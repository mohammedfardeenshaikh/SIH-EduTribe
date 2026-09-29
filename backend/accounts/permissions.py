from rest_framework.permissions import BasePermission

class IsApplicant(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'APPLICANT')

class IsInstituteOfficer(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'INSTITUTE_OFFICER')

class IsMinistryAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'MINISTRY_ADMIN')

class IsOfficerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['INSTITUTE_OFFICER', 'MINISTRY_ADMIN'])