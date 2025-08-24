from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserPreferences


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """用户管理"""
    list_display = ['email', 'username', 'first_name', 'is_active', 'is_staff', 'date_joined']
    list_filter = ['is_active', 'is_staff', 'date_joined']
    search_fields = ['email', 'username', 'first_name']
    ordering = ['-date_joined']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('个人信息', {'fields': ('avatar', 'bio')}),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('个人信息', {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'avatar', 'bio'),
        }),
    )


@admin.register(UserPreferences)
class UserPreferencesAdmin(admin.ModelAdmin):
    """用户偏好管理"""
    list_display = ['user', 'theme', 'language', 'email_notifications', 'updated_at']
    list_filter = ['theme', 'language', 'email_notifications']
    search_fields = ['user__email', 'user__username']
    readonly_fields = ['created_at', 'updated_at']
