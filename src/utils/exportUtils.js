import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import jsPDF from 'jspdf'
import { saveAs } from 'file-saver'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// 格式化日期
const formatDate = (dateString) => {
  try {
    return format(parseISO(dateString), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
  } catch {
    return dateString
  }
}

// 按标签筛选星星
export const filterStarsByTags = (stars, selectedTags) => {
  if (!selectedTags || selectedTags.length === 0) {
    return Object.values(stars)
  }
  
  return Object.values(stars).filter(star => 
    star.tags && star.tags.some(tag => selectedTags.includes(tag))
  )
}

// 按时间范围筛选星星
export const filterStarsByDateRange = (stars, startDate, endDate) => {
  if (!startDate && !endDate) {
    return Object.values(stars)
  }
  
  return Object.values(stars).filter(star => {
    const starDate = new Date(star.createdAt)
    const start = startDate ? new Date(startDate) : new Date('1970-01-01')
    const end = endDate ? new Date(endDate) : new Date()
    
    return starDate >= start && starDate <= end
  })
}

// 格式化星星数据用于导出
export const formatStarData = (stars, articles, options = {}) => {
  const { includeThoughts = true, includeTags = true, sortOrder = 'desc' } = options
  
  // 按时间排序
  const sortedStars = [...stars].sort((a, b) => {
    const dateA = new Date(a.createdAt)
    const dateB = new Date(b.createdAt)
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
  })
  
  return sortedStars.map(star => {
    const article = articles[star.articleId]
    
    return {
      content: star.content,
      articleTitle: article?.title || '未知文章',
      createdAt: formatDate(star.createdAt),
      tags: includeTags ? (star.tags || []) : [],
      thoughts: includeThoughts ? (star.thoughts || []) : []
    }
  })
}

// 生成导出标题
const generateExportTitle = (filterType, filterValue, totalCount) => {
  let title = '星光摘录集'
  
  if (filterType === 'tags' && filterValue.length > 0) {
    title += ` - 标签：${filterValue.join('、')}`
  } else if (filterType === 'dateRange') {
    title += ` - 时间范围：${filterValue.start} 至 ${filterValue.end}`
  } else {
    title += ' - 全部摘录'
  }
  
  title += ` (${totalCount} 条)`
  return title
}

// 导出为 TXT
export const exportToTXT = (data, options = {}) => {
  const {
    filterType = 'all',
    filterValue = null,
    filename = '星光摘录集.txt'
  } = options

  const title = generateExportTitle(filterType, filterValue, data.length)
  const exportTime = format(new Date(), 'yyyy年MM月dd日 HH:mm:ss', { locale: zhCN })

  let content = ''

  // 添加标题和基本信息
  content += `${title}\n`
  content += `${'='.repeat(title.length)}\n\n`
  content += `导出时间：${exportTime}\n`
  content += `总计：${data.length} 条摘录\n\n`
  content += `${'='.repeat(50)}\n\n`

  // 添加每个摘录
  data.forEach((star, index) => {
    content += `摘录 ${index + 1}\n`
    content += `${'-'.repeat(20)}\n\n`

    // 内容
    content += `内容：\n"${star.content}"\n\n`

    // 来源
    content += `来源：${star.articleTitle}\n`

    // 时间
    content += `时间：${star.createdAt}\n`

    // 标签
    if (star.tags.length > 0) {
      content += `标签：${star.tags.map(tag => `#${tag}`).join(' ')}\n`
    }

    // 想法记录
    if (star.thoughts.length > 0) {
      content += `\n想法记录：\n`
      star.thoughts.forEach(thought => {
        content += `  • [${formatDate(thought.date)}] ${thought.text}\n`
      })
    }

    content += `\n${'='.repeat(50)}\n\n`
  })

  // 添加结尾信息
  content += `\n导出完成 - 星光摘录集\n`
  content += `共 ${data.length} 条摘录\n`
  content += `导出时间：${exportTime}\n`

  // 创建并下载文件
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  saveAs(blob, filename)
}

// 导出为 Markdown
export const exportToMarkdown = (data, options = {}) => {
  const { 
    filterType = 'all', 
    filterValue = null, 
    filename = '星光摘录集.md' 
  } = options
  
  const title = generateExportTitle(filterType, filterValue, data.length)
  const exportTime = format(new Date(), 'yyyy年MM月dd日 HH:mm:ss', { locale: zhCN })
  
  let markdown = `# ${title}\n\n`
  markdown += `> 导出时间：${exportTime}\n`
  markdown += `> 总计：${data.length} 条摘录\n\n`
  
  data.forEach((star, index) => {
    markdown += `## 摘录 ${index + 1}\n\n`
    markdown += `**内容：** "${star.content}"\n\n`
    markdown += `**来源：** ${star.articleTitle}\n\n`
    markdown += `**时间：** ${star.createdAt}\n\n`
    
    if (star.tags.length > 0) {
      markdown += `**标签：** ${star.tags.map(tag => `#${tag}`).join(' ')}\n\n`
    }
    
    if (star.thoughts.length > 0) {
      markdown += `**想法记录：**\n`
      star.thoughts.forEach(thought => {
        markdown += `- [${formatDate(thought.date)}] ${thought.text}\n`
      })
      markdown += '\n'
    }
    
    markdown += '---\n\n'
  })
  
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  saveAs(blob, filename)
}

// 导出为 Word - 简化版本
export const exportToWord = async (data, options = {}) => {
  try {
    console.log('Word导出开始，数据:', data.length, '条')

    const {
      filterType = 'all',
      filterValue = null,
      filename = '星光摘录集.docx'
    } = options

    const title = generateExportTitle(filterType, filterValue, data.length)
    const exportTime = format(new Date(), 'yyyy年MM月dd日 HH:mm:ss', { locale: zhCN })

    console.log('Word导出标题:', title)

    // 简化的Word文档创建
    const children = []
  
    // 添加标题
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 32,
          }),
        ],
        alignment: AlignmentType.CENTER,
      })
    )

    // 添加导出信息
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `导出时间：${exportTime}`,
            italics: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
      })
    )

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `总计：${data.length} 条摘录`,
            italics: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
      })
    )

    // 空行
    children.push(new Paragraph({ text: '' }))
  
    // 添加每个摘录
    data.forEach((star, index) => {
      // 摘录标题
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `摘录 ${index + 1}`,
              bold: true,
              size: 24,
            }),
          ],
        })
      )

      // 内容
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '内容：',
              bold: true,
            }),
            new TextRun({
              text: `"${star.content}"`,
            }),
          ],
        })
      )

      // 来源
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '来源：',
              bold: true,
            }),
            new TextRun({
              text: star.articleTitle,
              italics: true,
            }),
          ],
        })
      )

      // 时间
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '时间：',
              bold: true,
            }),
            new TextRun({
              text: star.createdAt,
            }),
          ],
        })
      )

      // 标签
      if (star.tags.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '标签：',
                bold: true,
              }),
              new TextRun({
                text: star.tags.map(tag => `#${tag}`).join(' '),
              }),
            ],
          })
        )
      }

      // 想法记录
      if (star.thoughts.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '想法记录：',
                bold: true,
              }),
            ],
          })
        )

        star.thoughts.forEach(thought => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• [${formatDate(thought.date)}] ${thought.text}`,
                }),
              ],
            })
          )
        })
      }

      // 空行分隔
      children.push(new Paragraph({ text: '' }))
    })
  
    console.log('创建Word文档，内容块数量:', children.length)

    // 创建简化的文档
    const doc = new Document({
      sections: [{
        children: children,
      }],
    })

    console.log('开始生成Word缓冲区...')
    const buffer = await Packer.toBuffer(doc)
    console.log('Word缓冲区生成完成，大小:', buffer.byteLength, 'bytes')

    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    })

    console.log('开始下载Word文件:', filename)
    saveAs(blob, filename)
    console.log('Word文件下载完成')

  } catch (error) {
    console.error('Word导出详细错误:', error)
    console.error('错误堆栈:', error.stack)
    throw new Error(`Word导出失败: ${error.message}`)
  }
}

// 导出为 PDF - 重新设计的方案
export const exportToPDF = (data, options = {}) => {
  const {
    filterType = 'all',
    filterValue = null,
    filename = '星光摘录集.pdf'
  } = options

  // 由于PDF中文支持复杂，我们提供一个更好的解决方案
  // 创建一个HTML内容，然后提示用户使用浏览器的打印功能

  const title = generateExportTitle(filterType, filterValue, data.length)
  const exportTime = format(new Date(), 'yyyy年MM月dd日 HH:mm:ss', { locale: zhCN })

  // 创建HTML内容
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Microsoft YaHei', 'SimSun', sans-serif;
          line-height: 1.6;
          margin: 40px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #4ecdc4;
          padding-bottom: 20px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        .meta {
          color: #7f8c8d;
          font-size: 14px;
        }
        .excerpt {
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #ecf0f1;
          border-radius: 8px;
          background: #fafafa;
        }
        .excerpt-title {
          font-size: 18px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 15px;
          border-bottom: 1px solid #bdc3c7;
          padding-bottom: 5px;
        }
        .content {
          font-size: 16px;
          margin-bottom: 10px;
          background: white;
          padding: 15px;
          border-radius: 5px;
          border-left: 4px solid #4ecdc4;
        }
        .meta-info {
          font-size: 14px;
          color: #7f8c8d;
          margin-bottom: 5px;
        }
        .tags {
          margin-top: 10px;
        }
        .tag {
          background: #4ecdc4;
          color: white;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 12px;
          margin-right: 5px;
        }
        .thoughts {
          margin-top: 15px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 5px;
        }
        .thought {
          margin-bottom: 8px;
          padding-left: 15px;
          border-left: 2px solid #95a5a6;
        }
        @media print {
          body { margin: 20px; }
          .excerpt { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${title}</div>
        <div class="meta">导出时间：${exportTime}</div>
        <div class="meta">总计：${data.length} 条摘录</div>
      </div>
  `

  // 添加每个摘录
  data.forEach((star, index) => {
    htmlContent += `
      <div class="excerpt">
        <div class="excerpt-title">摘录 ${index + 1}</div>
        <div class="content">"${star.content}"</div>
        <div class="meta-info"><strong>来源：</strong>${star.articleTitle}</div>
        <div class="meta-info"><strong>时间：</strong>${star.createdAt}</div>
    `

    if (star.tags.length > 0) {
      htmlContent += `
        <div class="tags">
          <strong>标签：</strong>
          ${star.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
        </div>
      `
    }

    if (star.thoughts.length > 0) {
      htmlContent += `
        <div class="thoughts">
          <strong>想法记录：</strong>
          ${star.thoughts.map(thought =>
            `<div class="thought">• [${formatDate(thought.date)}] ${thought.text}</div>`
          ).join('')}
        </div>
      `
    }

    htmlContent += `</div>`
  })

  htmlContent += `
      <div style="text-align: center; margin-top: 40px; color: #95a5a6; font-size: 12px;">
        <p>提示：请使用浏览器的"打印"功能，选择"保存为PDF"来生成PDF文件</p>
        <p>这样可以确保中文字符正确显示</p>
      </div>
    </body>
    </html>
  `

  // 在新窗口中打开HTML内容
  const newWindow = window.open('', '_blank')
  newWindow.document.write(htmlContent)
  newWindow.document.close()

  // 提示用户如何保存为PDF
  setTimeout(() => {
    alert('PDF预览已在新窗口打开！\n\n请按以下步骤保存为PDF：\n1. 在新窗口中按 Ctrl+P (或 Cmd+P)\n2. 选择"保存为PDF"\n3. 点击"保存"\n\n这样可以确保中文字符正确显示。')
  }, 500)
}

