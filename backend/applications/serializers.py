from rest_framework import serializers
from applications.models import Application, ApplicationStatusHistory, Document
from accounts.serializers import UserSerializer
from accounts.models import Institute

class InstituteBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institute
        fields = ['id', 'name', 'location', 'state', 'course', 'code']

class DocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ['id', 'application', 'doc_type', 'file', 'file_url', 'ocr_status', 'extracted_data', 'uploaded_at']

    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None

class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.full_name', read_only=True)
    changed_by_role = serializers.CharField(source='changed_by.role', read_only=True)

    class Meta:
        model = ApplicationStatusHistory
        fields = ['id', 'old_status', 'new_status', 'changed_by_name', 'changed_by_role', 'remark', 'timestamp']

class ApplicationListSerializer(serializers.ModelSerializer):
    applicant_name = serializers.CharField(source='applicant.full_name', read_only=True)
    applicant_email = serializers.CharField(source='applicant.email', read_only=True)
    institute_name = serializers.CharField(source='institute.name', read_only=True)
    documents_count = serializers.IntegerField(source='documents.count', read_only=True)
    app_id_display = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            'id', 'app_id_display', 'applicant', 'applicant_name', 'applicant_email',
            'scheme_id', 'scheme_name', 'institute', 'institute_name',
            'status', 'declared_income', 'education_level', 'age', 'marks_percent',
            'study_destination', 'state', 'documents_count', 'submitted_at', 'created_at', 'updated_at'
        ]

    def get_app_id_display(self, obj):
        return f"APP-2026-{obj.id:04d}"

class ApplicationDetailSerializer(serializers.ModelSerializer):
    applicant = UserSerializer(read_only=True)
    institute = InstituteBriefSerializer(read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)
    status_history = ApplicationStatusHistorySerializer(many=True, read_only=True)
    app_id_display = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            'id', 'app_id_display', 'applicant', 'scheme_id', 'scheme_name', 'institute',
            'status', 'declared_income', 'education_level', 'age', 'marks_percent',
            'study_destination', 'state', 'documents', 'status_history',
            'submitted_at', 'created_at', 'updated_at'
        ]

    def get_app_id_display(self, obj):
        return f"APP-2026-{obj.id:04d}"

class CreateApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = [
            'scheme_id', 'scheme_name', 'institute', 'declared_income',
            'education_level', 'age', 'marks_percent', 'study_destination', 'state'
        ]

class OfficerVerificationSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['VERIFY', 'REQUEST_RESUBMIT', 'REJECT'])
    remark = serializers.CharField(required=True, allow_blank=False)
