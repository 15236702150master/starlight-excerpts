import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Stars, Sparkles, Package, Database } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { getRandomStar, isNewDay } from '../utils/helpers'
import InspirationEcho from './InspirationEcho'
import DataManager from './DataManager'
import './LandingPage.css'

const LandingPage = () => {
  const { state, setDailyLight } = useData()
  const [dailyLight, setDailyLightState] = useState(null)
  const [showDataManager, setShowDataManager] = useState(false)

  useEffect(() => {
    // Check if we need to set a new daily light
    if (isNewDay(state.lastDailyLightDate)) {
      const randomStar = getRandomStar(state.stars)
      if (randomStar) {
        setDailyLight(randomStar)
        setDailyLightState(randomStar)
      }
    } else {
      setDailyLightState(state.dailyLight)
    }
  }, [state.stars, state.lastDailyLightDate, state.dailyLight, setDailyLight])

  const totalArticles = Object.keys(state.articles).length
  const totalStars = Object.keys(state.stars).length
  const totalCapsules = Object.keys(state.memoryCapsules).length

  return (
    <div className="landing-page">
      <div className="stars-background">
        {[...Array(50)].map((_, i) => (
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

      <div className="landing-content">
        <motion.div
          className="hero-section"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="app-title">
            <Sparkles className="title-icon" />
            星光摘录馆
          </h1>
          <p className="app-subtitle">
            收集文字的光芒，点亮思想的星空
          </p>
        </motion.div>

        <motion.div
          className="navigation-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <Link to="/library" className="nav-card library-card">
            <BookOpen className="nav-icon" />
            <h3>文库</h3>
            <p>管理您的文章收藏</p>
            <span className="stats">{totalArticles} 篇文章</span>
          </Link>

          <Link to="/starfield" className="nav-card starfield-card">
            <Stars className="nav-icon" />
            <h3>星空</h3>
            <p>探索您的思想星空</p>
            <span className="stats">{totalStars} 颗星星</span>
          </Link>

          <Link to="/capsules" className="nav-card capsules-card">
            <Package className="nav-icon" />
            <h3>记忆胶囊</h3>
            <p>封存珍贵的回忆</p>
            <span className="stats">{totalCapsules} 个胶囊</span>
          </Link>
        </motion.div>

        {dailyLight && (
          <motion.div
            className="daily-light-section"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <h3 className="daily-light-title">
              <Sparkles className="daily-icon" />
              今日一光
            </h3>
            <div className="daily-light-content">
              <blockquote>"{dailyLight.content}"</blockquote>
              {dailyLight.thoughts && dailyLight.thoughts.length > 0 && (
                <p className="daily-thought">
                  {dailyLight.thoughts[0]}
                </p>
              )}
              <div className="daily-tags">
                {dailyLight.tags.map(tag => (
                  <span key={tag} className="daily-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          className="footer-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <p>让每一段文字都成为夜空中最亮的星</p>
          <button
            className="data-manager-button"
            onClick={() => setShowDataManager(true)}
            title="数据管理"
          >
            <Database />
          </button>
        </motion.div>
      </div>

      <InspirationEcho />

      <AnimatePresence>
        {showDataManager && (
          <DataManager onClose={() => setShowDataManager(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default LandingPage
