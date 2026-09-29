from django.utils import timezone
from django.db.models import Count, Q, Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from applications.models import Application, ApplicationStatusHistory, Document
from applications.serializers import (
    ApplicationListSerializer,
    ApplicationDetailSerializer,
    CreateApplicationSerializer,
    DocumentSerializer,
    OfficerVerificationSerializer
)
from accounts.models import Institute
from accounts.permissions import IsApplicant, IsInstituteOfficer, IsMinistryAdmin, IsOfficerOrAdmin
from core.utils import audit_log, get_client_ip
from applications.ocr_processor import process_document

class ApplicantApplicationsView(APIView):
    permission_classes = [IsAuthenticated, IsApplicant]

    def get(self, request):
        apps = Application.objects.filter(applicant=request.user).order_by('-created_at')
        serializer = ApplicationDetailSerializer(apps, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateApplicationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        app = serializer.save(
            applicant=request.user,
            status='DRAFT'
        )

        audit_log(
            actor=request.user,
            action='APPLICATION_CREATED',
            entity_type='Application',
            entity_id=str(app.id),
            after={'status': 'DRAFT', 'scheme_id': app.scheme_id},
            ip=get_client_ip(request)
        )

        ApplicationStatusHistory.objects.create(
            application=app,
            old_status='',
            new_status='DRAFT',
            changed_by=request.user,
            remark='Application initiated as draft.'
        )

        detail_serializer = ApplicationDetailSerializer(app)
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)


class ApplicationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            app = Application.objects.get(pk=pk)
        except Application.DoesNotExist:
            return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)

        # Scoping check
        if request.user.role == 'APPLICANT' and app.applicant != request.user:
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        if request.user.role == 'INSTITUTE_OFFICER':
            if request.user.institute and app.institute != request.user.institute:
                return Response({'error': 'Forbidden: Institute scope restriction'}, status=status.HTTP_403_FORBIDDEN)

        serializer = ApplicationDetailSerializer(app)
        return Response(serializer.data)


class ApplicationSubmitView(APIView):
    permission_classes = [IsAuthenticated, IsApplicant]

    def post(self, request, pk):
        try:
            app = Application.objects.get(pk=pk, applicant=request.user)
        except Application.DoesNotExist:
            return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)

        if app.status not in ('DRAFT', 'RESUBMIT_REQUESTED'):
            return Response({'error': f'Cannot submit application in {app.status} status'}, status=status.HTTP_400_BAD_REQUEST)

        old_status = app.status
        app.status = 'SUBMITTED'
        app.submitted_at = timezone.now()
        app.save(update_fields=['status', 'submitted_at', 'updated_at'])

        audit_log(
            actor=request.user,
            action='APPLICATION_SUBMITTED',
            entity_type='Application',
            entity_id=str(app.id),
            before={'status': old_status},
            after={'status': 'SUBMITTED'},
            ip=get_client_ip(request)
        )

        ApplicationStatusHistory.objects.create(
            application=app,
            old_status=old_status,
            new_status='SUBMITTED',
            changed_by=request.user,
            remark=request.data.get('remark', 'Application formally submitted for institute verification.')
        )

        serializer = ApplicationDetailSerializer(app)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DocumentUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, pk):
        try:
            app = Application.objects.get(pk=pk)
        except Application.DoesNotExist:
            return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == 'APPLICANT' and app.applicant != request.user:
            return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'File is required'}, status=status.HTTP_400_BAD_REQUEST)

        doc_type = request.data.get('doc_type', 'INCOME_CERTIFICATE')
        doc = Document.objects.create(
            application=app,
            doc_type=doc_type,
            file=file_obj,
            ocr_status='PENDING'
        )

        # Process OCR immediately
        process_document(doc)

        audit_log(
            actor=request.user,
            action='DOCUMENT_UPLOADED',
            entity_type='Document',
            entity_id=str(doc.id),
            after={'doc_type': doc.doc_type, 'ocr_status': doc.ocr_status},
            ip=get_client_ip(request)
        )

        serializer = DocumentSerializer(doc)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class OfficerQueueView(APIView):
    permission_classes = [IsAuthenticated, IsInstituteOfficer]

    def get(self, request):
        user_inst = request.user.institute
        if not user_inst:
            return Response([], status=status.HTTP_200_OK)

        apps = Application.objects.filter(institute=user_inst).order_by('-submitted_at', '-created_at')
        serializer = ApplicationListSerializer(apps, many=True)
        return Response(serializer.data)


class OfficerVerifyView(APIView):
    permission_classes = [IsAuthenticated, IsInstituteOfficer]

    def post(self, request, pk):
        user_inst = request.user.institute
        try:
            app = Application.objects.get(pk=pk, institute=user_inst)
        except Application.DoesNotExist:
            return Response({'error': 'Application not found in your institute queue'}, status=status.HTTP_404_NOT_FOUND)

        serializer = OfficerVerificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        action = serializer.validated_data['action']
        remark = serializer.validated_data['remark']

        status_mapping = {
            'VERIFY': 'OFFICER_VERIFIED',
            'REQUEST_RESUBMIT': 'RESUBMIT_REQUESTED',
            'REJECT': 'REJECTED'
        }
        new_status = status_mapping[action]
        old_status = app.status

        app.status = new_status
        app.save(update_fields=['status', 'updated_at'])

        audit_log(
            actor=request.user,
            action=f'OFFICER_{action}',
            entity_type='Application',
            entity_id=str(app.id),
            before={'status': old_status},
            after={'status': new_status, 'remark': remark},
            ip=get_client_ip(request)
        )

        ApplicationStatusHistory.objects.create(
            application=app,
            old_status=old_status,
            new_status=new_status,
            changed_by=request.user,
            remark=remark
        )

        detail_serializer = ApplicationDetailSerializer(app)
        return Response(detail_serializer.data, status=status.HTTP_200_OK)


