import React, { useState, useEffect } from 'react'
import { Key, TestTube, Save, Trash2, ExternalLink, CheckCircle, XCircle, Loader2, Info } from 'lucide-react'
import {
  getSupportedPlatforms,
  validateApiKey,
  testAPIConnection,
  saveAPIKeys,
  loadAPIKeys,
  clearAPIKeys,
  getAPIKeyGuide
} from '../utils/aiService'
import './APIKeyManager.css'

const APIKeyManager = ({ onConfigChange }) => {
  const [apiKeys, setApiKeys] = useState({})
  const [selectedPlatform, setSelectedPlatform] = useState('doubao')
  const [selectedModel, setSelectedModel] = useState('')
  const [currentApiKey, setCurrentApiKey] = useState('')
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [showGuide, setShowGuide] = useState(false)
  const [platforms] = useState(getSupportedPlatforms())

  // 加载保存的API密钥
  useEffect(() => {
    const savedKeys = loadAPIKeys()
    setApiKeys(savedKeys)
    
    // 设置默认选择
    if (savedKeys[selectedPlatform]) {
      setCurrentApiKey(savedKeys[selectedPlatform])
    }
    
    // 设置默认模型
    const platform = platforms.find(p => p.id === selectedPlatform)
    if (platform && platform.models.length > 0) {
      setSelectedModel(platform.models[0])
    }
  }, [])

  // 平台切换时更新API密钥和模型
  useEffect(() => {
    setCurrentApiKey(apiKeys[selectedPlatform] || '')
    setTestResult(null)
    
    const platform = platforms.find(p => p.id === selectedPlatform)
    if (platform && platform.models.length > 0) {
      setSelectedModel(platform.models[0])
    }
  }, [selectedPlatform, apiKeys])

  // 保存API密钥
  const handleSaveApiKey = () => {
    if (!currentApiKey.trim()) {
      setTestResult({ success: false, message: '请输入API密钥' })
      return
    }

    if (!validateApiKey(selectedPlatform, currentApiKey)) {
      setTestResult({ success: false, message: 'API密钥格式不正确' })
      return
    }

    const newApiKeys = {
      ...apiKeys,
      [selectedPlatform]: currentApiKey
    }

    if (saveAPIKeys(newApiKeys)) {
      setApiKeys(newApiKeys)
      setTestResult({ success: true, message: 'API密钥保存成功！' })
      
      // 通知父组件配置已更改
      if (onConfigChange) {
        onConfigChange({
          platform: selectedPlatform,
          model: selectedModel,
          apiKey: currentApiKey
        })
      }
    } else {
      setTestResult({ success: false, message: '保存失败，请重试' })
    }
  }

  // 测试API连接
  const handleTestConnection = async () => {
    if (!currentApiKey.trim()) {
      setTestResult({ success: false, message: '请先输入API密钥' })
      return
    }

    if (!validateApiKey(selectedPlatform, currentApiKey)) {
      setTestResult({ success: false, message: 'API密钥格式不正确' })
      return
    }

    setIsTestingConnection(true)
    setTestResult(null)

    try {
      const result = await testAPIConnection(selectedPlatform, selectedModel, currentApiKey)
      setTestResult(result)
    } catch (error) {
      setTestResult({ success: false, message: `测试失败: ${error.message}` })
    } finally {
      setIsTestingConnection(false)
    }
  }

  // 清除所有API密钥
  const handleClearAllKeys = () => {
    if (window.confirm('确定要删除所有保存的API密钥吗？此操作不可撤销。')) {
      if (clearAPIKeys()) {
        setApiKeys({})
        setCurrentApiKey('')
        setTestResult({ success: true, message: '所有API密钥已删除' })
      }
    }
  }

  // 获取当前平台的指南
  const currentGuide = getAPIKeyGuide(selectedPlatform)

  return (
    <div className="api-key-manager">
      <div className="api-key-header">
        <h3>
          <Key size={20} />
          AI API 配置
        </h3>
        <p className="api-key-description">
          配置您自己的AI平台API密钥，所有密钥仅保存在您的浏览器本地，不会上传到服务器。
        </p>
      </div>

      <div className="api-key-form">
        {/* 平台选择 */}
        <div className="form-group">
          <label>选择AI平台：</label>
          <div className="platform-selector">
            {platforms.map(platform => (
              <label key={platform.id} className="platform-option">
                <input
                  type="radio"
                  name="platform"
                  value={platform.id}
                  checked={selectedPlatform === platform.id}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                />
                <span>{platform.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 模型选择 */}
        <div className="form-group">
          <label>选择模型：</label>
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            className="model-select"
          >
            {platforms.find(p => p.id === selectedPlatform)?.models.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>

        {/* API密钥输入 */}
        <div className="form-group">
          <label>API密钥：</label>
          <div className="api-key-input-group">
            <input
              type="password"
              value={currentApiKey}
              onChange={(e) => setCurrentApiKey(e.target.value)}
              placeholder={`请输入${platforms.find(p => p.id === selectedPlatform)?.name}的API密钥`}
              className="api-key-input"
            />
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="guide-button"
              title="获取API密钥指南"
            >
              <Info size={16} />
            </button>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="form-actions">
          <button
            onClick={handleTestConnection}
            disabled={isTestingConnection || !currentApiKey.trim()}
            className="test-button"
          >
            {isTestingConnection ? (
              <>
                <Loader2 size={16} className="spinning" />
                测试中...
              </>
            ) : (
              <>
                <TestTube size={16} />
                测试连接
              </>
            )}
          </button>

          <button
            onClick={handleSaveApiKey}
            disabled={!currentApiKey.trim()}
            className="save-button"
          >
            <Save size={16} />
            保存配置
          </button>

          <button
            onClick={handleClearAllKeys}
            className="clear-button"
            title="删除所有API密钥"
          >
            <Trash2 size={16} />
            清除全部
          </button>
        </div>

        {/* 测试结果 */}
        {testResult && (
          <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
            {testResult.success ? (
              <CheckCircle size={16} />
            ) : (
              <XCircle size={16} />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* API密钥获取指南 */}
        {showGuide && currentGuide && (
          <div className="api-guide">
            <h4>
              <ExternalLink size={16} />
              {currentGuide.name} API密钥获取指南
            </h4>
            
            <div className="guide-content">
              <div className="guide-steps">
                <h5>获取步骤：</h5>
                <ol>
                  {currentGuide.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="guide-features">
                <h5>平台特点：</h5>
                <ul>
                  {currentGuide.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>

              <div className="guide-cost">
                <h5>费用说明：</h5>
                <p>{currentGuide.cost}</p>
              </div>

              <a 
                href={currentGuide.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="guide-link"
              >
                <ExternalLink size={16} />
                前往申请API密钥
              </a>
            </div>
          </div>
        )}

        {/* 已保存的密钥状态 */}
        <div className="saved-keys-status">
          <h4>已配置的平台：</h4>
          <div className="saved-keys-list">
            {platforms.map(platform => (
              <div key={platform.id} className="saved-key-item">
                <span>{platform.name}</span>
                {apiKeys[platform.id] ? (
                  <CheckCircle size={16} className="configured" />
                ) : (
                  <XCircle size={16} className="not-configured" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default APIKeyManager
