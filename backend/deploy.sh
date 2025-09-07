#!/bin/bash

# InnerGrow.ai 后端部署脚本
# 用于自动化Django项目部署流程

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_NAME="InnerGrow.ai Backend"
PROJECT_DIR="/home/siyuanlou/innergrow.ai/backend"
VENV_DIR="$PROJECT_DIR/venv"
REQUIREMENTS_FILE="$PROJECT_DIR/requirements.txt"
MANAGE_PY="$PROJECT_DIR/manage.py"

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

# 检查是否在正确的目录
check_directory() {
    log_info "检查项目目录..."
    if [ ! -f "$MANAGE_PY" ]; then
        log_error "未找到 manage.py 文件，请确保在正确的项目目录中运行此脚本"
        exit 1
    fi
    log_success "项目目录检查通过"
}

# 创建虚拟环境（如果不存在）
setup_virtualenv() {
    log_info "设置Python虚拟环境..."
    
    if [ ! -d "$VENV_DIR" ]; then
        log_info "创建新的虚拟环境..."
        python3 -m venv "$VENV_DIR"
        log_success "虚拟环境创建完成"
    else
        log_info "虚拟环境已存在，跳过创建"
    fi
    
    # 激活虚拟环境
    source "$VENV_DIR/bin/activate"
    log_success "虚拟环境已激活"
}

# 升级pip并安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    # 升级pip
    pip install --upgrade pip
    
    # 安装依赖
    if [ -f "$REQUIREMENTS_FILE" ]; then
        log_info "从 requirements.txt 安装依赖..."
        pip install -r "$REQUIREMENTS_FILE"
        log_success "依赖安装完成"
    else
        log_warning "未找到 requirements.txt，手动安装核心依赖..."
        pip install Django==5.2.5
        pip install djangorestframework==3.15.2
        pip install django-cors-headers==4.4.0
        pip install Pillow==10.4.0
        pip install python-decouple==3.8
        log_success "核心依赖安装完成"
    fi
}

# 环境变量检查
check_environment() {
    log_info "检查环境变量..."
    
    # 检查是否有.env文件
    if [ -f "$PROJECT_DIR/.env" ]; then
        log_success "找到 .env 文件"
        source "$PROJECT_DIR/.env"
    else
        log_warning "未找到 .env 文件，使用默认配置"
    fi
}

# 数据库迁移
run_migrations() {
    log_info "执行数据库迁移..."
    
    # 创建迁移文件
    python "$MANAGE_PY" makemigrations accounts
    python "$MANAGE_PY" makemigrations exams
    python "$MANAGE_PY" makemigrations goals
    
    # 应用迁移
    python "$MANAGE_PY" migrate
    
    log_success "数据库迁移完成"
}

# 收集静态文件
collect_static() {
    log_info "收集静态文件..."
    
    # 创建static目录
    mkdir -p "$PROJECT_DIR/static"
    
    # 收集静态文件（生产环境需要）
    python "$MANAGE_PY" collectstatic --noinput --clear
    
    log_success "静态文件收集完成"
}

# 创建超级用户（如果不存在）
create_superuser() {
    log_info "检查超级用户..."
    
    # 检查是否已有超级用户
    SUPERUSER_EXISTS=$(python "$MANAGE_PY" shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
print('true' if User.objects.filter(is_superuser=True).exists() else 'false')
" 2>/dev/null || echo "false")
    
    if [ "$SUPERUSER_EXISTS" = "false" ]; then
        log_warning "未找到超级用户，请手动创建："
        echo "python $MANAGE_PY createsuperuser"
    else
        log_success "超级用户已存在"
    fi
}

# 运行测试
run_tests() {
    log_info "运行项目测试..."
    
    # 运行Django测试
    python "$MANAGE_PY" check
    
    # 如果有测试脚本，也可以运行
    if [ -f "$PROJECT_DIR/test_api.py" ]; then
        log_info "运行API测试脚本..."
        # 注意：这需要服务器运行，所以在后台启动服务器进行测试
        python "$MANAGE_PY" runserver 8000 &
        SERVER_PID=$!
        sleep 5  # 等待服务器启动
        
        python "$PROJECT_DIR/test_api.py" || log_warning "API测试失败，请检查"
        
        # 停止测试服务器
        kill $SERVER_PID 2>/dev/null || true
    fi
    
    log_success "测试检查完成"
}

# 启动服务
start_service() {
    log_info "启动Django开发服务器..."
    
    # 生产环境警告
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}⚠️  开发服务器警告${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}当前使用的是Django开发服务器${NC}"
    echo -e "${YELLOW}仅适用于开发和测试环境${NC}"
    echo -e "${YELLOW}生产环境请使用: ./deploy.sh --production${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo ""
    
    # 检查端口是否被占用
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null; then
        log_warning "端口8000已被占用，尝试停止现有进程..."
        pkill -f "manage.py runserver" || true
        sleep 2
    fi
    
    # 启动服务器
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}🚀 InnerGrow.ai 后端服务启动中...${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${BLUE}访问地址:${NC}"
    echo -e "  API根目录: http://localhost:8000/api/"
    echo -e "  管理后台: http://localhost:8000/admin/"
    echo -e "  前端应用: http://localhost:3000/"
    echo -e "${YELLOW}按 Ctrl+C 停止服务${NC}"
    echo ""
    
    python "$MANAGE_PY" runserver 8000
}

