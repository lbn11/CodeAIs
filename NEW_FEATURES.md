# 新增功能说明

## 🎉 完整测试流程 + 任务记录 + Telegram 通知

根据原文要求，系统现在包含以下三个关键功能：

## 1. 完整自动化测试流程 🧪

### 测试步骤（5 步）

```
代码提交 → Lint → TypeScript → 单元测试 → E2E测试 → UI截图 → 完成报告
```

### 详细流程

#### 1. ESLint 检查
- 检查代码风格
- 报告错误和警告
- 分数权重：20 分

#### 2. TypeScript 类型检查
- 确保类型安全
- 检测类型错误
- 分数权重：20 分

#### 3. 单元测试
- 运行所有单元测试
- 计算测试覆盖率
- 分数权重：30 分

#### 4. E2E 测试
- 使用 Playwright 运行端到端测试
- 在预览环境中测试
- 分数权重：20 分

#### 5. UI 截图
- 自动检测 UI 变化
- 截取变化后的界面
- 保存到 `screenshots/` 目录
- 分数权重：10 分（基于覆盖率）

### 测试评分

总分 100 分，80 分以上才算通过：
- ✅ **90-100 分**：优秀，可以直接合并
- ✅ **80-89 分**：良好，需要 review
- ❌ **< 80 分**：不合格，需要修复

### 配置

在 `.env` 文件中：

```env
# 是否运行完整测试流程
RUN_FULL_TEST_SUITE=true

# 最低通过分数
MIN_TEST_SCORE=80
```

### 手动运行测试

```bash
# 运行完整测试流程（需要先进入 worktree）
cd worktrees/task-xxx
npm run test  # 或者自定义的测试命令
```

---

## 2. 任务完成记录 JSON 📝

### 记录内容

每个任务完成后，系统会生成详细的 JSON 记录，包含：

```json
{
  "taskId": "task-123",
  "type": "feature",
  "description": "实现用户登录功能",
  "status": "completed",

  "filesChanged": ["src/auth/login.ts", "src/types/user.ts"],
  "commitCount": 5,
  "prUrl": "https://github.com/...",
  "branchName": "feat/task-123",

  "testResults": {
    "passed": 25,
    "failed": 0,
    "skipped": 2,
    "coverage": 85.5
  },
  "testCoverage": 85.5,

  "uiChanges": {
    "afterScreenshot": "screenshots/ui-changes.png",
    "description": "新增登录页面"
  },

  "codeReviews": [
    {
      "agent": "codex",
      "status": "approved",
      "comments": []
    }
  ],

  "agent": "claude-code",
  "duration": 1800000,
  "retries": 0,
  "startedAt": 1234567890,
  "completedAt": 1234569690,

  "learningData": {
    "prompt": "完整的 prompt...",
    "successfulPatterns": [
      "使用 TypeScript 类型定义",
      "编写完整的测试"
    ],
    "failedPatterns": [],
    "contextUsed": ["customerNotes", "meetingNotes"],
    "decisions": ["使用 JWT 认证"]
  },

  "metrics": {
    "codeQualityScore": 87.5,
    "testPassRate": 1.0,
    "reviewApprovalRate": 1.0,
    "timeEfficiency": 0.5
  }
}
```

### 为什么这个 JSON 很重要？

#### 1. 学习和改进
- **成功模式**：什么做法有效
- **失败模式**：什么做法导致失败
- **Prompt 优化**：如何改进 prompt

#### 2. 上下文传递
- 后续任务可以参考历史成功案例
- 避免重复同样的错误
- 学习最佳实践

#### 3. 性能指标
- 代码质量评分
- 测试通过率
- 审批通过率
- 时间效率

#### 4. 决策依据
- 为你提供 review 的依据
- 了解代码质量
- 评估 Agent 表现

### 记录位置

```
task-results/
├── task-001.json         # 任务 001 的完成记录
├── task-002.json         # 任务 002 的完成记录
├── learning-data/         # 学习数据
│   ├── feature.json      # 功能开发的学习数据
│   ├── bugfix.json       # Bug 修复的学习数据
│   └── ...
└── failures/             # 失败记录
    └── task-003.json     # 任务 003 的失败记录
```

