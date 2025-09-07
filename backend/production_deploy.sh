#!/bin/bash

# InnerGrow.ai 生产环境部署脚本
# 使用 Gunicorn WSGI 服务器，适用于生产环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 项目配置
PROJECT_DIR="/home/siyuanlou/innergrow.ai/backend"
VENV_DIR="$PROJECT_DIR/.venv"
GUNICORN_PID="$PROJECT_DIR/gunicorn.pid"
LOG_DIR="$PROJECT_DIR/logs"

# 域名配置（可通过环境变量设置）
DOMAIN_NAME=${DOMAIN_NAME:-"innergrow.ai"}
PROTOCOL=${PROTOCOL:-"https"}
PORT=${PORT:-""}

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

# 检查生产环境要求
check_production_requirements() {
    log_info "检查生产环境要求..."
    
    # 检查必要的环境变量
    if [ -z "$DJANGO_SECRET_KEY" ]; then
        log_warning "未设置 DJANGO_SECRET_KEY 环境变量"
        echo "请设置生产环境密钥: export DJANGO_SECRET_KEY='your-secret-key'"
    fi
    
    # 创建必要的目录
    mkdir -p "$LOG_DIR"
    mkdir -p "$PROJECT_DIR/staticfiles"
    mkdir -p "$PROJECT_DIR/media"
    
    log_success "生产环境检查完成"
}

# 停止现有的Gunicorn进程
stop_gunicorn() {
    if [ -f "$GUNICORN_PID" ]; then
        log_info "停止现有的Gunicorn进程..."
        PID=$(cat "$GUNICORN_PID")
        if kill -0 $PID > /dev/null 2>&1; then
            kill $PID
            log_success "Gunicorn进程已停止"
        else
            log_warning "PID文件存在但进程不存在，清理PID文件"
        fi
        rm -f "$GUNICORN_PID"
    fi
}

# 安装生产环境依赖
install_production_deps() {
    log_info "安装生产环境依赖..."
    
    source "$VENV_DIR/bin/activate"
    
    # 基础依赖
    pip install -r requirements.txt
    
    # 生产环境专用依赖
    pip install gunicorn
    pip install whitenoise
    pip install psycopg2-binary  # PostgreSQL支持
    pip install redis django-redis  # Redis缓存支持
    pip install dj-database-url  # 数据库URL解析
    
    log_success "生产环境依赖安装完成"
}

# 收集静态文件
collect_static() {
    log_info "收集静态文件..."
    
    export DJANGO_SETTINGS_MODULE="mysite.production_settings"
    python manage.py collectstatic --noinput --clear
    
    log_success "静态文件收集完成"
}

# 数据库迁移
run_migrations() {
    log_info "执行数据库迁移..."
    
    export DJANGO_SETTINGS_MODULE="mysite.production_settings"
    
    # 为所有应用创建迁移文件
    log_info "为所有应用创建迁移文件..."
    python manage.py makemigrations accounts exams
    
    # 执行迁移
    python manage.py migrate
    
    log_success "数据库迁移完成"
}

# 启动Gunicorn服务
start_gunicorn() {
    log_info "启动Gunicorn生产服务器..."
    
    # 设置环境变量
    export DJANGO_SETTINGS_MODULE="mysite.production_settings"
    
    # Gunicorn配置
    WORKERS=${GUNICORN_WORKERS:-3}
    BIND_ADDRESS=${BIND_ADDRESS:-"0.0.0.0:8000"}
    TIMEOUT=${TIMEOUT:-30}
    
    # 启动命令
    gunicorn mysite.wsgi:application \
        --bind "$BIND_ADDRESS" \
        --workers $WORKERS \
        --timeout $TIMEOUT \
        --keep-alive 2 \
        --max-requests 1000 \
        --max-requests-jitter 100 \
        --preload \
        --pid "$GUNICORN_PID" \
        --access-logfile "$LOG_DIR/gunicorn_access.log" \
        --error-logfile "$LOG_DIR/gunicorn_error.log" \
        --log-level info \
        --daemon
    
    sleep 2
    
    # 检查服务是否启动成功
    if [ -f "$GUNICORN_PID" ] && kill -0 $(cat "$GUNICORN_PID") > /dev/null 2>&1; then
        log_success "Gunicorn服务启动成功"
        log_info "PID: $(cat $GUNICORN_PID)"
        log_info "监听地址: $BIND_ADDRESS"
        log_info "工作进程数: $WORKERS"
    else
        log_error "Gunicorn服务启动失败"
        exit 1
    fi
}

