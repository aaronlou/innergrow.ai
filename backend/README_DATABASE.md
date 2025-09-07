# 数据库配置说明

## PostgreSQL 配置

此项目仅支持 PostgreSQL 数据库。请确保在运行项目前正确配置 PostgreSQL。

### 安装 PostgreSQL

#### macOS
```bash
brew install postgresql
brew services start postgresql
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 创建数据库

```bash
# 切换到postgres用户
sudo -u postgres psql

# 在PostgreSQL命令行中创建数据库和用户
CREATE DATABASE innergrow_db;
CREATE USER innergrow_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE innergrow_db TO innergrow_user;
\q
```

### 环境变量配置

创建 `.env` 文件或设置以下环境变量：

```bash
# 方式1：使用DATABASE_URL
DATABASE_URL=postgresql://innergrow_user:your_password@localhost:5432/innergrow_db

# 方式2：使用单独的环境变量
DB_NAME=innergrow_db
DB_USER=innergrow_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

### 运行迁移

```bash
# 安装依赖
pip install -r requirements.txt

# 运行迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser
```

### 生产环境配置

生产环境使用 `mysite.production_settings`：

```bash
export DJANGO_SETTINGS_MODULE=mysite.production_settings
python manage.py migrate
```

### 注意事项

1. **仅支持PostgreSQL**：项目已移除SQLite支持，确保使用PostgreSQL
2. **迁移兼容性**：所有迁移文件都针对PostgreSQL优化
3. **性能配置**：生产环境包含PostgreSQL专用的连接池和超时设置
4. **备份建议**：定期备份PostgreSQL数据库

### 故障排除

#### 连接错误
- 检查PostgreSQL服务是否运行
- 验证数据库用户权限
- 确认防火墙设置

#### 迁移错误
- 确保数据库为空或兼容当前模型结构
- 检查用户是否有足够权限创建表和索引
