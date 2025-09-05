from rest_framework import serializers
from .models import Goal, AISuggestion, GoalCategory, GoalStatus


class GoalCategorySerializer(serializers.ModelSerializer):
    """目标分类序列化器"""
    
    class Meta:
        model = GoalCategory
        fields = ['id', 'name', 'name_en', 'created_at']


class GoalStatusSerializer(serializers.ModelSerializer):
    """目标状态序列化器"""
    
    class Meta:
        model = GoalStatus
        fields = ['id', 'name', 'name_en', 'created_at']


class GoalSerializer(serializers.ModelSerializer):
    """目标序列化器"""
    
    category = GoalCategorySerializer(read_only=True)
    status = GoalStatusSerializer(read_only=True)
    is_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = Goal
        fields = [
            'id',
            'title',
            'description',
            'category',
            'status',
            'visibility',
            'progress',
            'target_date',
            'created_at',
            'updated_at',
            'is_overdue'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_overdue']


class GoalCreateSerializer(serializers.ModelSerializer):
    """创建目标序列化器"""
    
    category_id = serializers.IntegerField(required=False)
    status_id = serializers.IntegerField(required=False)
    
    class Meta:
        model = Goal
        fields = [
            'title',
            'description',
            'category_id',
            'status_id',
            'visibility',
            'target_date'
        ]
    
    def create(self, validated_data):
        """创建目标时自动关联当前用户"""
        user = self.context['request'].user
        
        # 设置默认分类和状态
        if 'category_id' not in validated_data:
            # 获取或创建默认分类
            default_category, _ = GoalCategory.objects.get_or_create(
                name='学习',
                name_en='learning',
                defaults={'name': '学习', 'name_en': 'learning'}
            )
            validated_data['category'] = default_category
        else:
            category_id = validated_data.pop('category_id')
            try:
                validated_data['category'] = GoalCategory.objects.get(id=category_id)
            except GoalCategory.DoesNotExist:
                raise serializers.ValidationError("指定的分类不存在")
        
        if 'status_id' not in validated_data:
            # 获取或创建默认状态
            default_status, _ = GoalStatus.objects.get_or_create(
                name='进行中',
                name_en='active',
                defaults={'name': '进行中', 'name_en': 'active'}
            )
            validated_data['status'] = default_status
        else:
            status_id = validated_data.pop('status_id')
            try:
                validated_data['status'] = GoalStatus.objects.get(id=status_id)
            except GoalStatus.DoesNotExist:
                raise serializers.ValidationError("指定的状态不存在")
        
        validated_data['user'] = user
        return super().create(validated_data)


class GoalUpdateSerializer(serializers.ModelSerializer):
    """更新目标序列化器"""
    
    category_id = serializers.IntegerField(required=False)
    status_id = serializers.IntegerField(required=False)
    
    class Meta:
        model = Goal
        fields = [
            'title',
            'description',
            'category_id',
            'status_id',
            'visibility',
            'progress',
            'target_date'
        ]
    
    def validate_progress(self, value):
        """验证进度值在0-100之间"""
        if value < 0 or value > 100:
            raise serializers.ValidationError("进度值必须在0-100之间")
        return value
    
    def update(self, instance, validated_data):
        """更新目标时处理外键关系"""
        if 'category_id' in validated_data:
            category_id = validated_data.pop('category_id')
            try:
                instance.category = GoalCategory.objects.get(id=category_id)
            except GoalCategory.DoesNotExist:
                raise serializers.ValidationError({"category_id": "指定的分类不存在"})
        
        if 'status_id' in validated_data:
            status_id = validated_data.pop('status_id')
            try:
                instance.status = GoalStatus.objects.get(id=status_id)
            except GoalStatus.DoesNotExist:
                raise serializers.ValidationError({"status_id": "指定的状态不存在"})
        
        return super().update(instance, validated_data)


class PublicGoalSerializer(serializers.ModelSerializer):
    """公开目标序列化器（用于其他用户查看）"""
    
    category = GoalCategorySerializer(read_only=True)
    status = GoalStatusSerializer(read_only=True)
    user = serializers.SerializerMethodField()
    
    class Meta:
        model = Goal
        fields = [
            'id',
            'title',
            'description',
            'category',
            'status',
            'progress',
            'target_date',
            'created_at',
            'user'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_user(self, obj):
        """返回用户信息（不包含敏感信息）"""
        return {
            'id': obj.user.id,
            'name': obj.user.name,
            'avatar': obj.user.avatar.url if obj.user.avatar else None
        }


class AISuggestionSerializer(serializers.ModelSerializer):
    """AI建议序列化器"""
    
    class Meta:
        model = AISuggestion
        fields = [
            'id',
            'title',
            'description',
            'priority',
            'accepted',
            'completed',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AISuggestionCreateSerializer(serializers.ModelSerializer):
    """创建AI建议序列化器"""
    
    class Meta:
        model = AISuggestion
        fields = [
            'title',
            'description',
            'priority'
        ]


class AISuggestionAcceptSerializer(serializers.Serializer):
    """接受AI建议序列化器"""
    
    accepted = serializers.BooleanField(required=True)