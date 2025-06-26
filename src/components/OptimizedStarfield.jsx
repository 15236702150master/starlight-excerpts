import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useData } from '../contexts/DataContext'
import StarDetailModal from './StarDetailModal'
import './OptimizedStarfield.css'

// 星空渲染配置
const STARFIELD_CONFIG = {
  MAX_VISIBLE_STARS: 500, // 最大可见星星数量
  CLUSTER_THRESHOLD: 20,   // 聚合阈值
  LOD_LEVELS: {
    HIGH: { distance: 100, detail: 'full' },
    MEDIUM: { distance: 300, detail: 'simple' },
    LOW: { distance: 500, detail: 'dot' }
  },
  ANIMATION_FPS: 60,
  BACKGROUND_STARS: 100
}

class StarfieldRenderer {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.stars = []
    this.backgroundStars = []
    this.clusters = []
    this.viewport = { x: 0, y: 0, width: 0, height: 0, zoom: 1 }
    this.animationFrame = null
    this.lastFrameTime = 0
    this.isAnimating = false
    
    this.initBackgroundStars()
  }

  // 初始化背景装饰星星
  initBackgroundStars() {
    this.backgroundStars = []
    for (let i = 0; i < STARFIELD_CONFIG.BACKGROUND_STARS; i++) {
      this.backgroundStars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.01
      })
    }
  }

  // 更新星星数据
  updateStars(stars) {
    this.stars = stars.map(star => ({
      ...star,
      screenX: (star.position.x / 100) * this.canvas.width,
      screenY: (star.position.y / 100) * this.canvas.height,
      brightness: this.calculateBrightness(star),
      size: this.calculateSize(star),
      visible: true
    }))
    
    this.updateClusters()
  }

  // 计算星星亮度
  calculateBrightness(star) {
    const thoughtCount = star.thoughts?.length || 0
    if (thoughtCount > 5) return 'bright'
    if (thoughtCount > 2) return 'medium'
    return 'dim'
  }

  // 计算星星大小
  calculateSize(star) {
    const thoughtCount = star.thoughts?.length || 0
    return Math.max(3, Math.min(12, 3 + thoughtCount * 1.5))
  }

  // 更新视口
  updateViewport(viewport) {
    this.viewport = viewport
    this.updateVisibleStars()
  }

  // 更新可见星星
  updateVisibleStars() {
    const { x, y, width, height, zoom } = this.viewport
    
    this.stars.forEach(star => {
      const distance = Math.sqrt(
        Math.pow(star.screenX - x, 2) + Math.pow(star.screenY - y, 2)
      )
      
      star.visible = distance < width * zoom
      star.lod = this.calculateLOD(distance, zoom)
    })
  }

  // 计算LOD级别
  calculateLOD(distance, zoom) {
    const adjustedDistance = distance / zoom
    
    if (adjustedDistance < STARFIELD_CONFIG.LOD_LEVELS.HIGH.distance) {
      return 'high'
    } else if (adjustedDistance < STARFIELD_CONFIG.LOD_LEVELS.MEDIUM.distance) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  // 更新星团
  updateClusters() {
    this.clusters = []
    const gridSize = 100
    const grid = new Map()

    // 将星星分配到网格
    this.stars.forEach(star => {
      const gridX = Math.floor(star.screenX / gridSize)
      const gridY = Math.floor(star.screenY / gridSize)
      const key = `${gridX},${gridY}`
      
      if (!grid.has(key)) {
        grid.set(key, [])
      }
      grid.get(key).push(star)
    })

    // 创建星团
    grid.forEach((starsInCell, key) => {
      if (starsInCell.length > STARFIELD_CONFIG.CLUSTER_THRESHOLD) {
        const [gridX, gridY] = key.split(',').map(Number)
        const centerX = (gridX + 0.5) * gridSize
        const centerY = (gridY + 0.5) * gridSize
        
        this.clusters.push({
          x: centerX,
          y: centerY,
          count: starsInCell.length,
          stars: starsInCell,
          radius: Math.min(50, Math.sqrt(starsInCell.length) * 5)
        })
      }
    })
  }

  // 渲染背景星星
  renderBackgroundStars(currentTime) {
    this.ctx.save()
    
    this.backgroundStars.forEach(star => {
      const twinkle = Math.sin(currentTime * star.twinkleSpeed) * 0.3 + 0.7
      this.ctx.globalAlpha = star.opacity * twinkle
      this.ctx.fillStyle = '#ffffff'
      this.ctx.beginPath()
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      this.ctx.fill()
    })
    
    this.ctx.restore()
  }

  // 渲染星星
  renderStar(star, currentTime) {
    if (!star.visible) return

    const { screenX, screenY, size, brightness, lod } = star
    
    this.ctx.save()
    
    // 根据LOD级别渲染
    switch (lod) {
      case 'high':
        this.renderDetailedStar(screenX, screenY, size, brightness, currentTime)
        break
      case 'medium':
        this.renderSimpleStar(screenX, screenY, size, brightness)
        break
      case 'low':
        this.renderDotStar(screenX, screenY, brightness)
        break
    }
    
    this.ctx.restore()
  }

  // 渲染详细星星
  renderDetailedStar(x, y, size, brightness, currentTime) {
    const colors = {
      bright: '#fbbf24',
      medium: '#60a5fa',
      dim: '#e5e7eb'
    }
    
    const color = colors[brightness] || colors.dim
    const pulse = Math.sin(currentTime * 0.003) * 0.2 + 0.8
    
    // 光环
    if (brightness === 'bright') {
      const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size * 2)
      gradient.addColorStop(0, `${color}40`)
      gradient.addColorStop(1, `${color}00`)
      this.ctx.fillStyle = gradient
      this.ctx.beginPath()
      this.ctx.arc(x, y, size * 2, 0, Math.PI * 2)
      this.ctx.fill()
    }
    
    // 星星核心
    this.ctx.fillStyle = color
    this.ctx.globalAlpha = pulse
    this.ctx.beginPath()
    this.ctx.arc(x, y, size, 0, Math.PI * 2)
    this.ctx.fill()
    
    // 十字光芒
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = 1
    this.ctx.globalAlpha = pulse * 0.6
    this.ctx.beginPath()
    this.ctx.moveTo(x - size * 1.5, y)
    this.ctx.lineTo(x + size * 1.5, y)
    this.ctx.moveTo(x, y - size * 1.5)
    this.ctx.lineTo(x, y + size * 1.5)
    this.ctx.stroke()
  }

  // 渲染简单星星
  renderSimpleStar(x, y, size, brightness) {
    const colors = {
      bright: '#fbbf24',
      medium: '#60a5fa',
      dim: '#e5e7eb'
    }
    
    this.ctx.fillStyle = colors[brightness] || colors.dim
    this.ctx.beginPath()
    this.ctx.arc(x, y, size * 0.8, 0, Math.PI * 2)
    this.ctx.fill()
  }

  // 渲染点状星星
  renderDotStar(x, y, brightness) {
    const colors = {
      bright: '#fbbf24',
      medium: '#60a5fa',
      dim: '#e5e7eb'
    }
    
    this.ctx.fillStyle = colors[brightness] || colors.dim
    this.ctx.beginPath()
    this.ctx.arc(x, y, 2, 0, Math.PI * 2)
    this.ctx.fill()
  }

  // 渲染星团
  renderCluster(cluster) {
    const { x, y, count, radius } = cluster
    
    this.ctx.save()
    
    // 星团背景
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, 'rgba(96, 165, 250, 0.3)')
    gradient.addColorStop(1, 'rgba(96, 165, 250, 0)')
    this.ctx.fillStyle = gradient
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, Math.PI * 2)
    this.ctx.fill()
    
    // 星团标签
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = '12px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(count.toString(), x, y + 4)
    
    this.ctx.restore()
  }

  // 主渲染循环
  render(currentTime = 0) {
    if (!this.isAnimating) return
    
    // 控制帧率
    if (currentTime - this.lastFrameTime < 1000 / STARFIELD_CONFIG.ANIMATION_FPS) {
      this.animationFrame = requestAnimationFrame((time) => this.render(time))
      return
    }
    
    this.lastFrameTime = currentTime
    
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 渲染背景星星
    this.renderBackgroundStars(currentTime)
    
    // 渲染星团
    this.clusters.forEach(cluster => this.renderCluster(cluster))
    
    // 渲染可见星星
    const visibleStars = this.stars.filter(star => star.visible)
      .slice(0, STARFIELD_CONFIG.MAX_VISIBLE_STARS)
    
    visibleStars.forEach(star => this.renderStar(star, currentTime))
    
    this.animationFrame = requestAnimationFrame((time) => this.render(time))
  }

  // 开始动画
  startAnimation() {
    this.isAnimating = true
    this.render()
  }

  // 停止动画
  stopAnimation() {
    this.isAnimating = false
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }
  }

  // 调整画布大小
  resize(width, height) {
    this.canvas.width = width
    this.canvas.height = height
    this.initBackgroundStars()
    this.updateStars(this.stars)
  }

  // 获取点击的星星
  getStarAtPosition(x, y) {
    return this.stars.find(star => {
      if (!star.visible) return false
      
      const distance = Math.sqrt(
        Math.pow(star.screenX - x, 2) + Math.pow(star.screenY - y, 2)
      )
      
      return distance <= star.size + 5 // 增加点击容差
    })
  }
}

