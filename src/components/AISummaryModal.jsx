import React, { useState, useEffect } from 'react'
import { X, Brain, Loader2, CheckCircle, AlertCircle, RefreshCw, Copy, Download } from 'lucide-react'
import './AISummaryModal.css'

const AISummaryModal = ({ isOpen, onClose, article, onSummaryGenerated }) => {
  const [summary, setSummary] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedModel, setSelectedModel] = useState('doubao-lite-4k')
  const [models, setModels] = useState([])
  const [copySuccess, setCopySuccess] = useState(false)

  // 获取可用模型列表
  useEffect(() => {
    if (isOpen) {
      fetchModels()
    }
  }, [isOpen])

  const fetchModels = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/models')
      const data = await response.json()
      setModels(data.models || [])
    } catch (error) {
      console.error('获取模型列表失败:', error)
      // 使用默认模型列表
      setModels([
        {
          id: 'doubao-lite-4k',
          name: '豆包-轻量版-4K',
          description: '适合日常对话和简单任务',
          recommended: true
        }
      ])
    }
  }

  const generateSummary = async () => {
    if (!article?.content) {
      setError('文档内容为空，无法生成总结')
      return
    }

    setIsLoading(true)
    setError(null)
    setSummary('')

    try {
      const response = await fetch('http://localhost:3001/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: article.content,
          title: article.title,
          options: {
            model: selectedModel,
            maxTokens: 1000,
            temperature: 0.7
          }
        })
      })

      const data = await response.json()

      if (data.success) {
        setSummary(data.data.summary)
        // 通知父组件总结已生成
        if (onSummaryGenerated) {
          onSummaryGenerated({
            articleId: article.id,
            summary: data.data.summary,
            model: selectedModel,
            timestamp: data.data.timestamp
          })
        }
      } else {
        throw new Error(data.error || '生成总结失败')
      }
    } catch (error) {
      console.error('AI总结错误:', error)
      setError(error.message || '网络错误，请检查后端服务是否启动')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!summary) return

    try {
      await navigator.clipboard.writeText(summary)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  const handleDownload = () => {
    if (!summary) return

    const content = `# ${article.title || '文档总结'}\n\n## AI总结\n\n${summary}\n\n---\n生成时间: ${new Date().toLocaleString()}\n模型: ${selectedModel}`
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${article.title || '文档总结'}_AI总结.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleRetry = () => {
    setError(null)
    setSummary('')
    generateSummary()
  }

  if (!isOpen) return null

  return (
    <div className="ai-summary-modal-overlay" onClick={onClose}>
      <div className="ai-summary-modal" onClick={e => e.stopPropagation()}>
        <div className="ai-summary-header">
          <div className="ai-summary-title">
            <Brain className="ai-summary-icon" />
            <h2>AI智能总结</h2>
          </div>
          <button className="ai-summary-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="ai-summary-content">
          <div className="ai-summary-article-info">
            <h3>{article?.title || '未命名文档'}</h3>
            <p className="ai-summary-article-preview">
              {article?.content?.substring(0, 200)}...
            </p>
          </div>

          <div className="ai-summary-model-selection">
            <label htmlFor="model-select">选择AI模型：</label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isLoading}
            >
              {models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} {model.recommended ? '(推荐)' : ''}
                </option>
              ))}
            </select>
            <p className="ai-summary-model-description">
              {models.find(m => m.id === selectedModel)?.description || ''}
            </p>
          </div>

          {!summary && !isLoading && !error && (
            <div className="ai-summary-start">
              <p>点击下方按钮开始生成AI总结</p>
              <button 
                className="ai-summary-generate-btn"
                onClick={generateSummary}
                disabled={isLoading}
              >
                <Brain size={16} />
                生成AI总结
              </button>
            </div>
          )}

          {isLoading && (
            <div className="ai-summary-loading">
              <Loader2 className="ai-summary-spinner" />
              <p>AI正在分析文档内容，请稍候...</p>
              <div className="ai-summary-progress">
                <div className="ai-summary-progress-bar"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="ai-summary-error">
              <AlertCircle className="ai-summary-error-icon" />
              <div className="ai-summary-error-content">
                <h4>生成失败</h4>
                <p>{error}</p>
                <button 
                  className="ai-summary-retry-btn"
                  onClick={handleRetry}
                >
                  <RefreshCw size={16} />
                  重试
                </button>
              </div>
            </div>
          )}

          {summary && (
            <div className="ai-summary-result">
              <div className="ai-summary-result-header">
                <div className="ai-summary-success">
                  <CheckCircle className="ai-summary-success-icon" />
                  <span>总结生成成功</span>
                </div>
                <div className="ai-summary-actions">
                  <button 
                    className="ai-summary-action-btn"
                    onClick={handleCopy}
                    title="复制总结"
                  >
                    <Copy size={16} />
                    {copySuccess ? '已复制' : '复制'}
                  </button>
                  <button 
                    className="ai-summary-action-btn"
                    onClick={handleDownload}
                    title="下载总结"
                  >
                    <Download size={16} />
                    下载
                  </button>
                  <button 
                    className="ai-summary-action-btn"
                    onClick={handleRetry}
                    title="重新生成"
                  >
                    <RefreshCw size={16} />
                    重新生成
                  </button>
                </div>
              </div>
              <div className="ai-summary-text">
                {summary.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="ai-summary-footer">
          <p className="ai-summary-powered">
            <Brain size={14} />
            由豆包大模型提供支持
          </p>
        </div>
      </div>
    </div>
  )
}

export default AISummaryModal
