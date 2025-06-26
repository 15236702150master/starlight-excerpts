import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FileText, Star, Clock, Trash2, Search, Filter, Grid, List, Calendar } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import './VirtualizedLibrary.css'

const ITEM_HEIGHT = 200 // 每个文章卡片高度
const ITEMS_PER_ROW = 4 // 每行显示的文章数
const BUFFER_SIZE = 5 // 缓冲区大小

const VirtualizedLibrary = () => {
  const { state, deleteArticle } = useData()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const [containerHeight, setContainerHeight] = useState(800)
  const [scrollTop, setScrollTop] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid') // grid, list, timeline
  const [sortBy, setSortBy] = useState('createdAt') // createdAt, title, starsCount, lastAccess
  const [sortOrder, setSortOrder] = useState('desc') // asc, desc
  const [selectedCategory, setSelectedCategory] = useState('all')

  // 获取文章数据并排序
  const articles = useMemo(() => {
    let filteredArticles = Object.values(state.articles)

    // 搜索过滤
    if (searchQuery) {
      filteredArticles = filteredArticles.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // 分类过滤
    if (selectedCategory !== 'all') {
      filteredArticles = filteredArticles.filter(article =>
        article.category === selectedCategory
      )
    }

    // 排序
    filteredArticles.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'starsCount':
          aValue = getArticleStarsCount(a.id)
          bValue = getArticleStarsCount(b.id)
          break
        case 'lastAccess':
          aValue = new Date(a.lastAccessTime || a.createdAt)
          bValue = new Date(b.lastAccessTime || b.createdAt)
          break
        default: // createdAt
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filteredArticles
  }, [state.articles, searchQuery, selectedCategory, sortBy, sortOrder])

  // 获取文章星星数量
  const getArticleStarsCount = useCallback((articleId) => {
    return Object.values(state.stars).filter(star => star.articleId === articleId).length
  }, [state.stars])

  // 计算虚拟滚动参数
  const virtualScrollParams = useMemo(() => {
    const itemHeight = viewMode === 'list' ? 80 : ITEM_HEIGHT
    const itemsPerRow = viewMode === 'list' ? 1 : ITEMS_PER_ROW
    const totalRows = Math.ceil(articles.length / itemsPerRow)
    const totalHeight = totalRows * itemHeight

    const visibleRows = Math.ceil(containerHeight / itemHeight)
    const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - BUFFER_SIZE)
    const endRow = Math.min(totalRows, startRow + visibleRows + BUFFER_SIZE * 2)

    const startIndex = startRow * itemsPerRow
    const endIndex = Math.min(articles.length, endRow * itemsPerRow)

    return {
      itemHeight,
      itemsPerRow,
      totalHeight,
      startRow,
      endRow,
      startIndex,
      endIndex,
      offsetY: startRow * itemHeight
    }
  }, [articles.length, containerHeight, scrollTop, viewMode])

  // 可见文章
  const visibleArticles = useMemo(() => {
    return articles.slice(virtualScrollParams.startIndex, virtualScrollParams.endIndex)
  }, [articles, virtualScrollParams.startIndex, virtualScrollParams.endIndex])

  // 监听容器大小变化
  useEffect(() => {
    const updateContainerHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight)
      }
    }

    updateContainerHeight()
    window.addEventListener('resize', updateContainerHeight)
    return () => window.removeEventListener('resize', updateContainerHeight)
  }, [])

  // 处理滚动
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop)
  }, [])

  // 处理文章点击
  const handleArticleClick = useCallback((article) => {
    // 更新最后访问时间
    const updatedArticle = {
      ...article,
      lastAccessTime: new Date().toISOString()
    }
    // 这里应该调用更新文章的方法
    navigate(`/reader/${article.id}`)
  }, [navigate])

  // 处理删除文章
  const handleDeleteArticle = useCallback((articleId, e) => {
    e.stopPropagation()
    if (window.confirm('确定要删除这篇文章吗？这将同时删除相关的所有摘录。')) {
      deleteArticle(articleId)
    }
  }, [deleteArticle])

  // 获取分类列表
  const categories = useMemo(() => {
    const categorySet = new Set(['all'])
    articles.forEach(article => {
      if (article.category) {
        categorySet.add(article.category)
      }
    })
    return Array.from(categorySet)
  }, [articles])

  return (
    <div className="virtualized-library">
      {/* 工具栏 */}
      <div className="library-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="搜索文章..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? '全部分类' : category}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-right">
          <div className="sort-controls">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="createdAt">创建时间</option>
              <option value="title">标题</option>
              <option value="starsCount">星星数量</option>
              <option value="lastAccess">最后访问</option>
            </select>
            <button
              className={`sort-order ${sortOrder}`}
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          <div className="view-mode-toggle">
            <button
              className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={16} />
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
            >
              <Calendar size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="library-stats">
        <span>共 {articles.length} 篇文章</span>
        {searchQuery && <span>搜索结果 {articles.length} 篇</span>}
      </div>

      {/* 虚拟滚动容器 */}
      <div
        ref={containerRef}
        className="virtual-scroll-container"
        onScroll={handleScroll}
      >
        <div
          className="virtual-scroll-content"
          style={{ height: virtualScrollParams.totalHeight }}
        >
          <div
            className={`visible-items ${viewMode}`}
            style={{
              transform: `translateY(${virtualScrollParams.offsetY}px)`,
              display: viewMode === 'list' ? 'block' : 'grid',
              gridTemplateColumns: viewMode === 'grid' ? `repeat(${ITEMS_PER_ROW}, 1fr)` : 'none'
            }}
          >
            <AnimatePresence>
              {visibleArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  viewMode={viewMode}
                  starsCount={getArticleStarsCount(article.id)}
                  onClick={() => handleArticleClick(article)}
                  onDelete={(e) => handleDeleteArticle(article.id, e)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 空状态 */}
      {articles.length === 0 && (
        <div className="empty-state">
          <FileText className="empty-icon" />
          <h3>
            {searchQuery ? '没有找到匹配的文章' : '还没有文章'}
          </h3>
          <p>
            {searchQuery 
              ? '试试调整搜索关键词或筛选条件'
              : '开始添加您的第一篇文章，开启星光摘录之旅'
            }
          </p>
        </div>
      )}
    </div>
  )
}

// 文章卡片组件
const ArticleCard = ({ article, viewMode, starsCount, onClick, onDelete }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getPreview = (content, maxLength = 100) => {
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...'
      : content
  }

  if (viewMode === 'list') {
    return (
      <motion.div
        className="article-card list-mode"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClick}
      >
        <div className="article-info">
          <h3 className="article-title">{article.title}</h3>
          <div className="article-meta">
            <span className="article-date">
              <Clock size={14} />
              {formatDate(article.createdAt)}
            </span>
            <span className="article-stars">
              <Star size={14} />
              {starsCount}
            </span>
          </div>
        </div>
        <button
          className="delete-button"
          onClick={onDelete}
          title="删除文章"
        >
          <Trash2 size={16} />
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="article-card grid-mode"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -5 }}
      onClick={onClick}
    >
      <div className="article-header">
        <h3 className="article-title">{article.title}</h3>
        <button
          className="delete-button"
          onClick={onDelete}
          title="删除文章"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="article-preview">
        {getPreview(article.content)}
      </div>

      <div className="article-footer">
        <div className="article-meta">
          <span className="article-date">
            <Clock size={14} />
            {formatDate(article.createdAt)}
          </span>
          <span className="article-stars">
            <Star size={14} />
            {starsCount} 颗星星
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default VirtualizedLibrary
