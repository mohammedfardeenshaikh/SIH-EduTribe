from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import Institute

User = get_user_model()

class AccountsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.institute = Institute.objects.create(
            name='Indian Institute of Technology Delhi',
            location='Hauz Khas, New Delhi',
            state='Delhi',
            course='All Engineering Courses',
            code='iit-delhi'
        )
        self.admin = User.objects.create_user(
            email='admin@edutribe.gov.in',
            password='admin123',
            full_name='Ministry Admin',
            role='MINISTRY_ADMIN',
            is_staff=True
        )
        self.officer = User.objects.create_user(
            email='officer.iitd@edutribe.gov.in',
            password='officer123',
            full_name='IIT Officer',
            role='INSTITUTE_OFFICER',
            institute=self.institute
        )
        self.applicant = User.objects.create_user(
            email='anita.murmu@example.com',
            password='applicant123',
            full_name='Anita Murmu',
            role='APPLICANT'
        )

    def test_user_creation_and_roles(self):
        self.assertEqual(self.admin.role, 'MINISTRY_ADMIN')
        self.assertEqual(self.officer.role, 'INSTITUTE_OFFICER')
        self.assertEqual(self.officer.institute, self.institute)
        self.assertEqual(self.applicant.role, 'APPLICANT')

    def test_login_success(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'anita.murmu@example.com',
            'password': 'applicant123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], 'anita.murmu@example.com')
        self.assertEqual(response.data['user']['role'], 'APPLICANT')

    def test_login_invalid_credentials(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'anita.murmu@example.com',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_authenticated(self):
        self.client.force_authenticate(user=self.officer)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'officer.iitd@edutribe.gov.in')
        self.assertEqual(response.data['institute'], self.institute.id)
