# InnerGrow.ai 后端API部署和测试指南

## 🚀 部署步骤

### 1. 安装依赖
```bash
# 确保你在backend目录下
cd /Users/lousiyuan/innergrow.ai/backend

# 安装Python依赖
pip install -r requirements.txt
```

### 2. 创建数据库迁移
```bash
# 创建迁移文件
python manage.py makemigrations accounts
python manage.py makemigrations books

# 应用迁移
python manage.py migrate
```

### 3. 创建超级用户（可选）
```bash
python manage.py createsuperuser
```

### 4. 启动开发服务器
```bash
python manage.py runserver 8000
```

## 📋 API端点总览

### 🔐 用户认证 (`/api/accounts/`)

| 方法 | 端点 | 功能 | 认证要求 |
|------|------|------|----------|
| POST | `/auth/register/` | 用户注册 | 否 |
| POST | `/auth/login/` | 用户登录 | 否 |
| POST | `/auth/logout/` | 用户登出 | 是 |
| GET | `/auth/check-email/` | 检查邮箱是否存在 | 否 |
| GET | `/profile/` | 获取用户信息 | 是 |
| PUT/PATCH | `/profile/update/` | 更新用户信息 | 是 |
| GET/PUT | `/preferences/` | 用户偏好设置 | 是 |

### 📚 书籍管理 (`/api/books/`)

| 方法 | 端点 | 功能 | 认证要求 |
|------|------|------|----------|
| GET | `/` | 获取书籍列表（支持搜索） | 否 |
| POST | `/` | 发布新书籍 | 是 |
| GET | `/<id>/` | 获取书籍详情 | 否 |
| PUT/PATCH | `/<id>/` | 更新书籍信息 | 是（仅卖家） |
| DELETE | `/<id>/` | 删除书籍 | 是（仅卖家） |
| GET | `/my-books/` | 获取我发布的书籍 | 是 |
| GET | `/categories/` | 获取书籍分类列表 | 否 |
| GET | `/conditions/` | 获取书籍品相列表 | 否 |

### 📦 订单管理 (`/api/books/orders/`)

| 方法 | 端点 | 功能 | 认证要求 |
|------|------|------|----------|
| GET | `/` | 获取订单列表 | 是 |
| POST | `/` | 创建新订单 | 是 |
| GET | `/<id>/` | 获取订单详情 | 是（买家或卖家） |
| PUT/PATCH | `/<id>/` | 更新订单状态 | 是（仅卖家） |

## 🧪 API测试示例

### 1. 用户注册
```bash
curl -X POST http://localhost:8000/api/accounts/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试用户",
    "email": "test@innergrow.ai",
    "password": "password123",
    "confirm_password": "password123"
  }'
```

### 2. 用户登录
```bash
curl -X POST http://localhost:8000/api/accounts/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@innergrow.ai",
    "password": "password123"
  }'
```

### 3. 获取书籍列表
```bash
curl -X GET "http://localhost:8000/api/books/?keyword=python&category=technology"
```

### 4. 发布书籍（需要认证）
```bash
curl -X POST http://localhost:8000/api/books/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -d '{
    "title": "Python编程从入门到实践",
    "author": "Eric Matthes",
    "category": "technology",
    "condition": "like-new",
    "description": "Python编程入门经典书籍",
    "price": "45.00",
    "location": "北京"
  }'
```

### 5. 创建订单（需要认证）
```bash
curl -X POST http://localhost:8000/api/books/orders/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -d '{
    "book_id": "1",
    "message": "我想购买这本书",
    "buyer_contact": "13800138000",
    "payment_method": "wechat"
  }'
```

## 🔧 前后端集成配置

### 1. 前端环境变量配置
在前端项目中创建 `.env.local` 文件：
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

### 2. 前端API调用示例
```typescript
// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export const api = {
  // 用户认证
  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/accounts/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },
  
  // 获取书籍列表
  async getBooks(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/books/${query}`);
    return response.json();
  },
  
  // 发布书籍
  async createBook(bookData: FormData, token: string) {
    const response = await fetch(`${API_BASE_URL}/books/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
      },
      body: bookData, // FormData for file upload
    });
    return response.json();
  }
};
```

## 🚨 注意事项

### 1. 认证方式
- 后端使用 Token 认证
- 登录成功后会返回 token，前端需要在请求头中携带：`Authorization: Token YOUR_TOKEN`

### 2. 文件上传
- 支持书籍图片和用户头像上传
- 使用 `multipart/form-data` 格式

### 3. 错误处理
所有API返回统一格式：
```json
{
  "success": boolean,
  "data": any,           // 成功时的数据
  "error": string,       // 错误时的消息
  "message": string,     // 操作消息
  "details": object      // 详细错误信息（验证错误等）
}
```

### 4. 分页
列表接口支持分页，返回格式：
```json
{
  "success": true,
  "data": [...],
  "count": 100,
  "next": "http://localhost:8000/api/books/?page=2",
  "previous": null
}
```

## 🏗️ 数据库结构

### 核心模型
- **User**: 扩展的用户模型（邮箱登录、头像、简介）
- **UserPreferences**: 用户偏好设置
- **Book**: 书籍信息（标题、作者、价格、状态等）
- **BookImage**: 书籍图片
- **BookOrder**: 书籍订单
- **ShippingAddress**: 收货地址

### 关系映射
- User 1:1 UserPreferences
- User 1:N Book (seller)
- Book 1:N BookImage
- Book 1:N BookOrder
- BookOrder 1:1 ShippingAddress

## 🔍 调试和开发

### 1. Django Admin
访问 `http://localhost:8000/admin/` 查看和管理数据

### 2. API根端点
访问 `http://localhost:8000/api/` 查看API概览

### 3. 日志查看
Django会在控制台输出请求日志，便于调试

这样就完成了 InnerGrow.ai 后端API的开发，可以支持前端的登录、注册和书籍管理功能！