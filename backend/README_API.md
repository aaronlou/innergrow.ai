# InnerGrow.ai Backend API

## 简介

InnerGrow.ai 是一个目标管理和个人成长平台的后端API。

## 技术栈

- Python 3.11+
- Django 5.2
- Django REST Framework
- PostgreSQL (生产环境)
- Redis (可选，用于缓存)

## 环境变量配置

在运行应用之前，需要设置以下环境变量：

### 开发环境

创建 `.env` 文件在项目根目录：

```env
# Django 设置
DJANGO_SECRET_KEY=your-secret-key-here

# 数据库设置 (可选，如果使用PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# OpenAI API 设置
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-5-turbo  # 可选，指定要使用的模型

# 邮件设置 (可选)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-email-password
```

### 生产环境

在生产环境中，建议通过部署平台的环境变量设置功能来配置，而不是使用 `.env` 文件。

## 安装和运行

1. 克隆仓库：
   ```bash
   git clone <repository-url>
   cd innergrow.ai/backend
   ```

2. 创建虚拟环境：
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # 或
   venv\Scripts\activate  # Windows
   ```

3. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```

4. 运行数据库迁移：
   ```bash
   python manage.py migrate
   ```

5. 创建超级用户（可选）：
   ```bash
   python manage.py createsuperuser
   ```

6. 运行开发服务器：
   ```bash
   python manage.py runserver
   ```

## AI 服务

本项目集成了 OpenAI 的 ChatGPT 服务，用于生成目标建议和学习计划等功能。

### 当前实现的功能

1. 目标建议生成 - 为用户的目标提供个性化建议
2. 学习计划生成 - 为用户的考试生成学习计划（预留接口）

### AI 服务架构

AI 服务采用模块化设计，便于在项目的不同部分复用：

- `ai_services/ai_client.py` - OpenAI 客户端封装
- `ai_services/goal_suggestions.py` - 目标建议生成服务
- `ai_services/exam_suggestions.py` - 考试学习计划生成服务（预留）

### 国际化支持

AI 服务支持多语言，可以根据用户的语言偏好生成相应语言的内容：
- 中文 (zh, zh-cn, zh-hans, chinese)
- 英文 (其他所有语言代码)

### 模型选择

可以通过环境变量 `OPENAI_MODEL` 或在 API 请求中指定 `model` 参数来选择使用的 OpenAI 模型。

## API 端点

所有API端点都以 `/api/` 为前缀。

### 认证

除了用户注册和登录接口外，所有API都需要认证。使用Token认证：

```bash
curl -H "Authorization: Token YOUR_TOKEN_HERE" http://localhost:8000/api/some-endpoint/
```

### 用户账户

| 方法 | 端点 | 功能 | 认证要求 |
|------|------|------|----------|
| POST | `/auth/register/` | 用户注册 | 否 |
| POST | `/auth/login/` | 用户登录 | 否 |
| POST | `/auth/logout/` | 用户登出 | 是 |
| GET | `/auth/check-email/` | 检查邮箱是否存在 | 否 |
| GET | `/profile/` | 获取用户信息 | 是 |
| PUT/PATCH | `/profile/update/` | 更新用户信息 | 是 |
| GET/PUT | `/preferences/` | 用户偏好设置 | 是 |

### 书籍管理

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

### 订单管理

| 方法 | 端点 | 功能 | 认证要求 |
|------|------|------|----------|
| GET | `/` | 获取订单列表 | 是 |
| POST | `/` | 创建新订单 | 是 |
| GET | `/<id>/` | 获取订单详情 | 是（买家或卖家） |
| PUT/PATCH | `/<id>/` | 更新订单状态 | 是（仅卖家） |

### 目标管理

| 方法 | 端点 | 功能 | 认证要求 |
|------|------|------|----------|
| GET | `/` | 获取目标列表（支持过滤） | 是 |
| POST | `/` | 创建新目标 | 是 |
| GET | `/<id>/` | 获取目标详情 | 是 |
| PUT/PATCH | `/<id>/` | 更新目标信息 | 是 |
| DELETE | `/<id>/` | 删除目标 | 是 |
| GET | `/public/` | 获取所有公开目标 | 否 |
| GET | `/public/<id>/` | 获取公开目标详情 | 否 |
| GET | `/categories/` | 获取所有目标分类 | 是 |
| GET | `/statuses/` | 获取所有目标状态 | 是 |
| POST | `/categories/create/` | 创建新的目标分类 | 是 |
| POST | `/statuses/create/` | 创建新的目标状态 | 是 |
| GET | `/statistics/` | 获取目标统计信息 | 是 |
| POST | `/<id>/complete/` | 标记目标为完成 | 是 |
| POST | `/<id>/analyze/` | 为目标生成AI建议 | 是 |
| GET | `/<goal_id>/suggestions/` | 获取目标的AI建议列表 | 是 |
| POST | `/<goal_id>/suggestions/<suggestion_id>/accept/` | 接受AI建议 | 是 |

