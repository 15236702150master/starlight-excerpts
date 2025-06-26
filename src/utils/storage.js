const STORAGE_KEY = 'starlight-excerpts-data'
const BACKUP_KEY = 'starlight-excerpts-backup'
const VERSION_KEY = 'starlight-excerpts-version'
const CURRENT_VERSION = '1.0.0'

// Data structure validation schema
const DATA_SCHEMA = {
  articles: 'object',
  stars: 'object',
  tags: 'array',
  selectedTags: 'array',
  memoryCapsules: 'object',
  dailyLight: 'object',
  lastDailyLightDate: 'string',
  aiSummaries: 'object',
  version: 'string'
}

// Validate data structure
const validateData = (data) => {
  if (!data || typeof data !== 'object') {
    return false
  }

  for (const [key, expectedType] of Object.entries(DATA_SCHEMA)) {
    if (key === 'version') continue // Version is optional for backward compatibility

    if (!(key in data)) {
      console.warn(`Missing required field: ${key}`)
      return false
    }

    const actualType = Array.isArray(data[key]) ? 'array' : typeof data[key]

    // Special handling for lastDailyLightDate - allow both string and null
    if (key === 'lastDailyLightDate' && (actualType === 'string' || data[key] === null)) {
      continue
    }

    if (actualType !== expectedType) {
      console.warn(`Invalid type for ${key}: expected ${expectedType}, got ${actualType}`)
      return false
    }
  }

  return true
}

// Get storage usage information
export const getStorageInfo = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    const backup = localStorage.getItem(BACKUP_KEY)

    const dataSize = data ? new Blob([data]).size : 0
    const backupSize = backup ? new Blob([backup]).size : 0
    const totalSize = dataSize + backupSize

    // Set unlimited quota for better user experience
    const quota = Number.MAX_SAFE_INTEGER // Unlimited
    const usagePercentage = 0 // Always show 0% when unlimited

    return {
      dataSize,
      backupSize,
      totalSize,
      quota,
      usagePercentage: Math.min(usagePercentage, 100),
      formattedDataSize: formatBytes(dataSize),
      formattedBackupSize: formatBytes(backupSize),
      formattedTotalSize: formatBytes(totalSize),
      formattedQuota: '无限制'
    }
  } catch (error) {
    console.error('Error getting storage info:', error)
    return null
  }
}

// Format bytes to human readable format
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Create default data structure
export const createDefaultData = () => {
  return {
    articles: {},
    stars: {},
    tags: [],
    selectedTags: [],
    memoryCapsules: {},
    dailyLight: null,
    lastDailyLightDate: null,
    aiSummaries: {},
    version: CURRENT_VERSION,
    lastSaved: new Date().toISOString()
  }
}

// Load data from localStorage with validation and migration
export const loadData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    const version = localStorage.getItem(VERSION_KEY)

    if (!data) {
      console.log('No existing data found, creating default data structure')
      return createDefaultData()
    }

    const parsedData = JSON.parse(data)

    // Migrate data if necessary
    const migratedData = migrateData(parsedData, version)

    // Validate data structure
    if (!validateData(migratedData)) {
      console.error('Data validation failed, attempting to restore from backup')
      const backupData = loadBackup()
      if (backupData) {
        return backupData
      } else {
        console.log('No valid backup found, creating default data structure')
        return createDefaultData()
      }
    }

    return migratedData
  } catch (error) {
    console.error('Error loading data from localStorage:', error)
    console.log('Attempting to restore from backup...')
    const backupData = loadBackup()
    if (backupData) {
      return backupData
    } else {
      console.log('No valid backup found, creating default data structure')
      return createDefaultData()
    }
  }
}

// Save data to localStorage with backup
export const saveData = (data) => {
  try {
    // Validate data before saving
    if (!validateData(data)) {
      throw new Error('Data validation failed')
    }

    // Create backup of current data before saving new data
    const currentData = localStorage.getItem(STORAGE_KEY)
    if (currentData) {
      localStorage.setItem(BACKUP_KEY, currentData)
    }

    // Add version and timestamp to data
    const dataWithMeta = {
      ...data,
      version: CURRENT_VERSION,
      lastSaved: new Date().toISOString()
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithMeta))
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION)

    return true
  } catch (error) {
    console.error('Error saving data to localStorage:', error)
    return false
  }
}

