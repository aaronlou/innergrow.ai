# InnerGrow.ai 生产环境配置
# 导入基础设置
from .settings import *
import os
from pathlib import Path

# 尝试导入 python-decouple 来读取 .env 文件
try:
    from decouple import Config, RepositoryEnv
    # 获取项目根目录
    BASE_DIR = Path(__file__).resolve().parent.parent
    # 指定 .env.production 文件路径
    env_file = BASE_DIR / '.env.production'
    
    if env_file.exists():
        try:
            # 从 .env.production 文件读取配置
            config = Config(RepositoryEnv(str(env_file)))
            print(f"已加载配置文件: {env_file}")
        except PermissionError:
            # 处理权限错误，回退到系统环境变量
            from decouple import config
            print(f"警告: {env_file} 权限不足，使用系统环境变量")
        except Exception as e:
            # 其他错误也回退到系统环境变量
            from decouple import config
            print(f"警告: 加载 {env_file} 失败 ({e})，使用系统环境变量")
    else:
        # 如果文件不存在，使用默认配置
        from decouple import config
        print(f"警告: 未找到 {env_file}，使用系统环境变量")
except ImportError:
    # 如果没有安装 python-decouple，回退到 os.environ
    print("Warning: python-decouple not installed. 只能读取系统环境变量")
    class Config:
        def __call__(self, key, default=None, cast=str):
            return cast(os.environ.get(key, default))
    config = Config()

# 尝试导入dj_database_url，如果失败则设为 None
try:
    import dj_database_url  # type: ignore
except ImportError:
    dj_database_url = None  # type: ignore
    print("Warning: dj_database_url not installed. Please install it with: pip install dj-database-url")

# 生产环境标识
DEBUG = False

# 安全设置
ALLOWED_HOSTS = [
    'innergrow.ai',  # 替换为你的域名
    'www.innergrow.ai',
    'localhost',  # 保留用于本地测试
    '127.0.0.1',
]

# 安全密钥（生产环境必须修改）
SECRET_KEY = config('DJANGO_SECRET_KEY', default='CHANGE-THIS-IN-PRODUCTION')

# 数据库配置（仅使用PostgreSQL）
import logging
logger = logging.getLogger('django')

database_url = config('DATABASE_URL', default='')
logger.info(f"DATABASE_URL 读取结果: {'已设置' if database_url else '未设置'}")
if database_url:
    logger.info(f"DATABASE_URL 前缀: {database_url[:20]}...")  # 只显示前20个字符保护敏感信息

if database_url and dj_database_url is not None:
    logger.info("使用 DATABASE_URL 配置数据库")
    DATABASES = {
        'default': dj_database_url.parse(database_url)
    }
    # PostgreSQL专用配置
    DATABASES['default']['OPTIONS'] = {
        'connect_timeout': 60,
        # 注意：事务隔离级别通过PostgreSQL默认配置即可，无需显式设置
    }
    logger.info(f"数据库配置 - 主机: {DATABASES['default'].get('HOST', 'N/A')}")
    logger.info(f"数据库配置 - 数据库名: {DATABASES['default'].get('NAME', 'N/A')}")
else:
    logger.info("未读取到DATABASE_URL，使用默认PostgreSQL配置")
    # 默认PostgreSQL配置
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME', default='innergrow_db'),
            'USER': config('DB_USER', default='postgres'),
            'PASSWORD': config('DB_PASSWORD', default=''),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432', cast=int),
            'OPTIONS': {
                'connect_timeout': 60,
            },
        }
    }
    logger.info(f"默认配置 - 主机: {DATABASES['default']['HOST']}")
    logger.info(f"默认配置 - 数据库名: {DATABASES['default']['NAME']}")

# 静态文件设置
# 确保使用绝对路径
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# 媒体文件设置  
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# 确保静态文件目录存在
os.makedirs(STATIC_ROOT, exist_ok=True)
os.makedirs(MEDIA_ROOT, exist_ok=True)

# 使用WhiteNoise处理静态文件
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')

# 静态文件压缩
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# 安全设置
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# HTTPS设置（如果使用HTTPS）
if config('USE_HTTPS', default='False', cast=bool):
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# 日志配置
# 确保日志目录存在
log_dir = os.path.join(BASE_DIR, 'logs')
os.makedirs(log_dir, exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(log_dir, 'django.log'),
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# 缓存配置（可选，使用Redis）
if config('REDIS_URL', default=''):
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': config('REDIS_URL'),
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            }
        }
    }

# 邮件配置
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')

# OpenAI API 配置
OPENAI_API_KEY = config('OPENAI_API_KEY', default='')

# OpenAI Model 配置
OPENAI_MODEL = config('OPENAI_MODEL', default='gpt-4-turbo')

# 性能优化
CONN_MAX_AGE = 60  # 数据库连接池

# 时区设置
USE_TZ = True
TIME_ZONE = 'Asia/Shanghai'  # 设置为中国时区

# 国际化设置
LANGUAGE_CODE = 'zh-hans'
USE_I18N = True
USE_L10N = True

# CSRF Cookie Settings for Production
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SECURE = True  # Secure in production (only sent over HTTPS)
CSRF_COOKIE_SAMESITE = 'Lax'
