from django.db import models
from django.conf import settings

class Exam(models.Model):
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='exams')
	title = models.CharField(max_length=200, verbose_name='考试名称')
	description = models.TextField(verbose_name='考试描述')
	category = models.CharField(max_length=100, verbose_name='考试类别', default='Language')
	exam_time = models.DateTimeField(verbose_name='考试时间')
	material = models.FileField(upload_to='exam_materials/', blank=True, null=True, verbose_name='复习资料')
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['-created_at']

	def __str__(self):
		return str(self.title)