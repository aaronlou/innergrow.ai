#!/bin/bash

# PostgreSQL权限快速修复脚本
# 专门解决"permission denied for schema public"问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   PostgreSQL权限快速修复${NC}"
echo -e "${BLUE}========================================${NC}"

# 数据库配置（从环境变量读取，默认值为常用配置）
DB_NAME="${POSTGRES_DB_NAME:-innergrow_db}"
DB_USER="${POSTGRES_DB_USER:-innergrow_user}"

echo -e "${YELLOW}当前问题：${NC}用户 $DB_USER 无法在 public schema 中创建表"
echo ""

echo -e "${YELLOW}解决方案：${NC}需要以postgres管理员身份执行以下SQL命令"
echo ""

echo -e "${GREEN}方法1: 直接执行SQL命令${NC}"
echo "sudo -u postgres psql << EOF"
cat << 'EOF'
-- 连接到目标数据库
\c ${DB_NAME}

-- 授予用户对public schema的完全权限
GRANT ALL ON SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};

-- 设置未来对象的默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};

-- 确保用户具有创建权限
ALTER USER ${DB_USER} CREATEDB;

-- 验证权限
\du ${DB_USER};

-- 测试创建表
CREATE TABLE test_permissions (id serial PRIMARY KEY, test_field varchar(50));
DROP TABLE test_permissions;

\q
EOF
echo ""

echo -e "${GREEN}方法2: 逐步执行${NC}"
echo "1. 切换到postgres用户："
echo "   sudo su - postgres"
echo ""
echo "2. 连接到PostgreSQL："
echo "   psql"
echo ""
echo "3. 执行以下命令："
echo "   \\c ${DB_NAME}"
echo "   GRANT ALL ON SCHEMA public TO ${DB_USER};"
echo "   ALTER USER ${DB_USER} CREATEDB;"
echo "   \\q"
echo ""

echo -e "${GREEN}方法3: 一键修复脚本${NC}"
echo "执行以下命令："
echo ""
echo -e "${BLUE}sudo -u postgres psql -d ${DB_NAME} -c \"GRANT ALL ON SCHEMA public TO ${DB_USER}; ALTER USER ${DB_USER} CREATEDB;\"${NC}"
echo ""

echo -e "${YELLOW}修复完成后，重新运行Django迁移：${NC}"
echo "cd /data/www/innergrow.ai/backend"
echo "./production_deploy.sh deploy"
echo ""

echo -e "${RED}注意：${NC}如果数据库用户不存在，请先运行完整的数据库初始化脚本："
echo "./setup_postgresql.sh"
echo ""
echo -e "${BLUE}安全提醒：${NC}"
echo "1. 请不要在公开代码中包含真实的数据库密码"
echo "2. 使用环境变量或配置文件管理敏感信息"
echo "3. 确保 .env.production 文件权限为 600 且不提交到 Git"