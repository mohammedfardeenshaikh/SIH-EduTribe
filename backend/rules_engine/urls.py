from django.urls import path
from rules_engine.views import (
    SchemeListView,
    InstituteSearchView,
    EvaluateEligibilityView,
    ExplainDecisionView
)

urlpatterns = [
    path('schemes/', SchemeListView.as_view(), name='scheme-list'),
    path('institutes/', InstituteSearchView.as_view(), name='institute-search'),
    path('eligibility/evaluate/', EvaluateEligibilityView.as_view(), name='evaluate-eligibility'),
    path('ai/explain/', ExplainDecisionView.as_view(), name='explain-decision'),
]