## API 测试示例

### 1. 用户注册
``bash
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
``bash
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
``bash
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
``bash
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

### 6. 目标管理（需要认证）
``bash
# 获取目标分类
curl -X GET http://localhost:8000/api/goals/categories/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# 获取目标状态
curl -X GET http://localhost:8000/api/goals/statuses/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# 创建新的目标分类
curl -X POST http://localhost:8000/api/goals/categories/create/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -d '{
    "name": "Fitness",
    "name_en": "健身"
  }'

# 创建新的目标状态
curl -X POST http://localhost:8000/api/goals/statuses/create/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -d '{
    "name": "In Progress",
    "name_en": "进行中"
  }'

# 创建目标（私密）
curl -X POST http://localhost:8000/api/goals/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -d '{
    "title": "每日阅读30分钟",
    "description": "通过每天阅读来扩展知识面和提升思维能力",
    "category_id": 1,
    "status_id": 1,
    "visibility": "private",
    "target_date": "2024-12-31"
  }'

# 创建目标（公开）
curl -X POST http://localhost:8000/api/goals/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -d '{
    "title": "学习新的编程技能",
    "description": "掌握 React 和 TypeScript 的高级用法",
    "category_id": 1,
    "status_id": 1,
    "visibility": "public",
    "target_date": "2024-12-31"
  }'

# 获取目标列表
curl -X GET http://localhost:8000/api/goals/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# 获取目标详情
curl -X GET http://localhost:8000/api/goals/1/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# 更新目标
curl -X PATCH http://localhost:8000/api/goals/1/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -d '{
    "progress": 75,
    "status_id": 2
  }'

# 删除目标
curl -X DELETE http://localhost:8000/api/goals/1/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# 获取统计信息
curl -X GET http://localhost:8000/api/goals/statistics/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# 标记目标为完成
curl -X POST http://localhost:8000/api/goals/1/complete/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# 生成AI建议 (中文)
curl -X POST http://localhost:8000/api/goals/1/analyze/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -d '{
    "language": "zh"
  }'

# 生成AI建议 (英文)
curl -X POST http://localhost:8000/api/goals/1/analyze/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -d '{
    "language": "en"
  }'

# 生成AI建议 (使用特定模型)
curl -X POST http://localhost:8000/api/goals/1/analyze/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -d '{
    "language": "en",
    "model": "gpt-5-turbo"
  }'

# 获取AI建议列表
curl -X GET http://localhost:8000/api/goals/1/suggestions/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"

# 接受AI建议
curl -X POST http://localhost:8000/api/goals/1/suggestions/1/accept/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -d '{
    "accepted": true
  }'

# 生成学习计划 (中文)
curl -X POST http://localhost:8000/api/exams/1/study-plan/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -d '{
    "language": "zh"
  }'

# 生成学习计划 (英文)
curl -X POST http://localhost:8000/api/exams/1/study-plan/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -d '{
    "language": "en"
  }'

```

### 7. 公开目标查看（无需认证）
```bash
# 获取所有公开目标
curl -X GET http://localhost:8000/api/goals/public/

# 获取特定公开目标详情
curl -X GET http://localhost:8000/api/goals/public/1/
```

## 前后端集成配置

### 1. 前端环境变量配置
在前端项目中创建 `.env.local` 文件：
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

### 2. 前端API调用示例
```
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

## 注意事项

### 1. 认证方式
- 后端使用 Token 认证
- 登录成功后会返回 token，前端需要在请求头中携带：`Authorization: Token YOUR_TOKEN`

### 2. 文件上传
- 支持书籍图片和用户头像上传
- 使用 `multipart/form-data` 格式

### 3. 错误处理
所有API返回统一格式：
```
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
```
{
  "success": true,
  "data": [...],
  "count": 100,
  "next": "http://localhost:8000/api/books/?page=2",
  "previous": null
}
```

## 数据库结构

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

## 调试和开发

### 1. Django Admin
访问 `http://localhost:8000/admin/` 查看和管理数据

### 2. API根端点
访问 `http://localhost:8000/api/` 查看API概览

### 3. 日志查看
Django会在控制台输出请求日志，便于调试

这样就完成了 InnerGrow.ai 后端API的开发，可以支持前端的登录、注册和书籍管理功能！