### 如何使用这些记录？

#### 查看任务历史

```bash
# 查看所有任务记录
ls task-results/

# 查看具体任务
cat task-results/task-001.json
```

#### 获取成功模式（用于 prompt 生成）

系统会自动读取历史成功模式，并应用到新的 prompt 中。

#### 分析失败原因

```bash
# 查看失败记录
cat task-results/failures/task-003.json
```

---

## 3. Telegram 通知 + UI 截图 📱

### 通知内容

任务完成后，你会收到 Telegram 通知，包含：

1. **任务信息**
   - 任务 ID
   - 任务描述
   - PR 链接

2. **测试结果**
   - 单元测试：25/26 通过
   - 覆盖率：85.5%

3. **质量指标**
   - 代码质量：87.5/100
   - 测试通过率：100%
   - 审批通过率：100%

4. **UI 截图**
   - 如果有 UI 变化，会发送截图
   - 你可以直接看到界面变化

### 通知示例

```
✅ 任务完成

任务: `task-123`
描述: 实现用户登录功能

PR: https://github.com/xxx/pull/1

📊 测试结果:
   单元测试: 25/26 通过
   覆盖率: 85.5%

🎯 质量指标:
   代码质量: 87.5/100
   测试通过率: 100%
   审批通过率: 100%

[UI 截图]

👀 请 review 并决定是否合并 PR。
```

### 配置 Telegram

1. 创建一个 Telegram Bot
   - 找 @BotFather
   - 发送 `/newbot`
   - 获取 bot token

2. 获取你的 Chat ID
   - 找 @userinfobot
   - 发送任意消息
   - 获取你的 chat_id

3. 配置 `.env` 文件

```env
# Telegram 配置
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHAT_ID=123456789
TELEGRAM_ENABLED=true
```

### 通知时机

- ✅ **任务开始**：通知任务已开始处理
- ✅ **任务完成**：通知测试结果和质量指标
- ❌ **任务失败**：通知失败原因
- ⚠️ **测试失败**：通知测试未通过

### UI 截图

如果任务涉及 UI 变化：
- 系统自动检测 UI 文件变更（.tsx, .css 等）
- 使用 Playwright 截取界面
- 随 Telegram 通知一起发送

---

## 完整工作流

```
你输入需求
    ↓
编排器理解并拆解
    ↓
选择 Agent 并启动
    ↓
Agent 写代码
    ↓
创建 PR
    ↓
【自动化】运行完整测试流程
    ├─ ESLint (20分)
    ├─ TypeScript (20分)
    ├─ 单元测试 (30分)
    ├─ E2E测试 (20分)
    └─ UI截图 (覆盖率 10分)
    ↓
【记录】保存详细 JSON
    ├─ 代码变更
    ├─ 测试结果
    ├─ UI 变化
    ├─ 学习数据
    └─ 性能指标
    ↓
【通知】Telegram + 截图
    ├─ 任务信息
    ├─ 测试结果
    ├─ 质量指标
    └─ UI 截图
    ↓
你 review 并决定是否合并
    ↓
系统学习（成功/失败）
```

---

## 常见问题

### Q: 测试失败会通知吗？

A: 会。测试会继续运行完成，但会发送通知告诉你测试未通过，需要人工审查。

### Q: UI 截图什么时候发送？

A: 只有当检测到 UI 文件变更（.tsx, .css, .vue 等）时才会截取并发送截图。

### Q: 任务 JSON 存在哪里？

A: 存在 `task-results/` 目录下，用于后续学习和上下文传递。

### Q: 如何查看测试分数？

A: 在 Telegram 通知中会显示，也可以查看 `task-results/task-xxx.json` 文件。

### Q: 最低通过分数可以调整吗？

A: 可以，在 `.env` 文件中修改 `MIN_TEST_SCORE=80`。

---

## 下一步

1. 配置 Telegram（可选但推荐）
2. 测试完整流程
3. 添加你的第一个需求
4. 启动编排器
5. 收到通知并 review PR

🚀 开始体验吧！
