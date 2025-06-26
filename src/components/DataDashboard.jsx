import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Tag,
  Star,
  BookOpen,
  Clock,
  Target,
  Award,
  Zap,
  X
} from 'lucide-react'
import { useData } from '../contexts/DataContext'
import './DataDashboard.css'

const DataDashboard = ({ onClose }) => {
  const { state } = useData()
  const [activeTab, setActiveTab] = useState('overview') // overview, trends, tags, achievements

  const articles = useMemo(() => Object.values(state.articles), [state.articles])
  const stars = useMemo(() => Object.values(state.stars), [state.stars])

  // 基础统计数据
  const basicStats = useMemo(() => {
    const totalWords = articles.reduce((sum, article) => {
      return sum + (article.content?.length || 0)
    }, 0)

    const totalThoughts = stars.reduce((sum, star) => {
      return sum + (star.thoughts?.length || 0)
    }, 0)

    const avgStarsPerArticle = articles.length > 0 ? (stars.length / articles.length).toFixed(1) : 0
    const avgThoughtsPerStar = stars.length > 0 ? (totalThoughts / stars.length).toFixed(1) : 0

    return {
      totalArticles: articles.length,
      totalStars: stars.length,
      totalWords,
      totalThoughts,
      avgStarsPerArticle,
      avgThoughtsPerStar
    }
  }, [articles, stars])

  // 时间趋势数据
  const timelineData = useMemo(() => {
    const last30Days = []
    const now = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const articlesCount = articles.filter(article => 
        article.createdAt.startsWith(dateStr)
      ).length
      
      const starsCount = stars.filter(star => 
        star.createdAt.startsWith(dateStr)
      ).length
      
      last30Days.push({
        date: dateStr,
        articles: articlesCount,
        stars: starsCount,
        day: date.getDate(),
        month: date.getMonth() + 1
      })
    }
    
    return last30Days
  }, [articles, stars])

  // 标签统计
  const tagStats = useMemo(() => {
    const tagMap = new Map()
    
    stars.forEach(star => {
      star.tags?.forEach(tag => {
        if (tagMap.has(tag)) {
          tagMap.set(tag, tagMap.get(tag) + 1)
        } else {
          tagMap.set(tag, 1)
        }
      })
    })
    
    return Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
  }, [stars])

  // 分类统计
  const categoryStats = useMemo(() => {
    const categoryMap = new Map()
    
    articles.forEach(article => {
      const category = article.category || '未分类'
      if (categoryMap.has(category)) {
        categoryMap.set(category, categoryMap.get(category) + 1)
      } else {
        categoryMap.set(category, 1)
      }
    })
    
    return Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
  }, [articles])

  // 成就系统
  const achievements = useMemo(() => {
    const achievements = []
    
    // 文章数量成就
    if (basicStats.totalArticles >= 100) {
      achievements.push({ 
        id: 'articles_100', 
        title: '博览群书', 
        description: '收藏了100篇文章',
        icon: BookOpen,
        color: '#3b82f6'
      })
    } else if (basicStats.totalArticles >= 50) {
      achievements.push({ 
        id: 'articles_50', 
        title: '知识收集者', 
        description: '收藏了50篇文章',
        icon: BookOpen,
        color: '#06b6d4'
      })
    } else if (basicStats.totalArticles >= 10) {
      achievements.push({ 
        id: 'articles_10', 
        title: '初出茅庐', 
        description: '收藏了10篇文章',
        icon: BookOpen,
        color: '#10b981'
      })
    }
    
    // 星星数量成就
    if (basicStats.totalStars >= 500) {
      achievements.push({ 
        id: 'stars_500', 
        title: '星空大师', 
        description: '创建了500颗星星',
        icon: Star,
        color: '#f59e0b'
      })
    } else if (basicStats.totalStars >= 100) {
      achievements.push({ 
        id: 'stars_100', 
        title: '摘录达人', 
        description: '创建了100颗星星',
        icon: Star,
        color: '#eab308'
      })
    }
    
    // 思考深度成就
    if (basicStats.avgThoughtsPerStar >= 3) {
      achievements.push({ 
        id: 'deep_thinker', 
        title: '深度思考者', 
        description: '平均每颗星星有3个以上想法',
        icon: Target,
        color: '#8b5cf6'
      })
    }
    
    // 持续性成就
    const recentDays = timelineData.slice(-7)
    const activeDays = recentDays.filter(day => day.articles > 0 || day.stars > 0).length
    if (activeDays >= 7) {
      achievements.push({ 
        id: 'consistent_week', 
        title: '持之以恒', 
        description: '连续7天都有活动',
        icon: Zap,
        color: '#ef4444'
      })
    }
    
    return achievements
  }, [basicStats, timelineData])

  // 获取最大值用于图表缩放
  const maxValue = Math.max(...timelineData.map(d => Math.max(d.articles, d.stars)))

  return (
    <motion.div
      className="data-dashboard-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="data-dashboard-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="dashboard-header">
          <h2>数据统计</h2>
          <button className="close-button" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart3 size={16} />
            概览
          </button>
          <button
            className={`tab-button ${activeTab === 'trends' ? 'active' : ''}`}
            onClick={() => setActiveTab('trends')}
          >
            <TrendingUp size={16} />
            趋势
          </button>
          <button
            className={`tab-button ${activeTab === 'tags' ? 'active' : ''}`}
            onClick={() => setActiveTab('tags')}
          >
            <Tag size={16} />
            标签
          </button>
          <button
            className={`tab-button ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            <Award size={16} />
            成就
          </button>
        </div>

        <div className="dashboard-content">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                className="overview-tab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <BookOpen />
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{basicStats.totalArticles}</div>
                      <div className="stat-label">篇文章</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <Star />
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{basicStats.totalStars}</div>
                      <div className="stat-label">颗星星</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <Target />
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{basicStats.totalThoughts}</div>
                      <div className="stat-label">个想法</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon">
                      <Clock />
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{Math.round(basicStats.totalWords / 1000)}k</div>
                      <div className="stat-label">字数</div>
                    </div>
                  </div>
                </div>

                <div className="insights-grid">
                  <div className="insight-card">
                    <h4>平均摘录密度</h4>
                    <div className="insight-value">{basicStats.avgStarsPerArticle}</div>
                    <div className="insight-desc">每篇文章的星星数</div>
                  </div>

                  <div className="insight-card">
                    <h4>思考深度</h4>
                    <div className="insight-value">{basicStats.avgThoughtsPerStar}</div>
                    <div className="insight-desc">每颗星星的想法数</div>
                  </div>
                </div>

                <div className="category-overview">
                  <h4>分类分布</h4>
                  <div className="category-list">
                    {categoryStats.map(({ category, count }) => (
                      <div key={category} className="category-item">
                        <span className="category-name">{category}</span>
                        <span className="category-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'trends' && (
              <motion.div
                key="trends"
                className="trends-tab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h4>最近30天活动趋势</h4>
                <div className="timeline-chart">
                  {timelineData.map((day, index) => (
                    <div key={day.date} className="timeline-day">
                      <div className="day-bars">
                        <div 
                          className="bar articles-bar"
                          style={{ 
                            height: maxValue > 0 ? `${(day.articles / maxValue) * 100}%` : '0%' 
                          }}
                          title={`${day.articles} 篇文章`}
                        />
                        <div 
                          className="bar stars-bar"
                          style={{ 
                            height: maxValue > 0 ? `${(day.stars / maxValue) * 100}%` : '0%' 
                          }}
                          title={`${day.stars} 颗星星`}
                        />
                      </div>
                      <div className="day-label">
                        {day.day}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-color articles"></div>
                    <span>文章</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color stars"></div>
                    <span>星星</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'tags' && (
              <motion.div
                key="tags"
                className="tags-tab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h4>热门标签 (Top 20)</h4>
                <div className="tags-chart">
                  {tagStats.map(({ tag, count }, index) => (
                    <div key={tag} className="tag-bar">
                      <div className="tag-info">
                        <span className="tag-name">#{tag}</span>
                        <span className="tag-count">{count}</span>
                      </div>
                      <div className="tag-progress">
                        <div 
                          className="tag-fill"
                          style={{ 
                            width: `${(count / tagStats[0].count) * 100}%`,
                            backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 60%)`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'achievements' && (
              <motion.div
                key="achievements"
                className="achievements-tab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h4>已获得成就</h4>
                <div className="achievements-grid">
                  {achievements.map((achievement) => (
                    <motion.div
                      key={achievement.id}
                      className="achievement-card"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div 
                        className="achievement-icon"
                        style={{ backgroundColor: achievement.color }}
                      >
                        <achievement.icon />
                      </div>
                      <div className="achievement-content">
                        <h5>{achievement.title}</h5>
                        <p>{achievement.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {achievements.length === 0 && (
                  <div className="no-achievements">
                    <Award className="no-achievements-icon" />
                    <p>继续使用应用来解锁成就吧！</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default DataDashboard
