// 创建测试数据脚本
const testData = {
  articles: {
    'test-article-1': {
      id: 'test-article-1',
      title: '记忆承载的智慧',
      content: `# 记忆承载的智慧

记忆是人类最珍贵的财富之一。它不仅仅是过去经历的简单存储，更是我们理解世界、构建身份认同的基础。

## 记忆的本质

记忆并非完美的录像带，而是一个动态的重构过程。每当我们回忆起某个事件时，大脑都会根据当前的情境和情感状态对记忆进行微调。这种特性使得记忆既脆弱又强大。

## 集体记忆的力量

个人记忆之外，还存在着集体记忆——那些被社会群体共同保存和传承的经历与智慧。这些记忆塑造了我们的文化认同，连接着过去、现在和未来。

## 遗忘的价值

有趣的是，遗忘并非记忆的对立面，而是记忆系统的重要组成部分。适度的遗忘帮助我们筛选重要信息，避免被琐碎细节淹没。

## 数字时代的记忆

在数字化时代，我们的记忆方式正在发生深刻变化。外部存储设备延伸了我们的记忆容量，但也带来了新的挑战：如何在信息爆炸中保持深度思考的能力？

记忆不仅是过去的见证，更是未来的指南。珍惜每一个值得记住的瞬间，让智慧在时间的长河中闪闪发光。`,
      createdAt: new Date().toISOString(),
      tags: ['哲学', '记忆', '智慧'],
      type: 'markdown'
    }
  },
  stars: {},
  tags: ['哲学', '记忆', '智慧'],
  memoryCapsules: {}
}

// 将数据写入localStorage格式的JSON文件
import fs from 'fs'
fs.writeFileSync('localStorage.json', JSON.stringify(testData, null, 2))
console.log('测试数据已创建到 localStorage.json')
console.log('文章ID:', 'test-article-1')
console.log('文章标题:', testData.articles['test-article-1'].title)
console.log('内容长度:', testData.articles['test-article-1'].content.length, '字符')
