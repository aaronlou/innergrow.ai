#!/usr/bin/env python3
"""
Django Admin 访问问题诊断脚本
用于排查 https://innergrow.ai/admin 404 错误
"""

import os
import sys
from pathlib import Path

# 添加项目路径
sys.path.append(str(Path(__file__).resolve().parent))

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.production_settings')

import django
django.setup()

from django.conf import settings
from django.urls import reverse
from django.contrib import admin
from django.core.management.color import make_style

style = make_style()

def print_header(title):
    """打印标题"""
    print(f"\n{'='*60}")
    print(f"🔍 {title}")
    print(f"{'='*60}")

def print_status(status, message):
    """打印状态信息"""
    if status == "OK":
        print(f"✅ {message}")
    elif status == "WARNING":
        print(f"⚠️  {message}")
    else:
        print(f"❌ {message}")

def check_django_settings():
    """检查Django基本设置"""
    print_header("Django基本设置检查")
    
    print_status("OK", f"DEBUG模式: {settings.DEBUG}")
    print_status("OK", f"ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
    
    # 检查admin是否在INSTALLED_APPS中
    if 'django.contrib.admin' in settings.INSTALLED_APPS:
        print_status("OK", "django.contrib.admin 已在 INSTALLED_APPS 中")
    else:
        print_status("ERROR", "django.contrib.admin 未在 INSTALLED_APPS 中")
    
    # 检查必要的中间件
    required_middleware = [
        'django.middleware.security.SecurityMiddleware',
        'django.contrib.sessions.middleware.SessionMiddleware',
        'django.contrib.auth.middleware.AuthenticationMiddleware',
    ]
    
    for middleware in required_middleware:
        if middleware in settings.MIDDLEWARE:
            print_status("OK", f"{middleware} 已配置")
        else:
            print_status("ERROR", f"{middleware} 未配置")

def check_url_configuration():
    """检查URL配置"""
    print_header("URL配置检查")
    
    try:
        admin_url = reverse('admin:index')
        print_status("OK", f"Admin URL路径: {admin_url}")
    except Exception as e:
        print_status("ERROR", f"无法反向解析admin URL: {e}")
    
    # 检查根URLconf
    print_status("OK", f"ROOT_URLCONF: {settings.ROOT_URLCONF}")

def check_database_connection():
    """检查数据库连接"""
    print_header("数据库连接检查")
    
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            print_status("OK", "数据库连接正常")
            
        # 检查数据库配置
        db_config = settings.DATABASES['default']
        print_status("OK", f"数据库引擎: {db_config['ENGINE']}")
        print_status("OK", f"数据库名称: {db_config.get('NAME', 'N/A')}")
        
    except Exception as e:
        print_status("ERROR", f"数据库连接失败: {e}")

def check_static_files():
    """检查静态文件配置"""
    print_header("静态文件配置检查")
    
    print_status("OK", f"STATIC_URL: {settings.STATIC_URL}")
    print_status("OK", f"STATIC_ROOT: {getattr(settings, 'STATIC_ROOT', 'N/A')}")
    
    # 检查静态文件目录是否存在
    static_root = getattr(settings, 'STATIC_ROOT', None)
    if static_root and Path(static_root).exists():
        print_status("OK", "STATIC_ROOT 目录存在")
        
        # 检查admin静态文件
        admin_css_path = Path(static_root) / 'admin' / 'css' / 'base.css'
        if admin_css_path.exists():
            print_status("OK", "Admin静态文件已收集")
        else:
            print_status("WARNING", "Admin静态文件可能未收集")
    else:
        print_status("WARNING", "STATIC_ROOT 目录不存在或未配置")

def check_admin_configuration():
    """检查Admin配置"""
    print_header("Admin配置检查")
    
    # 检查是否有注册的模型
    registered_models = []
    for model, admin_class in admin.site._registry.items():
        registered_models.append(f"{model._meta.app_label}.{model._meta.model_name}")
    
    if registered_models:
        print_status("OK", f"已注册的模型: {', '.join(registered_models)}")
    else:
        print_status("WARNING", "没有注册任何模型到admin")
    
    # 检查是否创建了超级用户
    try:
        from django.contrib.auth.models import User
        superuser_count = User.objects.filter(is_superuser=True).count()
        if superuser_count > 0:
            print_status("OK", f"已创建 {superuser_count} 个超级用户")
        else:
            print_status("WARNING", "尚未创建超级用户")
    except Exception as e:
        print_status("ERROR", f"无法检查超级用户: {e}")

def check_server_configuration():
    """检查服务器配置"""
    print_header("服务器配置建议检查")
    
    # 检查是否在生产环境
    if not settings.DEBUG:
        print_status("OK", "生产环境模式（DEBUG=False）")
        
        # 提供服务器配置建议
        print("\n📋 服务器配置检查清单:")
        print("1. 确保 Gunicorn 正在运行并监听正确端口")
        print("2. 检查反向代理（如 Nginx）配置")
        print("3. 验证域名 DNS 解析")
        print("4. 检查防火墙和网络配置")
        print("5. 验证 SSL 证书配置（HTTPS）")
        
    else:
        print_status("WARNING", "开发环境模式（DEBUG=True）")

def provide_solutions():
    """提供解决方案"""
    print_header("常见解决方案")
    
    solutions = [
        "1. 收集静态文件：python manage.py collectstatic --noinput",
        "2. 创建超级用户：python manage.py createsuperuser", 
        "3. 检查服务器日志：tail -f logs/gunicorn_error.log",
        "4. 重启 Gunicorn 服务：./production_deploy.sh restart",
        "5. 检查 URL 访问：curl -I https://innergrow.ai/admin/",
        "6. 测试本地访问：curl -I http://localhost:8000/admin/",
    ]
    
    for solution in solutions:
        print(f"💡 {solution}")
    
    print(f"\n🌐 测试URL:")
    print(f"- 生产环境: https://innergrow.ai/admin/")
    print(f"- API根路径: https://innergrow.ai/api/")
    print(f"- 本地测试: http://localhost:8000/admin/")

def main():
    """主函数"""
    print("🧪 Django Admin 访问问题诊断工具")
    print("分析 https://innergrow.ai/admin 404 错误")
    
    try:
        check_django_settings()
        check_url_configuration()
        check_database_connection()
        check_static_files()
        check_admin_configuration()
        check_server_configuration()
        provide_solutions()
        
        print_header("诊断完成")
        print("📊 如果所有检查都通过但仍然404，问题可能在于:")
        print("   - 反向代理配置（Nginx/Apache）")
        print("   - DNS解析问题")
        print("   - 服务器防火墙配置")
        print("   - SSL证书问题")
        
    except Exception as e:
        print_status("ERROR", f"诊断过程出错: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()