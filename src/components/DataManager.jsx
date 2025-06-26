import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Database,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  BarChart3,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  Settings,
  HardDrive
} from 'lucide-react'
import { useData } from '../contexts/DataContext'
import {
  exportData,
  importData,
  clearData,
  restoreFromBackup,
  optimizeData,
  getDataStatistics,
  getStorageInfo
} from '../utils/storage'
import './DataManager.css'

const DataManager = ({ onClose }) => {
  const { state, dispatch } = useData()
  const [activeTab, setActiveTab] = useState('overview')
  const [statistics, setStatistics] = useState(null)
  const [storageInfo, setStorageInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    loadStatistics()
    loadStorageInfo()
  }, [])

  const loadStatistics = () => {
    const stats = getDataStatistics()
    setStatistics(stats)
  }

  const loadStorageInfo = () => {
    const info = getStorageInfo()
    setStorageInfo(info)
  }

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleExportData = async (format = 'json') => {
    setIsLoading(true)
    try {
      const success = exportData(state, { format })
      if (success) {
        showMessage(`数据已成功导出为 ${format.toUpperCase()} 格式`, 'success')
      } else {
        showMessage('导出失败，请重试', 'error')
      }
    } catch (error) {
      showMessage('导出过程中发生错误', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImportData = async (file, merge = false) => {
    setIsLoading(true)
    try {
      const importedData = await importData(file, { merge })
      dispatch({ type: 'LOAD_DATA', payload: importedData })
      showMessage(merge ? '数据已成功合并' : '数据已成功导入', 'success')
      loadStatistics()
      loadStorageInfo()
    } catch (error) {
      showMessage(`导入失败: ${error.message}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearData = async () => {
    if (!window.confirm('确定要清除所有数据吗？此操作不可撤销！')) {
      return
    }

    setIsLoading(true)
    try {
      const success = clearData({ createBackup: true })
      if (success) {
        dispatch({ type: 'LOAD_DATA', payload: {} })
        showMessage('数据已清除，备份已创建', 'success')
        loadStatistics()
        loadStorageInfo()
      } else {
        showMessage('清除数据失败', 'error')
      }
    } catch (error) {
      showMessage('清除过程中发生错误', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestoreBackup = async () => {
    if (!window.confirm('确定要从备份恢复数据吗？当前数据将被覆盖！')) {
      return
    }

    setIsLoading(true)
    try {
      const success = restoreFromBackup()
      if (success) {
        const restoredData = await import('../utils/storage').then(m => m.loadData())
        dispatch({ type: 'LOAD_DATA', payload: restoredData })
        showMessage('数据已从备份恢复', 'success')
        loadStatistics()
        loadStorageInfo()
      } else {
        showMessage('恢复失败，没有可用的备份', 'error')
      }
    } catch (error) {
      showMessage('恢复过程中发生错误', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOptimizeData = async () => {
    setIsLoading(true)
    try {
      const optimized = optimizeData()
      if (optimized) {
        const optimizedData = await import('../utils/storage').then(m => m.loadData())
        dispatch({ type: 'LOAD_DATA', payload: optimizedData })
        showMessage('数据已优化', 'success')
        loadStatistics()
        loadStorageInfo()
      } else {
        showMessage('数据已是最优状态', 'info')
      }
    } catch (error) {
      showMessage('优化过程中发生错误', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const renderOverview = () => (
    <div className="overview-section">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Database />
          </div>
          <div className="stat-content">
            <h3>{statistics?.articles.total || 0}</h3>
            <p>文章</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <span className="star-icon">⭐</span>
          </div>
          <div className="stat-content">
            <h3>{statistics?.stars.total || 0}</h3>
            <p>星星</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <span className="tag-icon">#</span>
          </div>
          <div className="stat-content">
            <h3>{statistics?.tags.total || 0}</h3>
            <p>标签</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <span className="capsule-icon">📦</span>
          </div>
          <div className="stat-content">
            <h3>{statistics?.memoryCapsules.total || 0}</h3>
            <p>记忆胶囊</p>
          </div>
        </div>
      </div>

      {storageInfo && (
        <div className="storage-info">
          <h3>
            <HardDrive className="section-icon" />
            存储使用情况
          </h3>
          <div className="storage-bar">
            <div 
              className="storage-fill"
              style={{ width: `${storageInfo.usagePercentage}%` }}
            />
          </div>
          <div className="storage-details">
            <span>已使用: {storageInfo.formattedTotalSize}</span>
            <span>总容量: {storageInfo.formattedQuota}</span>
            <span>{storageInfo.usagePercentage.toFixed(1)}%</span>
          </div>
        </div>
      )}
    </div>
  )



  const renderBackupRestore = () => (
    <div className="backup-section">
      <div className="action-group">
        <h3>
          <Download className="section-icon" />
          导出数据
        </h3>
        <div className="action-buttons">
          <button 
            className="action-button primary"
            onClick={() => handleExportData('json')}
            disabled={isLoading}
          >
            <Download />
            导出为 JSON
          </button>
          <button 
            className="action-button secondary"
            onClick={() => handleExportData('csv')}
            disabled={isLoading}
          >
            <Download />
            导出为 CSV
          </button>
        </div>
      </div>

      <div className="action-group">
        <h3>
          <Upload className="section-icon" />
          导入数据
        </h3>
        <div className="import-area">
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files[0]
              if (file) {
                handleImportData(file, false)
              }
            }}
            style={{ display: 'none' }}
            id="import-file"
          />
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files[0]
              if (file) {
                handleImportData(file, true)
              }
            }}
            style={{ display: 'none' }}
            id="merge-file"
          />
          <button 
            className="action-button primary"
            onClick={() => document.getElementById('import-file').click()}
            disabled={isLoading}
          >
            <Upload />
            替换导入
          </button>
          <button 
            className="action-button secondary"
            onClick={() => document.getElementById('merge-file').click()}
            disabled={isLoading}
          >
            <Upload />
            合并导入
          </button>
        </div>
      </div>

      <div className="action-group">
        <h3>
          <Shield className="section-icon" />
          备份与恢复
        </h3>
        <div className="action-buttons">
          <button 
            className="action-button warning"
            onClick={handleRestoreBackup}
            disabled={isLoading}
          >
            <RefreshCw />
            从备份恢复
          </button>
        </div>
      </div>
    </div>
  )

  const renderMaintenance = () => (
    <div className="maintenance-section">
      <div className="action-group">
        <h3>
          <Settings className="section-icon" />
          数据维护
        </h3>
        <div className="action-buttons">
          <button 
            className="action-button primary"
            onClick={handleOptimizeData}
            disabled={isLoading}
          >
            <RefreshCw />
            优化数据
          </button>
        </div>
        <p className="action-description">
          清理孤立的星星和未使用的标签，优化存储空间
        </p>
      </div>

      <div className="action-group danger">
        <h3>
          <AlertTriangle className="section-icon" />
          危险操作
        </h3>
        <div className="action-buttons">
          <button 
            className="action-button danger"
            onClick={handleClearData}
            disabled={isLoading}
          >
            <Trash2 />
            清除所有数据
          </button>
        </div>
        <p className="action-description">
          永久删除所有数据，操作前会自动创建备份
        </p>
      </div>
    </div>
  )

  return (
    <motion.div
      className="data-manager-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="data-manager-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="data-manager-header">
          <h2>
            <Database className="header-icon" />
            数据管理
          </h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="data-manager-tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart3 />
            概览
          </button>
          <button
            className={`tab ${activeTab === 'backup' ? 'active' : ''}`}
            onClick={() => setActiveTab('backup')}
          >
            <Shield />
            备份恢复
          </button>
          <button
            className={`tab ${activeTab === 'maintenance' ? 'active' : ''}`}
            onClick={() => setActiveTab('maintenance')}
          >
            <Settings />
            维护
          </button>
        </div>

        <div className="data-manager-body">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'backup' && renderBackupRestore()}
          {activeTab === 'maintenance' && renderMaintenance()}
        </div>

        <AnimatePresence>
          {message && (
            <motion.div
              className={`message ${message.type}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {message.type === 'success' && <CheckCircle />}
              {message.type === 'error' && <AlertTriangle />}
              {message.type === 'info' && <Info />}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner" />
            <p>处理中...</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default DataManager
