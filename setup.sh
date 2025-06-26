#!/bin/bash

# Starlight Excerpts 项目设置脚本
# 用于首次设置项目环境

echo "🔧 Starlight Excerpts 项目设置"
echo "================================"

# 获取当前脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📍 项目目录: $SCRIPT_DIR"

# 检查系统要求
echo ""
echo "🔍 检查系统要求..."

# 检查Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
    
    # 检查Node.js版本是否满足要求 (>= 16.0.0)
    NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR_VERSION" -lt 16 ]; then
        echo "⚠️  警告: Node.js版本过低，建议升级到16.0.0或更高版本"
    fi
else
    echo "❌ Node.js 未安装"
    echo "📖 请访问 https://nodejs.org/ 下载安装 Node.js (推荐LTS版本)"
    exit 1
fi

# 检查npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ npm 未安装"
    exit 1
fi

# 检查curl (用于健康检查)
if command -v curl &> /dev/null; then
    echo "✅ curl: 已安装"
else
    echo "⚠️  curl 未安装，建议安装以便进行服务健康检查"
fi

# 检查项目文件
echo ""
echo "📁 检查项目文件..."

required_files=("package.json" "backend/package.json" "backend/server.js" "src/main.jsx")
missing_files=()

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (缺失)"
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo ""
    echo "❌ 缺少必要文件，请确保项目完整"
    exit 1
fi

# 安装依赖
echo ""
echo "📦 安装项目依赖..."

echo "🔄 安装前端依赖..."
if npm install; then
    echo "✅ 前端依赖安装完成"
else
    echo "❌ 前端依赖安装失败"
    exit 1
fi

echo "🔄 安装后端依赖..."
cd backend
if npm install; then
    echo "✅ 后端依赖安装完成"
else
    echo "❌ 后端依赖安装失败"
    exit 1
fi
cd ..

# 配置环境变量
echo ""
echo "⚙️  配置环境变量..."

if [ ! -f "backend/.env" ]; then
    echo "📝 创建后端环境配置文件..."
    
    cat > backend/.env << 'EOF'
# AI平台API密钥配置
# 请配置您自己的API密钥以使用AI总结功能

# 豆包大模型 (字节跳动) - 中文理解能力强
# 获取地址: https://console.volcengine.com/ark
DOUBAO_API_KEY=your_doubao_api_key_here

# DeepSeek - 推理和代码能力优秀
# 获取地址: https://platform.deepseek.com/
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# 通义千问 (阿里云) - 中文处理专业
# 获取地址: https://dashscope.console.aliyun.com/
QIANWEN_API_KEY=your_qianwen_api_key_here

# 服务器配置
PORT=3001

# 环境配置
NODE_ENV=development

# API配置
API_TIMEOUT=30000
MAX_CONTENT_LENGTH=10485760

# 安全配置
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174
EOF

    echo "✅ 已创建 backend/.env 文件"
    echo ""
    echo "⚠️  重要提示："
    echo "   请编辑 backend/.env 文件，配置您的AI平台API密钥"
    echo "   至少需要配置一个平台的API密钥才能使用AI总结功能"
    echo ""
    echo "📖 API密钥获取地址："
    echo "   豆包: https://console.volcengine.com/ark"
    echo "   DeepSeek: https://platform.deepseek.com/"
    echo "   通义千问: https://dashscope.console.aliyun.com/"
else
    echo "✅ backend/.env 文件已存在"
fi

# 创建必要目录
echo ""
echo "📁 创建必要目录..."

directories=("logs" "test-documents")
for dir in "${directories[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        echo "✅ 创建目录: $dir"
    else
        echo "✅ 目录已存在: $dir"
    fi
done

# 设置脚本权限
echo ""
echo "🔐 设置脚本执行权限..."

scripts=("start-services.sh" "stop-services.sh" "setup.sh")
for script in "${scripts[@]}"; do
    if [ -f "$script" ]; then
        chmod +x "$script"
        echo "✅ $script"
    fi
done

# 完成设置
echo ""
echo "🎉 项目设置完成！"
echo ""
echo "📋 下一步操作："
echo "   1. 编辑 backend/.env 文件，配置API密钥"
echo "   2. 运行 ./start-services.sh 启动服务"
echo "   3. 在浏览器中访问 http://localhost:5173"
echo ""
echo "🔧 常用命令："
echo "   启动服务: ./start-services.sh"
echo "   停止服务: ./stop-services.sh"
echo "   重新设置: ./setup.sh"
echo ""
echo "📚 更多信息请查看 README.md 文件"