// Data migration functions
const migrateData = (data, version) => {
  if (!version || version === CURRENT_VERSION) {
    return data
  }

  console.log(`Migrating data from version ${version} to ${CURRENT_VERSION}`)

  // Migration logic for different versions
  let migratedData = { ...data }

  // Example migration from version 0.9.0 to 1.0.0
  if (version === '0.9.0') {
    // Add new fields with default values
    migratedData.memoryCapsules = migratedData.memoryCapsules || {}
    migratedData.selectedTags = migratedData.selectedTags || []
    migratedData.aiSummaries = migratedData.aiSummaries || {}

    // Migrate old star format if needed
    if (migratedData.stars) {
      Object.values(migratedData.stars).forEach(star => {
        if (!star.position) {
          star.position = {
            x: Math.random() * 80 + 10,
            y: Math.random() * 80 + 10
          }
        }
        if (!star.highlightIds) {
          star.highlightIds = []
        }
      })
    }
  }

  // Add aiSummaries field for any version that doesn't have it
  if (!migratedData.aiSummaries) {
    migratedData.aiSummaries = {}
  }

  // Fix lastDailyLightDate type if it's not a string
  if (migratedData.lastDailyLightDate && typeof migratedData.lastDailyLightDate !== 'string') {
    if (migratedData.lastDailyLightDate instanceof Date) {
      migratedData.lastDailyLightDate = migratedData.lastDailyLightDate.toISOString()
    } else {
      migratedData.lastDailyLightDate = new Date().toISOString()
    }
  }

  // Ensure lastDailyLightDate exists
  if (!migratedData.lastDailyLightDate) {
    migratedData.lastDailyLightDate = null
  }

  migratedData.version = CURRENT_VERSION
  return migratedData
}

// Load backup data
const loadBackup = () => {
  try {
    const backupData = localStorage.getItem(BACKUP_KEY)
    if (!backupData) {
      console.warn('No backup data available')
      return null
    }

    const parsedBackup = JSON.parse(backupData)
    console.log('Successfully restored from backup')
    return parsedBackup
  } catch (error) {
    console.error('Error loading backup data:', error)
    return null
  }
}

// Export data as JSON file with metadata
export const exportData = (data, options = {}) => {
  try {
    const {
      includeMetadata = true,
      filename = null,
      format = 'json'
    } = options

    let exportData = { ...data }

    if (includeMetadata) {
      exportData = {
        ...exportData,
        exportedAt: new Date().toISOString(),
        exportedBy: 'Starlight Excerpts',
        version: CURRENT_VERSION,
        storageInfo: getStorageInfo()
      }
    }

    const timestamp = new Date().toISOString().split('T')[0]
    const defaultFilename = `starlight-excerpts-backup-${timestamp}.${format}`

    if (format === 'json') {
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      downloadFile(dataBlob, filename || defaultFilename)
    } else if (format === 'csv') {
      const csvData = convertToCSV(exportData)
      const dataBlob = new Blob([csvData], { type: 'text/csv' })
      downloadFile(dataBlob, filename || defaultFilename.replace('.json', '.csv'))
    }

    return true
  } catch (error) {
    console.error('Error exporting data:', error)
    return false
  }
}

// Helper function to download file
const downloadFile = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Convert data to CSV format
const convertToCSV = (data) => {
  const csvRows = []

  // Export stars as CSV
  if (data.stars && Object.keys(data.stars).length > 0) {
    csvRows.push('Type,ID,Content,Thoughts,Tags,Created At,Article ID')

    Object.values(data.stars).forEach(star => {
      const row = [
        'Star',
        star.id,
        `"${star.content.replace(/"/g, '""')}"`,
        `"${star.thoughts.join('; ').replace(/"/g, '""')}"`,
        star.tags.join('; '),
        star.createdAt,
        star.articleId
      ]
      csvRows.push(row.join(','))
    })
  }

  // Export articles as CSV
  if (data.articles && Object.keys(data.articles).length > 0) {
    csvRows.push('\nType,ID,Title,Content Preview,Created At,Type')

    Object.values(data.articles).forEach(article => {
      const contentPreview = article.content.substring(0, 100).replace(/"/g, '""')
      const row = [
        'Article',
        article.id,
        `"${article.title.replace(/"/g, '""')}"`,
        `"${contentPreview}..."`,
        article.createdAt,
        article.type
      ]
      csvRows.push(row.join(','))
    })
  }

  return csvRows.join('\n')
}

// Import data from JSON file with validation and merge options
export const importData = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      merge = false,
      validateBeforeImport = true,
      createBackup = true
    } = options

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result)

        // Validate imported data
        if (validateBeforeImport && !validateData(importedData)) {
          reject(new Error('Imported data failed validation'))
          return
        }

        // Create backup before importing if requested
        if (createBackup) {
          const currentData = loadData()
          if (currentData) {
            const backupFilename = `pre-import-backup-${new Date().toISOString()}.json`
            exportData(currentData, { filename: backupFilename })
          }
        }

        let finalData = importedData

        // Merge with existing data if requested
        if (merge) {
          const currentData = loadData()
          if (currentData) {
            finalData = mergeData(currentData, importedData)
          }
        }

        // Migrate imported data if necessary
        const migratedData = migrateData(finalData, importedData.version)

        resolve(migratedData)
      } catch (error) {
        reject(new Error('Invalid JSON file: ' + error.message))
      }
    }

    reader.onerror = () => {
      reject(new Error('Error reading file'))
    }

    reader.readAsText(file)
  })
}

