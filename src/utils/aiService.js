// 前端AI服务 - 通过Vercel Functions代理调用AI平台API
// 解决GitHub Pages部署时的CORS跨域问题

import { API_ENDPOINTS } from '../config/vercel.js'

// AI平台配置
const AI_PLATFORMS = {
  deepseek: {
    name: 'DeepSeek',
    apiUrl: API_ENDPOINTS.AI_PROXY,
    models: ['deepseek-chat', 'deepseek-coder'],
    provider: 'deepseek',
    needsProxy: false // 通过Vercel Functions，不需要额外代理
  },
  qianwen: {
    name: '通义千问',
    apiUrl: API_ENDPOINTS.AI_PROXY,
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
    provider: 'qianwen',
    needsProxy: false // 通过Vercel Functions，不需要额外代理
  }
}

// 生成AI总结
export const generateAISummary = async (content, title, platform, model, apiKey) => {
  if (!content || !platform || !model || !apiKey) {
    throw new Error('缺少必要参数')
  }

  const platformConfig = AI_PLATFORMS[platform]
  if (!platformConfig) {
    throw new Error('不支持的AI平台')
  }

  try {
    let response

    switch (platform) {
      case 'deepseek':
        response = await callVercelAPI(content, title, model, apiKey, platformConfig)
        break
      case 'qianwen':
        response = await callVercelAPI(content, title, model, apiKey, platformConfig)
        break
      default:
        throw new Error('不支持的AI平台')
    }

    return {
      success: true,
      data: {
        summary: response.summary,
        platform: platform,
        model: model,
        createdAt: new Date().toISOString(),
        wordCount: response.summary.length
      }
    }
  } catch (error) {
    console.error('AI总结生成失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 通过Vercel Functions调用AI API
const callVercelAPI = async (content, title, model, apiKey, platformConfig) => {
  const prompt = createSummaryPrompt(content, title)

  const messages = [
    {
      role: 'system',
      content: '你是一个专业的文档分析助手，请对用户提供的文档进行详细分析和总结。'
    },
    {
      role: 'user',
      content: prompt
    }
  ]

  const requestBody = {
    provider: platformConfig.provider,
    messages: messages,
    apiKey: apiKey,
    model: model
  }

  try {
    const response = await fetch(platformConfig.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Vercel API调用失败: ${response.status} ${errorData.error || response.statusText}`)
    }

    const data = await response.json()

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('AI API返回格式错误')
    }

    return {
      summary: data.choices[0].message.content.trim()
    }
  } catch (error) {
    console.error('Vercel API调用失败:', error)
    throw error
  }
}

// 注意：原来的单独API调用函数已被统一的callVercelAPI函数替代
// 所有AI平台现在都通过Vercel Functions代理调用

// 创建总结提示词
const createSummaryPrompt = (content, title) => {
  return `请为以下文档生成一个简洁有力的总结：

标题：${title || '未命名文档'}

内容：
${content}

请参考这个优质总结的风格：
"天才关注'如何做'，真正的成功者理解'为什么做'

在《取经更重要？还是送荔枝更重要？》一文中，作者认为，一项任务的名义目标往往次于围绕其的复杂人类利益和权力动态网络。作者认为，真正的成功并非来自那些高度专注于任务本身的才华横溢的人，而是来自那些理解并驾驭潜在政治格局的人。"

总结要求：
1. 开头用一句话概括核心观点，要有吸引力和洞察力
2. 用4-6段自然流畅的文字展开，每段聚焦一个主要方面
3. 语言要自然、易读，避免生硬的学术腔调
4. 内容要详细充实，深入分析各个要点
5. 总字数控制在800-1000字之间
6. 不要使用markdown符号（如#、**、\`\`\`等）
7. 段落之间用空行分隔

请直接输出总结内容，不要添加"总结："等前缀。`
}

// 获取支持的AI平台列表
export const getSupportedPlatforms = () => {
  return Object.entries(AI_PLATFORMS).map(([key, config]) => ({
    id: key,
    name: config.name,
    models: config.models
  }))
}

// 验证API密钥格式
export const validateApiKey = (platform, apiKey) => {
  if (!apiKey || typeof apiKey !== 'string') {
    return false
  }

  switch (platform) {
    case 'deepseek':
      return apiKey.startsWith('sk-') && apiKey.length > 20
    case 'qianwen':
      return apiKey.startsWith('sk-') && apiKey.length > 20
    default:
      return false
  }
}

// 测试API连接
export const testAPIConnection = async (platform, model, apiKey) => {
  try {
    const testContent = "这是一个测试文档，用于验证API连接是否正常。"
    const testTitle = "API连接测试"

    const result = await generateAISummary(testContent, testTitle, platform, model, apiKey)

    if (result.success) {
      return {
        success: true,
        message: 'API连接测试成功！'
      }
    } else {
      return {
        success: false,
        message: result.error || 'API连接测试失败'
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `API连接测试失败: ${error.message}`
    }
  }
}

// API密钥管理
const API_KEY_STORAGE_KEY = 'starlight-excerpts-api-keys'

// 保存API密钥到本地存储
export const saveAPIKeys = (apiKeys) => {
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, JSON.stringify(apiKeys))
    return true
  } catch (error) {
    console.error('保存API密钥失败:', error)
    return false
  }
}

// 从本地存储加载API密钥
export const loadAPIKeys = () => {
  try {
    const saved = localStorage.getItem(API_KEY_STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch (error) {
    console.error('加载API密钥失败:', error)
    return {}
  }
}

// 删除API密钥
export const clearAPIKeys = () => {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY)
    return true
  } catch (error) {
    console.error('删除API密钥失败:', error)
    return false
  }
}

// 获取API密钥申请指南
export const getAPIKeyGuide = (platform) => {
  const guides = {
    deepseek: {
      name: 'DeepSeek',
      url: 'https://platform.deepseek.com/',
      steps: [
        '1. 访问DeepSeek平台',
        '2. 注册/登录账号',
        '3. 进入API管理页面',
        '4. 创建新的API密钥',
        '5. 复制密钥到应用中'
      ],
      features: ['推理能力强', '代码理解优秀', '性价比高'],
      cost: '价格便宜，适合大量使用'
    },
    qianwen: {
      name: '通义千问（阿里云）',
      url: 'https://dashscope.console.aliyun.com/',
      steps: [
        '1. 访问阿里云DashScope',
        '2. 注册/登录阿里云账号',
        '3. 开通DashScope服务',
        '4. 创建API-KEY',
        '5. 复制密钥到应用中'
      ],
      features: ['中文处理专业', '阿里云生态', '稳定可靠'],
      cost: '按调用次数计费，有免费额度'
    }
  }

  return guides[platform] || null
}
