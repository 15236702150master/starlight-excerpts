const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// AI平台配置
const AI_PLATFORMS = {
  doubao: {
    name: '豆包大模型',
    url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    key: process.env.DOUBAO_API_KEY,
    models: ['doubao-seed-1-6-250615', 'doubao-seed-1-6-thinking-250615', 'doubao-seed-1-6-flash-250615']
  },
  deepseek: {
    name: 'DeepSeek',
    url: 'https://api.deepseek.com/v1/chat/completions',
    key: process.env.DEEPSEEK_API_KEY,
    models: ['deepseek-chat', 'deepseek-coder']
  },
  qianwen: {
    name: '通义千问',
    url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    key: process.env.QIANWEN_API_KEY,
    models: ['qwen-max', 'qwen-plus', 'qwen-turbo']
  }
};

// 智能句子分割函数
function smartSentenceSplit(content) {
  // 改进的中文句子分割，考虑更多语境
  let sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 0);

  // 进一步处理：合并过短的句子，分割过长的句子
  const processedSentences = [];
  let currentSentence = '';

  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    if (trimmed.length < 10 && currentSentence.length > 0) {
      // 合并过短的句子
      currentSentence += trimmed;
    } else if (trimmed.length > 200) {
      // 分割过长的句子
      if (currentSentence.length > 0) {
        processedSentences.push(currentSentence);
        currentSentence = '';
      }

      // 按逗号、分号等分割长句
      const subSentences = trimmed.split(/[，；,;]/).filter(s => s.trim().length > 5);
      processedSentences.push(...subSentences.map(s => s.trim()));
    } else {
      // 正常长度的句子
      if (currentSentence.length > 0) {
        processedSentences.push(currentSentence);
        currentSentence = '';
      }
      processedSentences.push(trimmed);
    }
  });

  // 添加最后的句子
  if (currentSentence.length > 0) {
    processedSentences.push(currentSentence);
  }

  return processedSentences.filter(s => s.length > 3);
}

