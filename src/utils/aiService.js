// 前端AI服务 - 直接调用AI平台API
// 适用于GitHub Pages等静态托管环境

// CORS代理配置（用于解决跨域问题）
const CORS_PROXIES = [
  'https://cors-anywhere.herokuapp.com/',
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?'
]

// AI平台配置
const AI_PLATFORMS = {
  doubao: {
    name: '豆包',
    apiUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    models: ['doubao-seed-1-6-250615', 'doubao-1.5-pro-32k-250115'],
    needsProxy: true // 需要代理解决CORS
  },
  deepseek: {
    name: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/chat/completions',
    models: ['deepseek-chat', 'deepseek-coder'],
    needsProxy: true // 需要代理解决CORS
  },
  qianwen: {
    name: '通义千问',
    apiUrl: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
    needsProxy: true // 需要代理解决CORS
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
      case 'doubao':
        response = await callDoubaoAPI(content, title, model, apiKey, platformConfig)
        break
      case 'deepseek':
        response = await callDeepSeekAPI(content, title, model, apiKey, platformConfig)
        break
      case 'qianwen':
        response = await callQianwenAPI(content, title, model, apiKey, platformConfig)
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

// 通用的API调用函数，处理CORS问题
const callAIAPI = async (url, headers, body, needsProxy = true) => {
  let finalUrl = url
  let finalHeaders = { ...headers }

  // 如果需要代理来解决CORS问题
  if (needsProxy) {
    // 尝试直接调用，如果失败则使用代理
    try {
      const directResponse = await fetch(url, {
        method: 'POST',
        headers: finalHeaders,
        body: JSON.stringify(body)
      })

      if (directResponse.ok) {
        return await directResponse.json()
      }
    } catch (error) {
      console.log('直接调用失败，尝试使用代理:', error.message)
    }

    // 使用CORS代理
    for (const proxy of CORS_PROXIES) {
      try {
        finalUrl = proxy + encodeURIComponent(url)

        // 某些代理需要特殊处理
        if (proxy.includes('allorigins')) {
          finalUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
        }

        const response = await fetch(finalUrl, {
          method: 'POST',
          headers: finalHeaders,
          body: JSON.stringify(body)
        })

        if (response.ok) {
          return await response.json()
        }
      } catch (error) {
        console.log(`代理 ${proxy} 调用失败:`, error.message)
        continue
      }
    }

    throw new Error('所有代理都调用失败，请检查网络连接或API密钥')
  } else {
    // 直接调用
    const response = await fetch(url, {
      method: 'POST',
      headers: finalHeaders,
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`API调用失败: ${response.status} ${errorData.error?.message || response.statusText}`)
    }

    return await response.json()
  }
}

// 豆包API调用
const callDoubaoAPI = async (content, title, model, apiKey, platformConfig) => {
  const prompt = createSummaryPrompt(content, title)

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  }

  const body = {
    model: model,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 2000
  }

  const data = await callAIAPI(platformConfig.apiUrl, headers, body, platformConfig.needsProxy)

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('豆包API返回格式错误')
  }

  return {
    summary: data.choices[0].message.content.trim()
  }
}

// DeepSeek API调用
const callDeepSeekAPI = async (content, title, model, apiKey, platformConfig) => {
  const prompt = createSummaryPrompt(content, title)

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  }

  const body = {
    model: model,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 2000
  }

  const data = await callAIAPI(platformConfig.apiUrl, headers, body, platformConfig.needsProxy)

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('DeepSeek API返回格式错误')
  }

  return {
    summary: data.choices[0].message.content.trim()
  }
}

// 通义千问API调用
const callQianwenAPI = async (content, title, model, apiKey, platformConfig) => {
  const prompt = createSummaryPrompt(content, title)

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  }

  const body = {
    model: model,
    input: {
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    },
    parameters: {
      temperature: 0.7,
      max_tokens: 2000
    }
  }

  const data = await callAIAPI(platformConfig.apiUrl, headers, body, platformConfig.needsProxy)

  if (!data.output || !data.output.choices || !data.output.choices[0]) {
    throw new Error('通义千问API返回格式错误')
  }

  return {
    summary: data.output.choices[0].message.content.trim()
  }
}

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
    case 'doubao':
      return apiKey.length > 10 // 简单长度检查
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
    doubao: {
      name: '豆包（字节跳动）',
      url: 'https://console.volcengine.com/ark',
      steps: [
        '1. 访问火山引擎控制台',
        '2. 注册/登录账号',
        '3. 进入"机器学习平台PAI"',
        '4. 选择"模型推理"',
        '5. 创建API密钥',
        '6. 复制密钥到应用中'
      ],
      features: ['中文理解能力强', '新用户有免费额度', '按token计费'],
      cost: '相对便宜，新用户通常有免费试用'
    },
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
