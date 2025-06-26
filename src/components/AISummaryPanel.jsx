import React, { useState, useEffect, useRef } from 'react'
import { Brain, Loader2, RefreshCw, Copy, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Settings, Key } from 'lucide-react'
import { marked } from 'marked'
import { saveAISummary, getAISummary } from '../utils/storage'
import APIKeyConfig from './APIKeyConfig'
import './AISummaryPanel.css'

const AISummaryPanel = ({ article, onSummaryGenerated }) => {
  const [summary, setSummary] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [autoSummaryTriggered, setAutoSummaryTriggered] = useState(false)
  const [showPlatformSelector, setShowPlatformSelector] = useState(false)
  const [availablePlatforms, setAvailablePlatforms] = useState([])
  const [selectedPlatform, setSelectedPlatform] = useState('deepseek')
  const [selectedModel, setSelectedModel] = useState('')
  const [showAPIKeyConfig, setShowAPIKeyConfig] = useState(false)
  const [apiKeys, setApiKeys] = useState({})
  const summaryRef = useRef(null)

  // 配置marked选项
  useEffect(() => {
    marked.setOptions({
      breaks: true,
      gfm: true,
      headerIds: false,
      mangle: false
    })
  }, [])

  // 获取可用的AI平台和加载API密钥
  useEffect(() => {
    fetchAvailablePlatforms()
    loadAPIKeys()
  }, [])

  // 加载保存的API密钥
  const loadAPIKeys = () => {
    try {
      const savedKeys = localStorage.getItem('ai_api_keys')
      if (savedKeys) {
        const parsed = JSON.parse(savedKeys)
        setApiKeys(parsed)
      }
    } catch (error) {
      console.error('加载API密钥失败:', error)
    }
  }

  const fetchAvailablePlatforms = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/platforms')
      if (response.ok) {
        const data = await response.json()
        setAvailablePlatforms(data.data)

        // 设置默认选择的模型
        const deepseekPlatform = data.data.find(p => p.id === 'deepseek')
        if (deepseekPlatform) {
          setSelectedModel(deepseekPlatform.models[0])
        }
      }
    } catch (error) {
      console.error('获取AI平台列表失败:', error)
    }
  }

  // 检查是否已有总结，如果没有则自动生成
  useEffect(() => {
    if (article && article.content && !autoSummaryTriggered) {
      setAutoSummaryTriggered(true)

      // 先检查是否已有保存的总结
      const existingSummary = getAISummary(article.id)
      if (existingSummary) {
        setSummary(existingSummary.summary)
        console.log('加载已保存的AI总结')
      } else {
        // 延迟一点时间让页面加载完成后自动生成总结
        setTimeout(() => {
          generateSummary()
        }, 1000)
      }
    }
  }, [article, autoSummaryTriggered])

  const generateSummary = async (platform = selectedPlatform, model = selectedModel) => {
    if (!article?.content) {
      setError('文档内容为空，无法生成总结')
      return
    }

    // 检查是否有API密钥
    const hasValidKeys = Object.values(apiKeys).some(key => key && key.trim() !== '')
    if (!hasValidKeys) {
      setError('请先配置AI平台的API密钥')
      return
    }

    setIsLoading(true)
    setError(null)
    setSummary('')

    try {
      console.log('开始生成AI总结...')
      console.log('使用平台:', platform)
      console.log('使用模型:', model)

      const response = await fetch('http://localhost:3001/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: article.content,
          title: article.title,
          platform: platform,
          model: model,
          apiKeys: apiKeys
        })
      })

      const data = await response.json()

      if (data.success) {
        // 优化总结格式，确保Markdown结构清晰
        const optimizedSummary = optimizeSummaryFormat(data.data.summary)
        setSummary(optimizedSummary)

        // 保存总结到localStorage
        const summaryData = {
          summary: optimizedSummary,
          model: data.data.model || model,
          platform: data.data.platform || platform,
          timestamp: data.data.timestamp,
          usage: data.data.usage
        }
        saveAISummary(article.id, summaryData)

        // 通知父组件总结已生成
        if (onSummaryGenerated) {
          onSummaryGenerated({
            articleId: article.id,
            ...summaryData
          })
        }
      } else {
        throw new Error(data.error || '生成总结失败')
      }
    } catch (error) {
      console.error('AI总结错误:', error)
      if (error.message.includes('fetch')) {
        setError('无法连接到AI服务，请确保后端服务已启动 (http://localhost:3001)')
      } else {
        setError(error.message || '生成总结时发生错误')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 优化总结格式，确保清晰的层次结构和舒适的阅读体验
  const optimizeSummaryFormat = (rawSummary) => {
    let formatted = rawSummary

    // 确保有主标题
    if (!formatted.startsWith('#')) {
      formatted = `# 📄 文档总结\n\n${formatted}`
    }

    // 优化总结结构，使用清晰的标识符
    formatted = formatted
      // 标准化核心理念标识
      .replace(/核心理念[：:]/g, '**核心理念：**')
      .replace(/主要观点[：:]/g, '**主要观点：**')
      .replace(/关键结论[：:]/g, '**关键结论：**')
      .replace(/核心内容[：:]/g, '**核心内容：**')
      .replace(/重要要点[：:]/g, '**重要要点：**')
      .replace(/主要论点[：:]/g, '**主要论点：**')

      // 优化段落结构
      // 确保标题前后有空行
      .replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2')
      .replace(/(#{1,6}[^\n]+)\n([^#\n])/g, '$1\n\n$2')

      // 确保重要标识前后有适当空行
      .replace(/([^\n])\n(\*\*[^*]+：\*\*)/g, '$1\n\n$2')
      .replace(/(\*\*[^*]+：\*\*[^\n]*)\n([^\n*])/g, '$1\n\n$2')

      // 优化列表格式
      .replace(/([^\n])\n([*\-+]\s)/g, '$1\n\n$2')
      .replace(/([*\-+][^\n]+)\n([^*\-+\n])/g, '$1\n\n$2')

      // 优化数字列表格式
      .replace(/([^\n])\n(\d+\.\s)/g, '$1\n\n$2')
      .replace(/(\d+\.[^\n]+)\n([^\d\n])/g, '$1\n\n$2')

      // 清理多余空行，但保持适当的段落间距
      .replace(/\n{4,}/g, '\n\n\n')
      .replace(/\n{3}/g, '\n\n')
      .trim()

    // 确保总结有良好的结构
    if (!formatted.includes('**核心理念：**') && !formatted.includes('**主要观点：**')) {
      // 如果AI没有使用标准格式，尝试自动添加结构
      const lines = formatted.split('\n').filter(line => line.trim())
      if (lines.length > 3) {
        // 简单的结构化处理
        formatted = formatted.replace(/^(# [^\n]+\n\n)/, '$1**核心内容：**\n\n')
      }
    }

    return formatted
  }

  // 复制纯文本内容（去除Markdown格式）
  const handleCopy = async () => {
    if (!summary) return

    try {
      // 将Markdown转换为纯文本
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = marked(summary)
      const plainText = tempDiv.textContent || tempDiv.innerText || ''
      
      await navigator.clipboard.writeText(plainText)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
      // 降级方案：复制原始文本
      try {
        await navigator.clipboard.writeText(summary)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      } catch (fallbackError) {
        console.error('降级复制也失败:', fallbackError)
      }
    }
  }

  const handleRetry = () => {
    setError(null)
    setSummary('')
    generateSummary()
  }

  // 处理API密钥配置
  const handleAPIKeySave = (newKeys) => {
    setApiKeys(newKeys)
    setShowAPIKeyConfig(false)
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  if (!article) return null

  return (
    <div className="ai-summary-panel">
      <div className="ai-summary-panel-header" onClick={toggleCollapse}>
        <div className="ai-summary-panel-title">
          <Brain className="ai-summary-panel-icon" />
          <h3>AI智能总结</h3>
          {summary && !isLoading && (
            <span className="ai-summary-panel-badge">已生成</span>
          )}
        </div>
        <div className="ai-summary-panel-controls">
          <button
            className="ai-summary-settings-btn"
            onClick={(e) => {
              e.stopPropagation()
              setShowAPIKeyConfig(true)
            }}
            title="配置API密钥"
          >
            <Key size={16} />
          </button>
          <button
            className="ai-summary-settings-btn"
            onClick={(e) => {
              e.stopPropagation()
              setShowPlatformSelector(!showPlatformSelector)
            }}
            title="AI平台设置"
          >
            <Settings size={16} />
          </button>
          {summary && !isLoading && (
            <button
              className="ai-summary-copy-btn"
              onClick={(e) => {
                e.stopPropagation()
                handleCopy()
              }}
              title="复制总结内容"
            >
              {copySuccess ? <CheckCircle size={16} /> : <Copy size={16} />}
            </button>
          )}
          <button className="ai-summary-collapse-btn">
            {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="ai-summary-panel-content">
          {showPlatformSelector && (
            <div className="ai-platform-selector">
              <h4>选择AI平台</h4>
              <div className="platform-options">
                {availablePlatforms.map(platform => (
                  <div key={platform.id} className="platform-option">
                    <label className="platform-label">
                      <input
                        type="radio"
                        name="platform"
                        value={platform.id}
                        checked={selectedPlatform === platform.id}
                        onChange={(e) => {
                          setSelectedPlatform(e.target.value)
                          const models = platform.models || []
                          setSelectedModel(models[0] || '')
                        }}
                      />
                      <div className="platform-info">
                        <span className="platform-name">{platform.name}</span>
                        <span className="platform-desc">{platform.description}</span>
                        {!platform.available && (
                          <span className="platform-unavailable">需要配置API密钥</span>
                        )}
                      </div>
                    </label>
                    {selectedPlatform === platform.id && platform.models && platform.models.length > 1 && (
                      <select
                        className="model-selector"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                      >
                        {platform.models.map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
              <div className="platform-actions">
                <button
                  className="generate-with-platform-btn"
                  onClick={() => {
                    setShowPlatformSelector(false)
                    generateSummary(selectedPlatform, selectedModel)
                  }}
                  disabled={!availablePlatforms.find(p => p.id === selectedPlatform)?.available}
                >
                  使用此平台生成总结
                </button>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="ai-summary-loading">
              <Loader2 className="ai-summary-spinner" />
              <p>AI正在分析文档内容，生成智能总结...</p>
              <div className="ai-summary-progress">
                <div className="ai-summary-progress-bar"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="ai-summary-error">
              <AlertCircle className="ai-summary-error-icon" />
              <div className="ai-summary-error-content">
                <h4>总结生成失败</h4>
                <p>{error}</p>
                <button 
                  className="ai-summary-retry-btn"
                  onClick={handleRetry}
                >
                  <RefreshCw size={16} />
                  重新生成
                </button>
              </div>
            </div>
          )}

          {summary && !isLoading && (
            <div className="ai-summary-result">
              <div className="ai-summary-actions">
                <button 
                  className="ai-summary-action-btn"
                  onClick={handleCopy}
                  title="复制总结内容（纯文本）"
                >
                  {copySuccess ? (
                    <>
                      <CheckCircle size={16} />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      复制内容
                    </>
                  )}
                </button>
                <button 
                  className="ai-summary-action-btn"
                  onClick={handleRetry}
                  title="重新生成总结"
                >
                  <RefreshCw size={16} />
                  重新生成
                </button>
              </div>
              
              <div
                className="ai-summary-markdown-content"
                ref={summaryRef}
              >
                {summary}
              </div>
            </div>
          )}

          {!summary && !isLoading && !error && (
            <div className="ai-summary-placeholder">
              <Brain className="ai-summary-placeholder-icon" />
              {Object.values(apiKeys).some(key => key && key.trim() !== '') ? (
                <p>AI总结将在文档加载完成后自动生成</p>
              ) : (
                <div className="api-key-required">
                  <p>需要配置AI平台API密钥才能使用总结功能</p>
                  <button
                    className="config-api-key-btn"
                    onClick={() => setShowAPIKeyConfig(true)}
                  >
                    <Key size={16} />
                    配置API密钥
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="ai-summary-panel-footer">
        <span className="ai-summary-powered">
          <Brain size={12} />
          由AI大模型提供支持
        </span>
      </div>

      {/* API密钥配置组件 */}
      <APIKeyConfig
        isOpen={showAPIKeyConfig}
        onClose={() => setShowAPIKeyConfig(false)}
        onSave={handleAPIKeySave}
      />
    </div>
  )
}

export default AISummaryPanel