// 智能文档内容分析函数
function analyzeDocumentContent(content, title) {
  const analysis = {
    title: title || '未命名文档',
    wordCount: content.length,
    sentences: smartSentenceSplit(content),
    keywords: [],
    topics: [],
    structure: {}
  };

  // 提取关键词（改进的中文关键词提取）
  const commonWords = ['的', '是', '在', '有', '和', '与', '或', '但', '而', '了', '着', '过', '这', '那', '一个', '一些', '可以', '能够', '需要', '应该', '包括', '通过', '由于', '因为', '所以', '然而', '同时', '此外', '另外', '首先', '其次', '最后', '总之', '进行', '实现', '提供', '具有', '相关', '主要', '重要', '基本', '一般', '特别', '非常', '更加', '已经', '正在', '将要', '可能', '必须', '如果', '虽然', '尽管', '无论', '不管', '只要', '只有', '除了', '除非', '直到', '当时', '以后', '以前', '现在', '今天', '明天', '昨天'];

  // 提取2-6字的中文词汇
  const words = content.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
  const wordFreq = {};

  words.forEach(word => {
    if (!commonWords.includes(word) && word.length >= 2 && word.length <= 6) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  // 按频率排序，选择最重要的关键词
  analysis.keywords = Object.entries(wordFreq)
    .filter(([word, freq]) => freq >= 1) // 至少出现1次
    .sort((a, b) => {
      // 综合考虑频率和词长度
      const scoreA = a[1] * (a[0].length >= 3 ? 1.5 : 1);
      const scoreB = b[1] * (b[0].length >= 3 ? 1.5 : 1);
      return scoreB - scoreA;
    })
    .slice(0, 8)
    .map(([word]) => word);

  // 分析主题
  const techKeywords = ['技术', '算法', '系统', '数据', '模型', '人工智能', 'AI', '机器学习', '深度学习'];
  const businessKeywords = ['市场', '商业', '经济', '发展', '策略', '管理', '企业', '公司'];
  const academicKeywords = ['研究', '分析', '理论', '方法', '实验', '结果', '结论', '论文'];

  if (techKeywords.some(keyword => content.includes(keyword))) {
    analysis.topics.push('技术');
  }
  if (businessKeywords.some(keyword => content.includes(keyword))) {
    analysis.topics.push('商业');
  }
  if (academicKeywords.some(keyword => content.includes(keyword))) {
    analysis.topics.push('学术');
  }

  return analysis;
}

// 基于分析生成深度智能总结
function generateIntelligentSummary(analysis, title) {
  const { wordCount, sentences, keywords, topics } = analysis;

  // 深度内容分析
  const contentAnalysis = performDeepContentAnalysis(sentences, keywords);

  // 根据主题生成相应的总结结构
  let topicDescription = '';
  if (topics.includes('技术')) {
    topicDescription = '这是一份技术文档，涉及相关技术概念和实施方案。';
  } else if (topics.includes('商业')) {
    topicDescription = '这是一份商业文档，包含市场分析和商业策略内容。';
  } else if (topics.includes('学术')) {
    topicDescription = '这是一份学术文档，包含研究方法和分析结论。';
  } else {
    topicDescription = '这是一份综合性文档，包含多方面的信息和观点。';
  }

  const summary = `## 📄 ${title || '文档总结'}

**📋 文档主题**
${topicDescription}

**🎯 核心理念**
${contentAnalysis.coreIdea}

**📝 主要内容**
${contentAnalysis.mainContent}

**🔍 关键要点**
${contentAnalysis.keyPoints}

**💡 深度分析**
${contentAnalysis.deepAnalysis}

**📊 文档特征**
- 字数统计：${wordCount}字符
- 内容结构：${sentences.length}个主要段落
- 主题分类：${topics.length > 0 ? topics.join('、') : '综合性内容'}
- 核心概念：${keywords.slice(0, 5).join('、')}

---
*✨ 基于深度智能分析生成的总结，提供全面的内容理解和要点提取。*`;

  return summary;
}

// 深度内容分析函数
function performDeepContentAnalysis(sentences, keywords) {
  // 分析句子结构和逻辑关系
  const logicalStructure = analyzeLogicalStructure(sentences);

  // 提取核心理念
  const coreIdea = extractCoreIdea(sentences, keywords);

  // 生成主要内容概述
  const mainContent = generateMainContentSummary(sentences, logicalStructure);

  // 提取关键要点
  const keyPoints = extractKeyPoints(sentences, keywords, logicalStructure);

  // 生成深度分析
  const deepAnalysis = generateDeepAnalysis(sentences, keywords, logicalStructure);

  return {
    coreIdea,
    mainContent,
    keyPoints,
    deepAnalysis
  };
}

// 分析逻辑结构
function analyzeLogicalStructure(sentences) {
  const structure = {
    introduction: [],
    mainPoints: [],
    conclusion: [],
    examples: [],
    suggestions: []
  };

  sentences.forEach((sentence, index) => {
    const trimmed = sentence.trim();
    if (trimmed.length < 5) return;

    // 识别引言性句子
    if (index < 2 || trimmed.includes('首先') || trimmed.includes('开始') || trimmed.includes('引言')) {
      structure.introduction.push(trimmed);
    }
    // 识别结论性句子
    else if (trimmed.includes('总之') || trimmed.includes('综上') || trimmed.includes('最后') || trimmed.includes('因此')) {
      structure.conclusion.push(trimmed);
    }
    // 识别建议性句子
    else if (trimmed.includes('建议') || trimmed.includes('应该') || trimmed.includes('需要') || trimmed.includes('可以')) {
      structure.suggestions.push(trimmed);
    }
    // 识别例子
    else if (trimmed.includes('例如') || trimmed.includes('比如') || trimmed.includes('举例')) {
      structure.examples.push(trimmed);
    }
    // 其他作为主要观点
    else {
      structure.mainPoints.push(trimmed);
    }
  });

  return structure;
}

// 提取核心理念
function extractCoreIdea(sentences, keywords) {
  // 寻找包含最多关键词的句子作为核心理念
  let bestSentence = '';
  let maxKeywordCount = 0;

  sentences.forEach(sentence => {
    const keywordCount = keywords.filter(keyword => sentence.includes(keyword)).length;
    if (keywordCount > maxKeywordCount && sentence.trim().length > 10) {
      maxKeywordCount = keywordCount;
      bestSentence = sentence.trim();
    }
  });

  return bestSentence || (sentences.length > 0 ? sentences[0].trim() : '文档核心理念有待进一步分析。');
}

// 生成主要内容概述
function generateMainContentSummary(sentences, structure) {
  const { introduction, mainPoints } = structure;

  // 组合引言和主要观点
  const contentSentences = [...introduction, ...mainPoints.slice(0, 3)];

  if (contentSentences.length === 0) {
    return '文档内容概述有待进一步分析。';
  }

  return contentSentences.join('。') + '。';
}

// 提取关键要点
function extractKeyPoints(sentences, keywords, structure) {
  const { mainPoints, suggestions, examples } = structure;

  // 智能分组相关内容
  const groupedPoints = groupRelatedContent(sentences, keywords);

  if (groupedPoints.length === 0) {
    return '关键要点有待进一步分析。';
  }

  // 为每个分组生成标题和内容
  return groupedPoints.map((group, index) => {
    const title = generateGroupTitle(group, keywords);
    const content = group.sentences.slice(0, 2).join('。') + '。';
    return `**${index + 1}. ${title}**\n${content}`;
  }).join('\n\n');
}

// 将相关内容分组
function groupRelatedContent(sentences, keywords) {
  const groups = [];
  const usedSentences = new Set();

  // 基于关键词和语义相似性分组
  keywords.slice(0, 4).forEach(keyword => {
    const relatedSentences = sentences.filter((sentence, index) =>
      !usedSentences.has(index) &&
      sentence.includes(keyword) &&
      sentence.trim().length > 15
    );

    if (relatedSentences.length > 0) {
      groups.push({
        keyword,
        sentences: relatedSentences.slice(0, 3)
      });

      // 标记已使用的句子
      relatedSentences.forEach(sentence => {
        const index = sentences.indexOf(sentence);
        if (index !== -1) usedSentences.add(index);
      });
    }
  });

  // 如果分组太少，添加其他重要句子
  if (groups.length < 3) {
    const remainingSentences = sentences.filter((sentence, index) =>
      !usedSentences.has(index) &&
      sentence.trim().length > 20
    );

    if (remainingSentences.length > 0) {
      groups.push({
        keyword: '其他要点',
        sentences: remainingSentences.slice(0, 2)
      });
    }
  }

  return groups;
}

// 为分组生成标题
function generateGroupTitle(group, keywords) {
  const { keyword, sentences } = group;

  // 基于关键词和内容生成描述性标题
  if (keyword === '其他要点') {
    return '补充观点';
  }

  // 分析句子内容，生成更具描述性的标题
  const firstSentence = sentences[0] || '';

  if (firstSentence.includes('建议') || firstSentence.includes('应该') || firstSentence.includes('需要')) {
    return `关于${keyword}的建议`;
  } else if (firstSentence.includes('分析') || firstSentence.includes('认为') || firstSentence.includes('观点')) {
    return `${keyword}的分析观点`;
  } else if (firstSentence.includes('方法') || firstSentence.includes('策略') || firstSentence.includes('方式')) {
    return `${keyword}的实施策略`;
  } else {
    return `${keyword}相关论述`;
  }
}

// 生成深度分析
function generateDeepAnalysis(sentences, keywords, structure) {
  const { conclusion, mainPoints } = structure;

  let analysis = '';

  // 分析文档的论证逻辑
  if (structure.introduction.length > 0 && mainPoints.length > 0) {
    analysis += '文档采用了清晰的论证结构，从引言到主要观点层层递进。';
  }

  // 分析关键概念的重要性
  if (keywords.length > 0) {
    analysis += `文档重点围绕${keywords.slice(0, 3).join('、')}等核心概念展开论述。`;
  }

  // 分析结论的完整性
  if (conclusion.length > 0) {
    analysis += `作者在结论部分强调了${conclusion[0].substring(0, 50)}...等要点。`;
  }

  // 分析文档的实用性
  if (structure.suggestions.length > 0) {
    analysis += `文档提供了${structure.suggestions.length}个具体建议，具有较强的实用价值。`;
  }

  return analysis || '文档内容丰富，涵盖了多个重要方面，具有一定的参考价值。';
}

// 调用外部AI平台
async function callExternalAI(platform, model, content, title, userApiKeys = {}) {
  const platformConfig = AI_PLATFORMS[platform];
  if (!platformConfig) {
    throw new Error(`不支持的AI平台: ${platform}`);
  }

  // 优先使用用户提供的API密钥，否则使用环境变量中的密钥
  const apiKey = userApiKeys[platform] || platformConfig.key;
  if (!apiKey || apiKey === '') {
    throw new Error(`${platformConfig.name} API密钥未配置，请在前端配置您的API密钥`);
  }

  // 创建临时配置对象，使用用户的API密钥
  const configWithUserKey = {
    ...platformConfig,
    key: apiKey
  };

  const prompt = `请为以下文档生成详细、优美的总结分析：

标题：${title || '未命名文档'}

内容：
${content}

请按照以下格式生成总结，注意内容要详细充实，语言要优美流畅：

核心理念：[提取文档的核心观点，用1-2段话详细阐述]

然后按照重要性列出3-6个主要观点，每个观点格式如下：
1. [观点标题]
[详细解释这个观点，包含具体内容和例子，至少2-3句话]

• [子要点1]：[详细说明]
• [子要点2]：[详细说明]
• [子要点3]：[详细说明]

要求：
- 不要使用markdown符号（如#、**、\`\`\`等）
- 内容要详细充实，每个要点都要有足够的解释
- 语言要优美流畅，适合阅读
- 保持逻辑清晰的结构
- 总字数控制在800-1200字之间`;

  try {
    let response;

    switch (platform) {
      case 'doubao':
        response = await callDoubaoAPI(configWithUserKey, model, prompt);
        break;
      case 'deepseek':
        response = await callDeepSeekAPI(configWithUserKey, model, prompt);
        break;
      case 'qianwen':
        response = await callQianwenAPI(configWithUserKey, model, prompt);
        break;
      default:
        throw new Error(`暂不支持平台: ${platform}`);
    }

    return response;
  } catch (error) {
    console.error(`${platformConfig.name} API调用失败:`, error);
    throw error;
  }
}

// 豆包API调用
async function callDoubaoAPI(config, model, prompt) {
  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.key}`
    },
    body: JSON.stringify({
      model: model || 'doubao-seed-1-6-250615',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    throw new Error(`豆包API错误: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    summary: data.choices[0].message.content,
    model: data.model,
    usage: data.usage
  };
}

