from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import AuditLog
from .serializers import AuditLogSerializer
from accounts.permissions import IsMinistryAdmin

class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsMinistryAdmin]

    def get_queryset(self):
        queryset = AuditLog.objects.all()
        entity_type = self.request.query_params.get('entity_type')
        action = self.request.query_params.get('action')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
        if action:
            queryset = queryset.filter(action=action)
        if start_date and end_date:
            queryset = queryset.filter(timestamp__date__range=[start_date, end_date])

        return queryset


class ChatAssistantView(generics.GenericAPIView):
    """
    POST /api/ai/chat/
    Endpoint for EduTribe AI Assistant powered by Google Gemini API.
    Does not expose API key or sensitive data.
    """
    permission_classes = []  # Open to applicants and visitors

    def post(self, request, *args, **kwargs):
        from rest_framework.response import Response
        from rest_framework import status
        from .gemini_service import generate_gemini_response

        message = request.data.get('message', '').strip()
        language = request.data.get('language', 'en')
        context = request.data.get('context', {})
        history = request.data.get('history') or request.data.get('conversationHistory') or []

        if not message:
            return Response(
                {"reply": "Please ask a question about EduTribe scholarships." if language == 'en' else "कृपया छात्रवृत्ति से संबंधित अपना प्रश्न पूछें।"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Sanitize context (only keep safe metadata)
        safe_context = {}
        if isinstance(context, dict):
            for safe_key in ['current_page', 'page_title', 'scheme_name', 'eligibility_status', 'income_bracket', 'education_level', 'category', 'annual_income']:
                if safe_key in context and context[safe_key]:
                    safe_context[safe_key] = str(context[safe_key])[:150]

        reply = generate_gemini_response(user_message=message, language=language, context=safe_context, history=history)
        return Response({"reply": reply}, status=status.HTTP_200_OK)