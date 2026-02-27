# 快速参考卡 - 增强版编排器

## 🚀 快速启动

```bash
cd /Users/apple/Downloads/CodeAI/CodeAI

# 1. 配置环境（首次使用）
cp .env.example .env
nano .env

# 2. 测试系统
bash test-enhanced.sh

# 3. 启动增强版编排器
npm run orchestrator:enhanced
```

## 📋 常用命令

### 编排器命令
```bash
npm run orchestrator:enhanced  # 启动增强版编排器
npm run orchestrator            # 启动原版编排器
npm run monitor                 # 运行任务监控
npm run health-check            # 健康检查
```

### 开发命令
```bash
npm run build                   # 编译 TypeScript
npm run dev                     # 开发模式
npm test                        # 运行测试
```

### Worktree 管理
```bash
npm run worktree:create         # 创建 worktree
npm run worktree:clean          # 清理 worktree
```

### 手动启动 Agent
```bash
bash scripts/start-agent.sh <task-id> <agent-type> <priority> "prompt"
```

示例：
```bash
bash scripts/start-agent.sh task-123 claude-code high "实现用户登录功能"
```

## 📊 查看状态

### 查看进度快照
```bash
cat tasks/active/progress-snapshot.json
```

### 查看日志
```bash
# 编排器日志
tail -f logs/orchestrator.log

# 监控日志
tail -f logs/monitor.log

# Cron 日志
tail -f logs/cron.log
```

### 查看任务状态
```bash
# 列出所有运行中的任务
ls -la tasks/active/

# 查看具体任务
cat tasks/active/task-xxx.json
```

### 查看任务结果
```bash
# 列出所有任务结果
ls -la task-results/

# 查看具体结果
cat task-results/task-xxx.json
```

## 🗂️ 目录结构

```
CodeAI/
├── dist/                      # 编译输出
│   └── orchestrator/
├── src/                       # 源代码
│   └── orchestrator/
├── tasks/                     # 任务
│   ├── active/               # 进行中的任务
│   │   └── progress-snapshot.json  # 进度快照
│   └── completed/            # 已完成任务
├── context/                   # 业务上下文
│   ├── iterations/           # 迭代需求 ⬅️ 在这里输入需求
│   ├── decisions/            # 决策记录
│   ├── meetings/             # 会议记录
│   └── learnings/            # 学习记录
├── worktrees/                 # Git worktrees
├── logs/                      # 日志文件
│   ├── orchestrator.log
│   ├── monitor.log
│   └── cron.log
├── task-results/              # 任务结果
├── scripts/                   # 辅助脚本
├── package.json
├── tsconfig.json
└── .env                       # 环境配置
```

## 📝 添加需求

### 方式 1: 创建迭代文件
```bash
echo "我想开发一个功能..." > context/iterations/my-feature.md
```

### 方式 2: 创建详细的需求文件
```bash
nano context/iterations/my-feature.md
```

内容示例：
```markdown
# 功能需求

## 描述
实现用户登录功能

## 技术栈
- 前端：React + TypeScript
- 后端：Node.js + Express

## 功能要求
1. 邮箱登录
2. 手机号登录
3. 第三方登录（微信、GitHub）

## 优先级
P0（必须）
```

## 🎨 进度条示例

- `[░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]` 0% - 未开始
- `[████████░░░░░░░░░░░░░░░░░░░░░░░░]` 30% - 进行中
- `[████████████████░░░░░░░░░░░░░░░░]` 50% - 一半
- `[████████████████████████████░░░]` 80% - 快完成
- `[████████████████████████████████]` 100% - 完成

## 🎯 任务状态

- ⏸️ **pending** - 待定
- 🚀 **started** - 已开始
- ⏳ **in-progress** - 进行中
- ✅ **completed** - 已完成
- ❌ **failed** - 失败

## 🌈 颜色含义

- 🟢 **绿色** - 完成、成功
- 🟡 **黄色** - 进行中、警告
- 🔴 **红色** - 失败、错误
- 🔵 **蓝色** - 信息、步骤

## 🔧 故障排查

### 问题：Agent 没有启动
```bash
# 检查配置
cat .env | grep API_KEY

# 查看日志
tail -f logs/orchestrator.log

# 运行健康检查
npm run health-check
```

### 问题：worktree 创建失败
```bash
# 检查 Git 仓库
git status

# 清理 worktrees
npm run worktree:clean
```

### 问题：进度没有更新
```bash
# 检查进度快照
cat tasks/active/progress-snapshot.json

# 查看日志
tail -f logs/orchestrator.log
```

## 📱 Telegram 通知（可选）

### 配置步骤
1. 创建 Bot：找 @BotFather 发送 `/newbot`
2. 获取 Token：Bot 会给你一个 token
3. 获取 Chat ID：找 @userinfobot 发送任意消息
4. 配置 `.env`：
   ```env
   TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
   TELEGRAM_CHAT_ID=123456789
   TELEGRAM_ENABLED=true
   ```

## 💡 最佳实践

1. **清晰的需求描述**
   - 详细描述功能
   - 指定技术栈
   - 标记优先级

2. **定期查看日志**
   ```bash
   tail -f logs/orchestrator.log
   ```

3. **定期清理**
   ```bash
   npm run worktree:clean
   ```

4. **使用增强版编排器**
   - 实时进度
   - 任务清单
   - 断点续传

## 📞 获取帮助

- 查看文档：`README.md`
- 使用指南：`ENHANCED_GUIDE.md`
- 完成报告：`ENHANCEMENT_SUMMARY.md`
- 查看日志：`logs/orchestrator.log`

## 🎉 快速流程

```
1. 配置环境 → 2. 添加需求 → 3. 启动编排器 → 4. 观察进度 → 5. Review PR
```

---

**💩 爸爸，有问题随时叫我！**
