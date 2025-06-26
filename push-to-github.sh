#!/bin/bash

# GitHub推送脚本 - 支持重试机制
# 用于在网络不稳定时多次尝试推送

echo "🚀 开始推送到GitHub..."

# 最大重试次数
MAX_RETRIES=5
RETRY_COUNT=0

# 推送函数
push_to_github() {
    echo "📤 尝试推送... (第 $((RETRY_COUNT + 1)) 次)"
    
    if git push origin master; then
        echo "✅ 推送成功！"
        return 0
    else
        echo "❌ 推送失败"
        return 1
    fi
}

# 重试循环
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if push_to_github; then
        echo ""
        echo "🎉 推送完成！"
        echo "📍 仓库地址: https://github.com/15236702150master/starlight-excerpts"
        echo "🔗 在线访问: https://15236702150master.github.io/starlight-excerpts/"
        exit 0
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        WAIT_TIME=$((RETRY_COUNT * 10))
        echo "⏳ 等待 ${WAIT_TIME} 秒后重试..."
        sleep $WAIT_TIME
    fi
done

echo ""
echo "❌ 推送失败，已达到最大重试次数 ($MAX_RETRIES)"
echo ""
echo "🔧 可能的解决方案:"
echo "1. 检查网络连接"
echo "2. 稍后手动重试: git push origin master"
echo "3. 检查GitHub访问令牌是否有效"
echo ""
echo "📊 当前状态:"
git status --porcelain
echo ""
echo "📝 最近的提交:"
git log --oneline -3

exit 1
