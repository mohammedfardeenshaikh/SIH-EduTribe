from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rules_engine.models import Scheme
from accounts.models import Institute
from rules_engine.serializers import (
    SchemeSerializer,
    InstituteSearchSerializer,
    ProfileEvaluationInputSerializer,
    ExplainRequestSerializer
)
from rules_engine.evaluator import evaluate_applicant_profile, generate_deterministic_explanation

class SchemeListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        schemes = Scheme.objects.all()
        serializer = SchemeSerializer(schemes, many=True)
        return Response(serializer.data)

class InstituteSearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        state = request.query_params.get('state', '').strip()
        institutes = Institute.objects.all()
        if query:
            institutes = institutes.filter(name__icontains=query)
        if state:
            institutes = institutes.filter(state__icontains=state)
        institutes = institutes[:50]
        serializer = InstituteSearchSerializer(institutes, many=True)
        return Response(serializer.data)

class EvaluateEligibilityView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ProfileEvaluationInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        evaluation_results = evaluate_applicant_profile(serializer.validated_data)
        return Response({
            'profile': serializer.validated_data,
            'schemes': evaluation_results,
            'eligible_count': sum(1 for s in evaluation_results if s['status'] == 'Eligible'),
            'partially_eligible_count': sum(1 for s in evaluation_results if s['status'] == 'Partially Eligible'),
        })

class ExplainDecisionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ExplainRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        scheme_id = serializer.validated_data['scheme_id']
        profile = serializer.validated_data['profile']
        eval_res = serializer.validated_data['evaluation_result']

        scheme = Scheme.objects.filter(id=scheme_id).first()
        scheme_name = scheme.name if scheme else scheme_id

        passed = eval_res.get('passed_conditions', [])
        failed = eval_res.get('failed_conditions', [])
        current_status = eval_res.get('status', 'Not Eligible')

        explanation = generate_deterministic_explanation(
            scheme_name=scheme_name,
            status=current_status,
            passed_conditions=passed,
            failed_conditions=failed,
            profile=profile
        )

        return Response({
            'scheme_id': scheme_id,
            'scheme_name': scheme_name,
            'status': current_status,
            'explanation': explanation,
            'passed_conditions': passed,
            'failed_conditions': failed,
        })
