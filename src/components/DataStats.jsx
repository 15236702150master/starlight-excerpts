import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, TrendingUp, Calendar, Clock, X } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { getDataStatistics } from '../utils/storage'
import { formatDate } from '../utils/helpers'
import './DataStats.css'

const DataStats = ({ onClose }) => {
  const { state } = useData()
  const [statistics, setStatistics] = useState(null)
  const [timeRange, setTimeRange] = useState('all') // all, week, month, year

  useEffect(() => {
    loadStatistics()
  }, [state, timeRange])

  const loadStatistics = () => {
    const stats = getDataStatistics()
    if (stats) {
      const filteredStats = filterStatsByTimeRange(stats)
      setStatistics(filteredStats)
    }
  }

  const filterStatsByTimeRange = (stats) => {
    if (timeRange === 'all') return stats

    const now = new Date()
    let cutoffDate

    switch (timeRange) {
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        return stats
    }

    // Filter articles and stars by creation date
    const filteredArticles = Object.values(state.articles || {}).filter(
      article => new Date(article.createdAt) >= cutoffDate
    )
    const filteredStars = Object.values(state.stars || {}).filter(
      star => new Date(star.createdAt) >= cutoffDate
    )

    // Recalculate statistics for filtered data
    const filteredStats = {
      ...stats,
      articles: {
        total: filteredArticles.length,
        byType: {}
      },
      stars: {
        total: filteredStars.length,
        withThoughts: 0,
        withAudio: 0,
        byTag: {}
      }
    }

    // Recalculate article stats
    filteredArticles.forEach(article => {
      filteredStats.articles.byType[article.type] = 
        (filteredStats.articles.byType[article.type] || 0) + 1
    })

    // Recalculate star stats
    filteredStars.forEach(star => {
      if (star.thoughts && star.thoughts.length > 0) {
        filteredStats.stars.withThoughts++
      }
      if (star.audioBlob) {
        filteredStats.stars.withAudio++
      }
      star.tags.forEach(tag => {
        filteredStats.stars.byTag[tag] = (filteredStats.stars.byTag[tag] || 0) + 1
      })
    })

    return filteredStats
  }

  const getCreationTrend = () => {
    const stars = Object.values(state.stars || {})
    const last30Days = []
    const now = new Date()

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const count = stars.filter(star => 
        star.createdAt.split('T')[0] === dateStr
      ).length
      last30Days.push({ date: dateStr, count })
    }

    return last30Days
  }

  const getMostActiveDay = () => {
    const trend = getCreationTrend()
    return trend.reduce((max, day) => day.count > max.count ? day : max, { count: 0 })
  }

  const getTopTags = () => {
    if (!statistics?.stars.byTag) return []
    return Object.entries(statistics.stars.byTag)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
  }

  const timeRangeLabels = {
    all: '全部时间',
    week: '最近一周',
    month: '最近一月',
    year: '最近一年'
  }

  if (!statistics) {
    return (
      <div className="data-stats-loading">
        <div className="spinner" />
        <p>加载统计数据...</p>
      </div>
    )
  }

  const trend = getCreationTrend()
  const mostActiveDay = getMostActiveDay()
  const topTags = getTopTags()

  return (
    <motion.div
      className="data-stats-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="data-stats-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="stats-header">
          <h2>
            <BarChart3 className="header-icon" />
            数据统计
          </h2>
          <button className="close-button" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="time-range-selector">
          {Object.entries(timeRangeLabels).map(([key, label]) => (
            <button
              key={key}
              className={`time-range-button ${timeRange === key ? 'active' : ''}`}
              onClick={() => setTimeRange(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="stats-grid">
          <div className="stat-section">
            <h3>总览</h3>
            <div className="overview-stats">
              <div className="overview-item">
                <span className="stat-number">{statistics.articles.total}</span>
                <span className="stat-label">文章</span>
              </div>
              <div className="overview-item">
                <span className="stat-number">{statistics.stars.total}</span>
                <span className="stat-label">星星</span>
              </div>
              <div className="overview-item">
                <span className="stat-number">{statistics.stars.withThoughts}</span>
                <span className="stat-label">有想法的星星</span>
              </div>
              <div className="overview-item">
                <span className="stat-number">{statistics.stars.withAudio}</span>
                <span className="stat-label">有录音的星星</span>
              </div>
            </div>
          </div>

          <div className="stat-section">
            <h3>
              <TrendingUp className="section-icon" />
              创作趋势
            </h3>
            <div className="trend-chart">
              {trend.map((day, index) => (
                <div key={day.date} className="trend-bar">
                  <div 
                    className="trend-fill"
                    style={{ 
                      height: `${Math.max(day.count * 20, 2)}px`,
                      backgroundColor: day.count > 0 ? '#4ecdc4' : '#333'
                    }}
                    title={`${day.date}: ${day.count} 颗星星`}
                  />
                </div>
              ))}
            </div>
            {mostActiveDay.count > 0 && (
              <p className="trend-info">
                <Calendar className="info-icon" />
                最活跃的一天：{formatDate(mostActiveDay.date)} ({mostActiveDay.count} 颗星星)
              </p>
            )}
          </div>

          <div className="stat-section">
            <h3>热门标签</h3>
            <div className="top-tags">
              {topTags.length > 0 ? (
                topTags.map(([tag, count]) => (
                  <div key={tag} className="tag-stat">
                    <span className="tag-name">#{tag}</span>
                    <span className="tag-count">{count}</span>
                  </div>
                ))
              ) : (
                <p className="no-data">暂无标签数据</p>
              )}
            </div>
          </div>

          <div className="stat-section">
            <h3>文章类型分布</h3>
            <div className="type-distribution">
              {Object.entries(statistics.articles.byType).length > 0 ? (
                Object.entries(statistics.articles.byType).map(([type, count]) => (
                  <div key={type} className="type-stat">
                    <span className="type-name">{type.toUpperCase()}</span>
                    <div className="type-bar">
                      <div 
                        className="type-fill"
                        style={{ 
                          width: `${(count / statistics.articles.total) * 100}%`
                        }}
                      />
                    </div>
                    <span className="type-count">{count}</span>
                  </div>
                ))
              ) : (
                <p className="no-data">暂无文章数据</p>
              )}
            </div>
          </div>

          <div className="stat-section">
            <h3>
              <Clock className="section-icon" />
              存储信息
            </h3>
            {statistics.storage && (
              <div className="storage-stats">
                <div className="storage-item">
                  <span>数据大小</span>
                  <span>{statistics.storage.formattedDataSize}</span>
                </div>
                <div className="storage-item">
                  <span>备份大小</span>
                  <span>{statistics.storage.formattedBackupSize}</span>
                </div>
                <div className="storage-item">
                  <span>使用率</span>
                  <span>{statistics.storage.usagePercentage.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default DataStats
