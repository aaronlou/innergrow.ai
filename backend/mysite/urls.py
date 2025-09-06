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
from django.urls import get_resolver


@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """
    API根端点，提供API概览
    """
    # Get all registered URL patterns
    resolver = get_resolver()
    
    # Initialize the endpoints dictionary
    endpoints = {}
    
    # Process URL patterns to extract API endpoints
    def extract_endpoints(patterns, base_path=''):
        result = {}
        for pattern in patterns:
            if hasattr(pattern, 'pattern'):
                # Get the pattern string
                pattern_str = str(pattern.pattern)
                current_path = f"{base_path}{pattern_str}"
                
                # If this is an include (has url_patterns attribute)
                if hasattr(pattern, 'url_patterns'):
                    # Extract app name from the pattern
                    if 'api/' in current_path:
                        app_name = current_path.split('api/')[1].rstrip('/')
                        if app_name not in result:
                            result[app_name] = {}
                        
                        # Process nested patterns
                        nested_endpoints = extract_endpoints(pattern.url_patterns, current_path)
                        if app_name in nested_endpoints:
                            result[app_name] = nested_endpoints[app_name]
                        elif nested_endpoints:
                            # If it's not grouped by app, add it directly
                            result[app_name] = nested_endpoints
                elif hasattr(pattern, 'callback') and pattern.callback is not None and pattern.callback != api_root:
                    # This is a direct view, not an include
                    if 'api/' in current_path:
                        parts = current_path.split('api/')
                        if len(parts) > 1:
                            path_parts = parts[1].split('/')
                            if len(path_parts) > 0:
                                app_name = path_parts[0]
                                if app_name not in result:
                                    result[app_name] = {}
                                
                                # Get endpoint name from the URL pattern name or create one from the path
                                endpoint_name = getattr(pattern, 'name', None) or path_parts[-1] or 'root'
                                result[app_name][endpoint_name] = f"/api/{parts[1]}"
        return result
    
    # Extract all endpoints
    endpoints = extract_endpoints(resolver.url_patterns)
    
    return Response({
        'message': 'Welcome to InnerGrow.ai API',
        'version': '1.0.0',
        'endpoints': endpoints
    })


urlpatterns = [
    # Django Admin (生产环境重要：确保此路径有效)
    path('admin/', admin.site.urls),
    
    # API根端点
    path('api/', api_root, name='api_root'),
    
    # API路由
    path('api/accounts/', include('accounts.urls')),
    path('api/exams/', include('exams.urls')),
    path('api/goals/', include('goals.urls')),
]

# 开发环境下的媒体文件服务
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
