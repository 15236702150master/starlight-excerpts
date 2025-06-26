import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Mic, MicOff, Play, Pause, Trash2, Tag } from 'lucide-react'
import { useData } from '../contexts/DataContext'
import { getTagColor } from '../utils/helpers'
import { startRecording, playRecording, blobToBase64 } from '../utils/audioManager'
import './ExcerptModal.css'

const ExcerptModal = ({ selectedText, onSave, onClose }) => {
  const { state, addTag } = useData()
  const [thoughts, setThoughts] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [newTag, setNewTag] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingInstance, setRecordingInstance] = useState(null)
  const audioRef = useRef(null)

  const handleStartRecording = async () => {
    try {
      // 第一次获取麦克风权限
      const recording = await startRecording()
      setRecordingInstance(recording)

      // 开始录音
      recording.start()
      setIsRecording(true)

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

  const handleStopRecording = async () => {
    if (recordingInstance && isRecording) {
      try {
        console.log('正在停止录音...')
        const blob = await recordingInstance.stop()
        setAudioBlob(blob)
        setIsRecording(false)
        setRecordingInstance(null)
        console.log('录音已完成，音频大小:', blob.size, 'bytes')
      } catch (error) {
        console.error('Error stopping recording:', error)
        alert('停止录音时出错：' + error.message)
        setIsRecording(false)
        setRecordingInstance(null)
      }
    }
  }

  const playAudio = () => {
    if (audioBlob) {
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
          const audio = playRecording(audioBlob)
          if (audio) {
            audioRef.current = audio
            audio.onended = () => setIsPlaying(false)
            audio.onerror = () => {
              console.error('音频播放失败')
              setIsPlaying(false)
            }
            setIsPlaying(true)
          }
        } catch (error) {
          console.error('播放音频时出错:', error)
          alert('播放音频失败')
        }
      }
    }
  }

  const deleteAudio = () => {
    setAudioBlob(null)
    setIsPlaying(false)
    // 停止当前播放的音频
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  const startNewRecording = () => {
    // 删除当前录音并开始新录音
    deleteAudio()
    handleStartRecording()
  }

  const handleTagSelect = (tag) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleTagRemove = (tag) => {
    setSelectedTags(selectedTags.filter(t => t !== tag))
  }

  const handleNewTagAdd = () => {
    if (newTag.trim() && !state.tags.includes(newTag.trim())) {
      const tag = newTag.trim()
      addTag(tag)
      setSelectedTags([...selectedTags, tag])
      setNewTag('')
    }
  }

  const handleSave = async () => {
    let audioData = null
    if (audioBlob) {
      try {
        audioData = await blobToBase64(audioBlob)
      } catch (error) {
        console.error('Error converting audio to base64:', error)
      }
    }
    onSave(thoughts.trim(), selectedTags, audioData)
  }

  return (
    <motion.div
      className="excerpt-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="excerpt-modal-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>添加摘录</h3>
          <button className="close-button" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="selected-text">
          <blockquote>"{selectedText}"</blockquote>
        </div>

        <div className="form-section">
          <label>想法与感悟</label>
          <textarea
            value={thoughts}
            onChange={(e) => setThoughts(e.target.value)}
            placeholder="记录您对这段文字的想法..."
            rows={4}
          />
        </div>

        <div className="form-section">
          <label>录制心声</label>
          <div className="audio-controls">
            {!audioBlob ? (
              <button
                className={`record-button ${isRecording ? 'recording' : ''}`}
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isPlaying}
              >
                {isRecording ? <MicOff /> : <Mic />}
                {isRecording ? '停止录制' : '录制心声'}
              </button>
            ) : (
              <div className="audio-player">
                <button className="play-button" onClick={playAudio}>
                  {isPlaying ? <Pause /> : <Play />}
                </button>
                <span>心声已录制</span>
                <div className="audio-actions">
                  <button
                    className="rerecord-button"
                    onClick={startNewRecording}
                    disabled={isPlaying}
                    title="重新录音"
                  >
                    <Mic />
                  </button>
                  <button
                    className="delete-audio-button"
                    onClick={deleteAudio}
                    disabled={isPlaying}
                    title="删除录音"
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <label>标签</label>
          <div className="tags-section">
            <div className="existing-tags">
              {state.tags.map(tag => (
                <button
                  key={tag}
                  className={`tag-button ${selectedTags.includes(tag) ? 'selected' : ''}`}
                  style={{ 
                    backgroundColor: selectedTags.includes(tag) ? getTagColor(tag) : 'transparent',
                    borderColor: getTagColor(tag),
                    color: selectedTags.includes(tag) ? 'white' : getTagColor(tag)
                  }}
                  onClick={() => 
                    selectedTags.includes(tag) ? handleTagRemove(tag) : handleTagSelect(tag)
                  }
                >
                  {tag}
                </button>
              ))}
            </div>
            
            <div className="new-tag-input">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="添加新标签..."
                onKeyPress={(e) => e.key === 'Enter' && handleNewTagAdd()}
              />
              <button 
                className="add-tag-button"
                onClick={handleNewTagAdd}
                disabled={!newTag.trim()}
              >
                <Tag />
              </button>
            </div>
          </div>
        </div>

        <div className="selected-tags">
          {selectedTags.map(tag => (
            <span 
              key={tag} 
              className="selected-tag"
              style={{ backgroundColor: getTagColor(tag) }}
            >
              {tag}
              <button onClick={() => handleTagRemove(tag)}>×</button>
            </span>
          ))}
        </div>

        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose}>
            取消
          </button>
          <button 
            className="save-button" 
            onClick={handleSave}
          >
            保存为星星
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ExcerptModal
