import mammoth from 'mammoth'
import * as pdfjsLib from 'pdfjs-dist'

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

// Process text file
export const processTextFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      resolve({
        title: file.name.replace(/\.[^/.]+$/, ''),
        content: e.target.result,
        type: 'text'
      })
    }
    
    reader.onerror = () => {
      reject(new Error('Error reading text file'))
    }
    
    reader.readAsText(file)
  })
}

// HTML to Markdown converter with link preservation
const htmlToMarkdown = (html) => {
  // 简单的HTML到Markdown转换，保留链接信息
  let markdown = html
    // 处理标题
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')

    // 处理段落
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')

    // 处理换行
    .replace(/<br\s*\/?>/gi, '\n')

    // 处理粗体和斜体
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')

    // 处理链接 - 关键部分：将HTML链接转换为Markdown格式
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')

    // 处理列表
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, '$1\n')
    .replace(/<ol[^>]*>(.*?)<\/ol>/gis, '$1\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')

    // 处理代码
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<pre[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```\n')

    // 清理多余的空行
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return markdown
}

// Process DOCX file
export const processDocxFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      // 第一步：使用mammoth.js将Word文档转换为HTML，保留链接
      mammoth.convertToHtml({ arrayBuffer: e.target.result })
        .then(result => {
          const html = result.value

          // 第二步：将HTML转换为Markdown格式，保留链接信息
          const markdown = htmlToMarkdown(html)

          resolve({
            title: file.name.replace(/\.[^/.]+$/, ''),
            content: markdown,
            type: 'docx'
          })
        })
        .catch(error => {
          reject(new Error('Error processing DOCX file: ' + error.message))
        })
    }

    reader.onerror = () => {
      reject(new Error('Error reading DOCX file'))
    }

    reader.readAsArrayBuffer(file)
  })
}

// Process PDF file
export const processPdfFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target.result)
        const pdf = await pdfjsLib.getDocument(typedArray).promise
        
        let fullText = ''
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items.map(item => item.str).join(' ')
          fullText += pageText + '\n\n'
        }
        
        resolve({
          title: file.name.replace(/\.[^/.]+$/, ''),
          content: fullText.trim(),
          type: 'pdf'
        })
      } catch (error) {
        reject(new Error('Error processing PDF file: ' + error.message))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Error reading PDF file'))
    }
    
    reader.readAsArrayBuffer(file)
  })
}

// Main file processor
export const processFile = (file) => {
  const fileType = file.type
  const fileName = file.name.toLowerCase()
  
  if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
    return processTextFile(file)
  } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
    return processDocxFile(file)
  } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return processPdfFile(file)
  } else {
    return Promise.reject(new Error('Unsupported file type'))
  }
}
