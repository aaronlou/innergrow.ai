from django.conf import settings
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import login, logout
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .google_auth import verify_google_token
from .models import User, UserPreferences
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
    UserUpdateSerializer,
    UserPreferencesSerializer
)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def google_login_view(request):
    """
    Google 登录/注册 API
    前端需传递 { id_token: ... }
    """
    id_token_str = request.data.get('id_token')
    if not id_token_str:
        return Response({'success': False, 'error': '缺少 id_token'}, status=status.HTTP_400_BAD_REQUEST)

    # 验证 Google Token
    client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
    idinfo = verify_google_token(id_token_str, client_id)
    if not idinfo or 'email' not in idinfo:
        return Response({'success': False, 'error': 'Google token 验证失败'}, status=status.HTTP_400_BAD_REQUEST)

    email = idinfo['email']
    name = idinfo.get('name', '')
    avatar = idinfo.get('picture', '')

    user, created = User.objects.get_or_create(email=email, defaults={
        'first_name': name,
        'username': email.split('@')[0],
        'avatar': avatar,
        'is_active': True,
    })
    if created:
        UserPreferences.objects.create(user=user)

    token, _ = Token.objects.get_or_create(user=user)
    user_serializer = UserSerializer(user)
    return Response({
        'success': True,
        'data': {
            'user': user_serializer.data,
            'token': token.key
        },
        'message': 'Google 登录成功'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    """
    用户注册API
    """
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        
        # 创建token
        token, created = Token.objects.get_or_create(user=user)
        
        # 返回用户信息和token
        user_serializer = UserSerializer(user)
        
        return Response({
            'success': True,
            'data': {
                'user': user_serializer.data,
                'token': token.key
            },
            'message': '注册成功'
        }, status=status.HTTP_201_CREATED)
    
    return Response({
        'success': False,
        'error': '注册失败',
        'details': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """
    用户登录API
    """
    serializer = UserLoginSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # 获取或创建token
        token, created = Token.objects.get_or_create(user=user)
        
        # 登录用户
        login(request, user)
        
        # 返回用户信息和token
        user_serializer = UserSerializer(user)
        
        return Response({
            'success': True,
            'data': {
                'user': user_serializer.data,
                'token': token.key
            },
            'message': '登录成功'
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'error': serializer.errors.get('non_field_errors', ['登录失败'])[0]
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def logout_view(request):
    """
    用户登出API
    """
    try:
        # 删除用户token
        request.user.auth_token.delete()
    except (AttributeError, Token.DoesNotExist):
        pass
    
    # 登出用户
    logout(request)
    
    return Response({
        'success': True,
        'message': '登出成功'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def user_profile_view(request):
    """
    获取当前用户信息API
    """
    serializer = UserSerializer(request.user)
    
    return Response({
        'success': True,
        'data': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['PUT', 'PATCH'])
def update_profile_view(request):
    """
    更新用户信息API
    """
    serializer = UserUpdateSerializer(
        request.user,
        data=request.data,
        partial=request.method == 'PATCH'
    )
    
    if serializer.is_valid():
        user = serializer.save()
        user_serializer = UserSerializer(user)
        
        return Response({
            'success': True,
            'data': user_serializer.data,
            'message': '个人信息更新成功'
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'error': '更新失败',
        'details': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


class UserPreferencesView(generics.RetrieveUpdateAPIView):
    """
    用户偏好设置API
    """
    serializer_class = UserPreferencesSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        preferences, created = UserPreferences.objects.get_or_create(
            user=self.request.user
        )
        return preferences
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'data': serializer.data,
                'message': '偏好设置更新成功'
            })
        
        return Response({
            'success': False,
            'error': '更新失败',
            'details': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def check_email_view(request):
    """
    检查邮箱是否已被注册
    """
    email = request.GET.get('email')
    
    if not email:
        return Response({
            'success': False,
            'error': '请提供邮箱地址'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    exists = User.objects.filter(email=email).exists()
    
    return Response({
        'success': True,
        'data': {
            'exists': exists,
            'available': not exists
        }
    }, status=status.HTTP_200_OK)
