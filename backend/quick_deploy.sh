#!/bin/bash

# InnerGrow.ai 快速部署脚本
# 适用于日常开发和代码更新后的快速部署

set -e

echo "🚀 InnerGrow.ai 后端快速部署开始..."

# 进入项目目录
cd /Users/lousiyuan/innergrow.ai/backend

# 激活虚拟环境（如果存在）
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✅ 虚拟环境已激活"
else
    echo "⚠️  虚拟环境不存在，使用系统Python"
fi

# 安装/更新依赖
echo "📦 更新依赖包..."
pip install -r requirements.txt

# 数据库迁移
echo "🗄️  执行数据库迁移..."
python manage.py makemigrations accounts books
python manage.py migrate

# 启动服务
echo "🌟 启动Django开发服务器..."
echo "📱 前端地址: http://localhost:3000"
echo "🔗 API地址: http://localhost:8000/api/"
echo "🛠️  管理后台: http://localhost:8000/admin/"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

python manage.py runserver 8000