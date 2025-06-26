import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Star, Heart } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { isAnniversary, formatDate, getTagColor } from '../utils/helpers'
import './InspirationEcho.css'

const InspirationEcho = () => {
  const { state } = useData()
  const [echoStars, setEchoStars] = useState([])
  const [showEcho, setShowEcho] = useState(false)
  const [currentEcho, setCurrentEcho] = useState(null)

  useEffect(() => {
    // Check for anniversary stars (same date from previous years)
    const today = new Date()
    const anniversaryStars = Object.values(state.stars).filter(star => {
      const starDate = new Date(star.createdAt)
      return isAnniversary(today, starDate) && starDate.getFullYear() !== today.getFullYear()
    })

    if (anniversaryStars.length > 0) {
      setEchoStars(anniversaryStars)
      setCurrentEcho(anniversaryStars[0])
      setShowEcho(true)
    }
  }, [state.stars])

  const handleNextEcho = () => {
    const currentIndex = echoStars.findIndex(star => star.id === currentEcho.id)
    const nextIndex = (currentIndex + 1) % echoStars.length
    setCurrentEcho(echoStars[nextIndex])
  }

  const handlePrevEcho = () => {
    const currentIndex = echoStars.findIndex(star => star.id === currentEcho.id)
    const prevIndex = currentIndex === 0 ? echoStars.length - 1 : currentIndex - 1
    setCurrentEcho(echoStars[prevIndex])
  }

  const getYearsAgo = (date) => {
    const today = new Date()
    const starDate = new Date(date)
    return today.getFullYear() - starDate.getFullYear()
  }

  if (!showEcho || !currentEcho) return null

  return (
    <AnimatePresence>
      <motion.div
        className="inspiration-echo-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowEcho(false)}
      >
        <motion.div
          className="inspiration-echo-content"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="echo-header">
            <div className="echo-title">
              <Heart className="echo-icon" />
              <h2>灵感回响</h2>
            </div>
            <button className="close-button" onClick={() => setShowEcho(false)}>
              <X />
            </button>
          </div>

          <div className="echo-subtitle">
            <Calendar className="subtitle-icon" />
            <span>
              {getYearsAgo(currentEcho.createdAt)} 年前的今天，您收藏了这颗星星
            </span>
          </div>

          <div className="echo-star">
            <div 
              className="star-visual"
              style={{ '--star-color': getTagColor(currentEcho.tags[0] || 'default') }}
            >
              <div className="star-core" />
              {currentEcho.thoughts.length > 2 && <div className="star-aura" />}
              {currentEcho.thoughts.length > 5 && <div className="star-corona" />}
            </div>
          </div>

          <div className="echo-content">
            <blockquote className="echo-quote">
              "{currentEcho.content}"
            </blockquote>

            {currentEcho.thoughts.length > 0 && (
              <div className="echo-thoughts">
                <h4>当时的想法：</h4>
                {currentEcho.thoughts.map((thought, index) => (
                  <p key={index} className="echo-thought">
                    {thought}
                  </p>
                ))}
              </div>
            )}

            {currentEcho.tags.length > 0 && (
              <div className="echo-tags">
                {currentEcho.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="echo-tag"
                    style={{ backgroundColor: getTagColor(tag) }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="echo-date">
              <Star className="date-icon" />
              收藏于 {formatDate(currentEcho.createdAt)}
            </div>
          </div>

          {echoStars.length > 1 && (
            <div className="echo-navigation">
              <button className="nav-button" onClick={handlePrevEcho}>
                ← 上一个
              </button>
              <span className="nav-indicator">
                {echoStars.findIndex(star => star.id === currentEcho.id) + 1} / {echoStars.length}
              </span>
              <button className="nav-button" onClick={handleNextEcho}>
                下一个 →
              </button>
            </div>
          )}

          <div className="echo-message">
            <p>时光荏苒，但美好的文字永远闪耀 ✨</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default InspirationEcho
