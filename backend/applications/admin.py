from django.contrib import admin
from .models import Application, ApplicationStatusHistory, Document

class ApplicationStatusHistoryInline(admin.TabularInline):
    model = ApplicationStatusHistory
    extra = 0
    readonly_fields = ('old_status', 'new_status', 'changed_by', 'remark', 'timestamp')

class DocumentInline(admin.TabularInline):
    model = Document
    extra = 0

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('id', 'applicant', 'scheme_name', 'status', 'created_at')
    list_filter = ('status', 'scheme_name', 'state')
    search_fields = ('applicant__email', 'scheme_id')
    inlines = [DocumentInline, ApplicationStatusHistoryInline]

@admin.register(ApplicationStatusHistory)
class ApplicationStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('application', 'old_status', 'new_status', 'changed_by', 'timestamp')

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('application', 'doc_type', 'ocr_status', 'uploaded_at')