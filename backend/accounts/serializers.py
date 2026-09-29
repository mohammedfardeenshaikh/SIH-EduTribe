from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Institute

class UserSerializer(serializers.ModelSerializer):
    institute_name = serializers.CharField(source='institute.name', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'role', 'institute', 'institute_name')

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user_data = UserSerializer(self.user).data
        data['user'] = user_data
        return data

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)