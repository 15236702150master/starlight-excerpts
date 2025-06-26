import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Upload, Type, FileText } from 'lucide-react'
import './AddArticleModal.css'

const AddArticleModal = ({ onClose, onFileUpload, onTextSubmit, isLoading }) => {
  const [mode, setMode] = useState('choose') // 'choose', 'text', 'file'
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      onFileUpload(file)
    }
  }

  const handleTextSubmit = (e) => {
    e.preventDefault()
    if (content.trim()) {
      onTextSubmit(title.trim(), content.trim())
    }
  }

  const renderChooseMode = () => (
    <div className="mode-selection">
      <h2>添加文章</h2>
      <p>选择添加方式</p>
      
      <div className="mode-options">
        <button 
          className="mode-option"
          onClick={() => setMode('text')}
        >
          <Type className="mode-icon" />
          <h3>输入文本</h3>
          <p>直接粘贴或输入文章内容</p>
        </button>
        
        <button 
          className="mode-option"
          onClick={() => setMode('file')}
        >
          <Upload className="mode-icon" />
          <h3>上传文件</h3>
          <p>支持 TXT、DOCX、PDF 格式</p>
        </button>
      </div>
    </div>
  )

  const renderTextMode = () => (
    <form onSubmit={handleTextSubmit} className="text-form">
      <h2>输入文章</h2>
      
      <div className="form-group">
        <label htmlFor="title">标题（可选）</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入文章标题..."
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="content">内容 *</label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="粘贴或输入文章内容（支持 Markdown 格式）..."
          rows={12}
          required
        />
      </div>
      
      <div className="form-actions">
        <button 
          type="button" 
          className="secondary-button"
          onClick={() => setMode('choose')}
        >
          返回
        </button>
        <button 
          type="submit" 
          className="primary-button"
          disabled={!content.trim()}
        >
          开始阅读
        </button>
      </div>
    </form>
  )

  const renderFileMode = () => (
    <div className="file-upload">
      <h2>上传文件</h2>
      
      <div 
        className="upload-area"
        onClick={() => fileInputRef.current?.click()}
      >
        <FileText className="upload-icon" />
        <h3>点击选择文件</h3>
        <p>支持 TXT、DOCX、PDF 格式</p>
        <p className="file-size-hint">文件大小限制：10MB</p>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.docx,.pdf"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <div className="form-actions">
        <button 
          type="button" 
          className="secondary-button"
          onClick={() => setMode('choose')}
        >
          返回
        </button>
      </div>
    </div>
  )

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={onClose}>
          <X />
        </button>
        
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>正在处理文件...</p>
          </div>
        ) : (
          <>
            {mode === 'choose' && renderChooseMode()}
            {mode === 'text' && renderTextMode()}
            {mode === 'file' && renderFileMode()}
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

export default AddArticleModal
