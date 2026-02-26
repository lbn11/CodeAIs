# Agent 集群系统 - OpenClaw + Claude Code

## 🏗️ 架构概述

这是一个双层 Agent 系统，灵感来自 OpenClaw + Codex 的强大架构：

### 双层架构

1. **编排层 (Orchestrator)** - 位于你和所有 AI 工具之间
   - 持有所有业务上下文（需求、会议记录、决策历史）
   - 理解并拆解任务
   - 选择合适的 Agent
   - 监控任务进度
   - 从失败中学习

2. **执行层 (Agents)** - 专注写代码
   - Codex/Claude Code - 写代码
   - 执行具体任务
   - 只获得完成任务所需的最小上下文

## 📁 目录结构

```
.
├── orchestrator/          # 编排层
│   ├── index.ts          # 主入口
│   ├── task-manager.ts   # 任务管理
│   ├── prompt-generator.ts # Prompt 生成器
│   ├── context-loader.ts # 上下文加载器
│   └── agent-selector.ts # Agent 选择器
├── agents/               # 执行层配置
│   ├── config.json       # Agent 配置
│   └── prompts/          # Agent 提示模板
├── scripts/              # 辅助脚本
│   ├── start-agent.sh    # 启动 Agent
│   ├── worktree-manager.sh # worktree 管理
│   └── setup.sh          # 初始化脚本
├── monitors/             # 监控系统
│   ├── task-monitor.js   # 任务监控
│   └── health-check.js   # 健康检查
├── tasks/                # 任务记录
│   └── active/           # 当前任务
├── context/              # 业务上下文
│   ├── iterations/       # 迭代入口（文本、图片、会议记录）
│   ├── decisions/        # 决策记录
│   └── learnings/        # 学习记录
└── worktrees/            # Git worktrees
```

## 🚀 快速开始

### 1. 初始化

```bash
npm install
./scripts/setup.sh
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写：

```env
OPENCLAW_REPO=/Users/apple/Downloads/MyCarTest/CodeAIs
CLAUDE_API_KEY=d7dd5651cdff4008ab164cee716a375a.yq5OBBUVXdiJcZbD
CLAUDE_API_URL=https://open.bigmodel.cn/api/anthropic
GIT_REPO_URL=https://github.com/your-username/CodeAIs.git
```

### 3. 添加迭代需求

在 `context/iterations/` 目录下创建新的迭代文件：

```bash
echo "我想开发一个儿童小汽车视频平台，支持上传、播放、评论功能" > context/iterations/iteration-001.md
```

### 4. 启动编排器

```bash
npm run orchestrator
```

编排器会：
1. 读取迭代需求
2. 拆解任务
3. 启动相应的 Agent
4. 监控进度
5. 学习和改进

## 🎯 使用场景

- **产品构思**: 理解需求，提出技术方案
- **需求拆分**: 将大需求分解为可执行任务
- **自动化开发**: 自动编写代码、测试、文档
- **UI 开发**: 设计并实现界面
- **Bug 修复**: 分析问题，生成修复代码
- **功能开发**: 完整的功能实现流程

## 📊 监控

启动监控（建议用 cron）：

```bash
# 每 10 分钟检查一次
*/10 * * * * cd /path/to/CodeAIs && node monitors/task-monitor.js
```

## 🔑 核心概念

### Ralph Loop (改进版)

不只是重复执行，而是从失败中学习：

1. 拉取上下文 → 生成 prompt → 执行 → 评估
2. 如果失败，分析原因，**重写 prompt**，再执行
3. 成功的模式被记录，失败的经验也被记录

### Agent 选择策略

- **Codex**: 复杂后端逻辑、多文件重构
- **Claude Code**: 前端工作、快速迭代
- **Gemini**: UI 设计、视觉工作

### 安全边界

- 执行层 Agent **永远不接触** 生产数据库
- 执行层 Agent **永远不看到** 客户敏感信息
- 只传递完成任务所需的**最小上下文**

## 💡 工作流示例

### 从需求到 PR（8 步）

1. **需求输入** → 编排器理解并拆解
2. **启动 Agent** → 创建 worktree + tmux 会话
3. **自动监控** → cron 检查状态（100% 确定性）
4. **Agent 创建 PR** → 提交代码、推送、创建 PR
5. **Code Review** → 自动审查（多个 Agent）
6. **自动化测试** → CI 运行（lint、测试、E2E）
7. **人工 Review** → 通知你，5-10 分钟 review
8. **合并 PR** → 清理 worktree 和任务记录

## 📈 预期效果

- 单日 50+ 次提交
- 30 分钟完成多个 PR
- 客户需求当天交付
- 成本：起步 ¥200/月，重度使用 ¥500/月

## 🛠️ 开发

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 测试
npm test
```

## 📝 日志

日志保存在 `logs/` 目录：
- `orchestrator.log` - 编排器日志
- `agents.log` - Agent 日志
- `tasks.log` - 任务日志

## 🤝 贡献

欢迎提交 issue 和 PR！

## 📄 License

MIT

---

**记住**: 这不是堆 AI 工具，而是构建一个**递归自我改进的系统**。时间越长，它越聪明。🚀
