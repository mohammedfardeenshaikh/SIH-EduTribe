from django.db import models

class Scheme(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=255)
    authority = models.CharField(max_length=255)
    level = models.JSONField(default=list)
    income_ceiling_annual = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    age_limit_years = models.IntegerField(null=True, blank=True)
    age_limit_by_course = models.JSONField(null=True, blank=True)
    min_marks_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    min_marks_percent_pg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    study_destination = models.CharField(max_length=100, default='India')
    requires = models.JSONField(default=list, blank=True)
    excludes_if = models.JSONField(default=list, blank=True)
    other_conditions = models.JSONField(default=list, blank=True)
    fields_of_study = models.JSONField(default=list, blank=True)
    benefit_summary = models.TextField()
    indicative_annual_benefit = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ['-indicative_annual_benefit', 'name']

    def __str__(self):
        return self.name
