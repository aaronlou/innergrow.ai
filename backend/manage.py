#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    # 根据环境自动选择配置
    env = os.environ.get('DJANGO_ENV', 'production')  # 默认生产环境
    if env == 'development':
        settings_module = 'mysite.settings'
    else:
        settings_module = 'mysite.production_settings'
    
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', settings_module)
    print(f"使用配置模块: {settings_module}")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
