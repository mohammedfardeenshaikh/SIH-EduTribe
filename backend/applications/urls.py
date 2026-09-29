from django.urls import path
from applications.views import (
    ApplicantApplicationsView,
    ApplicationDetailView,
    ApplicationSubmitView,
    DocumentUploadView,
    OfficerQueueView,
    OfficerVerifyView,
    AdminApplicationListView,
    AdminUpdateStatusView,
    AnalyticsSummaryView,
    AlertsView
)

urlpatterns = [
    path('applications/mine/', ApplicantApplicationsView.as_view(), name='applicant-apps-mine'),
    path('applications/', ApplicantApplicationsView.as_view(), name='applicant-apps-create'),
    path('applications/<int:pk>/', ApplicationDetailView.as_view(), name='application-detail'),
    path('applications/<int:pk>/submit/', ApplicationSubmitView.as_view(), name='application-submit'),
    path('applications/<int:pk>/documents/', DocumentUploadView.as_view(), name='document-upload'),

    path('officer/applications/', OfficerQueueView.as_view(), name='officer-queue'),
    path('officer/applications/<int:pk>/verify/', OfficerVerifyView.as_view(), name='officer-verify'),

    path('admin/applications/', AdminApplicationListView.as_view(), name='admin-applications'),
    path('admin/applications/<int:pk>/status/', AdminUpdateStatusView.as_view(), name='admin-status-update'),
    path('analytics/summary/', AnalyticsSummaryView.as_view(), name='analytics-summary'),
    path('alerts/', AlertsView.as_view(), name='alerts-summary'),
]