# 检查服务状态
check_status() {
    if [ -f "$GUNICORN_PID" ] && kill -0 $(cat "$GUNICORN_PID") > /dev/null 2>&1; then
        PID=$(cat "$GUNICORN_PID")
        log_success "服务正在运行 (PID: $PID)"
        
        # 检查端口监听
        if netstat -tuln | grep -q ":8000 "; then
            log_success "端口8000正在监听"
        else
            log_warning "端口8000未在监听"
        fi
        
        # 显示进程信息
        ps aux | grep gunicorn | grep -v grep
    else
        log_warning "服务未运行"
    fi
}

# 重启服务
restart_service() {
    log_info "重启Gunicorn服务..."
    stop_gunicorn
    sleep 2
    start_gunicorn
}

# 查看日志
show_logs() {
    log_info "显示服务日志..."
    
    if [ -f "$LOG_DIR/gunicorn_error.log" ]; then
        echo -e "${YELLOW}=== 错误日志 ===${NC}"
        tail -n 20 "$LOG_DIR/gunicorn_error.log"
    fi
    
    if [ -f "$LOG_DIR/gunicorn_access.log" ]; then
        echo -e "${YELLOW}=== 访问日志 ===${NC}"
        tail -n 20 "$LOG_DIR/gunicorn_access.log"
    fi
}

# 获取访问地址函数
get_access_url() {
    # 检测当前环境
    if [ "$DOMAIN_NAME" = "innergrow.ai" ] && [ "$PROTOCOL" = "https" ]; then
        # 生产环境
        BASE_URL="https://innergrow.ai"
    elif [ "$DOMAIN_NAME" = "innergrow.ai" ] && [ "$PROTOCOL" = "http" ]; then
        # 生产环境但未启用HTTPS
        BASE_URL="http://innergrow.ai"
    else
        # 本地或测试环境
        if [ -n "$PORT" ]; then
            BASE_URL="http://localhost:$PORT"
        else
            BASE_URL="http://localhost:8000"
        fi
    fi
    echo "$BASE_URL"
}

# 显示最终结果函数
show_completion_message() {
    BASE_URL=$(get_access_url)
    
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}🎉 生产环境操作完成${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${BLUE}访问地址:${NC}"
    echo -e "  API服务: $BASE_URL/api/"
    echo -e "  管理后台: $BASE_URL/admin/"
    
    # 根据域名显示不同的提示信息
    if [ "$DOMAIN_NAME" = "innergrow.ai" ]; then
        echo -e "${YELLOW}注意: 这是生产环境WSGI服务器${NC}"
        echo -e "${YELLOW}确保域名DNS解析指向此服务器${NC}"
        if [ "$PROTOCOL" = "https" ]; then
            echo -e "${YELLOW}确保SSL证书配置正确${NC}"
        fi
    else
        echo -e "${YELLOW}注意: 这是生产环境WSGI服务器（本地/测试）${NC}"
    fi
}
main() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}   InnerGrow.ai 生产环境部署脚本${NC}"
    echo -e "${BLUE}========================================${NC}"
    
    # 进入项目目录
    cd "$PROJECT_DIR"
    
    # 解析命令行参数
    case "${1:-deploy}" in
        "deploy")
            check_production_requirements
            install_production_deps
            run_migrations
            collect_static
            stop_gunicorn
            start_gunicorn
            check_status
            ;;
        "start")
            start_gunicorn
            check_status
            ;;
        "stop")
            stop_gunicorn
            ;;
        "restart")
            restart_service
            check_status
            ;;
        "status")
            check_status
            ;;
        "logs")
            show_logs
            ;;
        *)
            echo "用法: $0 {deploy|start|stop|restart|status|logs}"
            echo ""
            echo "命令说明:"
            echo "  deploy  - 完整部署（默认）"
            echo "  start   - 启动服务"
            echo "  stop    - 停止服务"
            echo "  restart - 重启服务"
            echo "  status  - 查看状态"
            echo "  logs    - 查看日志"
            exit 1
            ;;
    esac
    
    # 显示完成消息
    show_completion_message
}

# 运行主函数
main "$@"
