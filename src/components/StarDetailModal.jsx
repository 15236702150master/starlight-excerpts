import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  Plus,
  Trash2,
  ExternalLink,
  Play,
  Pause,
  Volume2,
  Calendar,
  BookOpen,
  Tag as TagIcon,
  Mic,
  Square
} from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { formatDate, getTagColor } from '../utils/helpers'
import { base64ToBlob, playRecording } from '../utils/audioManager'
import './StarDetailModal.css'

const StarDetailModal = ({ star, onClose, onJumpToArticle }) => {
  const { state, updateStar, deleteStar } = useData()
  const [newThought, setNewThought] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const audioRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordingIntervalRef = useRef(null)

  const article = state.articles[star.articleId]

  const handleAddThought = () => {
    if (newThought.trim()) {
      const updatedThoughts = [...star.thoughts, newThought.trim()]
      updateStar(star.id, { thoughts: updatedThoughts })
      setNewThought('')
    }
  }

  const handleDeleteThought = (index) => {
    const updatedThoughts = star.thoughts.filter((_, i) => i !== index)
    updateStar(star.id, { thoughts: updatedThoughts })
  }

  const handleDeleteStar = () => {
    if (window.confirm('确定要删除这颗星星吗？')) {
      deleteStar(star.id)
      onClose()
    }
  }

  const handlePlayAudio = () => {
    if (star.audioBlob) {
      if (isPlaying) {
        // 暂停播放
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        }
        setIsPlaying(false)
      } else {
        // 开始播放
        try {
          console.log('正在播放录音...')
          const audioBlob = base64ToBlob(star.audioBlob)
          const audio = playRecording(audioBlob)

          if (audio) {
            audioRef.current = audio
            audio.onended = () => {
              console.log('录音播放完成')
              setIsPlaying(false)
            }
            audio.onerror = (e) => {
              console.error('音频播放失败:', e)
              setIsPlaying(false)
              alert('播放录音失败')
            }
            setIsPlaying(true)
          } else {
            console.error('无法创建音频对象')
            alert('播放录音失败')
          }
        } catch (error) {
          console.error('Error playing audio:', error)
          alert('播放录音时出错：' + error.message)
        }
      }
    }
  }

  const startRecording = async () => {
    try {
      // 使用 audioManager 的录音功能
      const { startRecording: startAudioRecording } = await import('../utils/audioManager')
      const recording = await startAudioRecording()

      mediaRecorderRef.current = recording
      recording.start()
      setIsRecording(true)
      setRecordingTime(0)

      // 开始计时
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      console.log('录音已开始')
    } catch (error) {
      console.error('Error starting recording:', error)
      if (error.name === 'NotAllowedError') {
        alert('需要麦克风权限才能录音，请在浏览器设置中允许访问麦克风')
      } else if (error.name === 'NotFoundError') {
        alert('未找到麦克风设备，请检查设备连接')
      } else {
        alert('无法访问麦克风：' + error.message)
      }
    }
  }

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        console.log('正在停止录音...')
        const blob = await mediaRecorderRef.current.stop()

        // 转换为 base64 并保存
        const { blobToBase64 } = await import('../utils/audioManager')
        const base64 = await blobToBase64(blob)

        // 更新星星的音频数据
        updateStar(star.id, { audioBlob: base64 })

        setIsRecording(false)
        clearInterval(recordingIntervalRef.current)
        mediaRecorderRef.current = null

        console.log('录音已完成并保存')
      } catch (error) {
        console.error('Error stopping recording:', error)
        alert('停止录音时出错：' + error.message)
        setIsRecording(false)
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  const deleteAudio = () => {
    // 停止当前播放
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)

    // 删除音频数据
    updateStar(star.id, { audioBlob: null })
    console.log('录音已删除')
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleJumpToArticle = () => {
    if (onJumpToArticle) {
      onJumpToArticle(star.articleId, star.id)
      onClose()
    }
  }

  return (
    <motion.div
      className="star-detail-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="star-detail-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="star-info">
            <div className="star-visual">
              <div 
                className="star-preview"
                style={{ '--star-color': getTagColor(star.tags[0] || 'default') }}
              >
                <div className="star-core" />
                {star.thoughts.length > 2 && <div className="star-aura" />}
                {star.thoughts.length > 5 && <div className="star-corona" />}
              </div>
            </div>
            <div className="star-meta">
              <span className="creation-date">
                <Calendar className="meta-icon" />
                {formatDate(star.createdAt)}
              </span>
              {article && (
                <span className="article-link" onClick={handleJumpToArticle}>
                  <BookOpen className="meta-icon" />
                  来自《{article.title}》
                  <ExternalLink className="external-icon" />
                </span>
              )}
            </div>
          </div>
          
          <div className="header-actions">
            <button className="delete-button" onClick={handleDeleteStar}>
              <Trash2 />
            </button>
            <button className="close-button" onClick={onClose}>
              <X />
            </button>
          </div>
        </div>

        <div className="star-content">
          <div className="original-text">
            <h3>原文摘录</h3>
            <blockquote>"{star.content}"</blockquote>
          </div>

          <div className="audio-section">
            <h3>
              <Volume2 className="section-icon" />
              心声录音
            </h3>
            {star.audioBlob ? (
              <div className="audio-player">
                <button className="play-button" onClick={handlePlayAudio}>
                  {isPlaying ? <Pause /> : <Play />}
                </button>
                <span>点击播放录音</span>
                <button
                  className="delete-audio-button"
                  onClick={deleteAudio}
                  disabled={isPlaying || isRecording}
                  title="删除录音"
                >
                  <Trash2 />
                </button>
              </div>
            ) : (
              <div className="no-audio">
                <span>暂无录音</span>
              </div>
            )}

            <div className="recording-controls">
              {!isRecording ? (
                <button
                  className="record-button"
                  onClick={startRecording}
                  disabled={isPlaying}
                >
                  <Mic />
                  {star.audioBlob ? '重新录音' : '开始录音'}
                </button>
              ) : (
                <div className="recording-active">
                  <button
                    className="stop-button"
                    onClick={stopRecording}
                  >
                    <Square />
                    停止录音
                  </button>
                  <span className="recording-time">
                    {formatTime(recordingTime)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="tags-section">
            <h3>
              <TagIcon className="section-icon" />
              标签
            </h3>
            <div className="tags-list">
              {star.tags.length > 0 ? (
                star.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="tag"
                    style={{ backgroundColor: getTagColor(tag) }}
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="no-tags">暂无标签</span>
              )}
            </div>
          </div>

          <div className="thoughts-section">
            <h3>想法与感悟</h3>
            <div className="thoughts-list">
              {star.thoughts.map((thought, index) => (
                <motion.div
                  key={index}
                  className="thought-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <p>{thought}</p>
                  <button 
                    className="delete-thought-button"
                    onClick={() => handleDeleteThought(index)}
                  >
                    <Trash2 />
                  </button>
                </motion.div>
              ))}
              
              {star.thoughts.length === 0 && (
                <p className="no-thoughts">还没有记录想法</p>
              )}
            </div>

            <div className="add-thought">
              <textarea
                value={newThought}
                onChange={(e) => setNewThought(e.target.value)}
                placeholder="添加新的想法..."
                rows={3}
              />
              <button 
                className="add-thought-button"
                onClick={handleAddThought}
                disabled={!newThought.trim()}
              >
                <Plus />
                添加想法
              </button>
            </div>
          </div>

          {/* 查看原文按钮 */}
          <div className="modal-footer">
            <button
              className="view-original-button"
              onClick={handleJumpToArticle}
            >
              <BookOpen />
              查看原文
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default StarDetailModal
