// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Format date
export const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Get random position for stars in starfield
export const getRandomPosition = () => {
  return {
    x: Math.random() * 80 + 10, // 10% to 90% of viewport width
    y: Math.random() * 80 + 10, // 10% to 90% of viewport height
  }
}

// Calculate star brightness based on thoughts count
export const getStarBrightness = (thoughtsCount) => {
  if (thoughtsCount === 0) return 'dim'
  if (thoughtsCount <= 2) return 'normal'
  if (thoughtsCount <= 5) return 'bright'
  return 'brilliant'
}

// Get random star from collection
export const getRandomStar = (stars) => {
  const starArray = Object.values(stars)
  if (starArray.length === 0) return null
  return starArray[Math.floor(Math.random() * starArray.length)]
}

// Check if it's a new day for daily light
export const isNewDay = (lastDate) => {
  if (!lastDate) return true
  return new Date().toDateString() !== lastDate
}

// Extract text content from HTML
export const extractTextContent = (html) => {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

// Truncate text to specified length
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text
  return text.substr(0, maxLength) + '...'
}

// Get color for tag
export const getTagColor = (tag) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// Debounce function
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Check if date is anniversary (same month and day)
export const isAnniversary = (date1, date2) => {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}

// Get stars from same article or with same tags
export const getRelatedStars = (currentStar, allStars) => {
  return Object.values(allStars).filter(star => {
    if (star.id === currentStar.id) return false
    
    // Same article
    if (star.articleId === currentStar.articleId) return true
    
    // Shared tags
    const sharedTags = star.tags.filter(tag => currentStar.tags.includes(tag))
    return sharedTags.length > 0
  })
}