class AdminApplicationListView(APIView):
    permission_classes = [IsAuthenticated, IsMinistryAdmin]

    def get(self, request):
        apps = Application.objects.all().order_by('-created_at')

        status_filter = request.query_params.get('status')
        scheme_filter = request.query_params.get('scheme_id')
        inst_filter = request.query_params.get('institute_id')
        search = request.query_params.get('q')

        if status_filter:
            apps = apps.filter(status=status_filter)
        if scheme_filter:
            apps = apps.filter(scheme_id=scheme_filter)
        if inst_filter:
            apps = apps.filter(institute_id=inst_filter)
        if search:
            apps = apps.filter(
                Q(applicant__full_name__icontains=search) |
                Q(applicant__email__icontains=search) |
                Q(scheme_name__icontains=search)
            )

        serializer = ApplicationListSerializer(apps, many=True)
        return Response(serializer.data)


class AdminUpdateStatusView(APIView):
    permission_classes = [IsAuthenticated, IsMinistryAdmin]

    def post(self, request, pk):
        try:
            app = Application.objects.get(pk=pk)
        except Application.DoesNotExist:
            return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        remark = request.data.get('remark', 'Updated by Ministry Administrator.')

        valid_statuses = [choice[0] for choice in Application.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'error': f'Invalid status: {new_status}'}, status=status.HTTP_400_BAD_REQUEST)

        old_status = app.status
        app.status = new_status
        app.save(update_fields=['status', 'updated_at'])

        audit_log(
            actor=request.user,
            action='ADMIN_STATUS_UPDATE',
            entity_type='Application',
            entity_id=str(app.id),
            before={'status': old_status},
            after={'status': new_status, 'remark': remark},
            ip=get_client_ip(request)
        )

        ApplicationStatusHistory.objects.create(
            application=app,
            old_status=old_status,
            new_status=new_status,
            changed_by=request.user,
            remark=remark
        )

        serializer = ApplicationDetailSerializer(app)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AnalyticsSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsMinistryAdmin]

    def get(self, request):
        total_apps = Application.objects.count()
        status_counts = Application.objects.values('status').annotate(count=Count('id'))
        scheme_counts = Application.objects.values('scheme_name').annotate(count=Count('id'))

        status_dict = {item['status']: item['count'] for item in status_counts}
        scheme_dict = {item['scheme_name']: item['count'] for item in scheme_counts}

        # Verification metrics
        verified_count = status_dict.get('OFFICER_VERIFIED', 0) + status_dict.get('MINISTRY_APPROVED', 0)
        submitted_count = status_dict.get('SUBMITTED', 0) + verified_count + status_dict.get('REJECTED', 0) + status_dict.get('RESUBMIT_REQUESTED', 0)

        rate = (verified_count / max(submitted_count, 1)) * 100

        # State wise
        state_counts = Application.objects.values('state').annotate(count=Count('id')).order_by('-count')[:5]

        return Response({
            'total_applications': total_apps,
            'by_status': status_dict,
            'by_scheme': scheme_dict,
            'verification_rate': round(rate, 1),
            'top_states': state_counts
        })


class AlertsView(APIView):
    permission_classes = [IsAuthenticated, IsOfficerOrAdmin]

    def get(self, request):
        alerts = []

        # 1. High income discrepancy documents
        review_docs = Document.objects.filter(ocr_status='NEEDS_REVIEW').select_related('application', 'application__applicant')
        for d in review_docs[:10]:
            app = d.application
            alerts.append({
                'id': f"doc-alert-{d.id}",
                'type': 'DISCREPANCY',
                'severity': 'HIGH',
                'title': f"Income Discrepancy on Application #{app.id}",
                'message': f"Certified income exceeds declared income for {app.applicant.full_name} ({app.scheme_name}).",
                'application_id': app.id,
                'created_at': d.uploaded_at
            })

        # 2. Resubmit requested applications
        resub_apps = Application.objects.filter(status='RESUBMIT_REQUESTED')
        for app in resub_apps[:10]:
            alerts.append({
                'id': f"resub-alert-{app.id}",
                'type': 'RESUBMISSION',
                'severity': 'MEDIUM',
                'title': f"Correction Pending: Application #{app.id}",
                'message': f"Awaiting revised revenue certificate from {app.applicant.full_name}.",
                'application_id': app.id,
                'created_at': app.updated_at
            })

        # 3. Quota / Seat Alert
        top_class_count = Application.objects.filter(scheme_id='national_scholarship_top_class', status__in=['SUBMITTED', 'OFFICER_VERIFIED', 'MINISTRY_APPROVED']).count()
        if top_class_count > 0:
            alerts.append({
                'id': 'quota-alert-1',
                'type': 'CAPACITY',
                'severity': 'LOW',
                'title': 'Top Class Quota Utilization',
                'message': f"{top_class_count} active applications currently enrolled in premier institution pipeline.",
                'application_id': None,
                'created_at': timezone.now()
            })

        return Response({
            'alerts': alerts,
            'total_alerts': len(alerts),
            'high_severity_count': sum(1 for a in alerts if a['severity'] == 'HIGH')
        })
