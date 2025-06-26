import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, 
  Calendar, 
  Clock, 
  Star, 
  Plus, 
  X, 
  Gift,
  Sparkles,
  Heart
} from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { formatDate, generateId } from '../utils/helpers'
import MemoryCapsuleModal from './MemoryCapsuleModal'
import './MemoryCapsule.css'

const MemoryCapsule = () => {
  const { state, addMemoryCapsule } = useData()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [readyCapsules, setReadyCapsules] = useState([])
  const [selectedCapsule, setSelectedCapsule] = useState(null)

  // Check for capsules ready to be opened
  useEffect(() => {
    const now = new Date()
    const ready = Object.values(state.memoryCapsules).filter(capsule => {
      const openDate = new Date(capsule.openDate)
      return openDate <= now && !capsule.opened
    })
    setReadyCapsules(ready)
  }, [state.memoryCapsules])

  const handleCreateCapsule = (capsuleData) => {
    const capsule = {
      id: generateId(),
      ...capsuleData,
      createdAt: new Date().toISOString(),
      opened: false,
    }
    addMemoryCapsule(capsule)
    setShowCreateModal(false)
  }

  const getDaysUntilOpen = (openDate) => {
    const now = new Date()
    const target = new Date(openDate)
    const diffTime = target - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getTimeUntilOpen = (openDate) => {
    const now = new Date()
    const target = new Date(openDate)
    const diffTime = target - now
    
    if (diffTime <= 0) return '已可开启'
    
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}天${hours}小时`
    if (hours > 0) return `${hours}小时${minutes}分钟`
    return `${minutes}分钟`
  }

  const activeCapsules = Object.values(state.memoryCapsules).filter(c => !c.opened)
  const openedCapsules = Object.values(state.memoryCapsules).filter(c => c.opened)

  return (
    <div className="memory-capsule-container">
      <div className="capsule-header">
        <div className="header-title">
          <Package className="header-icon" />
          <h2>记忆胶囊</h2>
        </div>
        <button 
          className="create-capsule-button"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus />
          创建胶囊
        </button>
      </div>

      {readyCapsules.length > 0 && (
        <div className="ready-capsules">
          <h3>
            <Gift className="section-icon" />
            可开启的胶囊
          </h3>
          <div className="capsules-grid">
            {readyCapsules.map(capsule => (
              <motion.div
                key={capsule.id}
                className="capsule-card ready"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setSelectedCapsule(capsule)}
              >
                <div className="capsule-glow" />
                <div className="capsule-icon">
                  <Gift />
                </div>
                <h4>{capsule.title}</h4>
                <p className="capsule-ready">点击开启！</p>
                <div className="capsule-stars">
                  <Star className="star-icon" />
                  {capsule.starIds.length} 颗星星
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {activeCapsules.length > 0 && (
        <div className="active-capsules">
          <h3>
            <Clock className="section-icon" />
            等待开启的胶囊
          </h3>
          <div className="capsules-grid">
            {activeCapsules.map(capsule => (
              <motion.div
                key={capsule.id}
                className="capsule-card waiting"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
              >
                <div className="capsule-icon">
                  <Package />
                </div>
                <h4>{capsule.title}</h4>
                <p className="capsule-description">{capsule.description}</p>
                <div className="capsule-countdown">
                  <Calendar className="countdown-icon" />
                  {getTimeUntilOpen(capsule.openDate)}
                </div>
                <div className="capsule-stars">
                  <Star className="star-icon" />
                  {capsule.starIds.length} 颗星星
                </div>
                <div className="capsule-date">
                  开启日期：{formatDate(capsule.openDate)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {openedCapsules.length > 0 && (
        <div className="opened-capsules">
          <h3>
            <Sparkles className="section-icon" />
            已开启的胶囊
          </h3>
          <div className="capsules-grid">
            {openedCapsules.map(capsule => (
              <motion.div
                key={capsule.id}
                className="capsule-card opened"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                onClick={() => setSelectedCapsule(capsule)}
              >
                <div className="capsule-icon">
                  <Sparkles />
                </div>
                <h4>{capsule.title}</h4>
                <p className="capsule-description">{capsule.description}</p>
                <div className="capsule-opened-date">
                  开启于：{formatDate(capsule.openedAt)}
                </div>
                <div className="capsule-stars">
                  <Star className="star-icon" />
                  {capsule.starIds.length} 颗星星
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {activeCapsules.length === 0 && openedCapsules.length === 0 && (
        <div className="empty-capsules">
          <Package className="empty-icon" />
          <h3>还没有记忆胶囊</h3>
          <p>创建您的第一个记忆胶囊，将珍贵的星星封存起来，在未来的某个时刻重新发现它们</p>
          <button 
            className="create-first-capsule"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus />
            创建第一个胶囊
          </button>
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <MemoryCapsuleModal
            mode="create"
            onClose={() => setShowCreateModal(false)}
            onSave={handleCreateCapsule}
          />
        )}
        
        {selectedCapsule && (
          <MemoryCapsuleModal
            mode="view"
            capsule={selectedCapsule}
            onClose={() => setSelectedCapsule(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default MemoryCapsule
