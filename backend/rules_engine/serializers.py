from rest_framework import serializers
from rules_engine.models import Scheme
from accounts.models import Institute

class SchemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scheme
        fields = '__all__'

class InstituteSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institute
        fields = ['id', 'name', 'location', 'state', 'course', 'code']

class ProfileEvaluationInputSerializer(serializers.Serializer):
    category = serializers.CharField(default='ST')
    education_level = serializers.CharField(required=True)
    annual_income = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    age = serializers.IntegerField(required=False, allow_null=True)
    marks_percent = serializers.FloatField(required=False, allow_null=True)
    study_destination = serializers.CharField(default='India')
    state_domicile = serializers.CharField(required=False, allow_blank=True)
    institute_id = serializers.IntegerField(required=False, allow_null=True)
    institute_name = serializers.CharField(required=False, allow_blank=True)
    admission_quota = serializers.CharField(default='regular')
    is_qs_top_1000 = serializers.BooleanField(default=False)

class ExplainRequestSerializer(serializers.Serializer):
    scheme_id = serializers.CharField(required=True)
    profile = serializers.DictField(required=True)
    evaluation_result = serializers.DictField(required=True)