// Merge two data objects intelligently
const mergeData = (currentData, importedData) => {
  const merged = { ...currentData }

  // Merge articles (avoid duplicates by content)
  if (importedData.articles) {
    Object.values(importedData.articles).forEach(article => {
      const existingArticle = Object.values(merged.articles || {}).find(
        existing => existing.title === article.title && existing.content === article.content
      )

      if (!existingArticle) {
        merged.articles = merged.articles || {}
        merged.articles[article.id] = article
      }
    })
  }

  // Merge stars (avoid duplicates by content and article)
  if (importedData.stars) {
    Object.values(importedData.stars).forEach(star => {
      const existingStar = Object.values(merged.stars || {}).find(
        existing => existing.content === star.content && existing.articleId === star.articleId
      )

      if (!existingStar) {
        merged.stars = merged.stars || {}
        merged.stars[star.id] = star
      }
    })
  }

  // Merge tags (avoid duplicates)
  if (importedData.tags) {
    merged.tags = merged.tags || []
    importedData.tags.forEach(tag => {
      if (!merged.tags.includes(tag)) {
        merged.tags.push(tag)
      }
    })
  }

  // Merge memory capsules
  if (importedData.memoryCapsules) {
    merged.memoryCapsules = { ...merged.memoryCapsules, ...importedData.memoryCapsules }
  }

  return merged
}

// Clear all data with confirmation and backup
export const clearData = (options = {}) => {
  try {
    const { createBackup = true, clearBackup = false } = options

    // Create backup before clearing if requested
    if (createBackup) {
      const currentData = loadData()
      if (currentData) {
        const backupFilename = `pre-clear-backup-${new Date().toISOString()}.json`
        exportData(currentData, { filename: backupFilename })
      }
    }

    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(VERSION_KEY)

    if (clearBackup) {
      localStorage.removeItem(BACKUP_KEY)
    }

    return true
  } catch (error) {
    console.error('Error clearing data:', error)
    return false
  }
}

// Restore from backup
export const restoreFromBackup = () => {
  try {
    const backupData = loadBackup()
    if (!backupData) {
      throw new Error('No backup data available')
    }

    // Save current data as emergency backup
    const currentData = loadData()
    if (currentData) {
      const emergencyBackup = JSON.stringify(currentData)
      localStorage.setItem('starlight-excerpts-emergency', emergencyBackup)
    }

    // Restore from backup
    const success = saveData(backupData)
    if (success) {
      console.log('Successfully restored from backup')
      return true
    } else {
      throw new Error('Failed to save restored data')
    }
  } catch (error) {
    console.error('Error restoring from backup:', error)
    return false
  }
}

