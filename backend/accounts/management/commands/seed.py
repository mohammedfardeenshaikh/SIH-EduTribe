import os
import shutil
import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from django.conf import settings

from accounts.models import User, Institute
from applications.models import Application, ApplicationStatusHistory, Document
from core.models import AuditLog
from core.utils import audit_log

SCHEMES = [
    {'id': 'pre_matric', 'name': 'Pre-Matric Scholarship (Class IX & X)'},
    {'id': 'post_matric', 'name': 'Post-Matric Scholarship (Class XI to Post-Graduation)'},
    {'id': 'national_scholarship_top_class', 'name': 'National Scholarship (Top Class Education Scheme)'},
    {'id': 'nfst_fellowship', 'name': 'National Fellowship for ST Students (NFST) — MPhil/PhD'},
    {'id': 'nos_overseas', 'name': 'National Overseas Scholarship (NOS)'},
]

class Command(BaseCommand):
    help = 'Seeds the database with exact demo state for EduTribe'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Delete all existing data before seeding')

    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write(self.style.WARNING('Clearing all existing application, audit, and user records...'))
            Document.objects.all().delete()
            AuditLog.objects.all().delete()
            ApplicationStatusHistory.objects.all().delete()
            Application.objects.all().delete()
            User.objects.all().delete()
            Institute.objects.all().delete()

        # 1. Load full schemes & 252 institutes
        self.stdout.write('Loading master schemes and premier institutes catalog...')
        base_path = settings.BASE_DIR.parent / 'frontend' / 'src' / 'data'
        
        # Load Schemes
        scheme_file = base_path / 'scheme_rules.json'
        if os.path.exists(scheme_file):
            with open(scheme_file, 'r', encoding='utf-8') as f:
                import json
                from rules_engine.models import Scheme
                data = json.load(f)
                schemes_data = data.get('schemes', [])
                benefit_map = {
                    'pre_matric': 10000,
                    'post_matric': 50000,
                    'national_scholarship_top_class': 350000,
                    'nfst_fellowship': 450000,
                    'nos_overseas': 2500000
                }
                for s in schemes_data:
                    Scheme.objects.update_or_create(
                        id=s['id'],
                        defaults={
                            'name': s['name'],
                            'authority': s.get('authority', 'Ministry of Tribal Affairs'),
                            'level': s.get('level', []),
                            'income_ceiling_annual': s.get('income_ceiling_annual'),
                            'age_limit_years': s.get('age_limit_years'),
                            'age_limit_by_course': s.get('age_limit_by_course'),
                            'min_marks_percent': s.get('min_marks_percent'),
                            'min_marks_percent_pg': s.get('min_marks_percent_pg'),
                            'study_destination': s.get('study_destination', 'India'),
                            'requires': s.get('requires', []),
                            'excludes_if': s.get('excludes_if', []),
                            'other_conditions': s.get('other_conditions', []),
                            'fields_of_study': s.get('fields_of_study', []),
                            'benefit_summary': s.get('benefit_summary', ''),
                            'indicative_annual_benefit': benefit_map.get(s['id'], 0)
                        }
                    )

        # Load Institutes
        inst_file = base_path / 'institute_list_full_252.json'
        if os.path.exists(inst_file):
            with open(inst_file, 'r', encoding='utf-8') as f:
                import json
                from django.utils.text import slugify
                inst_data = json.load(f)
                institutes = inst_data.get('institutes', [])
                for inst in institutes:
                    name = inst.get('name', '').strip()
                    if not name:
                        continue
                    code = slugify(name)[:250]
                    existing = Institute.objects.filter(name=name).first()
                    if not existing:
                        Institute.objects.create(
                            name=name,
                            location=inst.get('location', ''),
                            state=inst.get('state', ''),
                            course=inst.get('course', ''),
                            code=code
                        )

        # Fetch or create IIT Delhi & AIIMS
        iitd = Institute.objects.filter(name__icontains='Technology Delhi').first()
        if not iitd:
            iitd = Institute.objects.create(
                name='Indian Institute of Technology Delhi',
                location='Hauz Khas, New Delhi 110016',
                state='Delhi',
                course='All Engineering Courses',
                code='iit-delhi'
            )

        aiims = Institute.objects.filter(name__icontains='Medical Sciences').first()
        if not aiims:
            aiims = Institute.objects.create(
                name='All India Institute of Medical Sciences',
                location='Ansari Nagar, New Delhi 110029',
                state='Delhi',
                course='MBBS / MD / MS',
                code='aiims-delhi'
            )

        # 2. Create standard users
        self.stdout.write('Creating demo user accounts...')
        admin = User.objects.create(
            email='admin@edutribe.gov.in',
            full_name='Dr. Rajesh Kumar (Ministry Admin)',
            role='MINISTRY_ADMIN',
            password=make_password('admin123'),
            is_staff=True,
            is_superuser=True
        )

        officer_iitd = User.objects.create(
            email='officer.iitd@edutribe.gov.in',
            full_name='Prof. Amit Sharma (IIT Delhi)',
            role='INSTITUTE_OFFICER',
            password=make_password('officer123'),
            institute=iitd
        )

        officer_aiims = User.objects.create(
            email='officer.aiims@edutribe.gov.in',
            full_name='Dr. Meena Patel (AIIMS Delhi)',
            role='INSTITUTE_OFFICER',
            password=make_password('officer123'),
            institute=aiims
        )

        applicant_data = [
            ('Anita Murmu', 'anita.murmu@example.com', 'Jharkhand'),
            ('Ravi Oraon', 'ravi.oraon@example.com', 'Chhattisgarh'),
            ('Priya Bhil', 'priya.bhil@example.com', 'Rajasthan'),
            ('Suresh Munda', 'suresh.munda@example.com', 'Odisha'),
            ('Kavita Gond', 'kavita.gond@example.com', 'Madhya Pradesh'),
        ]

        applicants = []
        for name, email, _ in applicant_data:
            user = User.objects.create(
                email=email,
                full_name=name,
                role='APPLICANT',
                password=make_password('applicant123')
            )
            applicants.append(user)

        # 3. Create Sample Applications across all workflow states
        self.stdout.write('Creating realistic applications, documents & audit trails...')
        now = timezone.now()

        media_docs_dir = os.path.join(settings.MEDIA_ROOT, 'documents')
        os.makedirs(media_docs_dir, exist_ok=True)
        sample_matching_src = os.path.join(settings.BASE_DIR.parent, 'docs', 'samples', 'income_certificate_matching_anita_murmu.png')
        sample_mismatch_src = os.path.join(settings.BASE_DIR.parent, 'docs', 'samples', 'income_certificate_mismatch_ravi_oraon.png')

        sample_apps = [
            # app_idx, scheme_idx, inst, status, income, edu, age, marks, state, days_ago
            (0, 2, iitd, 'SUBMITTED', 200000, 'Graduate', 20, 85.0, 'Jharkhand', 10),
            (0, 1, None, 'MINISTRY_APPROVED', 200000, 'Post-Graduate', 24, 72.0, 'Jharkhand', 75),
            (0, 0, None, 'DRAFT', 180000, 'Class X', 15, 68.0, 'Jharkhand', 3),
            (1, 2, iitd, 'RESUBMIT_REQUESTED', 230000, 'Graduate', 21, 78.0, 'Chhattisgarh', 25),
            (1, 3, None, 'OFFICER_VERIFIED', 0, 'PhD', 28, 62.0, 'Chhattisgarh', 40),
            (1, 1, None, 'SUBMITTED', 230000, 'Diploma', 22, 71.0, 'Chhattisgarh', 14),
            (2, 2, iitd, 'OFFICER_VERIFIED', 350000, 'Graduate', 20, 88.0, 'Rajasthan', 30),
            (2, 4, None, 'REJECTED', 700000, "Master's (abroad)", 30, 58.0, 'Rajasthan', 60),
            (3, 0, None, 'MINISTRY_APPROVED', 150000, 'Class IX', 14, 78.0, 'Odisha', 80),
            (3, 1, None, 'SUBMITTED', 180000, 'Class XI', 16, 72.0, 'Odisha', 12),
            (4, 3, None, 'SUBMITTED', 0, 'MPhil', 27, 58.0, 'Madhya Pradesh', 8),
            (4, 2, aiims, 'OFFICER_VERIFIED', 450000, 'Graduate', 20, 82.0, 'Madhya Pradesh', 35),
            (4, 1, None, 'MINISTRY_APPROVED', 220000, 'Post-Graduate', 25, 69.0, 'Madhya Pradesh', 70),
        ]

        for idx, (app_idx, scheme_idx, inst, status_code, income, edu, age, marks, state, days) in enumerate(sample_apps):
            scheme = SCHEMES[scheme_idx]
            applicant = applicants[app_idx]
            created = now - timedelta(days=days)
            submitted = created + timedelta(hours=2) if status_code != 'DRAFT' else None

            app = Application.objects.create(
                applicant=applicant,
                scheme_id=scheme['id'],
                scheme_name=scheme['name'],
                institute=inst,
                status=status_code,
                declared_income=income,
                education_level=edu,
                age=age,
                marks_percent=marks,
                study_destination='Abroad' if scheme_idx == 4 else 'India',
                state=state,
                submitted_at=submitted,
            )
            Application.objects.filter(pk=app.pk).update(created_at=created)

            # Audit Log for creation
            audit_log(
                actor=applicant,
                action='APPLICATION_CREATED',
                entity_type='Application',
                entity_id=str(app.id),
                after={'status': 'DRAFT', 'scheme': scheme['id']},
            )

            # Attach sample document with OCR data
            if status_code != 'DRAFT':
                is_matching = (idx % 2 == 0)
                src_file = sample_matching_src if is_matching else sample_mismatch_src
                target_filename = f"cert_app_{app.id}.png"
                target_dest = os.path.join(media_docs_dir, target_filename)

                if os.path.exists(src_file):
                    shutil.copyfile(src_file, target_dest)

                ext_income = float(income) if is_matching else float(income) + 220000.0
                ocr_status = 'VERIFIED' if is_matching else 'NEEDS_REVIEW'

                doc = Document.objects.create(
                    application=app,
                    doc_type='INCOME_CERTIFICATE',
                    file=f"documents/{target_filename}",
                    ocr_status=ocr_status,
                    extracted_data={
                        'extracted_income': ext_income,
                        'declared_income': float(income),
                        'extracted_name': applicant.full_name,
                        'declared_name': applicant.full_name,
                        'certificate_no': f"CERT-2026-{1000 + app.id}",
                        'issue_date': '12/06/2026',
                        'issuing_state': state,
                        'ocr_status': ocr_status,
                        'income_matched': is_matching,
                        'discrepancies': [
                            f"Certified income ₹{ext_income:,.0f} verified against revenue database." if is_matching
                            else f"INCOME DISCREPANCY: Certified amount is ₹{ext_income:,.0f} vs declared ₹{income:,.0f}."
                        ]
                    }
                )

                # Status History
                ApplicationStatusHistory.objects.create(
                    application=app,
                    old_status='DRAFT',
                    new_status='SUBMITTED',
                    changed_by=applicant,
                    remark='Submitted with digital revenue certificate.'
                )

                if status_code in ('OFFICER_VERIFIED', 'RESUBMIT_REQUESTED', 'MINISTRY_APPROVED', 'REJECTED'):
                    officer = officer_iitd if inst == iitd else (officer_aiims if inst == aiims else officer_iitd)
                    remark = {
                        'OFFICER_VERIFIED': 'Institutional admission and ST category documentation verified by officer.',
                        'RESUBMIT_REQUESTED': 'Income certificate contains variance. Please re-upload updated revenue certificate.',
                        'MINISTRY_APPROVED': 'Institutional verification completed.',
                        'REJECTED': 'Income criteria exceeded statutory ceiling for overseas study.',
                    }.get(status_code, 'Officer reviewed.')

                    ApplicationStatusHistory.objects.create(
                        application=app,
                        old_status='SUBMITTED',
                        new_status=status_code if status_code != 'MINISTRY_APPROVED' else 'OFFICER_VERIFIED',
                        changed_by=officer,
                        remark=remark
                    )

                if status_code == 'MINISTRY_APPROVED':
                    ApplicationStatusHistory.objects.create(
                        application=app,
                        old_status='OFFICER_VERIFIED',
                        new_status='MINISTRY_APPROVED',
                        changed_by=admin,
                        remark='Sanction order released by Ministry Selection Committee.'
                    )

        # Seed specific demo Application #87 (APP-2026-0087) for Anita Murmu
        app_87, _ = Application.objects.update_or_create(
            id=87,
            defaults={
                'applicant': applicants[0],
                'scheme_id': 'nfst_fellowship',
                'scheme_name': 'National Fellowship for ST Students (NFST) — MPhil/PhD',
                'institute': None,
                'status': 'SUBMITTED',
                'declared_income': 0,
                'education_level': 'PhD',
                'age': 28,
                'marks_percent': 68.0,
                'study_destination': 'India',
                'state': 'Chhattisgarh',
                'submitted_at': now - timedelta(days=5),
            }
        )
        Application.objects.filter(pk=87).update(created_at=now - timedelta(days=6))

        for doc_name, doc_type in [
            ('ST Certificate', 'ST_CERTIFICATE'),
            ('PG Marksheet', 'PG_MARKSHEET'),
            ('PhD Admission Proof', 'PHD_ADMISSION_PROOF')
        ]:
            if not Document.objects.filter(application=app_87, doc_type=doc_type).exists():
                doc_file = os.path.join(media_docs_dir, f"doc_87_{doc_type.lower()}.png")
                if os.path.exists(sample_matching_src):
                    shutil.copyfile(sample_matching_src, doc_file)
                Document.objects.create(
                    application=app_87,
                    doc_type=doc_type,
                    file=f"documents/doc_87_{doc_type.lower()}.png",
                    ocr_status='VERIFIED',
                    extracted_data={
                        'doc_type': doc_name,
                        'ocr_status': 'VERIFIED',
                        'discrepancies': [f'{doc_name} validated against national database.']
                    }
                )

        ApplicationStatusHistory.objects.get_or_create(
            application=app_87,
            old_status='DRAFT',
            new_status='SUBMITTED',
            defaults={
                'changed_by': applicants[0],
                'remark': 'Initial submission with certified doctoral admission proof.'
            }
        )

        self.stdout.write(self.style.SUCCESS('\n============================================================'))
        self.stdout.write(self.style.SUCCESS('  EDUTRIBE POSTGRESQL DATABASE SEEDED SUCCESSFULLY'))
        self.stdout.write(self.style.SUCCESS('============================================================\n'))
        self.stdout.write(f'  {"Role":<20} | {"Email":<32} | {"Password"}')
        self.stdout.write(f'  {"-"*20} | {"-"*32} | {"-"*12}')
        self.stdout.write(f'  {"MINISTRY_ADMIN":<20} | {"admin@edutribe.gov.in":<32} | {"admin123"}')
        self.stdout.write(f'  {"INSTITUTE_OFFICER":<20} | {"officer.iitd@edutribe.gov.in":<32} | {"officer123"}')
        self.stdout.write(f'  {"INSTITUTE_OFFICER":<20} | {"officer.aiims@edutribe.gov.in":<32} | {"officer123"}')
        self.stdout.write(f'  {"APPLICANT":<20} | {"anita.murmu@example.com":<32} | {"applicant123"}')
        self.stdout.write(f'  {"APPLICANT":<20} | {"ravi.oraon@example.com":<32} | {"applicant123"}')
        self.stdout.write(f'\n  Institutes:    {Institute.objects.count()}')
        self.stdout.write(f'  Users:         {User.objects.count()}')
        self.stdout.write(f'  Applications:  {Application.objects.count()}')
        self.stdout.write(f'  Documents:     {Document.objects.count()}')
        self.stdout.write(f'  Audit Logs:    {AuditLog.objects.count()}\n')
