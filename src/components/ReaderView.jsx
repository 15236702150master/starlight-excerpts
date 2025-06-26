import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Star, Bookmark, Volume2 } from 'lucide-react'
import { marked } from 'marked'
import { useData } from '../contexts/DataContext'
import { generateId, getRandomPosition } from '../utils/helpers'
import ExcerptModal from './ExcerptModal'
import AISummaryPanel from './AISummaryPanel'
import './ReaderView.css'

const ReaderView = () => {
  const { articleId } = useParams()
  const navigate = useNavigate()
  const { state, addStar, updateStar } = useData()
  const [selectedText, setSelectedText] = useState('')
  const [selectionRange, setSelectionRange] = useState(null)
  const [showExcerptModal, setShowExcerptModal] = useState(false)
  const [highlights, setHighlights] = useState([])
  const contentRef = useRef(null)

  const article = state.articles[articleId]

  useEffect(() => {
    if (!article) {
      navigate('/library')
      return
    }

    // Load existing highlights for this article
    const articleStars = Object.values(state.stars).filter(star => star.articleId === articleId)
    setHighlights(articleStars)

    // 简化跳转逻辑 - 移除复杂的 URL 参数处理
    // 跳转功能现在由 StarfieldView 直接处理
  }, [article, articleId, navigate, state.stars])

  // 渲染已有高亮的内容 - 学习 starry-sky-project 的方式
  useEffect(() => {
    if (contentRef.current && highlights.length > 0 && article) {
      setTimeout(() => {
        reapplyAllHighlights()
      }, 300)
    }
  }, [highlights, article])

  // 重新应用所有高亮 - 学习 starry-sky-project 的 reapplyHighlight 方法
  const reapplyAllHighlights = () => {
    if (!contentRef.current) return

    console.log('重新应用高亮，共', highlights.length, '个星星')

    highlights.forEach(star => {
      reapplyHighlight(star)
    })
  }

  // 重新应用高亮 - 学习 starry-sky-project 的逻辑
  const reapplyHighlight = (star) => {
    // 处理旧版数据结构（单个highlightId）
    if (star.highlightId && !star.highlightIds) {
      const walker = document.createTreeWalker(contentRef.current, NodeFilter.SHOW_TEXT)
      let node
      while (node = walker.nextNode()) {
        const index = node.nodeValue.indexOf(star.content)
        if (index !== -1) {
          const range = document.createRange()
          range.setStart(node, index)
          range.setEnd(node, index + star.content.length)
          const span = document.createElement('span')
          span.id = star.highlightId
          span.className = 'highlighted-text'
          span.setAttribute('data-star-id', star.id)
          span.onclick = () => handleHighlightClick(star.id)
          try {
            range.surroundContents(span)
            return true
          } catch (e) {
            console.warn("重新应用高亮失败:", star.content, e)
          }
        }
      }
      return false
    }

    // 处理新版数据结构（多个高亮）
    if (star.highlightIds && star.highlightIds.length > 0) {
      const contentParts = star.content.split(/\s+/)
      let appliedCount = 0

      contentParts.forEach((part, index) => {
        if (!part.trim()) return

        const walker = document.createTreeWalker(contentRef.current, NodeFilter.SHOW_TEXT)
        let node
        while (node = walker.nextNode()) {
          const nodeText = node.nodeValue
          const partIndex = nodeText.indexOf(part)

          if (partIndex !== -1) {
            const range = document.createRange()
            range.setStart(node, partIndex)
            range.setEnd(node, partIndex + part.length)

            const highlightId = star.highlightIds[index] || `highlight-restored-${Date.now()}-${index}`
            const span = document.createElement('span')
            span.id = highlightId
            span.className = 'highlighted-text'
            span.dataset.groupId = star.highlightGroupId
            span.setAttribute('data-star-id', star.id)
            span.onclick = () => handleHighlightClick(star.id)

            try {
              range.surroundContents(span)
              appliedCount++
              break
            } catch (e) {
              console.warn(`重新应用高亮部分 ${index + 1}/${contentParts.length} 失败:`, e)
            }
          }
        }
      })

      console.log(`重新应用高亮完成: ${appliedCount}/${contentParts.length} 部分成功`)
      return appliedCount > 0
    }

    return false
  }

  // 处理高亮点击事件
  const handleHighlightClick = (starId) => {
    navigate(`/starfield?highlight=${starId}`)
  }

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection()
      if (selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0)
        const selectedText = selection.toString().trim()
        
        if (selectedText && contentRef.current?.contains(range.commonAncestorContainer)) {
          setSelectedText(selectedText)
          setSelectionRange(range.cloneRange())
          setShowExcerptModal(true)
        }
      }
    }

    document.addEventListener('mouseup', handleSelection)
    return () => document.removeEventListener('mouseup', handleSelection)
  }, [])

  // 简化的跳转逻辑 - 移除复杂的 URL 参数处理
  // 跳转现在由 StarfieldView 直接处理

  // 移除复杂的 jumpToTarget 函数
  // 跳转功能现在由 StarfieldView 直接处理，更简单直接



  const handleSaveExcerpt = (thoughts, tags, audioBlob) => {
    if (!selectedText || !selectionRange) return

    // 生成唯一的星星ID和高亮组ID - 学习 starry-sky-project
    const starId = `star-${Date.now()}`
    const highlightGroupId = `highlight-group-${Date.now()}`

    // 创建新星星对象 - 学习 starry-sky-project 的数据结构
    const newStar = {
      id: starId,
      createdAt: new Date().toISOString(),
      articleId: articleId,
      highlightGroupId: highlightGroupId,
      highlightIds: [], // 存储所有相关的高亮ID
      content: selectedText,
      thoughts: thoughts ? [{ date: new Date().toISOString(), text: thoughts }] : [],
      tags: tags || [],
      position: getRandomPosition(),
      audioBlob: audioBlob || null
    }

    // 处理跨段落选择 - 学习 starry-sky-project 的 applyHighlightToSelection
    try {
      applyHighlightToSelection(newStar)
      addStar(newStar)
      setHighlights(prev => [...prev, newStar])
    } catch (e) {
      console.error("创建高亮失败:", e)
      alert("无法创建高亮，请尝试重新选择文本。")
    }

    setSelectedText('')
    setSelectionRange(null)
    setShowExcerptModal(false)
    window.getSelection().removeAllRanges()
  }

  // 为选区应用高亮，支持跨段落 - 学习 starry-sky-project
  const applyHighlightToSelection = (star) => {
    if (!selectionRange) return false

    const range = selectionRange
    const selection = window.getSelection()

    // 获取范围中的所有文本节点
    const nodes = getTextNodesInRange(range)

    if (nodes.length === 0) {
      throw new Error("没有找到可高亮的文本节点")
    }

    // 为每个文本节点创建高亮
    nodes.forEach((nodeInfo, index) => {
      const { node, startOffset, endOffset } = nodeInfo
      const highlightId = `highlight-${Date.now()}-${index}`

      const nodeRange = document.createRange()
      nodeRange.setStart(node, startOffset)
      nodeRange.setEnd(node, endOffset)

      const span = document.createElement('span')
      span.id = highlightId
      span.className = 'highlighted-text'
      span.dataset.groupId = star.highlightGroupId
      span.setAttribute('data-star-id', star.id)
      span.onclick = () => handleHighlightClick(star.id)

      try {
        nodeRange.surroundContents(span)
        star.highlightIds.push(highlightId)
      } catch (e) {
        console.warn(`应用高亮失败 ${index + 1}/${nodes.length}:`, e)
      }
    })

    return star.highlightIds.length > 0
  }

  // 获取范围中的所有文本节点 - 学习 starry-sky-project
  const getTextNodesInRange = (range) => {
    const nodes = []
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (range.intersectsNode(node)) {
            return NodeFilter.FILTER_ACCEPT
          }
          return NodeFilter.FILTER_REJECT
        }
      }
    )

    let node
    while (node = walker.nextNode()) {
      const nodeRange = document.createRange()
      nodeRange.selectNodeContents(node)

      // 计算交集
      const intersectionRange = range.cloneRange()
      if (intersectionRange.compareBoundaryPoints(Range.START_TO_START, nodeRange) < 0) {
        intersectionRange.setStart(nodeRange.startContainer, nodeRange.startOffset)
      }
      if (intersectionRange.compareBoundaryPoints(Range.END_TO_END, nodeRange) > 0) {
        intersectionRange.setEnd(nodeRange.endContainer, nodeRange.endOffset)
      }

      if (!intersectionRange.collapsed) {
        const startOffset = intersectionRange.startOffset
        const endOffset = intersectionRange.endOffset

        nodes.push({
          node: node,
          startOffset: startOffset,
          endOffset: endOffset
        })
      }
    }

    return nodes
  }

  if (!article) {
    return (
      <div className="reader-view">
        <div className="reader-header">
          <Link to="/library" className="back-button">
            <ArrowLeft />
          </Link>
        </div>
        <div className="article-not-found">
          <h2>文章未找到</h2>
          <p>请返回文库选择其他文章</p>
        </div>
      </div>
    )
  }

  // 处理超链接点击事件
  const handleContentClick = (e) => {
    if (e.target.tagName === 'A') {
      e.preventDefault()
      const href = e.target.getAttribute('href')
      if (href && (href.startsWith('http') || href.startsWith('https'))) {
        window.open(href, '_blank', 'noopener,noreferrer')
      }
    }
  }

  const renderContent = () => {
    // 检查是否需要渲染为Markdown
    const shouldRenderAsMarkdown =
      article.type === 'docx' || // DOCX文件总是渲染为Markdown
      (article.type === 'text' && article.content.includes('#')) || // 包含标题的文本
      article.content.includes('[') && article.content.includes('](') // 包含Markdown链接的内容

    if (shouldRenderAsMarkdown) {
      // Render as Markdown
      return (
        <div
          className="article-content markdown-content"
          dangerouslySetInnerHTML={{ __html: marked(article.content) }}
          onClick={handleContentClick}
        />
      )
    } else {
      // Render as plain text with paragraph breaks, but also handle URLs
      const renderParagraphWithLinks = (text) => {
        // 更可靠的URL检测和转换
        const urlRegex = /(https?:\/\/[^\s]+)/g
        const parts = text.split(urlRegex)

        return parts.map((part, index) => {
          if (urlRegex.test(part)) {
            return (
              <a
                key={index}
                href={part}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.open(part, '_blank', 'noopener,noreferrer')
                }}
                className="content-link"
                style={{
                  display: 'inline',
                  userSelect: 'text',
                  WebkitUserSelect: 'text',
                  MozUserSelect: 'text',
                  msUserSelect: 'text'
                }}
              >
                {part}
              </a>
            )
          }
          return part
        })
      }

      return (
        <div
          className="article-content"
          onLoad={() => {
            // 内容加载完成后应用高亮
            setTimeout(() => {
              if (highlights.length > 0) {
                highlightExistingStars()
              }
            }, 100)
          }}
        >
          {article.content.split('\n').map((paragraph, index) => (
            paragraph.trim() ? (
              <p key={index}>{renderParagraphWithLinks(paragraph)}</p>
            ) : (
              <br key={index} />
            )
          ))}
        </div>
      )
    }
  }

  if (!article) {
    return (
      <div className="reader-view">
        <div className="reader-header">
          <Link to="/library" className="back-button">
            <ArrowLeft />
          </Link>
          <h1>文章未找到</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="reader-view">
      <div className="reader-header">
        <div className="header-left">
          <Link to="/library" className="back-button">
            <ArrowLeft />
          </Link>
          <div className="article-info">
            <h1 className="article-title">{article.title}</h1>
            <div className="article-meta">
              <span className="star-count">
                <Star className="meta-icon" />
                {highlights.length} 颗星星
              </span>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <Link to="/starfield" className="action-button">
            <Bookmark />
            查看星空
          </Link>
        </div>
      </div>

      {/* AI总结面板 */}
      <AISummaryPanel
        article={article}
        onSummaryGenerated={(summaryData) => {
          console.log('AI总结已生成:', summaryData)
          // 可以在这里保存总结到localStorage或其他处理
        }}
      />

      <div className="reader-content" ref={contentRef}>
        {renderContent()}
      </div>

      {/* 移除跳转指示器 - 现在使用直接跳转方式 */}

      <AnimatePresence>
        {showExcerptModal && (
          <ExcerptModal
            selectedText={selectedText}
            onSave={handleSaveExcerpt}
            onClose={() => {
              setShowExcerptModal(false)
              setSelectedText('')
              setSelectionRange(null)
              window.getSelection().removeAllRanges()
            }}
          />
        )}
      </AnimatePresence>

      <style jsx>{`
        /* 高亮样式 - 学习 starry-sky-project */
        .highlighted-text {
          background-color: rgba(250, 204, 21, 0.3);
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .highlighted-text:hover {
          background-color: rgba(250, 204, 21, 0.6);
        }

        /* 闪烁动画 - 完全学习 starry-sky-project */
        .highlighted-text--flash {
          animation: flash-bg 1.5s ease-out;
        }

        @keyframes flash-bg {
          50% {
            background-color: rgba(250, 204, 21, 0.8);
          }
        }

        /* 兼容旧版高亮样式 */
        .highlight {
          background: linear-gradient(120deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 215, 0, 0.1) 100%);
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .highlight:hover {
          background: linear-gradient(120deg, rgba(255, 215, 0, 0.5) 0%, rgba(255, 215, 0, 0.2) 100%);
          box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
        }

        .highlight.flash {
          animation: flash 1s ease-in-out;
        }

        @keyframes flash {
          0%, 100% { background: linear-gradient(120deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 215, 0, 0.1) 100%); }
          50% { background: linear-gradient(120deg, rgba(255, 215, 0, 0.8) 0%, rgba(255, 215, 0, 0.4) 100%); }
        }
      `}</style>
    </div>
  )
}

export default ReaderView
