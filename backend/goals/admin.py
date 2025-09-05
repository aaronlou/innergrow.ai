from django.contrib import admin
from .models import Goal, AISuggestion, GoalCategory, GoalStatus


@admin.register(GoalCategory)
class GoalCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'name_en', 'created_at']
    search_fields = ['name', 'name_en']
    ordering = ['name']


@admin.register(GoalStatus)
class GoalStatusAdmin(admin.ModelAdmin):
    list_display = ['name', 'name_en', 'created_at']
    search_fields = ['name', 'name_en']
    ordering = ['name']


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'category', 'status', 'progress', 'target_date', 'created_at']
    list_filter = ['category', 'status', 'created_at', 'target_date']
    search_fields = ['title', 'description', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']


@admin.register(AISuggestion)
class AISuggestionAdmin(admin.ModelAdmin):
    list_display = ['title', 'goal', 'priority', 'accepted', 'completed', 'created_at']
    list_filter = ['priority', 'accepted', 'completed', 'created_at']
    search_fields = ['title', 'description', 'goal__title']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']