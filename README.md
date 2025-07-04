# 星光摘录馆 ✨

[![Deploy to GitHub Pages](https://github.com/15236702150master/starlight-excerpts/actions/workflows/deploy.yml/badge.svg)](https://github.com/15236702150master/starlight-excerpts/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个用于收集、整理和创造性使用文本摘录的网页应用。将用户收集的文字片段可视化为"星星"，形成一个个人知识和灵感的"星空"。

## 🌟 在线演示

**[立即体验 → https://15236702150master.github.io/starlight-excerpts/](https://15236702150master.github.io/starlight-excerpts/)**

> 💡 **提示**: 首次访问建议先查看"今日一光"，然后前往"文库"添加您的第一篇文章开始体验！

## ✨ 项目特色

- 🎨 **诗意可视化**: 将文字摘录转化为美丽的星空，每颗星星都承载着知识和灵感
- 🎵 **沉浸体验**: 内置空灵音效，悬停和点击星星时播放动人音乐
- 🎙️ **语音备注**: 为每个摘录录制语音，保存当时的想法和感悟
- 🏷️ **智能标签**: 自动颜色编码的标签系统，让内容组织更加直观
- 📱 **响应式设计**: 完美适配桌面和移动设备，随时随地记录灵感
- 🔍 **高级搜索**: 支持全文搜索、标签筛选和时间范围查询
- 📦 **记忆胶囊**: 将特定主题的星星封存，设定未来开启日期
- 🤖 **AI 智能摘要**: 集成多个AI平台，自动生成文档摘要和分析（需用户自行配置API密钥）

## 🌟 核心功能

### 📚 文库管理
- **多格式支持**：支持文本粘贴、TXT、DOCX、PDF文件上传
- **Markdown渲染**：自动识别并渲染Markdown格式文档
- **文章预览**：快速浏览文章内容和摘要
- **智能管理**：显示每篇文章的星星数量和创建时间

### ⭐ 文本摘录
- **智能选择**：支持跨段落文本选择
- **实时高亮**：选中文本自动高亮显示
- **想法记录**：为每个摘录添加个人思考和感悟
- **标签分类**：使用标签系统组织和分类摘录
- **心声录制**：录制语音备注，保存当时的想法

### 🌌 星空可视化
- **动态星空**：摘录以星星形式在星空中展示
- **视觉层次**：根据想法数量显示不同的星星亮度和光环
- **智能关联**：点击星星时，相关星星会以相同颜色闪耀
- **交互体验**：悬停播放空灵音效，点击播放星辰音效
- **标签筛选**：通过标签快速筛选相关星星

### 🏷️ 标签系统
- **全局标签库**：统一管理所有使用过的标签
- **颜色编码**：每个标签自动分配独特颜色
- **智能筛选**：支持多标签组合筛选
- **使用统计**：显示每个标签的使用次数

### 🎵 音频功能
- **心声录制**：为摘录录制语音备注
- **环境音效**：星星悬停和点击时播放空灵音效
- **Web Audio API**：使用原生API生成星辰、风铃、宇宙脉冲音效
- **音频存储**：录音以Base64格式存储在本地

### 📦 记忆胶囊
- **时间封存**：将特定主题的星星打包封存
- **未来开启**：设定未来日期自动解封胶囊
- **留言功能**：为未来的自己留下时光留言
- **状态管理**：区分等待中、可开启、已开启的胶囊

### 🤖 AI 智能总结
- **多平台支持**：支持豆包、DeepSeek、通义千问等AI平台
- **用户API密钥**：用户需自行配置API密钥，保护隐私安全
- **自动总结**：文档加载后自动生成智能总结
- **格式优化**：结构化Markdown格式，便于阅读
- **本地缓存**：总结结果本地存储，避免重复生成

### ✨ 特色功能
- **每日一光**：每天随机展示一颗历史星星
- **灵感回响**：周年纪念日自动推送历史摘录
- **高亮闪烁**：从星空跳转到原文时高亮闪烁提示
- **响应式设计**：完美适配桌面和移动设备

## 🚀 技术栈

- **前端框架**：React 19 + Vite
- **路由管理**：React Router DOM
- **动画效果**：Framer Motion
- **图标库**：Lucide React
- **文档处理**：
  - Markdown: marked
  - DOCX: mammoth
  - PDF: pdfjs-dist
- **音频处理**：Web Audio API + MediaRecorder API
- **数据存储**：localStorage
- **状态管理**：React Context + useReducer

## 📱 使用指南

### 开始使用
1. 访问应用首页，查看"今日一光"推荐
2. 点击"文库"开始添加您的第一篇文章
3. 在阅读器中选择文本，添加想法和标签创建星星
4. 在"星空"中探索您的思想宇宙

### 文章管理
- 点击"+"按钮添加文章
- 支持直接粘贴文本或上传文件
- 文章列表显示标题、预览和星星数量

### 摘录创建
- 在阅读器中用鼠标选择文本
- 在弹出的摘录窗口中：
  - 添加您的想法和感悟
  - 选择或创建标签
  - 可选择录制语音备注
- 点击"保存为星星"完成创建

### AI 智能总结配置
- 首次使用需要配置AI平台API密钥
- 点击阅读器中的"🔑"按钮打开配置界面
- 支持的AI平台：
  - **豆包大模型**：[获取API密钥](https://console.volcengine.com/ark)
  - **DeepSeek**：[获取API密钥](https://platform.deepseek.com/)
  - **通义千问**：[获取API密钥](https://dashscope.console.aliyun.com/)
- API密钥仅存储在您的浏览器本地，安全可靠
- 配置完成后，文档会自动生成AI总结

### 星空探索
- 悬停星星查看内容预览
- 点击星星查看详细信息
- 使用搜索框查找特定内容
- 通过标签筛选相关星星
- 相关星星会以相同颜色高亮显示

### 记忆胶囊
- 在记忆胶囊页面创建新胶囊
- 选择要封存的星星
- 设定开启日期和留言
- 到期后胶囊会自动变为可开启状态

## 🛠️ 开发指南

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 开发运行
```bash
npm run dev
```

### 构建部署
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

## 🚀 部署指南

### GitHub Pages 部署
本项目已配置自动部署到GitHub Pages：

1. Fork 本仓库到您的GitHub账户
2. 在仓库设置中启用 Pages 功能
3. 选择 "GitHub Actions" 作为构建源
4. 推送代码到 `master` 分支即可自动部署

> **注意**: 项目使用HashRouter来确保在GitHub Pages上的路由正常工作，URL会包含 `#` 符号（如 `/#/library`）。

### 本地部署
```bash
# 克隆仓库
git clone https://github.com/15236702150master/starlight-excerpts.git
cd starlight-excerpts

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 其他平台部署
- **Vercel**: 导入GitHub仓库，自动检测Vite配置
- **Netlify**: 拖拽 `dist` 文件夹或连接GitHub仓库
- **自托管**: 将 `dist` 文件夹内容上传到Web服务器

## 🎨 设计理念

星光摘录馆的设计灵感来源于夜空中的星辰。每一段被摘录的文字都像是一颗星星，承载着知识和灵感。通过可视化的方式，让用户的思想形成一个美丽的星空，既实用又富有诗意。

### 视觉设计
- **深空背景**：深蓝渐变背景营造夜空氛围
- **星星效果**：根据内容丰富度显示不同亮度和光环
- **流畅动画**：使用Framer Motion创造丝滑的交互体验
- **色彩系统**：标签颜色自动生成，保持视觉一致性

### 交互设计
- **直观操作**：文本选择即可创建摘录
- **即时反馈**：悬停、点击都有相应的视觉和听觉反馈
- **渐进式披露**：复杂功能通过模态框逐步展示
- **响应式布局**：适配各种屏幕尺寸

## 🔧 技术架构

### 前端技术栈
- **React 19**: 最新的React版本，提供更好的性能和开发体验
- **Vite**: 快速的构建工具，支持热重载和优化打包
- **Framer Motion**: 流畅的动画效果，创造丝滑的交互体验
- **React Router**: 单页应用路由管理
- **Lucide React**: 精美的图标库

### 文档处理
- **Mammoth.js**: Word文档(.docx)解析和转换
- **PDF.js**: PDF文档解析和文本提取
- **Marked.js**: Markdown渲染和解析
- **DOMPurify**: HTML内容安全过滤

### 数据存储
- **localStorage**: 本地数据持久化存储
- **IndexedDB**: 大文件和音频数据存储
- **Context API**: 全局状态管理

### 音频处理
- **Web Audio API**: 原生音效生成和播放
- **MediaRecorder API**: 语音录制功能

## 💻 本地开发

### 环境要求
- Node.js >= 16.0.0
- npm >= 7.0.0

### 🚀 一键启动（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/15236702150master/starlight-excerpts.git
cd starlight-excerpts

# 2. 运行设置脚本（自动安装依赖和配置环境）
./setup.sh

# 3. 配置API密钥（编辑 backend/.env 文件）
# 至少配置一个AI平台的API密钥

# 4. 启动所有服务
./start-services.sh
```

### 手动安装（可选）

```bash
# 1. 安装前端依赖
npm install

# 2. 安装后端依赖
cd backend
npm install
cd ..

# 3. 配置环境变量
cp backend/.env.example backend/.env
# 编辑 backend/.env 文件，配置API密钥

# 4. 启动后端服务
cd backend
npm run dev &

# 5. 启动前端服务
npm run dev
```

### 服务管理

```bash
# 启动所有服务
./start-services.sh

# 停止所有服务
./stop-services.sh

# 重新设置项目
./setup.sh
```

### 🔧 配置说明

#### AI平台API密钥配置

编辑 `backend/.env` 文件，配置以下API密钥：

```env
# 豆包大模型 (推荐)
DOUBAO_API_KEY=your_doubao_api_key_here

# DeepSeek
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# 通义千问
QIANWEN_API_KEY=your_qianwen_api_key_here
```

**API密钥获取地址：**
- 豆包: https://console.volcengine.com/ark
- DeepSeek: https://platform.deepseek.com/
- 通义千问: https://dashscope.console.aliyun.com/

#### 服务端口

- 前端应用: http://localhost:5173
- 后端API: http://localhost:3001

### 故障排除

#### 常见问题

1. **服务启动失败**
   - 检查Node.js版本是否 >= 16.0.0
   - 确保端口5173和3001未被占用
   - 查看日志文件：`logs/frontend.log` 和 `logs/backend.log`

2. **AI总结功能不工作**
   - 确保已配置API密钥
   - 检查网络连接
   - 查看后端日志确认API调用状态

3. **文档上传失败**
   - 检查文件格式是否支持
   - 确保文件大小不超过限制
   - 清除浏览器缓存重试

#### 日志查看

```bash
# 查看前端日志
tail -f logs/frontend.log

# 查看后端日志
tail -f logs/backend.log
```

## 🤝 贡献指南

欢迎所有形式的贡献！无论是bug报告、功能建议还是代码提交。

### 如何贡献
1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

### 开发规范
- 遵循现有的代码风格
- 添加适当的注释和文档
- 确保所有测试通过
- 提交信息使用清晰的描述

## 🔮 未来规划

- [ ] 云端同步功能 (Firebase/Supabase集成)
- [ ] AI智能推荐相关内容
- [ ] 导出为各种格式（PDF、EPUB等）
- [ ] 社交分享功能
- [ ] 主题定制系统
- [ ] 插件系统和API
- [ ] 多语言支持
- [ ] 团队协作功能
- [ ] 移动端原生应用

## 📊 项目统计

- **代码行数**: 20,000+ 行
- **组件数量**: 25+ 个React组件
- **支持格式**: TXT, DOCX, PDF, Markdown
- **音效数量**: 3种原生生成音效
- **AI平台**: 支持DeepSeek、Qianwen、Doubao等

## 🙏 致谢

感谢所有开源项目的贡献者，特别是：
- React团队提供的优秀框架
- Vite团队的快速构建工具
- Framer Motion的精美动画库
- 所有依赖库的维护者们

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- **GitHub**: [@15236702150master](https://github.com/15236702150master)
- **项目地址**: [https://github.com/15236702150master/starlight-excerpts](https://github.com/15236702150master/starlight-excerpts)
- **在线演示**: [https://15236702150master.github.io/starlight-excerpts/](https://15236702150master.github.io/starlight-excerpts/)

---

⭐ **让每一段文字都成为夜空中最亮的星** ⭐

如果这个项目对您有帮助，请给它一个星标！
