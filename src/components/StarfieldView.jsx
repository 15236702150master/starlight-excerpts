import React, { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Filter, Search, Star as StarIcon, BarChart3, Download } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { getStarBrightness, getTagColor, getRelatedStars } from '../utils/helpers'
import { initializeAudio, playStarChime, playWindChime } from '../utils/audioManager'
import StarDetailModal from './StarDetailModal'
import TagFilter from './TagFilter'
import DataStats from './DataStats'
import ExportModal from './ExportModal'
import './StarfieldView.css'

const StarfieldView = () => {
  const { state } = useData()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [selectedStar, setSelectedStar] = useState(null)
  const [showTagFilter, setShowTagFilter] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredStar, setHoveredStar] = useState(null)
  const [relatedStars, setRelatedStars] = useState([])
  const [audioInitialized, setAudioInitialized] = useState(false)
  const [showDataStats, setShowDataStats] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  const stars = Object.values(state.stars)
  const filteredStars = stars.filter(star => {
    const matchesSearch = searchQuery === '' || 
      star.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      star.thoughts.some(thought => thought.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesTags = state.selectedTags.length === 0 ||
      state.selectedTags.some(tag => star.tags.includes(tag))
    
    return matchesSearch && matchesTags
  })

  // Initialize audio on first user interaction
  useEffect(() => {
    const handleFirstInteraction = async () => {
      if (!audioInitialized) {
        await initializeAudio()
        setAudioInitialized(true)
      }
    }

    document.addEventListener('click', handleFirstInteraction, { once: true })
    return () => document.removeEventListener('click', handleFirstInteraction)
  }, [audioInitialized])

  // Handle highlight parameter from URL
  useEffect(() => {
    const highlightId = searchParams.get('highlight')
    if (highlightId) {
      const star = stars.find(s => s.id === highlightId)
      if (star) {
        setSelectedStar(star)
        // Flash the star
        setTimeout(() => {
          const starElement = document.querySelector(`[data-star-id="${highlightId}"]`)
          if (starElement) {
            starElement.classList.add('flash')
            setTimeout(() => starElement.classList.remove('flash'), 1000)
          }
        }, 100)
      }
    }
  }, [searchParams, stars])

  const handleStarClick = (star) => {
    setSelectedStar(star)

    // Find and highlight related stars
    const related = getRelatedStars(star, state.stars)
    setRelatedStars(related)

    // Play ambient sound
    if (audioInitialized) {
      playStarChime()
    }
  }

  const handleStarHover = (star) => {
    setHoveredStar(star)

    // Play subtle hover sound
    if (audioInitialized) {
      playWindChime()
    }
  }

  const handleStarLeave = () => {
    setHoveredStar(null)
  }

  // 跳转到上下文 - 完全学习 starry-sky-project 的 jumpToContext 方法
  const jumpToContext = (star) => {
    if (!star || !star.articleId) return

    // 先导航到阅读器页面
    navigate(`/reader/${star.articleId}`)

    // 等待页面加载后执行跳转
    setTimeout(() => {
      // 处理新版数据结构（多个高亮）
      if (star.highlightIds && star.highlightIds.length > 0) {
        // 找到第一个高亮元素
        const firstHighlightEl = document.getElementById(star.highlightIds[0])
        if (firstHighlightEl) {
          firstHighlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' })

          // 闪烁所有属于同一组的高亮
          const groupId = star.highlightGroupId
          const groupHighlights = document.querySelectorAll(`.highlighted-text[data-group-id="${groupId}"]`)
          groupHighlights.forEach(el => {
            el.classList.add('highlighted-text--flash')
            setTimeout(() => el.classList.remove('highlighted-text--flash'), 1500)
          })
        }
      }
      // 处理旧版数据结构（单个高亮）
      else if (star.highlightId) {
        const highlightEl = document.getElementById(star.highlightId)
        if (highlightEl) {
          highlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
          highlightEl.classList.add('highlighted-text--flash')
          setTimeout(() => highlightEl.classList.remove('highlighted-text--flash'), 1500)
        }
      }
    }, 500) // Wait for view transition
  }

  const handleJumpToArticle = (articleId, starId) => {
    const star = Object.values(state.stars).find(s => s.id === starId)
    if (star) {
      jumpToContext(star)
    }
  }

  const getStarColor = (star) => {
    if (relatedStars.some(s => s.id === star.id)) {
      return '#ff6b6b' // Related stars glow red
    }
    if (star.tags.length > 0) {
      return getTagColor(star.tags[0])
    }
    return '#ffd700' // Default gold
  }

  return (
    <div className="starfield-view">
      <div className="starfield-header">
        <div className="header-left">
          <Link to="/" className="back-button">
            <ArrowLeft />
          </Link>
          <h1>
            <StarIcon className="header-icon" />
            星空
          </h1>
        </div>
        
        <div className="header-controls">
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="搜索星星..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button
            className={`filter-button ${showTagFilter ? 'active' : ''}`}
            onClick={() => setShowTagFilter(!showTagFilter)}
          >
            <Filter />
            筛选
          </button>

          <button
            className="stats-button"
            onClick={() => setShowDataStats(true)}
            title="数据统计"
          >
            <BarChart3 />
            统计
          </button>

          <button
            className="export-button"
            onClick={() => setShowExportModal(true)}
            title="导出摘录"
          >
            <Download />
            导出
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showTagFilter && (
          <TagFilter onClose={() => setShowTagFilter(false)} />
        )}

        {showDataStats && (
          <DataStats onClose={() => setShowDataStats(false)} />
        )}

        {showExportModal && (
          <ExportModal onClose={() => setShowExportModal(false)} />
        )}
      </AnimatePresence>

      <div className="starfield-container">
        <div className="stars-background">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="bg-star"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="stars-container">
          {filteredStars.map((star) => (
            <motion.div
              key={star.id}
              className={`star ${getStarBrightness(star.thoughts.length)}`}
              data-star-id={star.id}
              style={{
                left: `${star.position.x}%`,
                top: `${star.position.y}%`,
                '--star-color': getStarColor(star),
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.2 }}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => handleStarHover(star)}
              onMouseLeave={handleStarLeave}
            >
              <div className="star-core" />
              {star.thoughts.length > 2 && (
                <div className="star-aura" />
              )}
              {star.thoughts.length > 5 && (
                <div className="star-corona" />
              )}
              
              {hoveredStar?.id === star.id && (
                <motion.div
                  className="star-tooltip"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <div className="tooltip-content">
                    {star.content.length > 50 
                      ? star.content.substring(0, 50) + '...'
                      : star.content
                    }
                  </div>
                  <div className="tooltip-tags">
                    {star.tags.slice(0, 3).map(tag => (
                      <span 
                        key={tag} 
                        className="tooltip-tag"
                        style={{ backgroundColor: getTagColor(tag) }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {filteredStars.length === 0 && (
          <div className="empty-starfield">
            <StarIcon className="empty-icon" />
            <h3>星空空无一物</h3>
            <p>
              {searchQuery || state.selectedTags.length > 0 
                ? '没有找到匹配的星星，试试调整搜索条件'
                : '还没有收集任何星星，去文库阅读文章开始摘录吧'
              }
            </p>
            {!searchQuery && state.selectedTags.length === 0 && (
              <Link to="/library" className="go-library-button">
                前往文库
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="starfield-stats">
        <span>共 {stars.length} 颗星星</span>
        {state.selectedTags.length > 0 && (
          <span>筛选后 {filteredStars.length} 颗</span>
        )}
      </div>

      <AnimatePresence>
        {selectedStar && (
          <StarDetailModal
            star={selectedStar}
            onClose={() => {
              setSelectedStar(null)
              setRelatedStars([])
            }}
            onJumpToArticle={handleJumpToArticle}
          />
        )}
      </AnimatePresence>


    </div>
  )
}

export default StarfieldView
