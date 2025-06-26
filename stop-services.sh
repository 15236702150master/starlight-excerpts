#!/bin/bash

# Starlight Excerpts 服务停止脚本
# 用于停止前端和后端服务

echo "🛑 停止 Starlight Excerpts 服务..."

# 获取当前脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 停止后端服务
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "🔴 停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        sleep 2
        
        # 如果进程仍在运行，强制终止
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            echo "⚡ 强制终止后端服务..."
            kill -9 $BACKEND_PID
        fi
        
        echo "✅ 后端服务已停止"
    else
        echo "⚠️  后端服务进程不存在"
    fi
    rm -f logs/backend.pid
else
    echo "⚠️  未找到后端服务PID文件"
fi

# 停止前端服务
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "🔴 停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        sleep 2
        
        # 如果进程仍在运行，强制终止
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            echo "⚡ 强制终止前端服务..."
            kill -9 $FRONTEND_PID
        fi
        
        echo "✅ 前端服务已停止"
    else
        echo "⚠️  前端服务进程不存在"
    fi
    rm -f logs/frontend.pid
else
    echo "⚠️  未找到前端服务PID文件"
fi

# 额外清理：杀死可能残留的Node.js进程
echo "🧹 清理残留进程..."

# 查找并终止可能的残留进程
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true

# 检查端口是否已释放
check_port_free() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  端口 $port 仍被占用"
        return 1
    fi
    return 0
}

sleep 1

# 检查端口状态
if check_port_free 3001; then
    echo "✅ 后端端口 3001 已释放"
else
    echo "⚠️  后端端口 3001 仍被占用，可能需要手动处理"
fi

if check_port_free 5173; then
    echo "✅ 前端端口 5173 已释放"
else
    echo "⚠️  前端端口 5173 仍被占用，可能需要手动处理"
fi

echo ""
echo "🎉 服务停止完成！"
echo ""
echo "📝 日志文件保留在 logs/ 目录中，如需查看："
echo "   后端日志: logs/backend.log"
echo "   前端日志: logs/frontend.log"
echo ""
echo "🚀 重新启动服务:"
echo "   运行: ./start-services.sh"
