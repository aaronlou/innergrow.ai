#!/bin/bash

# InnerGrow.ai 配置文件权限修复脚本

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

# 项目目录
PROJECT_DIR="/data/www/innergrow.ai/backend"
ENV_FILE="$PROJECT_DIR/.env.production"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   InnerGrow.ai 权限修复脚本${NC}"
echo -e "${BLUE}========================================${NC}"

# 检查文件是否存在
if [ ! -f "$ENV_FILE" ]; then
    log_error "配置文件不存在: $ENV_FILE"
    log_info "请先创建配置文件："
    echo "  cp $PROJECT_DIR/.env.production.example $ENV_FILE"
    exit 1
fi

# 获取当前用户信息
CURRENT_USER=$(whoami)
CURRENT_GROUP=$(id -gn)

log_info "当前用户: $CURRENT_USER"
log_info "当前用户组: $CURRENT_GROUP"

# 检查文件权限
log_info "检查文件权限..."
ls -la "$ENV_FILE"

# 获取文件所有者
FILE_OWNER=$(stat -c '%U' "$ENV_FILE" 2>/dev/null || stat -f '%Su' "$ENV_FILE" 2>/dev/null)
FILE_GROUP=$(stat -c '%G' "$ENV_FILE" 2>/dev/null || stat -f '%Sg' "$ENV_FILE" 2>/dev/null)

log_info "文件所有者: $FILE_OWNER:$FILE_GROUP"

# 检查是否可读
if [ -r "$ENV_FILE" ]; then
    log_success "文件可读，权限正常"
    exit 0
fi

log_warning "文件不可读，开始修复权限..."

# 尝试不同的修复方案
if [ "$FILE_OWNER" = "root" ]; then
    log_info "文件属于 root 用户，尝试更改所有者..."
    
    # 检测系统和推荐用户
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS 开发环境
        WEB_USER="$CURRENT_USER"
        WEB_GROUP="staff"
    elif id www-data &>/dev/null; then
        # Linux with www-data
        WEB_USER="www-data"
        WEB_GROUP="www-data"
    elif id apache &>/dev/null; then
        # CentOS/RHEL
        WEB_USER="apache"
        WEB_GROUP="apache"
    else
        # 回退到当前用户
        WEB_USER="$CURRENT_USER"
        WEB_GROUP="$CURRENT_GROUP"
    fi
    
    log_info "推荐使用用户: $WEB_USER:$WEB_GROUP"
    
    # 提供选项
    echo "请选择修复方案："
    echo "1. 更改为推荐用户 ($WEB_USER:$WEB_GROUP)"
    echo "2. 更改为当前用户 ($CURRENT_USER:$CURRENT_GROUP)"
    echo "3. 仅添加读取权限 (保持 root 所有者)"
    echo "4. 退出"
    
    read -p "请输入选择 [1-4]: " choice
    
    case $choice in
        1)
            sudo chown "$WEB_USER:$WEB_GROUP" "$ENV_FILE"
            sudo chmod 600 "$ENV_FILE"
            log_success "已更改为 $WEB_USER:$WEB_GROUP"
            ;;
        2)
            sudo chown "$CURRENT_USER:$CURRENT_GROUP" "$ENV_FILE"
            chmod 600 "$ENV_FILE"
            log_success "已更改为 $CURRENT_USER:$CURRENT_GROUP"
            ;;
        3)
            sudo chmod 644 "$ENV_FILE"
            log_success "已添加读取权限"
            ;;
        4)
            log_info "用户取消操作"
            exit 0
            ;;
        *)
            log_error "无效选择"
            exit 1
            ;;
    esac
    
elif [ "$FILE_OWNER" = "www-data" ]; then
    log_info "文件属于 www-data 用户，尝试添加组权限..."
    
    # 将当前用户添加到 www-data 组
    sudo usermod -a -G www-data "$CURRENT_USER"
    
    # 设置组读取权限
    sudo chmod 640 "$ENV_FILE"
    
    log_success "已将 $CURRENT_USER 添加到 www-data 组"
    log_warning "请重新登录或运行 'newgrp www-data' 使组权限生效"
    
else
    log_info "尝试添加读取权限..."
    
    if sudo chmod 644 "$ENV_FILE"; then
        log_success "权限修复成功"
    else
        log_error "权限修复失败"
        exit 1
    fi
fi

# 验证修复结果
echo ""
log_info "权限修复完成，验证结果..."
ls -la "$ENV_FILE"

if [ -r "$ENV_FILE" ]; then
    log_success "✅ 文件现在可读"
    log_info "可以运行配置验证: python test_production_config.py"
else
    log_error "❌ 文件仍然不可读，请手动检查权限"
    exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 权限修复完成${NC}"
echo -e "${GREEN}========================================${NC}"