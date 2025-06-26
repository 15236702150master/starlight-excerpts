# Starlight Excerpts - Vercel Functions集成指南

## 🎯 概述

本指南说明如何将starlight-excerpts项目与Vercel Functions后端集成，解决GitHub Pages部署时的AI功能CORS跨域问题。

## 🏗️ 架构说明

```
GitHub Pages (前端) → Vercel Functions (API代理) → AI平台API
```

- **前端**: 部署在GitHub Pages上的React应用
- **后端**: 部署在Vercel上的Functions API，代理AI API调用
- **AI平台**: DeepSeek和Qianwen提供AI服务

## 📋 集成步骤

### 1. 部署Vercel Functions后端

```bash
# 进入API项目目录
cd starlight-excerpts-api

# 安装依赖
npm install

# 部署到Vercel
npm run deploy
# 或者使用: vercel --prod
```

### 2. 获取Vercel API URL

部署成功后，记录Vercel提供的URL，例如：
```
https://starlight-excerpts-api-xxx.vercel.app
```

### 3. 更新前端配置

编辑 `src/config/vercel.js`：

```javascript
// 将此URL替换为您的实际Vercel部署地址
export const API_BASE_URL = 'https://your-actual-vercel-url.vercel.app'
```

### 4. 验证集成

1. **健康检查**：访问 `https://your-vercel-url.vercel.app/api/health`
2. **前端测试**：在starlight-excerpts应用中测试AI总结功能
3. **API测试**：使用提供的测试页面验证API调用

## 🔧 配置文件说明

### 前端配置文件

#### `src/config/vercel.js`
```javascript
// Vercel API配置
export const API_BASE_URL = 'https://your-vercel-url.vercel.app'
export const API_ENDPOINTS = {
  AI_PROXY: `${API_BASE_URL}/api/ai-proxy`,
  DEEPSEEK: `${API_BASE_URL}/api/deepseek`,
  QIANWEN: `${API_BASE_URL}/api/qianwen`
}
```

#### `src/utils/aiService.js`
- 已更新为使用Vercel Functions代理
- 移除了CORS代理逻辑
- 统一使用`callVercelAPI`函数

### 后端配置文件

#### `vercel.json`
```json
{
  "version": 2,
  "functions": {
    "api/**/*.js": {
      "runtime": "@vercel/node"
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

## 🧪 测试方法

### 1. 自动化测试

```bash
# 在starlight-excerpts-api目录中
node test-integration.js

# 或者设置API密钥进行完整测试
DEEPSEEK_API_KEY=your_key QIANWEN_API_KEY=your_key node test-integration.js
```

### 2. 手动测试

打开 `starlight-excerpts-api/test-api.html` 进行交互式测试。

### 3. 前端集成测试

1. 在starlight-excerpts应用中上传文档
2. 配置AI API密钥
3. 点击"AI总结"按钮
4. 验证总结结果

## 🚨 故障排除

### 常见问题

1. **CORS错误**
   ```
   Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
   ```
   **解决方案**: 检查Vercel Functions的CORS配置

2. **API调用失败**
   ```
   Vercel API调用失败: 500 Internal Server Error
   ```
   **解决方案**: 
   - 检查API密钥是否正确
   - 查看Vercel Functions日志
   - 验证请求格式

3. **配置错误**
   ```
   TypeError: Failed to fetch
   ```
   **解决方案**: 确认`src/config/vercel.js`中的URL正确

### 调试步骤

1. **检查Vercel部署状态**
   - 访问Vercel Dashboard
   - 查看Functions日志
   - 确认部署成功

2. **验证API端点**
   ```bash
   curl https://your-vercel-url.vercel.app/api/health
   ```

3. **检查前端配置**
   - 确认`API_BASE_URL`正确
   - 检查浏览器开发者工具的网络请求

## 📊 性能和限制

### Vercel免费额度
- **函数调用**: 100万次/月
- **带宽**: 100GB/月
- **执行时间**: 10秒/次

### 优化建议
1. **缓存策略**: 对相同内容的总结进行本地缓存
2. **错误重试**: 实现智能重试机制
3. **负载均衡**: 在多个AI平台间分配请求

## 🔒 安全考虑

1. **API密钥安全**
   - 用户API密钥仅在前端存储
   - 通过HTTPS安全传输
   - 不在Vercel Functions中存储

2. **访问控制**
   - CORS配置限制访问源
   - 输入验证防止注入攻击
   - 速率限制防止滥用

## 📚 相关文档

- [Vercel Functions文档](https://vercel.com/docs/functions)
- [DeepSeek API文档](https://platform.deepseek.com/api-docs)
- [通义千问API文档](https://help.aliyun.com/zh/dashscope/)
- [GitHub Pages文档](https://docs.github.com/en/pages)

## 🆘 获取帮助

如果遇到问题：
1. 查看本指南的故障排除部分
2. 检查项目的GitHub Issues
3. 参考Vercel官方文档
4. 联系项目维护者
