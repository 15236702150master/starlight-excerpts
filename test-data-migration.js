// 测试数据迁移和兼容性脚本
// 这个脚本用于验证localStorage数据结构的迁移功能

// 模拟旧版本的数据结构（缺少某些字段）
const oldVersionData = {
  articles: {
    "test-article-1": {
      id: "test-article-1",
      title: "测试文章",
      content: "这是一个测试文章的内容。",
      createdAt: "2025-06-26T04:20:57.594Z",
      tags: ["测试"],
      type: "markdown"
    }
  },
  stars: {},
  tags: ["测试"],
  memoryCapsules: {}
  // 注意：缺少 selectedTags, dailyLight, lastDailyLightDate, aiSummaries 等字段
}

// 模拟更旧版本的数据结构
const veryOldVersionData = {
  articles: {
    "old-article": {
      id: "old-article",
      title: "旧版本文章",
      content: "旧版本的文章内容",
      createdAt: "2025-06-25T00:00:00.000Z"
      // 缺少 tags, type 等字段
    }
  },
  stars: {},
  tags: []
  // 缺少很多字段
}

console.log('=== 数据迁移测试 ===')

// 测试函数：验证数据结构
function validateDataStructure(data) {
  const requiredFields = [
    'articles', 'stars', 'tags', 'selectedTags', 
    'memoryCapsules', 'dailyLight', 'lastDailyLightDate', 'aiSummaries'
  ]
  
  const missingFields = []
  
  for (const field of requiredFields) {
    if (!(field in data)) {
      missingFields.push(field)
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields: missingFields
  }
}

// 测试当前localStorage数据
console.log('1. 测试当前localStorage数据结构...')
try {
  const currentData = JSON.parse(localStorage.getItem('starlight-excerpts-data') || '{}')
  const validation = validateDataStructure(currentData)
  
  if (validation.isValid) {
    console.log('✅ 当前数据结构完整')
    console.log('数据版本:', currentData.version || '未知')
  } else {
    console.log('❌ 当前数据结构不完整，缺少字段:', validation.missingFields)
  }
} catch (error) {
  console.log('❌ 读取localStorage数据失败:', error.message)
}

// 测试旧版本数据迁移
console.log('\n2. 测试旧版本数据迁移...')

// 保存当前数据
const currentData = localStorage.getItem('starlight-excerpts-data')

// 模拟旧版本数据
localStorage.setItem('starlight-excerpts-data', JSON.stringify(oldVersionData))

// 重新加载页面来触发数据迁移
console.log('请刷新页面以触发数据迁移，然后检查控制台输出')

// 恢复原始数据的函数
window.restoreOriginalData = function() {
  if (currentData) {
    localStorage.setItem('starlight-excerpts-data', currentData)
    console.log('✅ 已恢复原始数据')
  }
}

console.log('提示：运行 restoreOriginalData() 可以恢复原始数据')
