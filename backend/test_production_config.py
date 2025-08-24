#!/usr/bin/env python
"""
验证 .env.production 配置是否正确读取
"""
import os
import sys
from pathlib import Path

# 添加项目路径
project_dir = Path(__file__).parent
sys.path.insert(0, str(project_dir))

# 设置 Django 配置模块
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.production_settings')

try:
    import django
    django.setup()
    
    from django.conf import settings
    
    print("🔍 Django 配置验证")
    print("=" * 50)
    
    # 检查 SECRET_KEY
    secret_key = settings.SECRET_KEY
    if secret_key == 'CHANGE-THIS-IN-PRODUCTION':
        print("❌ SECRET_KEY 仍使用默认值，请设置 DJANGO_SECRET_KEY")
    else:
        print(f"✅ SECRET_KEY 已配置 (长度: {len(secret_key)})")
    
    # 检查 DEBUG 模式
    print(f"✅ DEBUG 模式: {settings.DEBUG}")
    
    # 检查 ALLOWED_HOSTS
    print(f"✅ ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
    
    # 检查数据库配置
    db_engine = settings.DATABASES['default']['ENGINE']
    print(f"✅ 数据库引擎: {db_engine}")
    
    if 'postgresql' in db_engine:
        print("✅ 使用 PostgreSQL 数据库")
    elif 'sqlite' in db_engine:
        print("⚠️  使用 SQLite 数据库（生产环境建议使用 PostgreSQL）")
    
    # 检查 HTTPS 设置
    if hasattr(settings, 'SECURE_SSL_REDIRECT'):
        print(f"✅ HTTPS 重定向: {settings.SECURE_SSL_REDIRECT}")
    else:
        print("⚠️  未启用 HTTPS 设置")
    
    # 检查缓存配置
    if 'default' in settings.CACHES and 'redis' in settings.CACHES['default']['BACKEND'].lower():
        print("✅ Redis 缓存已配置")
    else:
        print("⚠️  未配置 Redis 缓存")
    
    print("\n🎉 配置验证完成！")
    
except Exception as e:
    print(f"❌ 配置验证失败: {e}")
    import traceback
    traceback.print_exc()