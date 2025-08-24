#!/bin/bash

# Admin访问测试脚本
# 用于快速测试 Django Admin 是否可访问

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Django Admin 访问测试${NC}"
echo -e "${BLUE}========================================${NC}"

# 测试本地访问
echo -e "\n${YELLOW}1. 测试本地admin访问...${NC}"
if curl -s -I http://localhost:8000/admin/ | head -1 | grep -q "200\|302"; then
    echo -e "${GREEN}✅ 本地admin访问正常${NC}"
else
    echo -e "${RED}❌ 本地admin访问失败${NC}"
    echo "请确保Django服务正在运行：./production_deploy.sh status"
fi

# 测试生产环境访问
echo -e "\n${YELLOW}2. 测试生产环境admin访问...${NC}"
if curl -s -I https://innergrow.ai/admin/ | head -1 | grep -q "200\|302"; then
    echo -e "${GREEN}✅ 生产环境admin访问正常${NC}"
else
    echo -e "${RED}❌ 生产环境admin访问失败${NC}"
    echo "返回状态："
    curl -s -I https://innergrow.ai/admin/ | head -1
fi

# 测试API访问
echo -e "\n${YELLOW}3. 测试API访问...${NC}"
if curl -s -I https://innergrow.ai/api/ | head -1 | grep -q "200"; then
    echo -e "${GREEN}✅ API访问正常${NC}"
else
    echo -e "${RED}❌ API访问异常${NC}"
fi

# 检查静态文件
echo -e "\n${YELLOW}4. 检查静态文件...${NC}"
if [ -d "staticfiles/admin" ]; then
    echo -e "${GREEN}✅ Admin静态文件存在${NC}"
else
    echo -e "${RED}❌ Admin静态文件缺失，需要运行: python manage.py collectstatic${NC}"
fi

# 检查服务状态
echo -e "\n${YELLOW}5. 检查Gunicorn服务状态...${NC}"
if pgrep -f gunicorn > /dev/null; then
    echo -e "${GREEN}✅ Gunicorn服务正在运行${NC}"
    echo "进程信息："
    ps aux | grep gunicorn | grep -v grep
else
    echo -e "${RED}❌ Gunicorn服务未运行${NC}"
fi

# 提供解决建议
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}   解决建议${NC}"
echo -e "${BLUE}========================================${NC}"

if curl -s -I https://innergrow.ai/admin/ | head -1 | grep -q "404"; then
    echo -e "${RED}检测到404错误，可能原因：${NC}"
    echo "1. 反向代理配置问题（Nginx/Apache）"
    echo "2. Django URL配置问题"
    echo "3. 静态文件收集问题"
    echo "4. 域名解析问题"
    echo ""
    echo -e "${YELLOW}建议操作：${NC}"
    echo "1. 重新收集静态文件：python manage.py collectstatic --noinput"
    echo "2. 重启服务：./production_deploy.sh restart"
    echo "3. 检查日志：tail -f logs/gunicorn_error.log"
    echo "4. 运行诊断：python diagnose_admin.py"
fi

echo -e "\n${GREEN}测试完成！${NC}"