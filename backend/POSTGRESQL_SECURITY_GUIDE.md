# PostgreSQL 配置安全指南

## 🔒 安全原则

**重要提醒：本项目代码将在公开仓库中，绝不能包含真实的数据库密码或其他敏感信息！**

## 📋 脚本说明

### 1. setup_postgresql.sh - 数据库初始化脚本
- **用途**: 创建PostgreSQL数据库和用户，设置权限
- **安全特性**: 
  - 密码必须通过环境变量提供，不会硬编码在脚本中
  - 不在屏幕输出中显示真实密码
  - 支持自定义数据库名和用户名

### 2. fix_postgresql_permissions.sh - 权限修复脚本
- **用途**: 修复"permission denied for schema public"错误
- **安全特性**: 使用环境变量配置数据库信息

## 🛠️ 安全使用方法

### 步骤1: 设置环境变量（必须）
```bash
# 设置数据库密码（必须）
export POSTGRES_DB_PASSWORD='your_very_secure_password_here'

# 可选：自定义数据库名和用户名
export POSTGRES_DB_NAME='your_db_name'
export POSTGRES_DB_USER='your_db_user'
```

### 步骤2: 运行初始化脚本
```bash
# 以postgres用户身份运行
sudo -u postgres ./setup_postgresql.sh
```

### 步骤3: 或者只显示SQL命令（推荐用于生产环境）
```bash
./setup_postgresql.sh --sql-only
```

## 🔐 密码安全最佳实践

### 1. 生成安全密码
```bash
# 生成随机密码
openssl rand -base64 32

# 或使用Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2. 安全输入密码（避免命令历史记录）
```bash
# 交互式输入密码
read -s -p "Enter PostgreSQL password: " POSTGRES_DB_PASSWORD
export POSTGRES_DB_PASSWORD
```

### 3. 使用专用密码管理
```bash
# 从密码管理器读取
export POSTGRES_DB_PASSWORD=$(pass show innergrow/postgres)
```

## 📁 配置文件安全

### .env.production 文件
1. **权限设置**: `chmod 600 .env.production`
2. **所有者**: 确保只有应用用户可读写
3. **Git忽略**: 已在`.gitignore`中配置
4. **备份**: 安全地备份到加密存储

### 配置内容示例
```bash
# .env.production 文件内容
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/your_db
DJANGO_SECRET_KEY=your_django_secret_key

# 注意：上述密码应该是真实密码，不要提交到Git
```

## ⚠️ 安全检查清单

- [ ] 密码通过环境变量提供，不硬编码在脚本中
- [ ] .env.production 文件权限为 600
- [ ] .env.production 文件在 .gitignore 中
- [ ] 生产环境使用强密码（至少20位，包含字母数字符号）
- [ ] 定期更换数据库密码
- [ ] 备份配置文件到安全位置
- [ ] 限制数据库用户权限（仅授予必要权限）
- [ ] 启用PostgreSQL SSL连接（生产环境）

## 🚨 紧急情况处理

### 如果密码泄露
1. 立即更改数据库密码
2. 更新所有配置文件
3. 检查访问日志，确认是否有异常访问
4. 重新生成Django SECRET_KEY

### 如果配置文件被误提交
1. 立即从Git历史中删除敏感信息
2. 更改所有泄露的密码和密钥
3. 强制推送修复后的历史记录
4. 通知团队成员更新本地仓库

## 📞 联系信息

如发现安全问题或需要帮助，请及时联系系统管理员。

---
**记住：安全无小事，每个配置细节都很重要！**