// DeepSeek API调用
async function callDeepSeekAPI(config, model, prompt) {
  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.key}`
    },
    body: JSON.stringify({
      model: model || 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API错误: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    summary: data.choices[0].message.content,
    model: data.model,
    usage: data.usage
  };
}



// 通义千问API调用 (使用OpenAI兼容接口)
async function callQianwenAPI(config, model, prompt) {
  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.key}`
    },
    body: JSON.stringify({
      model: model || 'qwen-plus',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    throw new Error(`通义千问API错误: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    summary: data.choices[0].message.content,
    model: data.model,
    usage: data.usage
  };
}

// 文档总结API
app.post('/api/summarize', async (req, res) => {
  try {
    const { content, title, platform = 'doubao', model, options = {}, apiKeys = {} } = req.body;

    if (!content) {
      return res.status(400).json({ 
        error: '文档内容不能为空',
        code: 'MISSING_CONTENT'
      });
    }

    // 构建总结提示词 - 基于"质"和"术"的理念
    const systemPrompt = `你是一个专业的文档总结专家。你的任务是创作一篇像"高清哈哈镜"一样的总结：按比例缩小原作，但图像(核心论点)必须清晰、准确，且不扭曲变形。

## 总结的核心品质("质")：

1. **忠实原文 (Accuracy)**：这是最重要的原则
   - 准确反映原作的中心思想、主要论点和基调
   - 绝对不能歪曲、夸大、或加入你自己的观点和评判
   - 保持作者的原始意图和表达风格

2. **简洁精炼 (Brevity)**：总结的价值在于高效
   - 用比原文少得多的篇幅，提炼出最有价值的信息
   - 剔除冗余的例子、重复的论述和次要的细节
   - 每个词都要有存在的价值

3. **清晰连贯 (Clarity & Coherence)**：总结本身应是一篇独立、易读的短文
   - 结构清晰，逻辑流畅
   - 让未读过原文的人也能快速理解作者的思路和结论
   - 使用自然流畅的语言，避免生硬的拼凑

4. **要点完整 (Comprehensiveness)**：在追求简洁的同时，不能遗漏关键信息
   - 呈现完整的逻辑链条：从"是什么"到"为什么"，再到"怎么办"或"结论是什么"
   - 确保所有核心论点都有体现

## 总结的具体方法("术")：

**第一步：深入阅读，理解核心**
- 识别文章的"骨架"：核心问题是什么？中心论点是什么？主要论据有哪些？
- 理解作者的整体思路和逻辑结构

**第二步：识别并提取要点**
- 标记关键词句：主题句、定义性句子、结论性句子
- 按逻辑分块：提出问题 → 分析原因 → 举例论证 → 提出解决方案/结论

**第三步：整合并转述**（最关键）
- 绝对不要简单摘抄原文句子
- 用自己的语言重新组织和表达这些观点
- 构建清晰的逻辑链条，使用恰当的过渡词

**第四步：审阅和修改**
- 检查是否遗漏关键信息或存在不准确表述
- 删减冗余，确保每句话都简洁有力
- 确保客观性，避免主观色彩

## 输出格式要求：
- 使用清晰的层次结构
- 采用"核心理念:"、"主要观点:"、"关键结论:"等标识
- 总结长度控制在300-600字之间
- 语言自然流畅，避免生硬的条目罗列

请严格按照以上标准执行总结任务。`;

    const userPrompt = `请按照专业总结标准，为以下文档创作一篇高质量总结：

【文档标题】：${title || '未命名文档'}

【文档内容】：
${content}

请严格遵循"四步法"，创作一篇具备忠实原文、简洁精炼、清晰连贯、要点完整品质的总结。`;

    // 智能文档分析和总结生成
    console.log('开始生成智能总结...');
    console.log('文档标题:', title);
    console.log('内容长度:', content.length);
    console.log('使用平台:', platform);

    // 使用外部AI平台生成总结
    const result = await callExternalAI(platform, model, content, title, apiKeys);
    let summary = result.summary;
    const usedModel = result.model;
    const usage = result.usage;
    let status = 'ai_generated';

    // 总结质量控制和优化
    const qualityCheck = evaluateSummaryQuality(summary, content, title);
    console.log('总结质量评估:', qualityCheck);

    // 如果质量不达标，尝试优化
    if (!qualityCheck.isHighQuality) {
      console.log('总结质量需要改进，正在优化...');
      summary = improveSummaryQuality(summary, qualityCheck.issues);
      status = 'ai_generated_optimized';
    }

    console.log('智能总结生成完成');

    // 返回总结结果
    res.json({
      success: true,
      data: {
        summary: summary,
        title: title,
        timestamp: new Date().toISOString(),
        model: usedModel,
        usage: usage,
        platform: platform,
        status: status
      }
    });

  } catch (error) {
    console.error('文档总结错误:', error);

    // 处理不同类型的错误
    if (error.response) {
      // API响应错误
      const status = error.response.status;
      const message = error.response.data?.error?.message || '豆包API调用失败';
      
      res.status(status).json({
        error: message,
        code: 'API_ERROR',
        details: error.response.data
      });
    } else if (error.code === 'ECONNABORTED') {
      // 超时错误
      res.status(408).json({
        error: '请求超时，请稍后重试',
        code: 'TIMEOUT'
      });
    } else {
      // 其他错误
      res.status(500).json({
        error: '服务器内部错误',
        code: 'INTERNAL_ERROR',
        message: error.message
      });
    }
  }
});

// 获取AI平台列表
app.get('/api/platforms', (req, res) => {
  const platforms = Object.keys(AI_PLATFORMS).map(key => {
    const platform = AI_PLATFORMS[key];
    return {
      id: key,
      name: platform.name,
      models: platform.models,
      available: key === 'local' || (platform.key && platform.key !== ''),
      description: getPlatformDescription(key)
    };
  });

  res.json({
    success: true,
    data: platforms
  });
});

// 获取平台描述
function getPlatformDescription(platform) {
  const descriptions = {
    doubao: '字节跳动豆包大模型，中文理解能力强',
    deepseek: 'DeepSeek深度求索，推理和代码能力优秀',
    qianwen: '阿里通义千问，中文处理专业'
  };
  return descriptions[platform] || '未知平台';
}

// 总结质量评估函数
function evaluateSummaryQuality(summary, originalContent, title) {
  const issues = [];
  let isHighQuality = true;

  // 1. 长度检查 (300-600字符合理范围)
  const summaryLength = summary.replace(/[#*\-\s]/g, '').length;
  if (summaryLength < 200) {
    issues.push('总结过短，可能遗漏重要信息');
    isHighQuality = false;
  } else if (summaryLength > 800) {
    issues.push('总结过长，需要更加精炼');
    isHighQuality = false;
  }

  // 2. 结构完整性检查
  const hasStructure = summary.includes('核心理念') ||
                      summary.includes('主要观点') ||
                      summary.includes('关键结论') ||
                      summary.includes('核心内容');
  if (!hasStructure) {
    issues.push('缺乏清晰的结构标识');
    isHighQuality = false;
  }

  // 3. 内容忠实性检查（简单关键词匹配）
  const originalWords = originalContent.match(/[\u4e00-\u9fa5]{2,}/g) || [];
  const summaryWords = summary.match(/[\u4e00-\u9fa5]{2,}/g) || [];
  const keywordOverlap = originalWords.filter(word =>
    word.length > 2 && summaryWords.some(sw => sw.includes(word))
  ).length;

  if (keywordOverlap < Math.min(10, originalWords.length * 0.1)) {
    issues.push('与原文关键词重叠度较低，可能偏离主题');
    isHighQuality = false;
  }

  // 4. 逻辑连贯性检查
  const sentences = summary.split(/[。！？]/).filter(s => s.trim().length > 5);
  if (sentences.length < 3) {
    issues.push('总结过于简单，缺乏逻辑层次');
    isHighQuality = false;
  }

  // 5. 客观性检查（避免主观表达）
  const subjectiveWords = ['我认为', '我觉得', '个人认为', '笔者认为'];
  const hasSubjectiveContent = subjectiveWords.some(word => summary.includes(word));
  if (hasSubjectiveContent) {
    issues.push('包含主观性表达，违反客观性原则');
    isHighQuality = false;
  }

  return {
    isHighQuality,
    issues,
    metrics: {
      length: summaryLength,
      hasStructure,
      keywordOverlap,
      sentenceCount: sentences.length
    }
  };
}

// 总结质量改进函数
function improveSummaryQuality(summary, issues) {
  let improved = summary;

  // 添加结构标识
  if (issues.includes('缺乏清晰的结构标识')) {
    if (!improved.includes('**核心理念：**') && !improved.includes('**主要观点：**')) {
      // 在第一段后添加结构标识
      const lines = improved.split('\n');
      if (lines.length > 2) {
        lines.splice(2, 0, '', '**核心内容：**');
        improved = lines.join('\n');
      }
    }
  }

  // 移除主观性表达
  if (issues.includes('包含主观性表达，违反客观性原则')) {
    improved = improved
      .replace(/我认为/g, '文章认为')
      .replace(/我觉得/g, '文章指出')
      .replace(/个人认为/g, '作者认为')
      .replace(/笔者认为/g, '作者认为');
  }

  // 优化格式
  improved = improved
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return improved;
}

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'starlight-excerpts-ai-backend'
  });
});

// 获取支持的模型列表
app.get('/api/models', (req, res) => {
  res.json({
    models: [
      {
        id: 'doubao-seed-1.6-250615',
        name: '豆包-Seed-1.6 (最新)',
        description: '2025年6月最新发布，最强文本理解和生成能力，50万tokens免费额度',
        maxTokens: 256000,
        recommended: true,
        free: true,
        freeTokens: 500000
      },
      {
        id: 'doubao-seed-1.6-flash',
        name: '豆包-Seed-1.6-Flash',
        description: '快速版本，响应更快，50万tokens免费额度',
        maxTokens: 256000,
        recommended: false,
        free: true,
        freeTokens: 500000
      },
      {
        id: 'doubao-1.5-pro-32k',
        name: '豆包-1.5-专业版-32K',
        description: '专业版本，强大的理解能力，50万tokens免费额度',
        maxTokens: 32000,
        recommended: false,
        free: true,
        freeTokens: 500000
      },
      {
        id: 'doubao-lite-4k',
        name: '豆包-轻量版-4K',
        description: '轻量版本，适合简单任务',
        maxTokens: 4000,
        recommended: false,
        free: true,
        freeTokens: 500000
      }
    ]
  });
});

// 批量总结API（可选功能）
app.post('/api/batch-summarize', async (req, res) => {
  try {
    const { documents, options = {} } = req.body;

    if (!documents || !Array.isArray(documents)) {
      return res.status(400).json({
        error: '文档列表格式错误',
        code: 'INVALID_DOCUMENTS'
      });
    }

    const results = [];
    const errors = [];

    // 串行处理避免API限流
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      try {
        const response = await axios.post(`http://localhost:${PORT}/api/summarize`, {
          content: doc.content,
          title: doc.title,
          options
        });
        
        results.push({
          index: i,
          title: doc.title,
          summary: response.data.data.summary,
          success: true
        });
      } catch (error) {
        errors.push({
          index: i,
          title: doc.title,
          error: error.response?.data?.error || error.message,
          success: false
        });
      }

      // 添加延迟避免API限流
      if (i < documents.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    res.json({
      success: true,
      data: {
        results,
        errors,
        total: documents.length,
        successful: results.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('批量总结错误:', error);
    res.status(500).json({
      error: '批量总结服务错误',
      code: 'BATCH_ERROR'
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 AI总结服务已启动`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🔑 API密钥: ${AI_PLATFORMS.doubao.key ? '已配置' : '未配置'}`);
  console.log(`📚 支持的端点:`);
  console.log(`   POST /api/summarize - 文档总结`);
  console.log(`   POST /api/batch-summarize - 批量总结`);
  console.log(`   GET  /api/platforms - 获取AI平台列表`);
  console.log(`   GET  /api/health - 健康检查`);
});

module.exports = app;
