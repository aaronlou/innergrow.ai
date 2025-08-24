from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import EmailValidator


class User(AbstractUser):
    """扩展的用户模型"""
    email = models.EmailField(
        unique=True,
        validators=[EmailValidator()],
        help_text='用户邮箱地址，用作登录账号'
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        help_text='用户头像'
    )
    bio = models.TextField(
        blank=True,
        max_length=500,
        help_text='用户简介'
    )
    
    # 使用邮箱作为登录用户名
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name']
    
    class Meta:
        db_table = 'accounts_user'
        verbose_name = '用户'
        verbose_name_plural = '用户'
    
    def __str__(self):
        return self.email
    
    @property
    def name(self):
        """返回用户显示名称"""
        return self.first_name or self.username


class UserPreferences(models.Model):
    """用户偏好设置"""
    THEME_CHOICES = [
        ('light', '浅色主题'),
        ('dark', '深色主题'),
        ('system', '跟随系统'),
    ]
    
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('zh', '中文'),
    ]
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='preferences'
    )
    theme = models.CharField(
        max_length=10,
        choices=THEME_CHOICES,
        default='system'
    )
    language = models.CharField(
        max_length=5,
        choices=LANGUAGE_CHOICES,
        default='zh'
    )
    
    # 通知设置
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    goal_reminders = models.BooleanField(default=True)
    
    # 隐私设置
    show_profile = models.BooleanField(default=True)
    share_progress = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'accounts_user_preferences'
        verbose_name = '用户偏好'
        verbose_name_plural = '用户偏好'
    
    def __str__(self):
        return f'{self.user.email} 的偏好设置'
