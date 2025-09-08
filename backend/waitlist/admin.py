from django.contrib import admin
from .models import WaitlistFeature, WaitlistEntry


@admin.register(WaitlistFeature)
class WaitlistFeatureAdmin(admin.ModelAdmin):
    list_display = ['name', 'display_name', 'waitlist_count', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'display_name', 'description']
    readonly_fields = ['created_at', 'updated_at', 'waitlist_count']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'display_name', 'description', 'is_active')
        }),
        ('Statistics', {
            'fields': ('waitlist_count',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(WaitlistEntry)
class WaitlistEntryAdmin(admin.ModelAdmin):
    list_display = ['user', 'feature', 'is_active', 'priority', 'joined_at']
    list_filter = ['is_active', 'feature', 'joined_at']
    search_fields = ['user__username', 'user__email', 'feature__name', 'notes']
    readonly_fields = ['joined_at', 'updated_at']
    raw_id_fields = ['user']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'feature', 'is_active', 'priority')
        }),
        ('Additional Information', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('joined_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'feature')
