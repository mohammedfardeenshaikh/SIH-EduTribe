from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=255)
    entity_type = models.CharField(max_length=255)
    entity_id = models.CharField(max_length=255)
    before_state = models.JSONField(null=True, blank=True)
    after_state = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['actor']),
            models.Index(fields=['entity_type']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"{self.action} on {self.entity_type} {self.entity_id} at {self.timestamp}" 