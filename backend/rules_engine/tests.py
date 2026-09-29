from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from rules_engine.models import Scheme
from accounts.models import Institute
from rules_engine.evaluator import evaluate_applicant_profile

class RulesEngineTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.iitd = Institute.objects.create(
            name='Indian Institute of Technology Delhi',
            location='New Delhi',
            state='Delhi',
            course='All Engineering Courses',
            code='iit-delhi'
        )
        self.top_class = Scheme.objects.create(
            id='national_scholarship_top_class',
            name='National Scholarship (Top Class Education Scheme)',
            authority='Ministry of Tribal Affairs (Central Sector)',
            level=['Graduate', 'Post-Graduate'],
            income_ceiling_annual=600000,
            indicative_annual_benefit=350000,
            requires=['admission_in_notified_252_institute']
        )
        self.nos = Scheme.objects.create(
            id='nos_overseas',
            name='National Overseas Scholarship (NOS)',
            authority='Ministry of Tribal Affairs (Central Sector)',
            level=["Master's (abroad)", "PhD (abroad)", "Post-Doctoral (abroad)"],
            income_ceiling_annual=600000,
            indicative_annual_benefit=2500000,
            study_destination='Abroad only'
        )

    def test_anita_golden_case(self):
        profile = {
            'category': 'ST',
            'education_level': 'Graduate',
            'annual_income': 200000,
            'age': 20,
            'marks_percent': 85.0,
            'study_destination': 'India',
            'institute_id': self.iitd.id,
            'admission_quota': 'regular'
        }
        results = evaluate_applicant_profile(profile)
        top_class_res = next((r for r in results if r['scheme_id'] == 'national_scholarship_top_class'), None)
        self.assertIsNotNone(top_class_res)
        self.assertEqual(top_class_res['status'], 'Eligible')

    def test_high_income_ineligible(self):
        profile = {
            'category': 'ST',
            'education_level': 'Graduate',
            'annual_income': 800000,
            'age': 20,
            'institute_id': self.iitd.id
        }
        results = evaluate_applicant_profile(profile)
        top_class_res = next((r for r in results if r['scheme_id'] == 'national_scholarship_top_class'), None)
        self.assertIsNotNone(top_class_res)
        self.assertEqual(top_class_res['status'], 'Not Eligible')

    def test_non_st_ineligible(self):
        profile = {
            'category': 'GENERAL',
            'education_level': 'Graduate',
            'annual_income': 200000,
            'institute_id': self.iitd.id
        }
        results = evaluate_applicant_profile(profile)
        for r in results:
            self.assertEqual(r['status'], 'Not Eligible')

    def test_evaluate_api_endpoint(self):
        response = self.client.post('/api/eligibility/evaluate/', {
            'category': 'ST',
            'education_level': 'Graduate',
            'annual_income': 200000,
            'institute_id': self.iitd.id
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('schemes', response.data)
        self.assertGreaterEqual(response.data['eligible_count'], 1)
