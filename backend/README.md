# Starlight Excerpts AI Backend

AI文档总结后端服务，集成豆包大模型API为starlight-excerpts项目提供智能文档总结功能。

## 🚀 快速开始

### 1. 安装依赖
```bash
cd backend
npm install
```

### 2. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑.env文件，确保API密钥正确
# DOUBAO_API_KEY=你的豆包API密钥
```

### 3. 启动服务
```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务将在 `http://localhost:3001` 启动

## 📡 API接口

### 1. 文档总结
```http
POST /api/summarize
Content-Type: application/json

{
  "content": "文档内容...",
  "title": "文档标题",
  "options": {
    "model": "doubao-lite-4k",
    "maxTokens": 1000,
    "temperature": 0.7
  }
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "summary": "这是AI生成的文档总结...",
    "title": "文档标题",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "model": "doubao-lite-4k",
    "usage": {
      "prompt_tokens": 150,
      "completion_tokens": 200,
      "total_tokens": 350
    }
  }
}
```

### 2. 批量总结
```http
POST /api/batch-summarize
Content-Type: application/json

{
  "documents": [
    {
      "title": "文档1",
      "content": "内容1..."
    },
    {
      "title": "文档2", 
      "content": "内容2..."
    }
  ],
  "options": {
    "model": "doubao-lite-4k"
  }
}
```

### 3. 获取模型列表
```http
GET /api/models
```

### 4. 健康检查
```http
GET /api/health
```

## 🔧 配置说明

### 环境变量
- `DOUBAO_API_KEY`: 豆包大模型API密钥（必需）
- `PORT`: 服务端口（默认3001）
- `NODE_ENV`: 环境模式（development/production）

### 支持的模型
- `doubao-lite-4k`: 轻量版，适合日常使用（推荐）
- `doubao-lite-32k`: 轻量版长文档支持
- `doubao-pro-32k`: 专业版，更强能力

## 🛡️ 安全特性

- ✅ API密钥服务端保护
- ✅ CORS跨域配置
- ✅ 请求大小限制
- ✅ 超时保护
- ✅ 错误处理和日志

## 🔗 与前端集成

前端可以通过以下方式调用：

```javascript
// 总结单个文档
const response = await fetch('http://localhost:3001/api/summarize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: documentContent,
    title: documentTitle
  })
});

const result = await response.json();
if (result.success) {
  console.log('总结结果:', result.data.summary);
}
```

## 📝 开发说明

### 项目结构
```
backend/
├── server.js          # 主服务文件
├── package.json       # 依赖配置
├── .env               # 环境变量
├── .env.example       # 环境变量模板
└── README.md          # 说明文档
```

### 错误处理
服务提供完善的错误处理机制：
- API调用错误
- 网络超时
- 参数验证错误
- 服务器内部错误

### 性能优化
- 请求超时控制
- 批量处理防限流
- 内容长度限制
- 错误重试机制

## 🚀 部署建议

### 开发环境
使用 `npm run dev` 启动，支持热重载

### 生产环境
1. 设置 `NODE_ENV=production`
2. 使用 PM2 或类似工具管理进程
3. 配置反向代理（Nginx）
4. 启用HTTPS

## 📞 技术支持

如有问题，请检查：
1. API密钥是否正确配置
2. 网络连接是否正常
3. 豆包API服务状态
4. 服务日志输出
