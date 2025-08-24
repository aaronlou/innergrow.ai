#!/usr/bin/env bash
set -e
git pull origin main        # 拉最新代码
cd /data/www/innergrow.ai/frontend
npm ci                      # 按 lock 文件重装依赖（有则快，无则全）
npm run build               # 重新构建
pm2 restart next-frontend   # 平滑重启
