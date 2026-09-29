from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import Institute
from applications.models import Application, ApplicationStatusHistory, Document

User = get_user_model()

class ApplicationsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.iitd = Institute.objects.create(
            name='Indian Institute of Technology Delhi',
            location='New Delhi',
            state='Delhi',
            course='All Engineering Courses',
            code='iit-delhi'
        )
        self.aiims = Institute.objects.create(
            name='All India Institute of Medical Sciences',
            location='New Delhi',
            state='Delhi',
            course='Medical',
            code='aiims-delhi'
        )
        self.admin = User.objects.create_user(
            email='admin@edutribe.gov.in',
            password='admin123',
            full_name='Ministry Admin',
            role='MINISTRY_ADMIN',
            is_staff=True
        )
        self.officer_iitd = User.objects.create_user(
            email='officer.iitd@edutribe.gov.in',
            password='officer123',
            full_name='IIT Officer',
            role='INSTITUTE_OFFICER',
            institute=self.iitd
        )
        self.applicant = User.objects.create_user(
            email='anita.murmu@example.com',
            password='applicant123',
            full_name='Anita Murmu',
            role='APPLICANT'
        )

    def test_create_and_submit_application(self):
        self.client.force_authenticate(user=self.applicant)
        
        # 1. Create DRAFT application
        res = self.client.post('/api/applications/', {
            'scheme_id': 'national_scholarship_top_class',
            'scheme_name': 'National Scholarship (Top Class)',
            'institute': self.iitd.id,
            'declared_income': 200000,
            'education_level': 'Graduate',
            'age': 20,
            'marks_percent': 85.0,
            'study_destination': 'India',
            'state': 'Jharkhand'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        app_id = res.data['id']
        self.assertEqual(res.data['status'], 'DRAFT')

        # 2. Submit application
        submit_res = self.client.post(f'/api/applications/{app_id}/submit/')
        self.assertEqual(submit_res.status_code, status.HTTP_200_OK)
        self.assertEqual(submit_res.data['status'], 'SUBMITTED')

    def test_officer_institute_scoping(self):
        app_iitd = Application.objects.create(
            applicant=self.applicant,
            scheme_id='national_scholarship_top_class',
            scheme_name='National Scholarship (Top Class)',
            institute=self.iitd,
            status='SUBMITTED',
            declared_income=200000,
            education_level='Graduate',
            age=20,
            marks_percent=85.0,
            state='Jharkhand'
        )
        app_aiims = Application.objects.create(
            applicant=self.applicant,
            scheme_id='national_scholarship_top_class',
            scheme_name='National Scholarship (Top Class)',
            institute=self.aiims,
            status='SUBMITTED',
            declared_income=200000,
            education_level='Graduate',
            age=20,
            marks_percent=85.0,
            state='Jharkhand'
        )

        self.client.force_authenticate(user=self.officer_iitd)
        res = self.client.get('/api/officer/applications/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        app_ids = [item['id'] for item in res.data]
        self.assertIn(app_iitd.id, app_ids)
        self.assertNotIn(app_aiims.id, app_ids)

    def test_officer_verify_action(self):
        app = Application.objects.create(
            applicant=self.applicant,
            scheme_id='national_scholarship_top_class',
            scheme_name='National Scholarship (Top Class)',
            institute=self.iitd,
            status='SUBMITTED',
            declared_income=200000,
            education_level='Graduate',
            age=20,
            marks_percent=85.0,
            state='Jharkhand'
        )
        self.client.force_authenticate(user=self.officer_iitd)
        verify_res = self.client.post(f'/api/officer/applications/{app.id}/verify/', {
            'action': 'VERIFY',
            'remark': 'Institutional credentials confirmed.'
        })
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertEqual(verify_res.data['status'], 'OFFICER_VERIFIED')
        app.refresh_from_db()
        self.assertEqual(app.status, 'OFFICER_VERIFIED')

    def test_admin_approve_and_analytics(self):
        app = Application.objects.create(
            applicant=self.applicant,
            scheme_id='national_scholarship_top_class',
            scheme_name='National Scholarship (Top Class)',
            institute=self.iitd,
            status='OFFICER_VERIFIED',
            declared_income=200000,
            education_level='Graduate',
            age=20,
            marks_percent=85.0,
            state='Jharkhand'
        )
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f'/api/admin/applications/{app.id}/status/', {
            'status': 'MINISTRY_APPROVED',
            'remark': 'Sanction order approved.'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'MINISTRY_APPROVED')

        analytics_res = self.client.get('/api/analytics/summary/')
        self.assertEqual(analytics_res.status_code, status.HTTP_200_OK)
        self.assertIn('total_applications', analytics_res.data)
        self.assertIn('by_status', analytics_res.data)
