import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  Tag, 
  Star, 
  Clock,
  TrendingUp,
  BookOpen,
  Zap
} from 'lucide-react'
import { useData } from '../contexts/DataContext'
import './AdvancedSearch.css'

// 搜索引擎类
class SearchEngine {
  constructor(articles, stars) {
    this.articles = articles
    this.stars = stars
    this.index = this.buildIndex()
  }

  // 构建搜索索引
  buildIndex() {
    const index = {
      words: new Map(),
      tags: new Map(),
      categories: new Map(),
      timeline: new Map()
    }

    // 索引文章
    this.articles.forEach(article => {
      this.indexArticle(article, index)
    })

    // 索引星星
    this.stars.forEach(star => {
      this.indexStar(star, index)
    })

    return index
  }

  // 索引文章
  indexArticle(article, index) {
    // 分词并索引
    const words = this.tokenize(article.title + ' ' + article.content)
    words.forEach(word => {
      if (!index.words.has(word)) {
        index.words.set(word, new Set())
      }
      index.words.get(word).add({ type: 'article', id: article.id })
    })

    // 索引分类
    if (article.category) {
      if (!index.categories.has(article.category)) {
        index.categories.set(article.category, new Set())
      }
      index.categories.get(article.category).add({ type: 'article', id: article.id })
    }

    // 索引时间
    const date = new Date(article.createdAt).toISOString().split('T')[0]
    if (!index.timeline.has(date)) {
      index.timeline.set(date, new Set())
    }
    index.timeline.get(date).add({ type: 'article', id: article.id })
  }

  // 索引星星
  indexStar(star, index) {
    // 索引内容
    const words = this.tokenize(star.content + ' ' + star.thoughts.join(' '))
    words.forEach(word => {
      if (!index.words.has(word)) {
        index.words.set(word, new Set())
      }
      index.words.get(word).add({ type: 'star', id: star.id })
    })

    // 索引标签
    star.tags.forEach(tag => {
      if (!index.tags.has(tag)) {
        index.tags.set(tag, new Set())
      }
      index.tags.get(tag).add({ type: 'star', id: star.id })
    })
  }

  // 分词函数
  tokenize(text) {
    return text.toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1)
  }

  // 搜索函数
  search(query, filters = {}) {
    const results = new Map()

    // 文本搜索
    if (query.trim()) {
      const words = this.tokenize(query)
      words.forEach(word => {
        if (this.index.words.has(word)) {
          this.index.words.get(word).forEach(item => {
            const key = `${item.type}-${item.id}`
            if (!results.has(key)) {
              results.set(key, { ...item, score: 0 })
            }
            results.get(key).score += 1
          })
        }
      })
    }

    // 标签筛选
    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach(tag => {
        if (this.index.tags.has(tag)) {
          this.index.tags.get(tag).forEach(item => {
            const key = `${item.type}-${item.id}`
            if (!results.has(key)) {
              results.set(key, { ...item, score: 0 })
            }
            results.get(key).score += 2 // 标签匹配权重更高
          })
        }
      })
    }

    // 分类筛选
    if (filters.categories && filters.categories.length > 0) {
      filters.categories.forEach(category => {
        if (this.index.categories.has(category)) {
          this.index.categories.get(category).forEach(item => {
            const key = `${item.type}-${item.id}`
            if (!results.has(key)) {
              results.set(key, { ...item, score: 0 })
            }
            results.get(key).score += 1.5
          })
        }
      })
    }

    // 时间范围筛选
    if (filters.dateRange) {
      const { start, end } = filters.dateRange
      const startDate = new Date(start)
      const endDate = new Date(end)
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]
        if (this.index.timeline.has(dateStr)) {
          this.index.timeline.get(dateStr).forEach(item => {
            const key = `${item.type}-${item.id}`
            if (!results.has(key)) {
              results.set(key, { ...item, score: 0 })
            }
            results.get(key).score += 0.5
          })
        }
      }
    }

    // 排序并返回结果
    return Array.from(results.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 100) // 限制结果数量
  }

  // 获取推荐内容
  getRecommendations(itemId, itemType, limit = 5) {
    const item = itemType === 'article' 
      ? this.articles.find(a => a.id === itemId)
      : this.stars.find(s => s.id === itemId)
    
    if (!item) return []

    // 基于标签的推荐
    const tags = itemType === 'article' ? (item.tags || []) : item.tags
    const recommendations = new Map()

    tags.forEach(tag => {
      if (this.index.tags.has(tag)) {
        this.index.tags.get(tag).forEach(relatedItem => {
          if (relatedItem.id !== itemId) {
            const key = `${relatedItem.type}-${relatedItem.id}`
            if (!recommendations.has(key)) {
              recommendations.set(key, { ...relatedItem, score: 0 })
            }
            recommendations.get(key).score += 1
          }
        })
      }
    })

    return Array.from(recommendations.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }
}

