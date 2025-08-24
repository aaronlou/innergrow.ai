# 📊 PostgreSQL 数据库迁移指南

## 🎯 概述

InnerGrow.ai 后端项目完全兼容 PostgreSQL 数据库。本指南将帮助您从 SQLite 迁移到 PostgreSQL 或直接在生产环境中部署 PostgreSQL。

## ✅ 兼容性检查结果

### 完全兼容的功能
- ✅ 所有模型字段类型
- ✅ 外键关系和约束
- ✅ Django ORM 查询操作
- ✅ 用户认证系统
- ✅ 文件上传功能
- ✅ RESTful API 接口

### PostgreSQL 优化功能
- ✅ 数据库索引优化
- ✅ JSON 字段性能优化
- ✅ 连接池配置
- ✅ 查询性能优化

## 🚀 PostgreSQL 部署步骤

### 1. 安装 PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**CentOS/RHEL:**
```bash
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

### 2. 创建数据库和用户

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 在 PostgreSQL 控制台中执行
CREATE DATABASE innergrow_db;
CREATE USER innergrow_user WITH PASSWORD 'your_secure_password';
ALTER ROLE innergrow_user SET client_encoding TO 'utf8';
ALTER ROLE innergrow_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE innergrow_user SET timezone TO 'Asia/Shanghai';
GRANT ALL PRIVILEGES ON DATABASE innergrow_db TO innergrow_user;
\q
```

### 3. 配置环境变量

创建或更新 `.env.production` 文件：

```bash
# 数据库配置
DATABASE_URL=postgresql://innergrow_user:your_secure_password@localhost:5432/innergrow_db

# Django 配置
DJANGO_SETTINGS_MODULE=mysite.production_settings
DJANGO_SECRET_KEY=your-super-secret-key-change-this-in-production

# PostgreSQL 特定配置
DB_CONN_MAX_AGE=60
DB_CONN_HEALTH_CHECKS=True
```

### 4. 安装 PostgreSQL 依赖

```bash
# 项目依赖已包含 PostgreSQL 支持
pip install psycopg2-binary==2.9.9
pip install dj-database-url==2.1.0
```

### 5. 数据库迁移

```bash
# 使用生产环境配置
export DJANGO_SETTINGS_MODULE="mysite.production_settings"

# 生成迁移文件
python manage.py makemigrations accounts books

# 应用迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser
```

## 🔄 从 SQLite 迁移数据

### 方法 1: 使用 Django 数据导出/导入

```bash
# 1. 导出现有数据
python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission > data_backup.json

# 2. 切换到 PostgreSQL 配置
export DJANGO_SETTINGS_MODULE="mysite.production_settings"

# 3. 运行迁移
python manage.py migrate

# 4. 导入数据
python manage.py loaddata data_backup.json
```

### 方法 2: 使用 django-dbbackup（推荐）

```bash
# 安装 django-dbbackup
pip install django-dbbackup

# 添加到 INSTALLED_APPS
# 'dbbackup',

# 备份 SQLite 数据
python manage.py dbbackup

# 切换到 PostgreSQL
export DJANGO_SETTINGS_MODULE="mysite.production_settings"
python manage.py migrate

# 恢复数据
python manage.py dbrestore
```

## ⚡ PostgreSQL 性能优化

### 1. 数据库索引

项目已添加以下优化索引：

```python
# Book 模型索引
- category + condition 组合索引
- price 价格索引  
- status 状态索引
- seller + status 组合索引
- created_at 时间索引
- location 地区索引

# User 模型索引
- email 邮箱索引
- date_joined 注册时间索引
- is_active 活跃状态索引

# BookOrder 模型索引
- status 订单状态索引
- buyer + status 组合索引
- seller + status 组合索引
- book + status 组合索引
```

### 2. 连接池配置

```python
# production_settings.py 中已配置
CONN_MAX_AGE = 60  # 连接复用60秒
```

### 3. JSON 字段优化

```python
# PostgreSQL 中 JSONField 支持高效查询
Book.objects.filter(tags__contains=['技术'])  # JSON 包含查询
Book.objects.filter(tags__0='编程')          # JSON 数组索引查询
```

## 🛠️ 生产环境部署

### 使用部署脚本

```bash
# 设置 PostgreSQL 环境变量
export DATABASE_URL="postgresql://innergrow_user:password@localhost:5432/innergrow_db"
export DJANGO_SETTINGS_MODULE="mysite.production_settings"

# 运行生产环境部署
./production_deploy.sh deploy
```

### 手动部署步骤

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 收集静态文件
python manage.py collectstatic --noinput

# 3. 运行迁移
python manage.py migrate

# 4. 启动 Gunicorn
gunicorn mysite.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 30 \
    --daemon
```

## 🔧 故障排除

### 常见问题

**1. psycopg2 安装失败**
```bash
# 安装系统依赖
sudo apt-get install libpq-dev python3-dev  # Ubuntu
sudo yum install postgresql-devel python3-devel  # CentOS

# 或使用二进制版本
pip install psycopg2-binary
```

**2. 连接超时**
```bash
# 检查 PostgreSQL 服务状态
sudo systemctl status postgresql

# 检查端口监听
sudo netstat -tuln | grep 5432
```

**3. 权限问题**
```sql
-- 重新授权
GRANT ALL PRIVILEGES ON DATABASE innergrow_db TO innergrow_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO innergrow_user;
```

**4. 编码问题**
```sql
-- 检查数据库编码
SELECT datname, encoding FROM pg_database WHERE datname='innergrow_db';

-- 如需重新创建
DROP DATABASE innergrow_db;
CREATE DATABASE innergrow_db WITH ENCODING 'UTF8' LC_COLLATE='en_US.UTF-8' LC_CTYPE='en_US.UTF-8';
```

## 📊 性能监控

### 查询性能分析

```sql
-- 查看慢查询
SELECT query, mean_time, calls FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

-- 查看数据库统计
SELECT * FROM pg_stat_database WHERE datname = 'innergrow_db';
```

### Django 查询优化

```python
# 使用 select_related 优化外键查询
Book.objects.select_related('seller').all()

# 使用 prefetch_related 优化反向查询
Book.objects.prefetch_related('images', 'orders').all()

# 查询分析
from django.db import connection
print(connection.queries)
```

## ✅ 验证清单

迁移完成后，请验证以下功能：

- [ ] 用户注册和登录
- [ ] 书籍发布和编辑
- [ ] 图片上传
- [ ] 订单创建
- [ ] 搜索和筛选
- [ ] API 接口响应
- [ ] 管理后台访问
- [ ] 静态文件加载

## 🔄 备份策略

```bash
# 定期备份数据库
pg_dump -h localhost -U innergrow_user innergrow_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据库
psql -h localhost -U innergrow_user innergrow_db < backup_file.sql
```

---

🎉 **完成！** 您的 InnerGrow.ai 后端现在运行在高性能的 PostgreSQL 数据库上了！