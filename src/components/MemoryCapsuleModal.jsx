import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Calendar, Star, Package, Gift, Sparkles, Heart } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { formatDate, getTagColor } from '../utils/helpers'
import './MemoryCapsuleModal.css'

const MemoryCapsuleModal = ({ mode, capsule, onClose, onSave }) => {
  const { state, updateMemoryCapsule } = useData()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [openDate, setOpenDate] = useState('')
  const [selectedStarIds, setSelectedStarIds] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (mode === 'create') {
      // Set minimum date to tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setOpenDate(tomorrow.toISOString().split('T')[0])
    } else if (capsule) {
      setTitle(capsule.title)
      setDescription(capsule.description)
      setOpenDate(capsule.openDate.split('T')[0])
      setSelectedStarIds(capsule.starIds)
      setMessage(capsule.message || '')
    }
  }, [mode, capsule])

  const handleStarToggle = (starId) => {
    if (selectedStarIds.includes(starId)) {
      setSelectedStarIds(selectedStarIds.filter(id => id !== starId))
    } else {
      setSelectedStarIds([...selectedStarIds, starId])
    }
  }

  const handleSave = () => {
    if (!title.trim() || selectedStarIds.length === 0) return

    const capsuleData = {
      title: title.trim(),
      description: description.trim(),
      openDate: new Date(openDate).toISOString(),
      starIds: selectedStarIds,
      message: message.trim(),
    }

    onSave(capsuleData)
  }

  const handleOpenCapsule = () => {
    if (capsule) {
      // Mark capsule as opened
      updateMemoryCapsule(capsule.id, {
        opened: true,
        openedAt: new Date().toISOString(),
      })
      onClose()
    }
  }

  const getSelectedStars = () => {
    return selectedStarIds.map(id => state.stars[id]).filter(Boolean)
  }

  const getCapsuleStars = () => {
    if (!capsule) return []
    return capsule.starIds.map(id => state.stars[id]).filter(Boolean)
  }

  const renderCreateMode = () => (
    <div className="capsule-form">
      <h2>
        <Package className="modal-icon" />
        创建记忆胶囊
      </h2>
      
      <div className="form-group">
        <label>胶囊标题 *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="给您的记忆胶囊起个名字..."
          maxLength={50}
        />
      </div>

      <div className="form-group">
        <label>描述</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="描述这个胶囊的意义..."
          rows={3}
          maxLength={200}
        />
      </div>

      <div className="form-group">
        <label>开启日期 *</label>
        <input
          type="date"
          value={openDate}
          onChange={(e) => setOpenDate(e.target.value)}
          min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
        />
      </div>

      <div className="form-group">
        <label>给未来的自己留言</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="写给未来开启胶囊时的自己..."
          rows={3}
          maxLength={500}
        />
      </div>

      <div className="stars-selection">
        <h3>选择要封存的星星 ({selectedStarIds.length})</h3>
        <div className="stars-grid">
          {Object.values(state.stars).map(star => (
            <div
              key={star.id}
              className={`star-item ${selectedStarIds.includes(star.id) ? 'selected' : ''}`}
              onClick={() => handleStarToggle(star.id)}
            >
              <div 
                className="star-visual"
                style={{ '--star-color': getTagColor(star.tags[0] || 'default') }}
              >
                <div className="star-core" />
              </div>
              <div className="star-content">
                <p>{star.content.length > 50 ? star.content.substring(0, 50) + '...' : star.content}</p>
                <div className="star-tags">
                  {star.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="tag" style={{ backgroundColor: getTagColor(tag) }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="modal-actions">
        <button className="cancel-button" onClick={onClose}>
          取消
        </button>
        <button 
          className="save-button"
          onClick={handleSave}
          disabled={!title.trim() || selectedStarIds.length === 0}
        >
          <Package />
          封存胶囊
        </button>
      </div>
    </div>
  )

  const renderViewMode = () => {
    const stars = getCapsuleStars()
    const isReady = new Date(capsule.openDate) <= new Date()
    
    return (
      <div className="capsule-view">
        <div className="capsule-header">
          <div className="capsule-icon-large">
            {capsule.opened ? <Sparkles /> : isReady ? <Gift /> : <Package />}
          </div>
          <h2>{capsule.title}</h2>
          {capsule.description && <p className="capsule-description">{capsule.description}</p>}
        </div>

        <div className="capsule-info">
          <div className="info-item">
            <Calendar className="info-icon" />
            <span>
              {capsule.opened 
                ? `开启于 ${formatDate(capsule.openedAt)}`
                : `将于 ${formatDate(capsule.openDate)} 开启`
              }
            </span>
          </div>
          <div className="info-item">
            <Star className="info-icon" />
            <span>{stars.length} 颗星星</span>
          </div>
        </div>

        {capsule.message && (
          <div className="capsule-message">
            <h3>
              <Heart className="message-icon" />
              来自过去的留言
            </h3>
            <blockquote>{capsule.message}</blockquote>
          </div>
        )}

        <div className="capsule-stars">
          <h3>封存的星星</h3>
          <div className="stars-list">
            {stars.map(star => (
              <div key={star.id} className="star-item-view">
                <div 
                  className="star-visual"
                  style={{ '--star-color': getTagColor(star.tags[0] || 'default') }}
                >
                  <div className="star-core" />
                </div>
                <div className="star-content">
                  <blockquote>"{star.content}"</blockquote>
                  {star.thoughts.length > 0 && (
                    <p className="star-thought">{star.thoughts[0]}</p>
                  )}
                  <div className="star-tags">
                    {star.tags.map(tag => (
                      <span key={tag} className="tag" style={{ backgroundColor: getTagColor(tag) }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose}>
            关闭
          </button>
          {isReady && !capsule.opened && (
            <button className="open-button" onClick={handleOpenCapsule}>
              <Gift />
              开启胶囊
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="memory-capsule-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="memory-capsule-modal-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={onClose}>
          <X />
        </button>
        
        {mode === 'create' ? renderCreateMode() : renderViewMode()}
      </motion.div>
    </motion.div>
  )
}

export default MemoryCapsuleModal