# 生产环境部署（使用gunicorn）
deploy_production() {
    log_info "配置生产环境部署..."
    
    # 安装生产环境依赖
    pip install gunicorn
    pip install whitenoise  # 静态文件服务
    pip install psycopg2-binary  # PostgreSQL驱动（可选）
    
    # 创建gunicorn配置文件
    cat > "$PROJECT_DIR/gunicorn.conf.py" << EOF
# Gunicorn配置文件
bind = "0.0.0.0:8000"
workers = 3
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
user = "www-data"
group = "www-data"
tmp_upload_dir = None
logfile = "$PROJECT_DIR/logs/gunicorn.log"
loglevel = "info"
pidfile = "$PROJECT_DIR/gunicorn.pid"
daemon = False
EOF
    
    # 创建日志目录
    mkdir -p "$PROJECT_DIR/logs"
    
    # 创建systemd服务文件模板
    cat > "$PROJECT_DIR/innergrow-backend.service" << EOF
[Unit]
Description=InnerGrow.ai Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=$PROJECT_DIR
Environment="PATH=$VENV_DIR/bin"
ExecStart=$VENV_DIR/bin/gunicorn --config gunicorn.conf.py mysite.wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF
    
    log_success "生产环境配置文件已创建"
    log_info "要在生产环境中部署，请："
    echo "1. 复制 innergrow-backend.service 到 /etc/systemd/system/"
    echo "2. 运行: sudo systemctl enable innergrow-backend"
    echo "3. 运行: sudo systemctl start innergrow-backend"
}

# 主函数
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}   $PROJECT_NAME 部署脚本${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    # 解析命令行参数
    MODE="development"
    RUN_TESTS=false
    SKIP_DEPS=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --production)
                MODE="production"
                shift
                ;;
            --test)
                RUN_TESTS=true
                shift
                ;;
            --skip-deps)
                SKIP_DEPS=true
                shift
                ;;
            --help)
                echo "用法: $0 [选项]"
                echo "选项:"
                echo "  --production    生产环境部署"
                echo "  --test         运行测试"
                echo "  --skip-deps    跳过依赖安装"
                echo "  --help         显示帮助"
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                exit 1
                ;;
        esac
    done
    
    # 切换到项目目录
    cd "$PROJECT_DIR"
    
    # 执行部署步骤
    check_directory
    
    if [ "$SKIP_DEPS" = false ]; then
        setup_virtualenv
        install_dependencies
    else
        source "$VENV_DIR/bin/activate"
        log_info "跳过依赖安装"
    fi
    
    check_environment
    run_migrations
    
    if [ "$MODE" = "production" ]; then
        collect_static
        deploy_production
    fi
    
    create_superuser
    
    if [ "$RUN_TESTS" = true ]; then
        run_tests
    fi
    
    # 根据模式启动服务
    if [ "$MODE" = "production" ]; then
        log_success "生产环境配置完成！"
        log_info "使用以下命令启动生产服务："
        echo "gunicorn --config gunicorn.conf.py mysite.wsgi:application"
    else
        start_service
    fi
}

# 信号处理
trap 'log_info "部署脚本被中断"; exit 1' INT TERM

# 运行主函数
main "$@"