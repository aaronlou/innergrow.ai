# 🚀 InnerGrow.ai 后端部署脚本使用指南

## ⚠️ 重要提醒

**开发服务器警告处理**

如果你看到以下警告信息：
```
WARNING: This is a development server. Do not use it in a production setting. 
Use a production WSGI or ASGI server instead.
```

这是正常的Django开发服务器警告。根据你的使用场景：

- **开发/测试环境**: 可以忽略此警告，继续使用
- **生产环境**: 必须使用生产级WSGI服务器，请使用 `production_deploy.sh`

## 📁 脚本文件说明

### 1. `deploy.sh` - 开发环境部署脚本
功能最全面的部署脚本，支持开发和生产环境部署。

**使用方法：**
```bash
# 给脚本添加执行权限
chmod +x deploy.sh

# 开发环境部署（默认）
./deploy.sh

# 生产环境部署
./deploy.sh --production

# 运行测试
./deploy.sh --test

# 跳过依赖安装（加快部署速度）
./deploy.sh --skip-deps

# 查看帮助
./deploy.sh --help
```

### 2. `quick_deploy.sh` - 快速部署脚本
适用于日常开发，代码更新后的快速部署。

**使用方法：**
```bash
# 给脚本添加执行权限
chmod +x quick_deploy.sh

# 一键快速部署
./quick_deploy.sh
```

### 3. `production_deploy.sh` - 生产环境专用部署脚本
使用Gunicorn WSGI服务器，适用于生产环境部署。

**使用方法：**
```bash
# 给脚本添加执行权限
chmod +x production_deploy.sh

# 完整生产环境部署（默认）
./production_deploy.sh deploy

# 启动服务
./production_deploy.sh start

# 停止服务
./production_deploy.sh stop

# 重启服务
./production_deploy.sh restart

# 查看状态
./production_deploy.sh status

# 查看日志
./production_deploy.sh logs
```

**域名配置：**
```bash
# 设置环境变量来配置域名
export DOMAIN_NAME="innergrow.ai"
export PROTOCOL="https"

# 或者在.env.production文件中配置
DOMAIN_NAME=innergrow.ai
PROTOCOL=https
```

## 🔧 首次部署步骤

### 1. 环境准备
```bash
# 进入后端目录
cd /Users/lousiyuan/innergrow.ai/backend

# 复制环境变量配置文件
cp .env.example .env

# 根据需要编辑 .env 文件
nano .env
```

### 2. 给脚本添加执行权限
```bash
chmod +x deploy.sh
chmod +x quick_deploy.sh
```

### 3. 首次完整部署
```bash
./deploy.sh
```

### 4. 创建超级用户（如果需要）
```bash
python manage.py createsuperuser
```

## 📈 日常使用流程

### 代码更新后的快速部署
```bash
# 同步代码到服务器后
./quick_deploy.sh
```

### 添加新功能后的完整部署
```bash
# 如果有新的模型或依赖
./deploy.sh
```

## 🌍 访问地址配置

### 开发环境
部署成功后，可以通过以下地址访问：

- **API根目录**: http://localhost:8000/api/
- **管理后台**: http://localhost:8000/admin/
- **前端应用**: http://localhost:3000/

### 生产环境
使用 `production_deploy.sh` 部署后，访问地址会根据配置显示：

**默认配置（innergrow.ai）**：
- **API服务**: https://innergrow.ai/api/
- **管理后台**: https://innergrow.ai/admin/

**本地测试配置**：
```bash
# 设置为本地环境
export DOMAIN_NAME="localhost"
export PROTOCOL="http"
export PORT="8000"
```
显示结果：
- **API服务**: http://localhost:8000/api/
- **管理后台**: http://localhost:8000/admin/

## 🔍 故障排除

### 常见问题和解决方案

**1. 开发服务器警告**
```
WARNING: This is a development server. Do not use it in a production setting.
```
解决方案：
- 开发环境: 可以忽略，继续使用
- 生产环境: 使用 `./production_deploy.sh deploy`

**2. 权限错误**
```bash
chmod +x deploy.sh quick_deploy.sh
```

**2. 端口被占用**
```bash
# 查看占用8000端口的进程
lsof -i :8000

# 停止Django进程
pkill -f "manage.py runserver"
```

**3. 虚拟环境问题**
```bash
# 删除虚拟环境重新创建
rm -rf venv
./deploy.sh
```

**4. 数据库迁移错误**
```bash
# 重置数据库
rm db.sqlite3
python manage.py migrate
```

**5. 依赖安装失败**
```bash
# 升级pip
pip install --upgrade pip

# 清理缓存
pip cache purge

# 重新安装
pip install -r requirements.txt
```

## 📊 脚本功能对比

| 功能 | deploy.sh | quick_deploy.sh | production_deploy.sh |
|------|-----------|-----------------|----------------------|
| 虚拟环境管理 | ✅ | ⚠️ (如果存在) | ✅ |
| 依赖安装 | ✅ | ✅ | ✅ |
| 数据库迁移 | ✅ | ✅ | ✅ |
| 静态文件收集 | ✅ (生产环境) | ❌ | ✅ |
| 测试运行 | ✅ (可选) | ❌ | ❌ |
| 生产环境配置 | ✅ | ❌ | ✅ |
| 超级用户检查 | ✅ | ❌ | ❌ |
| 服务启动 | ✅ | ✅ | ✅ (Gunicorn) |
| WSGI服务器 | ❌ | ❌ | ✅ |
| 服务管理 | ❌ | ❌ | ✅ (start/stop/restart) |
| 域名配置 | ❌ | ❌ | ✅ |

## 🎯 推荐使用场景

- **首次部署**: 使用 `deploy.sh`
- **日常开发**: 使用 `quick_deploy.sh`
- **生产部署**: 使用 `production_deploy.sh deploy`
- **问题排查**: 使用 `deploy.sh --test`

## 📝 注意事项

1. **确保在正确的目录中运行脚本**
2. **生产环境需要修改 .env 配置**
3. **定期备份数据库文件 db.sqlite3**
4. **监控日志文件查看运行状态**

现在你可以轻松地一键部署后端服务了！ 🎉