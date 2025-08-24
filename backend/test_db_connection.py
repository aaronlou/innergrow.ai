#!/usr/bin/env python3
"""
数据库连接测试脚本
用于验证PostgreSQL数据库配置是否正确
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

from django.db import connection
from django.core.management.color import make_style

style = make_style()

def test_database_connection():
    """测试数据库连接"""
    print("🔍 测试数据库连接...")
    
    try:
        # 测试基本连接
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"✅ 数据库连接成功!")
            print(f"📊 PostgreSQL版本: {version[0]}")
            
        # 测试事务隔离级别
        with connection.cursor() as cursor:
            cursor.execute("SHOW default_transaction_isolation;")
            isolation_level = cursor.fetchone()
            print(f"🔐 事务隔离级别: {isolation_level[0]}")
            
        # 测试数据库信息
        db_settings = connection.settings_dict
        print(f"🏠 数据库主机: {db_settings.get('HOST', 'localhost')}")
        print(f"🚪 数据库端口: {db_settings.get('PORT', '5432')}")
        print(f"🗃️  数据库名称: {db_settings.get('NAME', 'N/A')}")
        print(f"👤 数据库用户: {db_settings.get('USER', 'N/A')}")
        
        # 测试创建一个简单的查询
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 as test_query;")
            result = cursor.fetchone()
            if result[0] == 1:
                print("✅ 数据库查询测试成功")
        
        return True
        
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
        
        # 检查常见问题
        print("\n🔧 故障排查建议:")
        print("1. 检查PostgreSQL服务是否启动: sudo systemctl status postgresql")
        print("2. 检查.env.production文件中的DATABASE_URL配置")
        print("3. 确保数据库和用户已创建")
        print("4. 检查防火墙和网络连接")
        print("5. 验证PostgreSQL监听地址: sudo netstat -tuln | grep 5432")
        print("6. 检查数据库认证: psql -U innergrow_user -d innergrow_db -h localhost")
        
        return False

def show_django_settings():
    """显示Django数据库配置"""
    from django.conf import settings
    
    print("\n📋 Django数据库配置:")
    for db_name, db_config in settings.DATABASES.items():
        print(f"  {db_name}:")
        for key, value in db_config.items():
            if key == 'PASSWORD':
                print(f"    {key}: {'*' * len(str(value)) if value else 'None'}")
            else:
                print(f"    {key}: {value}")

if __name__ == "__main__":
    print("=" * 60)
    print("🧪 InnerGrow.ai 数据库连接测试")
    print("=" * 60)
    
    # 显示配置信息
    show_django_settings()
    
    print("\n" + "=" * 60)
    
    # 测试连接
    success = test_database_connection()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 数据库配置测试通过！")
    else:
        print("💥 数据库配置需要修复！")
        sys.exit(1)