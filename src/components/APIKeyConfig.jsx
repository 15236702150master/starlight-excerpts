import React, { useState, useEffect } from 'react'
import { Settings, Eye, EyeOff, Save, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react'
import './APIKeyConfig.css'

const APIKeyConfig = ({ isOpen, onClose, onSave }) => {
  const [apiKeys, setApiKeys] = useState({
    doubao: '',
    deepseek: '',
    qianwen: ''
  })
  const [showKeys, setShowKeys] = useState({
    doubao: false,
    deepseek: false,
    qianwen: false
  })
  const [saveStatus, setSaveStatus] = useState(null)

  // 平台信息配置
  const platforms = {
    doubao: {
      name: '豆包大模型',
      description: '字节跳动出品，中文理解能力强',
      getUrl: 'https://console.volcengine.com/ark',
      placeholder: '请输入您的豆包API密钥'
    },
    deepseek: {
      name: 'DeepSeek',
      description: '推理和代码能力优秀',
      getUrl: 'https://platform.deepseek.com/',
      placeholder: '请输入您的DeepSeek API密钥'
    },
    qianwen: {
      name: '通义千问',
      description: '阿里云出品，中文处理专业',
      getUrl: 'https://dashscope.console.aliyun.com/',
      placeholder: '请输入您的通义千问API密钥'
    }
  }

  // 从localStorage加载已保存的API密钥
  useEffect(() => {
    const savedKeys = localStorage.getItem('ai_api_keys')
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys)
        setApiKeys(parsed)
      } catch (error) {
        console.error('加载API密钥失败:', error)
      }
    }
  }, [])

  // 处理API密钥输入
  const handleKeyChange = (platform, value) => {
    setApiKeys(prev => ({
      ...prev,
      [platform]: value
    }))
  }

  // 切换密钥显示/隐藏
  const toggleShowKey = (platform) => {
    setShowKeys(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }))
  }

  // 保存API密钥
  const handleSave = () => {
    try {
      // 过滤掉空的API密钥
      const validKeys = Object.fromEntries(
        Object.entries(apiKeys).filter(([_, value]) => value.trim() !== '')
      )
      
      localStorage.setItem('ai_api_keys', JSON.stringify(apiKeys))
      setSaveStatus('success')
      
      // 通知父组件
      if (onSave) {
        onSave(validKeys)
      }
      
      setTimeout(() => {
        setSaveStatus(null)
        onClose()
      }, 1500)
    } catch (error) {
      console.error('保存API密钥失败:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 3000)
    }
  }

  // 检查是否有有效的API密钥
  const hasValidKeys = Object.values(apiKeys).some(key => key.trim() !== '')

  if (!isOpen) return null

  return (
    <div className="api-key-config-overlay">
      <div className="api-key-config-modal">
        <div className="api-key-config-header">
          <div className="api-key-config-title">
            <Settings className="api-key-config-icon" />
            <h2>AI API 密钥配置</h2>
          </div>
          <button className="api-key-config-close" onClick={onClose}>×</button>
        </div>

        <div className="api-key-config-content">
          <div className="api-key-config-notice">
            <AlertCircle className="notice-icon" />
            <div className="notice-text">
              <p><strong>隐私保护说明</strong></p>
              <p>您的API密钥仅存储在本地浏览器中，不会上传到任何服务器。请妥善保管您的API密钥。</p>
            </div>
          </div>

          <div className="api-key-platforms">
            {Object.entries(platforms).map(([key, platform]) => (
              <div key={key} className="api-key-platform">
                <div className="platform-header">
                  <div className="platform-info">
                    <h3>{platform.name}</h3>
                    <p>{platform.description}</p>
                  </div>
                  <a 
                    href={platform.getUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="get-key-link"
                    title="获取API密钥"
                  >
                    <ExternalLink size={16} />
                    获取密钥
                  </a>
                </div>
                
                <div className="api-key-input-group">
                  <div className="api-key-input-wrapper">
                    <input
                      type={showKeys[key] ? 'text' : 'password'}
                      value={apiKeys[key]}
                      onChange={(e) => handleKeyChange(key, e.target.value)}
                      placeholder={platform.placeholder}
                      className="api-key-input"
                    />
                    <button
                      type="button"
                      className="toggle-visibility-btn"
                      onClick={() => toggleShowKey(key)}
                      title={showKeys[key] ? '隐藏密钥' : '显示密钥'}
                    >
                      {showKeys[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {apiKeys[key] && (
                    <div className="key-status">
                      <CheckCircle size={14} />
                      <span>已配置</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="api-key-config-footer">
            <div className="config-tips">
              <p><strong>使用提示：</strong></p>
              <ul>
                <li>至少配置一个平台的API密钥即可使用AI总结功能</li>
                <li>建议配置多个平台以获得更好的体验</li>
                <li>API密钥仅在您的浏览器本地存储，安全可靠</li>
              </ul>
            </div>

            <div className="config-actions">
              <button 
                className="config-cancel-btn" 
                onClick={onClose}
              >
                取消
              </button>
              <button 
                className="config-save-btn" 
                onClick={handleSave}
                disabled={!hasValidKeys}
              >
                <Save size={16} />
                保存配置
              </button>
            </div>

            {saveStatus && (
              <div className={`save-status ${saveStatus}`}>
                {saveStatus === 'success' ? (
                  <>
                    <CheckCircle size={16} />
                    <span>配置保存成功！</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} />
                    <span>保存失败，请重试</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default APIKeyConfig
