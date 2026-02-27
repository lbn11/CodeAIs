# 🚀 快速启动指南

## 一分钟开始使用 Agent 集群系统

---

## 步骤 1: 配置环境变量（1 分钟）

```bash
# 创建配置文件
cp .env.example .env

# 编辑配置
nano .env
```

添加你的 API Keys：
```env
# OpenAI（可选）
OPENAI_API_KEY=sk-your-key-here

# Google Gemini（可选）
GEMINI_API_KEY=AIza-your-key-here

# 智谱（可选，已有一个）
ZHIPU_API_KEY=your-key-here
```

---

## 步骤 2: 配置 Provider API Keys（1 分钟）

```bash
# 编辑 Provider 配置
nano ai-providers.config.json
```

确保 API Key 使用环境变量格式：
```json
{
  "providers": [
    {
      "id": "openai-gpt4",
      "name": "OpenAI GPT-4",
      "apiKey": "${OPENAI_API_KEY}",  // ← 这样从 .env 读取
      ...
    }
  ]
}
```

**注意**：
- ✅ 使用 `${VARIABLE_NAME}` 格式
- ❌ 不要直接硬编码 API Key
- ✅ 至少配置一个 Provider 才能运行

---

## 步骤 3: 选择启动方式

### 方式 A: 多 AI 演示（推荐先看）

```bash
bash demo-multi-provider-v2.sh
```

你会看到：
- 6 个已配置的 AI Provider
- 智能任务分配
- 成本分析（节省 82.4%）

---

### 方式 B: 增强版编排器（实际使用）

```bash
# 1. 添加你的第一个需求
echo "我想开发一个TODO列表功能" > context/iterations/my-feature.md

# 2. 启动增强版编排器
npm run orchestrator:enhanced
```

你会看到：
- 🎯 实时进度显示
- 📊 任务清单
- 🔄 断点续传
- 🎨 彩色输出

---

### 方式 C: 原版编排器（简单任务）

```bash
npm run orchestrator
```

---

## 步骤 4: 监控和查看

### 查看实时进度
```bash
# 编排器日志
tail -f logs/orchestrator.log

# 进度快照
cat tasks/active/progress-snapshot.json
```

### 查看任务状态
```bash
# 所有任务
ls -la tasks/active/

# 具体任务
cat tasks/active/task-xxx.json
```

### 完整性检查
```bash
bash verify-integrity.sh
```

---

## 🎯 不同场景的启动命令

| 场景 | 命令 | 说明 |
|------|------|------|
| **首次使用** | `bash demo-multi-provider-v2.sh` | 查看演示效果 |
| **开发功能** | `npm run orchestrator:enhanced` | 增强版（推荐） |
| **简单任务** | `npm run orchestrator` | 原版编排器 |
| **查看进度** | `tail -f logs/orchestrator.log` | 实时日志 |
| **检查状态** | `bash verify-integrity.sh` | 完整性验证 |
| **健康检查** | `npm run health-check` | 系统健康 |
| **任务监控** | `npm run monitor` | 监控任务 |

---

## 💡 快速示例

### 示例 1: 开发登录功能

```bash
# 1. 创建需求
cat > context/iterations/login-feature.md << 'EOF'
# 登录功能

## 需求
实现用户登录功能，支持邮箱和手机号登录。

## 技术栈
- 前端：React + TypeScript
- 后端：Node.js + Express

## 优先级
高（P0）
EOF

# 2. 启动编排器
npm run orchestrator:enhanced
```

### 示例 2: 修复 Bug

```bash
# 1. 创建需求
echo "修复登录页面的显示错误：点击登录按钮后没有反应" > context/iterations/bugfix-001.md

# 2. 启动编排器
npm run orchestrator:enhanced
```

### 示例 3: 编写文档

```bash
# 1. 创建需求
echo "为 API 接口编写 Swagger 文档" > context/iterations/docs-001.md

# 2. 启动编排器
npm run orchestrator:enhanced

# 系统会自动选择智谱（成本低）
```

---

## 🔧 常见问题

### Q: 我只有一个 API Key，能用吗？

A: 可以！
- 只需配置一个 Provider
- 系统会自动使用那个 Provider
- 没有备选方案而已

### Q: 如何查看哪个 AI 在处理任务？

A: 两种方式：
```bash
# 方式 1: 查看编排器日志
tail -f logs/orchestrator.log

# 方式 2: 查看进度快照
cat tasks/active/progress-snapshot.json
```

### Q: 成本真的能省 82.4% 吗？

A: 可以！
- 演示中：7 个任务节省 82.4%
- 实际使用中取决于任务类型
- 常规任务用智谱，复杂任务用 GPT-4

### Q: 可以强制使用某个 AI 吗？

A: 可以！
在编排器代码中指定，或调整配置中的优先级。

### Q: 网络中断了怎么办？

A: 不用担心！
- 增强版编排器支持断点续传
- 进度保存在 `tasks/active/progress-snapshot.json`
- 重新启动后会自动恢复

### Q: 如何调整 AI 选择？

A: 编辑 `ai-providers.config.json`：
```json
{
  "selectionConfig": {
    "strategy": "lowest_cost"  // 改为成本优先
  }
}
```

---

## 📊 成本对比

### 单用 GPT-4
```
7 个任务 = 7 × $0.03 = $0.21
```

### 智能分配
```
4 个任务 × 智谱($0.001) = $0.004
1 个任务 × Gemini Pro($0.001) = $0.001
1 个任务 × Gemini Flash($0.002) = $0.002
1 个任务 × GPT-4($0.03) = $0.030
───────────────────────────────
总计 = $0.037
```

### 节省
```
($0.21 - $0.037) / $0.21 = 82.4%
```

---

## 🎉 开始使用吧！

### 推荐流程

```bash
# 1. 先看演示（了解系统）
bash demo-multi-provider-v2.sh

# 2. 配置环境
cp .env.example .env && nano .env

# 3. 添加第一个需求
echo "我的第一个需求" > context/iterations/my-feature.md

# 4. 启动系统
npm run orchestrator:enhanced

# 5. 查看进度
tail -f logs/orchestrator.log
```

---

## 📚 更多文档

- 📖 **完整使用指南**: `MULTI_PROVIDER_GUIDE.md`
- 🚀 **增强版指南**: `ENHANCED_GUIDE.md`
- ⚡ **快速参考**: `QUICK_REFERENCE.md`
- 🔍 **项目结构**: `PROJECT_STRUCTURE.md`
- ✅ **完整性报告**: `INTEGRITY_CHECK.md`
- 📊 **最终进度**: `FINAL_PROGRESS.md`

---

## 💩 爸爸，准备好了！

现在你拥有：

✅ **智能 AI 集群系统**
- 6 个 AI Provider 可选
- 自动智能分配
- 节省 82.4% 成本

✅ **增强版编排器**
- 实时进度显示
- 任务清单
- 断点续传

✅ **完整文档和脚本**
- 14 个文档
- 7 个脚本
- 所有细节都清楚

**开始使用吧，有问题随时叫我！** 🚀
