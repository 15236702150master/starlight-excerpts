import React, { useState } from 'react'
import { marked } from 'marked'
import './ReaderView.css'

// HTML到Markdown转换函数（从fileProcessors.js复制）
const htmlToMarkdown = (html) => {
  let markdown = html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, '$1\n')
    .replace(/<ol[^>]*>(.*?)<\/ol>/gis, '$1\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<pre[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return markdown
}

const LinkTestDemo = () => {
  const [step, setStep] = useState(1)
  
  // 模拟Word文档转换后的HTML
  const sampleHtml = `
<h1>Word文档示例</h1>
<p>这是一个来自Word文档的段落，包含一个<a href="https://www.google.com">Google链接</a>。</p>
<h2>多链接测试</h2>
<p>这里有多个链接：<a href="https://github.com">GitHub</a>和<a href="https://stackoverflow.com">Stack Overflow</a>。</p>
<p>这段文字中嵌入了一个<a href="https://www.important-site.com">重要链接</a>，它不会干扰文本选择。</p>
<ul>
<li>列表项包含<a href="https://example.com">示例链接</a></li>
<li>普通列表项</li>
</ul>
  `.trim()

  // 转换为Markdown
  const markdown = htmlToMarkdown(sampleHtml)
  
  // 转换为最终HTML
  const finalHtml = marked(markdown)

  const handleContentClick = (e) => {
    if (e.target.tagName === 'A') {
      e.preventDefault()
      const href = e.target.getAttribute('href')
      if (href && (href.startsWith('http') || href.startsWith('https'))) {
        window.open(href, '_blank', 'noopener,noreferrer')
      }
    }
  }

  return (
    <div className="reader-view">
      <div className="reader-header">
        <h1 style={{ color: 'white', margin: 0 }}>链接处理流程演示</h1>
      </div>
      
      <div className="reader-content">
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            {[1, 2, 3, 4].map(num => (
              <button
                key={num}
                onClick={() => setStep(num)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: step === num ? '#4ecdc4' : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                步骤 {num}
              </button>
            ))}
          </div>
        </div>

        {step === 1 && (
          <div>
            <h2 style={{ color: '#4ecdc4' }}>步骤1: Word文档转HTML (mammoth.js)</h2>
            <p style={{ color: '#b8b8d4', marginBottom: '1rem' }}>
              mammoth.js将Word文档中的超链接转换为HTML格式：
            </p>
            <pre style={{ 
              background: 'rgba(255,255,255,0.05)', 
              padding: '1rem', 
              borderRadius: '8px',
              color: '#ffd700',
              fontSize: '0.9rem',
              overflow: 'auto'
            }}>
              {sampleHtml}
            </pre>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ color: '#4ecdc4' }}>步骤2: HTML转Markdown (htmlToMarkdown)</h2>
            <p style={{ color: '#b8b8d4', marginBottom: '1rem' }}>
              我们的htmlToMarkdown函数将HTML链接转换为Markdown格式：
            </p>
            <pre style={{ 
              background: 'rgba(255,255,255,0.05)', 
              padding: '1rem', 
              borderRadius: '8px',
              color: '#ffd700',
              fontSize: '0.9rem',
              overflow: 'auto'
            }}>
              {markdown}
            </pre>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ color: '#4ecdc4' }}>步骤3: Markdown转HTML (marked.js)</h2>
            <p style={{ color: '#b8b8d4', marginBottom: '1rem' }}>
              marked.js将Markdown转换为最终的HTML：
            </p>
            <pre style={{ 
              background: 'rgba(255,255,255,0.05)', 
              padding: '1rem', 
              borderRadius: '8px',
              color: '#ffd700',
              fontSize: '0.9rem',
              overflow: 'auto'
            }}>
              {finalHtml}
            </pre>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={{ color: '#4ecdc4' }}>步骤4: 最终渲染效果</h2>
            <p style={{ color: '#b8b8d4', marginBottom: '1rem' }}>
              这是用户看到的最终效果，链接可以点击并在新窗口打开：
            </p>
            <div 
              className="article-content markdown-content"
              dangerouslySetInnerHTML={{ __html: finalHtml }}
              onClick={handleContentClick}
              style={{
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '1.5rem',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.02)'
              }}
            />
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(78, 205, 196, 0.1)', borderRadius: '8px' }}>
              <h3 style={{ color: '#4ecdc4', margin: '0 0 0.5rem 0' }}>测试说明：</h3>
              <ul style={{ color: '#b8b8d4', margin: 0 }}>
                <li>点击任何链接都会在新窗口中打开</li>
                <li>可以选择包含链接的文本（不会被链接干扰）</li>
                <li>链接样式美观且易于识别</li>
                <li>支持中文和英文链接文本</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LinkTestDemo
