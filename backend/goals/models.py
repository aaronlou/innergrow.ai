from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class GoalCategory(models.Model):
    """目标分类模型"""
    name = models.CharField(max_length=50, unique=True, help_text='分类名称')
    name_en = models.CharField(max_length=50, unique=True, help_text='分类英文名称')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'goals_category'
        verbose_name = '目标分类'
        verbose_name_plural = '目标分类'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class GoalStatus(models.Model):
    """目标状态模型"""
    name = models.CharField(max_length=50, unique=True, help_text='状态名称')
    name_en = models.CharField(max_length=50, unique=True, help_text='状态英文名称')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'goals_status'
        verbose_name = '目标状态'
        verbose_name_plural = '目标状态'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Goal(models.Model):
    """目标模型"""
    
    VISIBILITY_CHOICES = [
        ('private', '私密'),
        ('public', '公开'),
    ]
    
    # 基本信息
    title = models.CharField(max_length=200, help_text='目标标题')
    description = models.TextField(blank=True, help_text='目标描述')
    
    # 关联用户
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='goals',
        help_text='目标所属用户'
    )
    
    # 分类和状态（使用外键而不是硬编码选项）
    category = models.ForeignKey(
        GoalCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text='目标分类'
    )
    status = models.ForeignKey(
        GoalStatus,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text='目标状态'
    )
    
    # 可见性控制
    visibility = models.CharField(
        max_length=10,
        choices=VISIBILITY_CHOICES,
        default='private',
        help_text='目标可见性'
    )
    
    # 时间相关
    target_date = models.DateField(blank=True, null=True, help_text='目标日期')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # 进度跟踪 (0-100)
    progress = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='完成进度 (0-100%)'
    )
    
    class Meta:
        db_table = 'goals_goal'
        verbose_name = '目标'
        verbose_name_plural = '目标'
        ordering = ['-created_at']
        # PostgreSQL优化索引
        indexes = [
            models.Index(fields=['user', 'status']),  # 用户状态组合索引
            models.Index(fields=['category']),  # 分类索引
            models.Index(fields=['status']),  # 状态索引
            models.Index(fields=['visibility']),  # 可见性索引
            models.Index(fields=['target_date']),  # 目标日期索引
        ]
    
    def __str__(self):
        return f'{self.title} - {self.user.email}'
    
    @property
    def is_overdue(self):
        """检查目标是否逾期"""
        if self.status and self.status.name_en == 'completed':
            return False
        if self.target_date:
            return self.target_date < timezone.now().date()
        return False


class AISuggestion(models.Model):
    """AI建议模型"""
    
    PRIORITY_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]
    
    goal = models.ForeignKey(
        Goal,
        on_delete=models.CASCADE,
        related_name='ai_suggestions',
        help_text='关联的目标'
    )
    
    title = models.CharField(max_length=200, help_text='建议标题')
    description = models.TextField(help_text='建议描述')
    
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        help_text='建议优先级'
    )
    
    # 是否已被用户接受
    accepted = models.BooleanField(default=False, help_text='是否已被接受')
    completed = models.BooleanField(default=False, help_text='是否已完成')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'goals_ai_suggestion'
        verbose_name = 'AI建议'
        verbose_name_plural = 'AI建议'
        ordering = ['-created_at']
        
    def __str__(self):
        return f'{self.title} - {self.goal.title}'