const AdvancedSearch = ({ onResults, onClose }) => {
  const { state } = useData()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({
    tags: [],
    categories: [],
    dateRange: null,
    sortBy: 'relevance' // relevance, date, stars
  })
  const [showFilters, setShowFilters] = useState(false)
  const [searchHistory, setSearchHistory] = useState([])
  const [suggestions, setSuggestions] = useState([])

  const articles = useMemo(() => Object.values(state.articles), [state.articles])
  const stars = useMemo(() => Object.values(state.stars), [state.stars])
  const searchEngine = useMemo(() => new SearchEngine(articles, stars), [articles, stars])

  // 获取所有可用的标签和分类
  const availableTags = useMemo(() => {
    const tagSet = new Set()
    stars.forEach(star => {
      star.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [stars])

  const availableCategories = useMemo(() => {
    const categorySet = new Set()
    articles.forEach(article => {
      if (article.category) {
        categorySet.add(article.category)
      }
    })
    return Array.from(categorySet).sort()
  }, [articles])

  // 执行搜索
  const performSearch = useCallback(() => {
    if (!query.trim() && !filters.tags.length && !filters.categories.length && !filters.dateRange) {
      onResults([])
      return
    }

    const results = searchEngine.search(query, filters)
    
    // 根据类型获取完整数据
    const fullResults = results.map(result => {
      if (result.type === 'article') {
        const article = articles.find(a => a.id === result.id)
        return { ...article, type: 'article', score: result.score }
      } else {
        const star = stars.find(s => s.id === result.id)
        return { ...star, type: 'star', score: result.score }
      }
    }).filter(Boolean)

    // 排序
    if (filters.sortBy === 'date') {
      fullResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } else if (filters.sortBy === 'stars') {
      fullResults.sort((a, b) => {
        const aStars = a.type === 'article' ? getArticleStarsCount(a.id) : a.thoughts.length
        const bStars = b.type === 'article' ? getArticleStarsCount(b.id) : b.thoughts.length
        return bStars - aStars
      })
    }

    onResults(fullResults)

    // 保存搜索历史
    if (query.trim()) {
      setSearchHistory(prev => {
        const newHistory = [query, ...prev.filter(h => h !== query)].slice(0, 10)
        localStorage.setItem('search-history', JSON.stringify(newHistory))
        return newHistory
      })
    }
  }, [query, filters, searchEngine, articles, stars, onResults])

  // 获取文章星星数量
  const getArticleStarsCount = useCallback((articleId) => {
    return stars.filter(star => star.articleId === articleId).length
  }, [stars])

  // 加载搜索历史
  useEffect(() => {
    const saved = localStorage.getItem('search-history')
    if (saved) {
      setSearchHistory(JSON.parse(saved))
    }
  }, [])

  // 实时搜索
  useEffect(() => {
    const timer = setTimeout(performSearch, 300)
    return () => clearTimeout(timer)
  }, [performSearch])

  // 生成搜索建议
  useEffect(() => {
    if (query.length > 1) {
      const words = searchEngine.tokenize(query)
      const lastWord = words[words.length - 1]
      
      const suggestions = []
      
      // 标签建议
      availableTags.forEach(tag => {
        if (tag.toLowerCase().includes(lastWord.toLowerCase())) {
          suggestions.push({ type: 'tag', value: tag, icon: Tag })
        }
      })
      
      // 分类建议
      availableCategories.forEach(category => {
        if (category.toLowerCase().includes(lastWord.toLowerCase())) {
          suggestions.push({ type: 'category', value: category, icon: BookOpen })
        }
      })
      
      setSuggestions(suggestions.slice(0, 5))
    } else {
      setSuggestions([])
    }
  }, [query, availableTags, availableCategories, searchEngine])

  return (
    <motion.div
      className="advanced-search-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="advanced-search-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="search-header">
          <h2>高级搜索</h2>
          <button className="close-button" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="search-main">
          <div className="search-input-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="搜索文章、摘录、标签..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
              id="advanced-search-input"
              autoFocus
            />
            <button
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter />
            </button>
          </div>

          {/* 搜索建议 */}
          {suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="suggestion-item"
                  onClick={() => {
                    if (suggestion.type === 'tag') {
                      setFilters(prev => ({
                        ...prev,
                        tags: [...prev.tags, suggestion.value]
                      }))
                    } else if (suggestion.type === 'category') {
                      setFilters(prev => ({
                        ...prev,
                        categories: [...prev.categories, suggestion.value]
                      }))
                    }
                    setQuery('')
                  }}
                >
                  <suggestion.icon size={16} />
                  {suggestion.value}
                </button>
              ))}
            </div>
          )}

          {/* 搜索历史 */}
          {!query && searchHistory.length > 0 && (
            <div className="search-history">
              <h4>最近搜索</h4>
              <div className="history-items">
                {searchHistory.map((item, index) => (
                  <button
                    key={index}
                    className="history-item"
                    onClick={() => setQuery(item)}
                  >
                    <Clock size={14} />
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 高级筛选 */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                className="advanced-filters"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                {/* 标签筛选 */}
                <div className="filter-group">
                  <label>标签筛选</label>
                  <div className="tag-selector">
                    {availableTags.map(tag => (
                      <button
                        key={tag}
                        className={`tag-option ${filters.tags.includes(tag) ? 'selected' : ''}`}
                        onClick={() => {
                          setFilters(prev => ({
                            ...prev,
                            tags: prev.tags.includes(tag)
                              ? prev.tags.filter(t => t !== tag)
                              : [...prev.tags, tag]
                          }))
                        }}
                      >
                        <Tag size={14} />
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 分类筛选 */}
                <div className="filter-group">
                  <label>分类筛选</label>
                  <div className="category-selector">
                    {availableCategories.map(category => (
                      <button
                        key={category}
                        className={`category-option ${filters.categories.includes(category) ? 'selected' : ''}`}
                        onClick={() => {
                          setFilters(prev => ({
                            ...prev,
                            categories: prev.categories.includes(category)
                              ? prev.categories.filter(c => c !== category)
                              : [...prev.categories, category]
                          }))
                        }}
                      >
                        <BookOpen size={14} />
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 排序方式 */}
                <div className="filter-group">
                  <label>排序方式</label>
                  <div className="sort-options">
                    <button
                      className={`sort-option ${filters.sortBy === 'relevance' ? 'selected' : ''}`}
                      onClick={() => setFilters(prev => ({ ...prev, sortBy: 'relevance' }))}
                    >
                      <TrendingUp size={14} />
                      相关性
                    </button>
                    <button
                      className={`sort-option ${filters.sortBy === 'date' ? 'selected' : ''}`}
                      onClick={() => setFilters(prev => ({ ...prev, sortBy: 'date' }))}
                    >
                      <Calendar size={14} />
                      时间
                    </button>
                    <button
                      className={`sort-option ${filters.sortBy === 'stars' ? 'selected' : ''}`}
                      onClick={() => setFilters(prev => ({ ...prev, sortBy: 'stars' }))}
                    >
                      <Star size={14} />
                      星星数
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="search-footer">
          <button className="clear-button" onClick={() => {
            setQuery('')
            setFilters({
              tags: [],
              categories: [],
              dateRange: null,
              sortBy: 'relevance'
            })
          }}>
            清空筛选
          </button>
          <button className="search-button" onClick={performSearch}>
            <Zap size={16} />
            搜索
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default AdvancedSearch
