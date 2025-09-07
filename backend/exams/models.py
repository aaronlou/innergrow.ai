from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class Exam(models.Model):
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='exams')
	title = models.CharField(max_length=200, verbose_name=_('Exam Title'))
	description = models.TextField(verbose_name=_('Exam Description'))
	category = models.CharField(max_length=100, verbose_name=_('Exam Category'), default=_('Language'))
	exam_time = models.DateField(verbose_name=_('Exam Date'))
	material = models.FileField(upload_to='exam_materials/', blank=True, null=True, verbose_name=_('Study Materials'))
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
	participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='joined_exams', blank=True, verbose_name=_('Participants'))

	class Meta:
		ordering = ['-created_at']
		verbose_name = _('Exam')
		verbose_name_plural = _('Exams')

	def __str__(self):
		return str(self.title)

	def is_participant(self, user):
		"""Check if a user is a participant of this exam"""
		return user in list(self.participants.all())  # type: ignore

	def add_participant(self, user):
		"""Add a user as a participant of this exam"""
		if user != self.user:  # Creator is automatically a participant
			self.participants.add(user)  # type: ignore

	def remove_participant(self, user):
		"""Remove a user from participants of this exam"""
		self.participants.remove(user)  # type: ignore