// Data cleanup and optimization
export const optimizeData = () => {
  try {
    const data = loadData()
    if (!data) return false

    let optimized = false

    // Remove orphaned stars (stars without corresponding articles)
    if (data.stars && data.articles) {
      const articleIds = Object.keys(data.articles)
      const orphanedStars = Object.keys(data.stars).filter(
        starId => !articleIds.includes(data.stars[starId].articleId)
      )

      if (orphanedStars.length > 0) {
        orphanedStars.forEach(starId => delete data.stars[starId])
        optimized = true
        console.log(`Removed ${orphanedStars.length} orphaned stars`)
      }
    }

    // Remove unused tags
    if (data.tags && data.stars) {
      const usedTags = new Set()
      Object.values(data.stars).forEach(star => {
        star.tags.forEach(tag => usedTags.add(tag))
      })

      const unusedTags = data.tags.filter(tag => !usedTags.has(tag))
      if (unusedTags.length > 0) {
        data.tags = data.tags.filter(tag => usedTags.has(tag))
        optimized = true
        console.log(`Removed ${unusedTags.length} unused tags`)
      }
    }

    // Clean up expired memory capsules (optional)
    if (data.memoryCapsules) {
      const now = new Date()
      const expiredCapsules = Object.keys(data.memoryCapsules).filter(id => {
        const capsule = data.memoryCapsules[id]
        return capsule.opened &&
               new Date(capsule.openedAt) < new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) // 1 year old
      })

      // Note: We don't automatically delete old capsules as they might have sentimental value
      if (expiredCapsules.length > 0) {
        console.log(`Found ${expiredCapsules.length} old opened capsules (not automatically removed)`)
      }
    }

    if (optimized) {
      const success = saveData(data)
      if (success) {
        console.log('Data optimization completed successfully')
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Error optimizing data:', error)
    return false
  }
}



// Get data statistics
export const getDataStatistics = () => {
  try {
    const data = loadData()
    if (!data) return null

    const stats = {
      articles: {
        total: Object.keys(data.articles || {}).length,
        byType: {}
      },
      stars: {
        total: Object.keys(data.stars || {}).length,
        withThoughts: 0,
        withAudio: 0,
        byTag: {}
      },
      tags: {
        total: (data.tags || []).length,
        usage: {}
      },
      memoryCapsules: {
        total: Object.keys(data.memoryCapsules || {}).length,
        waiting: 0,
        ready: 0,
        opened: 0
      },
      storage: getStorageInfo()
    }

    // Calculate article statistics
    Object.values(data.articles || {}).forEach(article => {
      stats.articles.byType[article.type] = (stats.articles.byType[article.type] || 0) + 1
    })

    // Calculate star statistics
    Object.values(data.stars || {}).forEach(star => {
      if (star.thoughts && star.thoughts.length > 0) {
        stats.stars.withThoughts++
      }
      if (star.audioBlob) {
        stats.stars.withAudio++
      }
      star.tags.forEach(tag => {
        stats.stars.byTag[tag] = (stats.stars.byTag[tag] || 0) + 1
        stats.tags.usage[tag] = (stats.tags.usage[tag] || 0) + 1
      })
    })

    // Calculate memory capsule statistics
    const now = new Date()
    Object.values(data.memoryCapsules || {}).forEach(capsule => {
      if (capsule.opened) {
        stats.memoryCapsules.opened++
      } else if (new Date(capsule.openDate) <= now) {
        stats.memoryCapsules.ready++
      } else {
        stats.memoryCapsules.waiting++
      }
    })

    return stats
  } catch (error) {
    console.error('Error getting data statistics:', error)
    return null
  }
}

// AI总结相关存储函数

// 保存AI总结
export const saveAISummary = (articleId, summaryData) => {
  try {
    const data = loadData()
    if (!data) return false

    if (!data.aiSummaries) {
      data.aiSummaries = {}
    }

    const summaryId = `summary-${Date.now()}`
    data.aiSummaries[summaryId] = {
      id: summaryId,
      articleId: articleId,
      summary: summaryData.summary,
      model: summaryData.model,
      timestamp: summaryData.timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString()
    }

    return saveData(data)
  } catch (error) {
    console.error('Error saving AI summary:', error)
    return false
  }
}

// 获取文章的AI总结
export const getAISummary = (articleId) => {
  try {
    const data = loadData()
    if (!data || !data.aiSummaries) return null

    // 返回该文章最新的总结
    const summaries = Object.values(data.aiSummaries)
      .filter(summary => summary.articleId === articleId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return summaries.length > 0 ? summaries[0] : null
  } catch (error) {
    console.error('Error getting AI summary:', error)
    return null
  }
}

// 获取所有AI总结
export const getAllAISummaries = () => {
  try {
    const data = loadData()
    if (!data || !data.aiSummaries) return []

    return Object.values(data.aiSummaries)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } catch (error) {
    console.error('Error getting all AI summaries:', error)
    return []
  }
}

// 删除AI总结
export const deleteAISummary = (summaryId) => {
  try {
    const data = loadData()
    if (!data || !data.aiSummaries) return false

    delete data.aiSummaries[summaryId]
    return saveData(data)
  } catch (error) {
    console.error('Error deleting AI summary:', error)
    return false
  }
}

// 清理过期的AI总结（可选，保留最近的几个）
export const cleanupOldAISummaries = (keepCount = 10) => {
  try {
    const data = loadData()
    if (!data || !data.aiSummaries) return false

    const summaries = Object.values(data.aiSummaries)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    if (summaries.length <= keepCount) return true

    // 保留最新的keepCount个总结
    const toKeep = summaries.slice(0, keepCount)
    const newSummaries = {}

    toKeep.forEach(summary => {
      newSummaries[summary.id] = summary
    })

    data.aiSummaries = newSummaries
    return saveData(data)
  } catch (error) {
    console.error('Error cleaning up old AI summaries:', error)
    return false
  }
}
