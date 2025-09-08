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

	class Meta:
		ordering = ['-created_at']
		verbose_name = _('Exam')
		verbose_name_plural = _('Exams')

	def __str__(self):
		return str(self.title)


	# Discussion room related methods
	@property
	def discussion_room(self):
		"""Get the discussion room for this exam"""
		try:
			from discussions.models import DiscussionRoom
			return DiscussionRoom.objects.get(exam=self)
		except:
			return None

	def has_discussion_room(self):
		"""Check if this exam has a discussion room"""
		return self.discussion_room is not None

	def get_or_create_discussion_room(self):
		"""Get or create discussion room for this exam"""
		from discussions.models import DiscussionRoom
		room, created = DiscussionRoom.objects.get_or_create(
			exam=self,
			defaults={
				'title': f"{self.title} - Discussion Room",
				'description': f"Discussion room for {self.title} exam"
			}
		)
		return room, created

	def is_discussion_member(self, user):
		"""Check if user is a member of this exam's discussion room"""
		try:
			room = self.discussion_room
			if room:
				return room.is_member(user)
			return False
		except:
			return False

	@property
	def discussion_members_count(self):
		"""Get discussion room members count"""
		try:
			room = self.discussion_room
			if room:
				return room.members_count
			return 0
		except:
			return 0

	@property
	def discussion_posts_count(self):
		"""Get discussion room posts count"""
		try:
			room = self.discussion_room
			if room:
				return room.posts.count()  # Use posts.count() instead of posts_count
			return 0
		except:
			return 0