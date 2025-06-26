import React from 'react'
import { motion } from 'framer-motion'
import { X, Tag } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { getTagColor } from '../utils/helpers'
import './TagFilter.css'

const TagFilter = ({ onClose }) => {
  const { state, setSelectedTags } = useData()

  const handleTagToggle = (tag) => {
    const isSelected = state.selectedTags.includes(tag)
    if (isSelected) {
      setSelectedTags(state.selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...state.selectedTags, tag])
    }
  }

  const handleClearAll = () => {
    setSelectedTags([])
  }

  const getTagCount = (tag) => {
    return Object.values(state.stars).filter(star => star.tags.includes(tag)).length
  }

  return (
    <motion.div
      className="tag-filter-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="tag-filter-content"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="filter-header">
          <h3>
            <Tag className="header-icon" />
            标签筛选
          </h3>
          <button className="close-button" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="filter-content">
          {state.tags.length === 0 ? (
            <div className="no-tags">
              <p>还没有任何标签</p>
              <p>在摘录文字时添加标签来分类管理您的星星</p>
            </div>
          ) : (
            <>
              <div className="filter-actions">
                <span className="selected-count">
                  已选择 {state.selectedTags.length} 个标签
                </span>
                {state.selectedTags.length > 0 && (
                  <button className="clear-button" onClick={handleClearAll}>
                    清除全部
                  </button>
                )}
              </div>

              <div className="tags-grid">
                {state.tags.map(tag => {
                  const isSelected = state.selectedTags.includes(tag)
                  const count = getTagCount(tag)
                  
                  return (
                    <motion.button
                      key={tag}
                      className={`tag-item ${isSelected ? 'selected' : ''}`}
                      style={{
                        backgroundColor: isSelected ? getTagColor(tag) : 'transparent',
                        borderColor: getTagColor(tag),
                        color: isSelected ? 'white' : getTagColor(tag)
                      }}
                      onClick={() => handleTagToggle(tag)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="tag-name">{tag}</span>
                      <span className="tag-count">{count}</span>
                    </motion.button>
                  )
                })}
              </div>

              {state.selectedTags.length > 0 && (
                <div className="selected-tags">
                  <h4>已选择的标签：</h4>
                  <div className="selected-tags-list">
                    {state.selectedTags.map(tag => (
                      <span 
                        key={tag} 
                        className="selected-tag"
                        style={{ backgroundColor: getTagColor(tag) }}
                      >
                        {tag}
                        <button onClick={() => handleTagToggle(tag)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default TagFilter
