#!/bin/bash

# Starlight Excerpts AI Backend 启动脚本

echo "🚀 启动 Starlight Excerpts AI 后端服务..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在 starlight-excerpts 项目根目录运行此脚本"
    exit 1
fi

# 检查 backend 目录是否存在
if [ ! -d "backend" ]; then
    echo "❌ 错误：backend 目录不存在"
    exit 1
fi

# 进入 backend 目录
cd backend

echo "📁 当前目录: $(pwd)"

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误：Node.js 未安装，请先安装 Node.js"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误：npm 未安装"
    exit 1
fi

echo "✅ npm 版本: $(npm --version)"

# 检查 package.json 是否存在
if [ ! -f "package.json" ]; then
    echo "❌ 错误：backend/package.json 不存在"
    exit 1
fi

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已存在"
fi

# 检查环境变量文件
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "📝 复制环境变量模板..."
        cp .env.example .env
        echo "✅ 已创建 .env 文件，请检查配置"
    else
        echo "⚠️  警告：.env 文件不存在，将使用默认配置"
    fi
fi

# 检查端口是否被占用
PORT=3001
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  警告：端口 $PORT 已被占用"
    echo "请停止占用端口的进程或修改 .env 文件中的 PORT 配置"
    echo "查看占用进程：lsof -i :$PORT"
    read -p "是否继续启动？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🎯 启动配置："
echo "   - 服务端口: $PORT"
echo "   - API 密钥: $(grep DOUBAO_API_KEY .env 2>/dev/null | cut -d'=' -f2 | head -c 20)..."
echo "   - 环境: $(grep NODE_ENV .env 2>/dev/null | cut -d'=' -f2 || echo 'development')"
echo ""

# 启动服务
echo "🚀 启动 AI 后端服务..."
echo "📍 服务地址: http://localhost:$PORT"
echo "📚 API 文档: 查看 backend/README.md"
echo ""
echo "按 Ctrl+C 停止服务"
echo "=========================="

# 使用 npm run dev 启动开发服务器（如果有 nodemon）
if npm list nodemon &>/dev/null; then
    npm run dev
else
    # 降级到普通启动
    npm start
fi
