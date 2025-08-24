#!/bin/bash

# 静态文件配置快速修复脚本
# 解决 collectstatic 命令的 STATIC_ROOT 配置问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   静态文件配置修复脚本${NC}"
echo -e "${BLUE}========================================${NC}"

# 项目目录设置
PROJECT_DIR="/data/www/innergrow.ai/backend"
cd "$PROJECT_DIR"

echo -e "${YELLOW}1. 创建必要的目录...${NC}"

# 创建静态文件目录
mkdir -p staticfiles
mkdir -p media
mkdir -p logs

# 设置正确的权限
chmod 755 staticfiles
chmod 755 media  
chmod 755 logs

echo -e "${GREEN}✅ 目录创建完成${NC}"

echo -e "${YELLOW}2. 验证Django配置...${NC}"

# 验证Django设置
export DJANGO_SETTINGS_MODULE="mysite.production_settings"

# 检查配置
python -c "
import django
django.setup()
from django.conf import settings
print(f'STATIC_ROOT: {settings.STATIC_ROOT}')
print(f'MEDIA_ROOT: {settings.MEDIA_ROOT}')
print(f'BASE_DIR: {settings.BASE_DIR}')
print('Django配置验证成功')
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Django配置验证通过${NC}"
else
    echo -e "${RED}❌ Django配置验证失败${NC}"
    exit 1
fi

echo -e "${YELLOW}3. 收集静态文件...${NC}"

# 收集静态文件
python manage.py collectstatic --noinput --clear

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 静态文件收集成功${NC}"
else
    echo -e "${RED}❌ 静态文件收集失败${NC}"
    exit 1
fi

echo -e "${YELLOW}4. 检查Admin静态文件...${NC}"

# 检查admin静态文件是否存在
if [ -f "staticfiles/admin/css/base.css" ]; then
    echo -e "${GREEN}✅ Admin静态文件存在${NC}"
else
    echo -e "${RED}❌ Admin静态文件缺失${NC}"
fi

echo -e "${YELLOW}5. 显示目录结构...${NC}"

echo "staticfiles 目录内容："
ls -la staticfiles/ | head -10

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}   修复完成！${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "${GREEN}下一步操作：${NC}"
echo "1. 重启Gunicorn服务："
echo "   ./production_deploy.sh restart"
echo ""
echo "2. 测试Admin访问："
echo "   curl -I https://innergrow.ai/admin/"
echo ""
echo "3. 检查服务状态："
echo "   ./production_deploy.sh status"

echo -e "\n${YELLOW}注意：${NC}"
echo "- 如果仍有问题，请检查数据库连接"
echo "- 确保超级用户已创建：python manage.py createsuperuser"
echo "- 检查防火墙和反向代理配置"