# 快速开始指南

## 🎯 5 分钟上手 Agent 集群系统

### 步骤 1: 安装依赖

```bash
cd /Users/apple/Downloads/MyCarTest/CodeAIs
npm install
```

### 步骤 2: 配置环境

```bash
# 复制配置文件
cp .env.example .env

# 编辑 .env 文件，填写你的配置
nano .env
```

至少需要填写：
- `CLAUDE_API_KEY` - 你的智谱 API Key
- `CLAUDE_API_URL` - https://open.bigmodel.cn/api/anthropic
- `GIT_REPO_URL` - 你的 GitHub 仓库地址

### 步骤 3: 初始化系统

```bash
# 运行初始化脚本
bash scripts/setup.sh
```

这会：
- 创建所有必要的目录
- 初始化 Git 仓库
- 创建示例迭代需求
- 编译 TypeScript 代码

### 步骤 4: 添加你的需求

在 `context/iterations/` 目录下创建新的需求文件：

```bash
echo "我想开发一个功能..." > context/iterations/my-iteration.md
```

### 步骤 5: 启动编排器

```bash
npm run orchestrator
```

编排器会自动：
- 读取你的需求
- 拆解任务
- 启动 Agent
- 监控进度

### 步骤 6: 设置监控（可选）

使用 cron 每 10 分钟监控一次：

```bash
crontab -e
```

添加以下行：
```
*/10 * * * * cd /Users/apple/Downloads/MyCarTest/CodeAIs && npm run monitor >> logs/cron.log 2>&1
```

## 🚀 使用示例

### 示例 1: 开发新功能

1. 创建需求文件 `context/iterations/new-feature.md`
2. 运行 `npm run orchestrator`
3. 系统会自动：
   - 理解需求
   - 拆解任务
   - 选择合适的 Agent
   - 生成代码
   - 创建 PR

### 示例 2: 修复 Bug

1. 在需求文件中描述 Bug
2. 运行 `npm run orchestrator`
3. 系统会自动：
   - 定位 Bug
   - 生成修复代码
   - 编写测试
   - 创建 PR

### 示例 3: 手动启动 Agent

```bash
# 启动一个 Claude Code Agent
bash scripts/start-agent.sh task-001 claude-code high "实现用户登录功能"
```

## 📊 监控和调试

### 查看任务状态

```bash
# 列出所有任务
ls -la tasks/active/

# 查看具体任务
cat tasks/active/task-xxx.json

# 查看日志
tail -f logs/orchestrator.log
```

### 查看运行中的 Agent

```bash
# 列出所有 worktrees
git worktree list

# 查看 tmux 会话
tmux ls

# 附加到 tmux 会话查看输出
tmux attach -t agent-xxx
```

### 健康检查

```bash
node dist/monitors/health-check.js
```

## 🔄 工作流详解

### 完整的 8 步流程

1. **需求输入** → 创建迭代需求文件
2. **编排器理解** → 读取并拆解任务
3. **启动 Agent** → 创建 worktree + tmux
4. **自动监控** → 每 10 分钟检查状态
5. **Agent 创建 PR** → 提交代码并创建 PR
6. **自动审查** → 多个 Agent 进行 code review
7. **自动化测试** → CI 运行测试
8. **人工合并** → 通知你进行最终 review

### Ralph Loop（从失败中学习）

系统不是简单重试失败的任务，而是：
1. 分析失败原因
2. 重新生成 prompt（应用学习）
3. 再次执行
4. 记录成功/失败模式

时间越长，系统越智能！

## 💡 最佳实践

1. **清晰的需求描述**
   - 详细的业务需求
   - 技术栈偏好
   - 优先级标记

2. **定期清理**
   ```bash
   # 清理完成的任务
   bash scripts/worktree-manager.sh clean
   ```

3. **监控日志**
   ```bash
   # 查看编排器日志
   tail -f logs/orchestrator.log

   # 查看监控日志
   tail -f logs/monitor.log
   ```

4. **版本控制**
   - 定期提交配置变更
   - 使用 git tags 标记重要里程碑

## 🛠️ 故障排查

### 问题：Agent 没有启动

检查：
1. `.env` 配置是否正确
2. API Key 是否有效
3. 网络连接是否正常

### 问题：worktree 创建失败

检查：
1. Git 仓库是否正常
2. 是否有足够的磁盘空间
3. 工作目录权限

### 问题：tmux 会话无法创建

检查：
1. tmux 是否已安装（`which tmux`）
2. 没有冲突的会话名

## 📞 获取帮助

- 查看 README.md 了解架构详情
- 查看 logs/ 目录下的日志文件
- 运行健康检查：`npm run health-check`

## 🎉 开始使用吧！

现在你已经准备好了，开始你的 AI 自动化之旅吧！

```bash
# 启动编排器
npm run orchestrator

# 或手动启动一个 Agent
bash scripts/start-agent.sh my-task claude-code high "实现一个TODO列表"
```

祝你好运！🚀
