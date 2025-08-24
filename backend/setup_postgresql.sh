#!/bin/bash

# PostgreSQL数据库初始化脚本
# 用于创建InnerGrow.ai项目所需的数据库和用户，并设置正确的权限

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 数据库配置（从环境变量或用户输入读取）
DB_NAME="${POSTGRES_DB_NAME:-innergrow_db}"
DB_USER="${POSTGRES_DB_USER:-innergrow_user}"
DB_PASSWORD="${POSTGRES_DB_PASSWORD}"  # 必须从环境变量设置

# 安全检查：确保密码不为空
if [ -z "$DB_PASSWORD" ]; then
    log_error "数据库密码未设置！请设置POSTGRES_DB_PASSWORD环境变量"
    echo "示例：export POSTGRES_DB_PASSWORD='your_secure_password'"
    echo "或者运行：read -s -p 'Enter database password: ' POSTGRES_DB_PASSWORD && export POSTGRES_DB_PASSWORD"
    exit 1
fi

# 检查PostgreSQL服务状态
check_postgresql_service() {
    log_info "检查PostgreSQL服务状态..."
    
    if systemctl is-active --quiet postgresql; then
        log_success "PostgreSQL服务正在运行"
    else
        log_warning "PostgreSQL服务未运行，尝试启动..."
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
        log_success "PostgreSQL服务已启动"
    fi
}

# 检查是否以postgres用户身份运行
check_postgres_user() {
    if [ "$USER" != "postgres" ]; then
        log_warning "建议以postgres用户身份运行此脚本"
        echo "使用以下命令切换到postgres用户："
        echo "sudo -u postgres $0"
        echo ""
        echo "或者直接执行以下SQL命令（需要postgres管理员权限）:"
        echo ""
        print_sql_commands
        exit 1
    fi
}

# 打印SQL命令
print_sql_commands() {
    echo -e "${YELLOW}=== PostgreSQL初始化SQL命令 ===${NC}"
    cat << EOF
-- 以postgres用户身份执行这些命令
-- psql -U postgres

-- 1. 创建数据库用户
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';

-- 2. 创建数据库
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};

-- 3. 授予用户权限
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- 4. 连接到新数据库并授予schema权限
\c ${DB_NAME}

-- 5. 授予public schema的所有权限
GRANT ALL ON SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};

-- 6. 设置未来对象的默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};

-- 7. 确保用户可以创建表
ALTER USER ${DB_USER} CREATEDB;

-- 验证权限
\du ${DB_USER}
\l ${DB_NAME}
EOF
    echo -e "${YELLOW}==============================${NC}"
}

# 创建数据库和用户
create_database_and_user() {
    log_info "创建数据库和用户..."
    
    # 检查数据库是否存在
    DB_EXISTS=$(psql -lqt | cut -d \| -f 1 | grep -w "$DB_NAME" | wc -l)
    
    if [ "$DB_EXISTS" -eq 1 ]; then
        log_warning "数据库 $DB_NAME 已存在"
    else
        log_info "创建数据库 $DB_NAME..."
        createdb "$DB_NAME"
        log_success "数据库创建成功"
    fi
    
    # 检查用户是否存在
    USER_EXISTS=$(psql -t -c "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -c 1 || true)
    
    if [ "$USER_EXISTS" -eq 1 ]; then
        log_warning "用户 $DB_USER 已存在"
    else
        log_info "创建用户 $DB_USER..."
        psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
        log_success "用户创建成功"
    fi
}

# 设置权限
setup_permissions() {
    log_info "设置数据库权限..."
    
    # 基本权限
    psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    
    # 切换到目标数据库并设置schema权限
    psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
    psql -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;"
    psql -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;"
    
    # 设置默认权限
    psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"
    psql -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;"
    
    # 授予创建数据库权限
    psql -c "ALTER USER $DB_USER CREATEDB;"
    
    log_success "权限设置完成"
}

# 验证配置
verify_setup() {
    log_info "验证数据库配置..."
    
    # 测试连接
    if PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        log_success "数据库连接测试成功"
    else
        log_error "数据库连接测试失败"
        return 1
    fi
    
    # 测试创建表权限
    if PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "CREATE TABLE test_table (id serial); DROP TABLE test_table;" > /dev/null 2>&1; then
        log_success "创建表权限测试成功"
    else
        log_error "创建表权限测试失败"
        return 1
    fi
    
    log_success "数据库配置验证通过"
}

# 生成.env.production配置
generate_env_config() {
    log_info "生成数据库连接配置..."
    
    echo ""
    echo -e "${YELLOW}=== .env.production 配置 ===${NC}"
    echo "将以下内容添加到 .env.production 文件中："
    echo ""
    echo "DATABASE_URL=postgresql://${DB_USER}:YOUR_PASSWORD@localhost:5432/${DB_NAME}"
    echo ""
    echo -e "${RED}重要安全提醒：${NC}"
    echo "1. 请手动替换 YOUR_PASSWORD 为实际密码"
    echo "2. 确保 .env.production 文件权限为 600"
    echo "3. .env.production 已在 .gitignore 中，不会被提交到版本控制"
    echo "4. 定期更换数据库密码以确保安全"
    echo ""
}

# 主函数
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}   PostgreSQL 数据库初始化脚本${NC}"
    echo -e "${BLUE}   InnerGrow.ai 项目${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    # 检查参数
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "用法: $0 [选项]"
        echo ""
        echo "选项:"
        echo "  --help, -h     显示帮助信息"
        echo "  --sql-only     只显示SQL命令，不执行"
        echo ""
        echo "注意：需要以postgres用户身份运行此脚本"
        echo "sudo -u postgres $0"
        exit 0
    fi
    
    if [ "$1" = "--sql-only" ]; then
        print_sql_commands
        exit 0
    fi
    
    # 检查PostgreSQL服务
    check_postgresql_service
    
    # 检查用户身份
    check_postgres_user
    
    # 创建数据库和用户
    create_database_and_user
    
    # 设置权限
    setup_permissions
    
    # 验证配置
    verify_setup
    
    # 生成配置
    generate_env_config
    
    echo ""
    log_success "PostgreSQL数据库初始化完成！"
    echo ""
    echo -e "${YELLOW}下一步：${NC}"
    echo "1. 更新 .env.production 文件中的 DATABASE_URL"
    echo "2. 运行 Django 数据库迁移: python manage.py migrate"
    echo "3. 创建 Django 超级用户: python manage.py createsuperuser"
}

# 运行主函数
main "$@"