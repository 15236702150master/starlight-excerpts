import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, FileText, File, Calendar, Tag, Loader, Type } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { getTagColor } from '../utils/helpers'
import {
  exportToTXT,
  exportToMarkdown,
  exportToWord,
  exportToPDF,
  filterStarsByTags,
  filterStarsByDateRange,
  formatStarData
} from '../utils/exportUtils'
import './ExportModal.css'

const ExportModal = ({ onClose }) => {
  const { state } = useData()
  const [exportFormat, setExportFormat] = useState('txt')
  const [filterType, setFilterType] = useState('all')
  const [selectedTags, setSelectedTags] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [includeThoughts, setIncludeThoughts] = useState(true)
  const [includeTags, setIncludeTags] = useState(true)
  const [sortOrder, setSortOrder] = useState('desc')
  const [isExporting, setIsExporting] = useState(false)

  // 计算筛选后的星星数量
  const filteredStarsCount = useMemo(() => {
    let stars = Object.values(state.stars)
    
    if (filterType === 'tags' && selectedTags.length > 0) {
      stars = filterStarsByTags(state.stars, selectedTags)
    } else if (filterType === 'dateRange') {
      stars = filterStarsByDateRange(state.stars, startDate, endDate)
    }
    
    return stars.length
  }, [state.stars, filterType, selectedTags, startDate, endDate])

  // 处理标签选择
  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  // 获取标签使用数量
  const getTagCount = (tag) => {
    return Object.values(state.stars).filter(star => star.tags?.includes(tag)).length
  }

  // 执行导出
  const handleExport = async () => {
    if (filteredStarsCount === 0) {
      alert('没有可导出的摘录')
      return
    }

    setIsExporting(true)
    
    try {
      // 获取筛选后的星星
      let stars = Object.values(state.stars)
      
      if (filterType === 'tags' && selectedTags.length > 0) {
        stars = filterStarsByTags(state.stars, selectedTags)
      } else if (filterType === 'dateRange') {
        stars = filterStarsByDateRange(state.stars, startDate, endDate)
      }

      // 格式化数据
      const formattedData = formatStarData(stars, state.articles, {
        includeThoughts,
        includeTags,
        sortOrder
      })

      // 生成文件名
      const timestamp = new Date().toISOString().slice(0, 10)
      let filename = `星光摘录集_${timestamp}`
      
      if (filterType === 'tags' && selectedTags.length > 0) {
        filename += `_${selectedTags.join('_')}`
      } else if (filterType === 'dateRange') {
        filename += `_${startDate}_${endDate}`
      }

      // 导出选项
      const exportOptions = {
        filterType,
        filterValue: filterType === 'tags' ? selectedTags : 
                    filterType === 'dateRange' ? { start: startDate, end: endDate } : null,
        filename: filename + (exportFormat === 'txt' ? '.txt' :
                             exportFormat === 'markdown' ? '.md' :
                             exportFormat === 'word' ? '.docx' : '.pdf')
      }

      // 执行导出
      console.log('开始导出，格式:', exportFormat, '数据量:', formattedData.length)

      if (exportFormat === 'txt') {
        exportToTXT(formattedData, exportOptions)
        console.log('TXT 导出完成')
      } else if (exportFormat === 'markdown') {
        exportToMarkdown(formattedData, exportOptions)
        console.log('Markdown 导出完成')
      } else if (exportFormat === 'word') {
        console.log('开始 Word 导出...')
        try {
          await exportToWord(formattedData, exportOptions)
          console.log('Word 导出完成')
        } catch (wordError) {
          console.error('Word导出失败，尝试降级到TXT:', wordError)
          // 降级到TXT
          const fallbackOptions = { ...exportOptions, filename: exportOptions.filename.replace('.docx', '.txt') }
          exportToTXT(formattedData, fallbackOptions)
          alert('Word导出失败，已自动转换为TXT格式下载。TXT格式完全支持中文显示。')
        }
      } else if (exportFormat === 'pdf') {
        console.log('开始 PDF 导出...')
        exportToPDF(formattedData, exportOptions)
        console.log('PDF 导出完成')
      }

      // 延迟关闭，让用户看到成功状态
      setTimeout(() => {
        onClose()
      }, 1000)

    } catch (error) {
      console.error('导出失败详细信息:', error)
      console.error('错误堆栈:', error.stack)

      // 最终降级方案：总是提供TXT导出（最可靠）
      try {
        console.log('尝试降级到TXT导出...')
        const fallbackOptions = {
          ...exportOptions,
          filename: `${exportOptions.filename.split('.')[0]}_fallback.txt`
        }
        exportToTXT(formattedData, fallbackOptions)
        alert('原格式导出失败，已自动使用TXT格式导出。TXT格式完全支持中文显示，是最可靠的导出选项。')
      } catch (fallbackError) {
        console.error('TXT降级导出也失败:', fallbackError)
        alert(`导出失败：${error.message || '未知错误'}。请尝试刷新页面后重试，或联系技术支持。`)
      }
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <motion.div
      className="export-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="export-modal-content"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>
            <Download className="header-icon" />
            导出收藏摘录
          </h2>
          <button className="close-button" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="modal-body">
          {/* 导出格式选择 */}
          <div className="section">
            <h3>导出格式</h3>
            <div className="format-options">
              <label className={`format-option ${exportFormat === 'txt' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="txt"
                  checked={exportFormat === 'txt'}
                  onChange={(e) => setExportFormat(e.target.value)}
                />
                <Type className="format-icon" />
                <span>TXT (.txt)</span>
                <small style={{color: '#27ae60'}}>最推荐 - 简单可靠</small>
              </label>

              <label className={`format-option ${exportFormat === 'markdown' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="markdown"
                  checked={exportFormat === 'markdown'}
                  onChange={(e) => setExportFormat(e.target.value)}
                />
                <FileText className="format-icon" />
                <span>Markdown (.md)</span>
                <small style={{color: '#27ae60'}}>推荐 - 完美中文支持</small>
              </label>
              
              <label className={`format-option ${exportFormat === 'word' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="word"
                  checked={exportFormat === 'word'}
                  onChange={(e) => setExportFormat(e.target.value)}
                />
                <File className="format-icon" />
                <span>Word (.docx)</span>
                <small style={{color: '#f39c12'}}>良好中文支持</small>
              </label>
              
              <label className={`format-option ${exportFormat === 'pdf' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="pdf"
                  checked={exportFormat === 'pdf'}
                  onChange={(e) => setExportFormat(e.target.value)}
                />
                <File className="format-icon" />
                <span>PDF (.pdf)</span>
                <small style={{color: '#e74c3c'}}>浏览器打印功能</small>
              </label>
            </div>

            <div className="format-tips" style={{
              marginTop: '15px',
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#6c757d',
              border: '1px solid #e9ecef'
            }}>
              <div style={{fontWeight: 'bold', marginBottom: '8px', color: '#495057'}}>格式说明：</div>
              <div style={{marginBottom: '4px'}}>
                <span style={{color: '#27ae60', fontWeight: 'bold'}}>• TXT</span>：纯文本格式，最简单可靠，完美支持中文，兼容所有设备
              </div>
              <div style={{marginBottom: '4px'}}>
                <span style={{color: '#27ae60', fontWeight: 'bold'}}>• Markdown</span>：轻量级格式，完美支持中文，易于编辑和版本控制
              </div>
              <div style={{marginBottom: '4px'}}>
                <span style={{color: '#f39c12', fontWeight: 'bold'}}>• Word</span>：专业文档格式，支持中文，适合进一步编辑和打印
              </div>
              <div>
                <span style={{color: '#e74c3c', fontWeight: 'bold'}}>• PDF</span>：在新窗口打开预览，使用浏览器"打印→保存为PDF"功能
              </div>
            </div>
          </div>

          {/* 筛选条件 */}
          <div className="section">
            <h3>筛选条件</h3>
            <div className="filter-options">
              <label className={`filter-option ${filterType === 'all' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="all"
                  checked={filterType === 'all'}
                  onChange={(e) => setFilterType(e.target.value)}
                />
                <span>全部摘录 ({Object.keys(state.stars).length} 条)</span>
              </label>
              
              <label className={`filter-option ${filterType === 'tags' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="tags"
                  checked={filterType === 'tags'}
                  onChange={(e) => setFilterType(e.target.value)}
                />
                <Tag className="filter-icon" />
                <span>按标签筛选</span>
              </label>
              
              <label className={`filter-option ${filterType === 'dateRange' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="dateRange"
                  checked={filterType === 'dateRange'}
                  onChange={(e) => setFilterType(e.target.value)}
                />
                <Calendar className="filter-icon" />
                <span>按时间筛选</span>
              </label>
            </div>

            {/* 标签选择 */}
            {filterType === 'tags' && (
              <div className="tags-selection">
                <h4>选择标签：</h4>
                {state.tags.length === 0 ? (
                  <p className="no-tags">暂无标签</p>
                ) : (
                  <div className="tags-grid">
                    {state.tags.map(tag => (
                      <button
                        key={tag}
                        className={`tag-item ${selectedTags.includes(tag) ? 'selected' : ''}`}
                        style={{
                          backgroundColor: selectedTags.includes(tag) ? getTagColor(tag) : 'transparent',
                          borderColor: getTagColor(tag),
                          color: selectedTags.includes(tag) ? 'white' : getTagColor(tag)
                        }}
                        onClick={() => handleTagToggle(tag)}
                      >
                        <span>{tag}</span>
                        <span className="tag-count">({getTagCount(tag)})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 时间范围选择 */}
            {filterType === 'dateRange' && (
              <div className="date-range-selection">
                <h4>选择时间范围：</h4>
                <div className="date-inputs">
                  <div className="date-input">
                    <label>开始日期：</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="date-input">
                    <label>结束日期：</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 导出选项 */}
          <div className="section">
            <h3>导出选项</h3>
            <div className="export-options">
              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={includeThoughts}
                  onChange={(e) => setIncludeThoughts(e.target.checked)}
                />
                <span>包含想法记录</span>
              </label>
              
              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={includeTags}
                  onChange={(e) => setIncludeTags(e.target.checked)}
                />
                <span>包含标签信息</span>
              </label>
              
              <div className="sort-option">
                <label>排序方式：</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="desc">时间倒序（最新在前）</option>
                  <option value="asc">时间正序（最早在前）</option>
                </select>
              </div>
            </div>
          </div>

          {/* 预览信息 */}
          <div className="preview-section">
            <div className="preview-info">
              <span>将导出 <strong>{filteredStarsCount}</strong> 条摘录</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            取消
          </button>
          <button 
            className="export-button" 
            onClick={handleExport}
            disabled={isExporting || filteredStarsCount === 0}
          >
            {isExporting ? (
              <>
                <Loader className="loading-icon" />
                导出中...
              </>
            ) : (
              <>
                <Download />
                导出
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ExportModal
