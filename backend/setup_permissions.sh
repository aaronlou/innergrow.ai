#!/bin/bash

# 为所有部署脚本添加执行权限

echo "🔧 设置部署脚本执行权限..."

chmod +x deploy.sh
chmod +x quick_deploy.sh
chmod +x production_deploy.sh

echo "✅ 权限设置完成！"
echo ""
echo "现在你可以使用以下命令："
echo "  开发环境: ./quick_deploy.sh"
echo "  完整部署: ./deploy.sh"
echo "  生产环境: ./production_deploy.sh deploy"