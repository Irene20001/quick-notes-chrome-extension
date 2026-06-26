#!/bin/bash
###############################################################################
# Quick Notes - 公司电脑自动配置脚本
# 在公司的 Mac 上运行此脚本即可
###############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}"
echo "  ╔═══════════════════════════════════════╗"
echo "  ║   🚀 Quick Notes 公司电脑配置脚本     ║"
echo "  ╚═══════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# ── 1. 检查 Node.js ──
if ! command -v node &> /dev/null; then
  echo -e "${YELLOW}⚠️  Node.js 未安装，正在安装...${NC}"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  brew install node
else
  echo -e "${GREEN}✅ Node.js $(node --version)${NC}"
fi

# ── 2. 检查安装 OpenClaw ──
if ! command -v openclaw &> /dev/null; then
  echo -e "${YELLOW}⚠️  OpenClaw 未安装，正在安装...${NC}"
  npm install -g openclaw
else
  echo -e "${GREEN}✅ OpenClaw 已安装${NC}"
fi

# ── 3. 配置 Git ──
echo ""
echo -e "${YELLOW}📝 配置 Git 信息${NC}"
git config --global user.name "Irene20001"
git config --global user.email "$(read -p '请输入 GitHub 邮箱: ' email && echo $email)"

# ── 4. 设置 GitHub 认证 ──
echo ""
echo -e "${YELLOW}🔑 设置 GitHub 认证${NC}"
echo "请输入 GitHub Personal Access Token (输入后不可见):"
read -s TOKEN
git config --global credential.helper store
echo "https://Irene20001:$TOKEN@github.com" > ~/.git-credentials
chmod 600 ~/.git-credentials

# ── 5. 克隆项目 ──
echo ""
echo -e "${YELLOW}📦 克隆项目...${NC}"
cd ~
git clone https://github.com/Irene20001/quick-notes-chrome-extension.git Projects
cd ~/Projects
echo -e "${GREEN}✅ 项目已克隆到 ~/Projects${NC}"

# ── 6. 创建自动同步脚本 ──
cat > ~/auto-sync.sh << 'SYNC'
#!/bin/bash
cd ~/Projects
git pull
if [[ -n $(git status -s) ]]; then
  git add .
  git commit -m "Auto-sync $(date '+%Y-%m-%d %H:%M')"
  git push
fi
SYNC
chmod +x ~/auto-sync.sh

# ── 7. 设置定时同步（可选） ──
echo ""
echo -e "${YELLOW}⏰ 是否设置每小时自动同步？ (y/n)${NC}"
read -r SYNC_SETUP
if [[ "$SYNC_SETUP" =~ ^[Yy]$ ]]; then
  (crontab -l 2>/dev/null; echo "0 * * * * ~/auto-sync.sh >> ~/auto-sync.log 2>&1") | crontab -
  echo -e "${GREEN}✅ 已设置每小时自动同步${NC}"
fi

echo ""
echo -e "${GREEN}🎉 配置完成！${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📁 项目目录: ~/Projects"
echo "  🔄 手动同步: ~/auto-sync.sh"
echo "  🌐 OpenClaw: openclaw start"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}提示：先在公司电脑上手动执行一次同步:${NC}"
echo "  cd ~/Projects && git pull"
