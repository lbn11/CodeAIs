# 手动上传到 GitHub 步骤

## 方法 1：GitHub CLI（推荐但需要登录）

### 1. 登录 GitHub CLI

```bash
gh auth login
```

选择：
- 平台：GitHub.com
- 协议：HTTPS
- 认证方式：Paste an authentication token（推荐，避免网络问题）

### 2. 创建 Personal Access Token

如果选择 token 方式：
1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 勾选权限：
   - `repo`（完全访问仓库）
   - `workflow`（GitHub Actions）
4. 生成并复制 token
5. 粘贴到 CLI 中

### 3. 创建仓库并推送

```bash
cd /Users/apple/Downloads/MyCarTest/CodeAIs
gh repo create CodeAIs --public --source=. --remote=origin
git push -u origin main
```

---

## 方法 2：手动创建仓库（简单，不需要 CLI）

### 1. 在 GitHub 网站创建仓库

1. 访问 https://github.com/new
2. 仓库名：`CodeAIs`
3. 选择 Public 或 Private
4. **不要**勾选 "Initialize with README"
5. 点击 "Create repository"

### 2. 添加远程仓库

```bash
cd /Users/apple/Downloads/MyCarTest/CodeAIs
git remote add origin https://github.com/你的用户名/CodeAIs.git
```

把 `你的用户名` 替换成你的 GitHub 用户名

### 3. 推送代码

```bash
git push -u origin main
```

---

## 方法 3：使用 SSH（如果你配置了 SSH）

```bash
cd /Users/apple/Downloads/MyCarTest/CodeAIs
git remote add origin git@github.com:你的用户名/CodeAIs.git
git push -u origin main
```

---

## 推送成功后

仓库会有：
- ✅ 完整的 Agent 集群系统
- ✅ GitHub Actions CI 配置
- ✅ 所有文档和配置

你可以：
1. 访问 GitHub 仓库查看代码
2. 配置 GitHub Secrets（用于 CI）
3. 开始使用系统

---

## 推荐方法

如果你有 GitHub 账号但没配置过 CLI，推荐**方法 2**：
- 最简单
- 不需要额外配置
- 一次搞定
