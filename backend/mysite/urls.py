"""
URL configuration for mysite project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """
    API根端点，提供API概览
    """
    return Response({
        'message': 'Welcome to InnerGrow.ai API',
        'version': '1.0.0',
        'endpoints': {
            'accounts': {
                'register': '/api/accounts/auth/register/',
                'login': '/api/accounts/auth/login/',
                'logout': '/api/accounts/auth/logout/',
                'profile': '/api/accounts/profile/',
            },
            'books': {
                'list': '/api/books/',
                'create': '/api/books/',
                'detail': '/api/books/{id}/',
                'my_books': '/api/books/my-books/',
                'orders': '/api/books/orders/',
            }
        }
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API根端点
    path('api/', api_root, name='api_root'),
    
    # API路由
    path('api/accounts/', include('accounts.urls')),
    path('api/books/', include('books.urls')),
]

# 开发环境下的媒体文件服务
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
