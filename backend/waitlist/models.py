from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class WaitlistFeature(models.Model):
    """Available features that users can join waitlists for"""
    
    FEATURE_CHOICES = [
        ('mockExams', _('Mock Exams')),
        ('flashcards', _('Flashcards')),
        ('quickQuizzes', _('Quick Quizzes')),
    ]
    
    name = models.CharField(
        max_length=50, 
        choices=FEATURE_CHOICES, 
        unique=True,
        verbose_name=_('Feature Name')
    )
    display_name = models.CharField(
        max_length=100,
        verbose_name=_('Display Name')
    )
    description = models.TextField(
        blank=True,
        verbose_name=_('Description')
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_('Is Active')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = _('Waitlist Feature')
        verbose_name_plural = _('Waitlist Features')
    
    def __str__(self):
        return f"{self.display_name}"
    
    @property
    def waitlist_count(self):
        """Get total users in waitlist for this feature"""
        return self.waitlist_entries.filter(is_active=True).count()


class WaitlistEntry(models.Model):
    """User entries in feature waitlists"""
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='waitlist_entries',
        verbose_name=_('User')
    )
    feature = models.ForeignKey(
        WaitlistFeature,
        on_delete=models.CASCADE,
        related_name='waitlist_entries',
        verbose_name=_('Feature')
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_('Is Active')
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Optional: priority or position in waitlist
    priority = models.IntegerField(
        default=0,
        verbose_name=_('Priority')
    )
    
    # Optional: user preferences or notes
    notes = models.TextField(
        blank=True,
        verbose_name=_('Notes')
    )
    
    class Meta:
        ordering = ['-joined_at']
        unique_together = ['user', 'feature']
        verbose_name = _('Waitlist Entry')
        verbose_name_plural = _('Waitlist Entries')
    
    def __str__(self):
        return f"{self.user.username} - {self.feature.display_name}"