const OptimizedStarfield = () => {
  const { state } = useData()
  const canvasRef = useRef(null)
  const rendererRef = useRef(null)
  const [selectedStar, setSelectedStar] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const stars = useMemo(() => Object.values(state.stars), [state.stars])

  // 初始化渲染器
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const renderer = new StarfieldRenderer(canvas)
    rendererRef.current = renderer

    // 调整画布大小
    const resizeCanvas = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      renderer.resize(rect.width, rect.height)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // 开始渲染
    renderer.startAnimation()
    setIsLoading(false)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      renderer.stopAnimation()
    }
  }, [])

  // 更新星星数据
  useEffect(() => {
    if (rendererRef.current && stars.length > 0) {
      rendererRef.current.updateStars(stars)
    }
  }, [stars])

  // 处理画布点击
  const handleCanvasClick = useCallback((event) => {
    if (!rendererRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const clickedStar = rendererRef.current.getStarAtPosition(x, y)
    if (clickedStar) {
      setSelectedStar(clickedStar)
    }
  }, [])

  return (
    <div className="optimized-starfield">
      {isLoading && (
        <div className="starfield-loading">
          <div className="loading-spinner"></div>
          <p>正在初始化星空...</p>
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        className="starfield-canvas"
        onClick={handleCanvasClick}
      />

      <div className="starfield-info">
        <span>共 {stars.length} 颗星星</span>
        <span>Canvas 渲染</span>
      </div>

      <AnimatePresence>
        {selectedStar && (
          <StarDetailModal
            star={selectedStar}
            onClose={() => setSelectedStar(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default OptimizedStarfield
