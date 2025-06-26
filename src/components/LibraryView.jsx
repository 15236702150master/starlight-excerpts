import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Plus,
  BookOpen,
  FileText,
  Upload,
  Trash2,
  Star,
  Calendar,
  Download,
  Brain,
  Zap
} from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { formatDate, truncateText } from '../utils/helpers'
import { processFile } from '../utils/fileProcessors'
import AddArticleModal from './AddArticleModal'
import ExportModal from './ExportModal'
import AISummaryModal from './AISummaryModal'
import VirtualizedLibrary from './VirtualizedLibrary'
import './LibraryView.css'

const LibraryView = () => {
  const { state, addArticle, deleteArticle } = useData()
  const navigate = useNavigate()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showAISummaryModal, setShowAISummaryModal] = useState(false)
  const [selectedArticleForSummary, setSelectedArticleForSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [useOptimizedView, setUseOptimizedView] = useState(true) // 默认使用优化版本

  const articles = Object.values(state.articles).sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  )

  const getArticleStarsCount = (articleId) => {
    return Object.values(state.stars).filter(star => star.articleId === articleId).length
  }

  const handleDeleteArticle = (articleId, e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (window.confirm('确定要删除这篇文章吗？相关的星星也会被删除。')) {
      deleteArticle(articleId)
    }
  }

  const handleFileUpload = async (file) => {
    setIsLoading(true)
    try {
      const processedFile = await processFile(file)
      addArticle(processedFile)
      setShowAddModal(false)
    } catch (error) {
      alert('文件处理失败：' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTextSubmit = (title, content) => {
    addArticle({
      title: title || '未命名文章',
      content,
      type: 'text'
    })
    setShowAddModal(false)
  }

  return (
    <div className="library-view">
      <div className="library-header">
        <div className="header-left">
          <Link to="/" className="back-button">
            <ArrowLeft />
          </Link>
          <h1>
            <BookOpen className="header-icon" />
            文库
          </h1>
        </div>

        <div className="header-actions">
          <button
            className={`view-toggle-button ${useOptimizedView ? 'active' : ''}`}
            onClick={() => setUseOptimizedView(!useOptimizedView)}
            title={useOptimizedView ? '切换到经典视图' : '切换到优化视图'}
          >
            <Zap />
            {useOptimizedView ? '优化视图' : '经典视图'}
          </button>

          <button
            className="export-button"
            onClick={() => setShowExportModal(true)}
            title="导出摘录"
          >
            <Download />
            导出
          </button>

          <button
            className="add-button"
            onClick={() => setShowAddModal(true)}
            disabled={isLoading}
          >
            <Plus />
            添加文章
          </button>
        </div>
      </div>

      {/* 根据选择的视图模式渲染不同的组件 */}
      {useOptimizedView ? (
        <VirtualizedLibrary />
      ) : (
        <div className="library-content">
          {articles.length === 0 ? (
            <div className="empty-state">
              <FileText className="empty-icon" />
              <h3>还没有文章</h3>
              <p>开始添加您的第一篇文章，开启星光摘录之旅</p>
              <button
                className="empty-add-button"
                onClick={() => setShowAddModal(true)}
              >
                <Plus />
                添加文章
              </button>
            </div>
          ) : (
          <div className="articles-grid">
            <AnimatePresence>
              {articles.map((article) => (
                <motion.div
                  key={article.id}
                  className="article-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  whileHover={{ y: -5 }}
                  onClick={() => navigate(`/reader/${article.id}`)}
                >
                  <div className="article-header">
                    <h3 className="article-title">{article.title}</h3>
                    <button
                      className="delete-button"
                      onClick={(e) => handleDeleteArticle(article.id, e)}
                      title="删除文章"
                    >
                      <Trash2 />
                    </button>
                  </div>
                  
                  <div className="article-content">
                    <p className="article-preview">
                      {truncateText(article.content, 150)}
                    </p>
                  </div>
                  
                  <div className="article-footer">
                    <div className="article-meta">
                      <span className="article-date">
                        <Calendar className="meta-icon" />
                        {formatDate(article.createdAt)}
                      </span>
                      <span className="article-stars">
                        <Star className="meta-icon" />
                        {getArticleStarsCount(article.id)} 颗星星
                      </span>
                    </div>
                    <div className="article-type">
                      {article.type}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        </div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <AddArticleModal
            onClose={() => setShowAddModal(false)}
            onFileUpload={handleFileUpload}
            onTextSubmit={handleTextSubmit}
            isLoading={isLoading}
          />
        )}

        {showExportModal && (
          <ExportModal onClose={() => setShowExportModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default LibraryView
