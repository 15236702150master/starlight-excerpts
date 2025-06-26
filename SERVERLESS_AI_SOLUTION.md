# 🚀 Serverless AI解决方案

## 🎯 推荐方案：Vercel Functions + GitHub Pages

### 架构设计
```
GitHub Pages (前端) → Vercel Functions (API代理) → AI平台API
```

### 优势
- ✅ 完全免费（Vercel免费额度很大）
- ✅ 解决CORS问题
- ✅ 保护API密钥
- ✅ 自动扩缩容
- ✅ 全球CDN加速

## 📁 实施步骤

### 1. 创建Vercel项目结构

```
starlight-excerpts-api/
├── api/
│   ├── summarize.js
│   └── platforms.js
├── package.json
└── vercel.json
```

### 2. 核心API文件

**api/summarize.js**
```javascript
export default async function handler(req, res) {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { content, title, platform, model, apiKey } = req.body

    // 调用对应的AI平台
    let result
    switch (platform) {
      case 'doubao':
        result = await callDoubaoAPI(content, title, model, apiKey)
        break
      case 'deepseek':
        result = await callDeepSeekAPI(content, title, model, apiKey)
        break
      default:
        throw new Error('不支持的AI平台')
    }

    res.status(200).json({
      success: true,
      data: result
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

async function callDeepSeekAPI(content, title, model, apiKey) {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'user',
          content: `请为以下文档生成800-1000字的详细总结：\n\n标题：${title}\n\n内容：${content}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  })

  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'API调用失败')
  }

  return {
    summary: data.choices[0].message.content.trim(),
    platform: 'deepseek',
    model: model,
    timestamp: new Date().toISOString()
  }
}
```

### 3. 部署配置

**vercel.json**
```json
{
  "functions": {
    "api/summarize.js": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

### 4. 前端调用修改

修改前端代码，调用Vercel Functions而不是直接调用AI API：

```javascript
// 修改 src/utils/aiService.js
const VERCEL_API_BASE = 'https://your-vercel-app.vercel.app'

export const generateAISummary = async (content, title, platform, model, apiKey) => {
  try {
    const response = await fetch(`${VERCEL_API_BASE}/api/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content,
        title,
        platform,
        model,
        apiKey
      })
    })

    const data = await response.json()
    return data
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}
```

## 🚀 部署步骤

### 1. 创建Vercel账号
- 访问 https://vercel.com
- 使用GitHub账号登录

### 2. 部署API项目
```bash
# 创建新的API项目
mkdir starlight-excerpts-api
cd starlight-excerpts-api

# 初始化项目
npm init -y

# 创建API文件
mkdir api
# 复制上面的代码到对应文件

# 部署到Vercel
npx vercel --prod
```

### 3. 获取API地址
部署成功后，Vercel会提供一个URL，如：
`https://starlight-excerpts-api.vercel.app`

### 4. 更新前端配置
在前端代码中使用这个URL作为API基地址

## 💰 成本分析

### Vercel免费额度
- ✅ 每月100GB带宽
- ✅ 每月100万次函数调用
- ✅ 10秒函数执行时间
- ✅ 无限制的静态部署

### 对于AI总结应用
- 每次总结大约消耗1-2秒执行时间
- 免费额度足够支持大量用户使用
- 超出免费额度后按使用量付费（很便宜）

## 🔒 安全性

### API密钥保护
- 用户的API密钥通过HTTPS传输到Vercel Functions
- Vercel Functions代理调用AI平台
- API密钥不会暴露给其他用户

### 使用限制
可以在Vercel Functions中添加：
- 请求频率限制
- 内容长度限制
- IP白名单等安全措施

## 🎯 最终架构

```
用户浏览器 (GitHub Pages)
    ↓ HTTPS
Vercel Functions (API代理)
    ↓ HTTPS
AI平台 (DeepSeek/豆包等)
```

这样既解决了CORS问题，又保持了低成本和高可用性！

## 📋 下一步行动

1. **立即实施**：创建Vercel Functions项目
2. **测试验证**：确保API调用正常
3. **更新前端**：修改API调用地址
4. **部署上线**：推送到GitHub Pages

这个方案既实用又经济，是目前最佳的解决方案！
