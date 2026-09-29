from django.urls import path
from .views import AuditLogListView, ChatAssistantView

urlpatterns = [
    path('audit-logs/', AuditLogListView.as_view(), name='audit-logs'),
    path('ai/chat/', ChatAssistantView.as_view(), name='ai-chat'),
]