from django.db import models


class Exam(models.Model):
	title = models.CharField(max_length=200, verbose_name='考试名称')
	summary = models.TextField(verbose_name='考试内容概要')
	exam_time = models.DateTimeField(verbose_name='考试时间')
	material = models.FileField(upload_to='exam_materials/', blank=True, null=True, verbose_name='复习资料')
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return str(self.title)