from django.contrib import admin
from .models import User, Institute

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'role', 'institute', 'is_active')
    list_filter = ('role', 'is_active', 'is_staff')
    search_fields = ('email', 'full_name')

@admin.register(Institute)
class InstituteAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'state', 'course', 'code')
    search_fields = ('name', 'code')