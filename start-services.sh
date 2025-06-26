#!/bin/bash

# Starlight Excerpts 服务启动脚本
# 用于一键启动前端和后端服务

echo "🚀 启动 Starlight Excerpts 服务..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js 未安装，请先安装 Node.js (版本 >= 16.0.0)"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: npm 未安装，请先安装 npm"
    exit 1
fi

# 获取当前脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📍 工作目录: $SCRIPT_DIR"

# 检查是否存在必要的文件
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 未找到 package.json 文件，请确保在正确的项目目录中运行此脚本"
    exit 1
fi

if [ ! -d "backend" ]; then
    echo "❌ 错误: 未找到 backend 目录"
    exit 1
fi

# 安装前端依赖
echo "📦 安装前端依赖..."
if ! npm install; then
    echo "❌ 前端依赖安装失败"
    exit 1
fi

# 安装后端依赖
echo "📦 安装后端依赖..."
cd backend
if ! npm install; then
    echo "❌ 后端依赖安装失败"
    exit 1
fi
cd ..

# 检查后端环境配置
if [ ! -f "backend/.env" ]; then
    echo "⚠️  警告: 未找到 backend/.env 文件"
    echo "📝 正在创建默认配置文件..."
    
    cat > backend/.env << EOF
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

    echo "✅ 已创建默认 .env 文件"
    echo "⚠️  请编辑 backend/.env 文件，配置您的API密钥"
    echo "📖 配置完成后重新运行此脚本"
    exit 1
fi

# 创建日志目录
mkdir -p logs

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  端口 $port 已被占用"
        return 1
    fi
    return 0
}

# 检查前端端口 (5173)
if ! check_port 5173; then
    echo "❌ 前端端口 5173 被占用，请关闭占用该端口的程序"
    exit 1
fi

# 检查后端端口 (3001)
if ! check_port 3001; then
    echo "❌ 后端端口 3001 被占用，请关闭占用该端口的程序"
    exit 1
fi

echo "🔧 启动服务..."

# 启动后端服务 (后台运行)
echo "🚀 启动后端AI服务 (端口: 3001)..."
cd backend
nohup npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..

# 等待后端服务启动
echo "⏳ 等待后端服务启动..."
sleep 3

# 检查后端服务是否启动成功
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "❌ 后端服务启动失败，请检查日志: logs/backend.log"
    exit 1
fi

echo "✅ 后端服务启动成功"

# 启动前端服务 (后台运行)
echo "🚀 启动前端服务 (端口: 5173)..."
nohup npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > logs/frontend.pid

# 等待前端服务启动
echo "⏳ 等待前端服务启动..."
sleep 5

# 检查前端服务是否启动成功
if ! curl -s http://localhost:5173 > /dev/null; then
    echo "❌ 前端服务启动失败，请检查日志: logs/frontend.log"
    exit 1
fi

echo "✅ 前端服务启动成功"

# 显示服务信息
echo ""
echo "🎉 所有服务启动成功！"
echo ""
echo "📍 服务地址:"
echo "   前端应用: http://localhost:5173"
echo "   后端API:  http://localhost:3001"
echo ""
echo "📊 服务状态:"
echo "   后端PID: $BACKEND_PID"
echo "   前端PID: $FRONTEND_PID"
echo ""
echo "📝 日志文件:"
echo "   后端日志: logs/backend.log"
echo "   前端日志: logs/frontend.log"
echo ""
echo "🛑 停止服务:"
echo "   运行: ./stop-services.sh"
echo ""
echo "🌟 现在可以在浏览器中访问 http://localhost:5173 开始使用！"
