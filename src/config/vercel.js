// Vercel Functions API配置
// 🔧 部署后请修改此文件中的API_BASE_URL

// 默认的Vercel API基础URL
// 已更新为实际部署的Vercel Functions地址
export const API_BASE_URL = 'https://starlight-excerpts-3grmyghz9-masters-projects-42c8b429.vercel.app'

// API端点配置
export const API_ENDPOINTS = {
  AI_PROXY: `${API_BASE_URL}/api/ai-proxy`,
  DEEPSEEK: `${API_BASE_URL}/api/deepseek`,
  QIANWEN: `${API_BASE_URL}/api/qianwen`
}

// 部署指南
export const DEPLOYMENT_GUIDE = {
  steps: [
    '1. 将 starlight-excerpts-api 项目部署到 Vercel',
    '2. 获取部署后的URL（例如：https://your-project.vercel.app）',
    '3. 修改 src/config/vercel.js 中的 API_BASE_URL',
    '4. 重新构建并部署前端项目'
  ],
  notes: [
    '确保Vercel Functions正常运行',
    'API密钥由用户在前端提供，不需要在Vercel中配置',
    '支持DeepSeek和Qianwen两个AI平台'
  ]
}

// 检查API连接状态
export const checkAPIStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET'
    })
    return {
      success: response.ok,
      status: response.status,
      url: API_BASE_URL
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      url: API_BASE_URL
    }
  }
}
