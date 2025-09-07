from django.contrib import admin
from .models import Exam

@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
	list_display = ('title', 'user', 'category', 'exam_time', 'created_at')
	list_filter = ('category', 'exam_time', 'created_at', 'user')
	search_fields = ('title', 'description')
	ordering = ('-created_at',)
	readonly_fields = ('created_at', 'updated_at')
	fieldsets = (
		('基本信息', {
			'fields': ('user', 'title', 'description')
		}),
		('考试详情', {
			'fields': ('category', 'exam_time')
		}),
		('附加信息', {
			'fields': ('material', 'created_at', 'updated_at')
		}),
	)