from django.db import models
from django.conf import settings
from accounts.models import Institute

class Application(models.Model):
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('OFFICER_VERIFIED', 'Officer Verified'),
        ('RESUBMIT_REQUESTED', 'Resubmit Requested'),
        ('MINISTRY_APPROVED', 'Ministry Approved'),
        ('REJECTED', 'Rejected'),
    )

    applicant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applications')
    scheme_id = models.CharField(max_length=255)
    scheme_name = models.CharField(max_length=255)
    institute = models.ForeignKey(Institute, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='DRAFT')
    
    declared_income = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    education_level = models.CharField(max_length=255, null=True, blank=True)
    age = models.IntegerField(null=True, blank=True)
    marks_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    study_destination = models.CharField(max_length=255, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Application {self.id} - {self.applicant.email}"

class ApplicationStatusHistory(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='status_history')
    old_status = models.CharField(max_length=50)
    new_status = models.CharField(max_length=50)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    remark = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

class Document(models.Model):
    OCR_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('VERIFIED', 'Verified'),
        ('NEEDS_REVIEW', 'Needs Review'),
        ('FAILED', 'Failed'),
    )

    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='documents')
    doc_type = models.CharField(max_length=100)
    file = models.FileField(upload_to='documents/')
    ocr_status = models.CharField(max_length=50, choices=OCR_STATUS_CHOICES, default='PENDING')
    extracted_data = models.JSONField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)