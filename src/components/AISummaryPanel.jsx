import React, { useState, useEffect, useRef } from 'react'
import { Brain, Loader2, RefreshCw, Copy, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Settings, Key } from 'lucide-react'
import { saveAISummary, getAISummary } from '../utils/storage'
import { generateAISummary, loadAPIKeys } from '../utils/aiService'
import APIKeyManager from './APIKeyManager'
import './AISummaryPanel.css'

const AISummaryPanel = ({ article, onSummaryGenerated }) => {
  const [summary, setSummary] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [autoSummaryTriggered, setAutoSummaryTriggered] = useState(false)
  const [showAPIKeyManager, setShowAPIKeyManager] = useState(false)
  const [aiConfig, setAiConfig] = useState(null)
  const [hasValidConfig, setHasValidConfig] = useState(false)
  const summaryRef = useRef(null)

  // 获取默认模型
  const getDefaultModel = (platform) => {
    const modelMap = {
      doubao: 'doubao-seed-1-6-250615',
      deepseek: 'deepseek-chat',
      qianwen: 'qwen-turbo'
    }
    return modelMap[platform] || 'deepseek-chat'
  }

  // 检查是否有有效的AI配置
  useEffect(() => {
    const savedKeys = loadAPIKeys()
    if (Object.keys(savedKeys).length > 0) {
      // 使用第一个可用的配置
      const firstPlatform = Object.keys(savedKeys)[0]
      setAiConfig({
        platform: firstPlatform,
        apiKey: savedKeys[firstPlatform],
        model: getDefaultModel(firstPlatform)
      })
      setHasValidConfig(true)
    } else {
      setHasValidConfig(false)
    }
  }, [])

  // 生成AI总结
  const generateSummary = async () => {
    if (!article || !article.content) {
      setError('没有可总结的内容')
      return
    }

    if (!hasValidConfig || !aiConfig) {
      setError('请先配置AI API密钥')
      setShowAPIKeyManager(true)
      return
    }

    setIsLoading(true)
    setError(null)
    setSummary('')

    try {
      const result = await generateAISummary(
        article.content,
        article.title,
        aiConfig.platform,
        aiConfig.model,
        aiConfig.apiKey
      )

      if (result.success) {
        const summaryText = result.data.summary
        setSummary(summaryText)

        // 保存总结到存储
        const summaryData = {
          id: `summary-${Date.now()}`,
          articleId: article.id,
          summary: summaryText,
          platform: aiConfig.platform,
          model: aiConfig.model,
          createdAt: new Date().toISOString(),
          wordCount: summaryText.length
        }

        saveAISummary(summaryData)

        if (onSummaryGenerated) {
          onSummaryGenerated(summaryData)
        }
      } else {
        setError(result.error || 'AI总结生成失败')
      }
    } catch (error) {
      console.error('AI总结生成错误:', error)
      setError(`生成失败: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 处理API配置更改
  const handleConfigChange = (config) => {
    setAiConfig(config)
    setHasValidConfig(true)
    setShowAPIKeyManager(false)
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
      } else if (hasValidConfig) {
        // 如果没有保存的总结且有有效配置，延迟生成
        setTimeout(() => {
          generateSummary()
        }, 1000)
      }
    }
  }, [article, autoSummaryTriggered, hasValidConfig])

  // 复制总结到剪贴板
  const copyToClipboard = async () => {
    if (!summary) return

    try {
      await navigator.clipboard.writeText(summary)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  // 重新生成总结
  const handleRegenerate = () => {
    if (hasValidConfig) {
      generateSummary()
    } else {
      setShowAPIKeyManager(true)
    }
  }

  // 切换折叠状态
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
          {!hasValidConfig && (
            <span className="ai-summary-panel-badge warning">需要配置</span>
          )}
        </div>
        <div className="ai-summary-panel-controls">
          <button
            className="ai-summary-settings-btn"
            onClick={(e) => {
              e.stopPropagation()
              setShowAPIKeyManager(true)
            }}
            title="配置API密钥"
          >
            <Key size={16} />
          </button>
          {summary && !isLoading && (
            <button
              className="ai-summary-copy-btn"
              onClick={(e) => {
                e.stopPropagation()
                copyToClipboard()
              }}
              title="复制总结内容"
            >
              {copySuccess ? <CheckCircle size={16} /> : <Copy size={16} />}
            </button>
          )}
          <button
            className="ai-summary-refresh-btn"
            onClick={(e) => {
              e.stopPropagation()
              handleRegenerate()
            }}
            disabled={isLoading}
            title="重新生成总结"
          >
            <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
          </button>
          <button className="ai-summary-collapse-btn">
            {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="ai-summary-panel-content">
          {/* API密钥管理器 */}
          {showAPIKeyManager && (
            <div className="api-key-manager-overlay">
              <APIKeyManager onConfigChange={handleConfigChange} />
              <button
                className="close-manager-btn"
                onClick={() => setShowAPIKeyManager(false)}
              >
                关闭
              </button>
            </div>
          )}

          {/* 配置提示 */}
          {!hasValidConfig && !showAPIKeyManager && (
            <div className="ai-config-prompt">
              <AlertCircle size={20} />
              <div>
                <p>请先配置AI平台的API密钥才能使用AI总结功能</p>
                <button
                  onClick={() => setShowAPIKeyManager(true)}
                  className="config-btn"
                >
                  <Key size={16} />
                  配置API密钥
                </button>
              </div>
            </div>
          )}

          {/* 加载状态 */}
          {isLoading && (
            <div className="ai-summary-loading">
              <Loader2 className="spinning" size={24} />
              <p>正在生成AI总结，请稍候...</p>
              <small>首次使用可能需要较长时间</small>
            </div>
          )}

          {/* 错误状态 */}
          {error && (
            <div className="ai-summary-error">
              <AlertCircle size={20} />
              <div>
                <p>{error}</p>
                <button onClick={handleRegenerate} className="retry-btn">
                  <RefreshCw size={16} />
                  重试
                </button>
              </div>
            </div>
          )}

          {/* 总结内容 */}
          {summary && !isLoading && (
            <div className="ai-summary-content" ref={summaryRef}>
              <div className="ai-summary-text">
                {summary.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              <div className="ai-summary-meta">
                {aiConfig && (
                  <span>
                    使用 {aiConfig.platform} · {aiConfig.model} ·
                    {summary.length} 字
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
}

export default AISummaryPanel
