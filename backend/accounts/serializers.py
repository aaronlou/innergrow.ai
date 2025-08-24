from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, UserPreferences


class UserPreferencesSerializer(serializers.ModelSerializer):
    """用户偏好序列化器"""
    
    class Meta:
        model = UserPreferences
        fields = [
            'theme', 'language', 'email_notifications', 
            'push_notifications', 'goal_reminders', 
            'show_profile', 'share_progress'
        ]


class UserSerializer(serializers.ModelSerializer):
    """用户信息序列化器"""
    preferences = UserPreferencesSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 
            'avatar', 'bio', 'preferences', 
            'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']
    
    def to_representation(self, instance):
        """自定义输出格式以匹配前端类型"""
        data = super().to_representation(instance)
        # 添加前端需要的字段
        data['name'] = instance.name
        data['createdAt'] = instance.date_joined
        data['updatedAt'] = instance.last_login or instance.date_joined
        return data


class UserRegistrationSerializer(serializers.ModelSerializer):
    """用户注册序列化器"""
    password = serializers.CharField(
        write_only=True,
        min_length=6,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )
    name = serializers.CharField(
        source='first_name',
        min_length=2,
        max_length=50
    )
    
    class Meta:
        model = User
        fields = ['email', 'name', 'password', 'confirm_password']
    
    def validate(self, attrs):
        """验证密码匹配"""
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("两次密码输入不一致")
        return attrs
    
    def validate_password(self, value):
        """验证密码强度"""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
    
    def validate_email(self, value):
        """验证邮箱唯一性"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("该邮箱已被注册")
        return value
    
    def create(self, validated_data):
        """创建用户"""
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        
        # 设置username为email的本地部分
        email = validated_data['email']
        validated_data['username'] = email.split('@')[0]
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        
        # 创建用户偏好设置
        UserPreferences.objects.create(user=user)
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """用户登录序列化器"""
    email = serializers.EmailField()
    password = serializers.CharField(
        style={'input_type': 'password'},
        trim_whitespace=False
    )
    
    def validate(self, attrs):
        """验证登录凭据"""
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(
                request=self.context.get('request'),
                username=email,  # 使用email作为username
                password=password
            )
            
            if not user:
                raise serializers.ValidationError('邮箱或密码错误')
            
            if not user.is_active:
                raise serializers.ValidationError('用户账户已被禁用')
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('请输入邮箱和密码')


class UserUpdateSerializer(serializers.ModelSerializer):
    """用户信息更新序列化器"""
    name = serializers.CharField(
        source='first_name',
        required=False,
        allow_blank=True
    )
    
    class Meta:
        model = User
        fields = ['name', 'avatar', 'bio']
    
    def update(self, instance, validated_data):
        """更新用户信息"""
        return super().update(instance, validated_data)