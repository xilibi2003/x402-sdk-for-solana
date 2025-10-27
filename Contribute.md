# SDK 贡献指南

本文档介绍如何参与 X402 SDK for Solana 的开发和发布。

## 目录

- [参与 SDK 开发](#参与-sdk-开发)
  - [开发环境设置](#开发环境设置)
  - [项目结构](#项目结构)
  - [SDK 模块说明](#sdk-模块说明)
  - [本地开发和测试](#本地开发和测试)
  - [开发流程](#开发流程)
- [构建和发布 SDK](#构建和发布-sdk)
  - [准备发布](#准备发布)
  - [发布到 npm](#发布到-npm)
  - [版本管理](#版本管理)
  - [自动化发布](#自动化发布)
  - [故障排除](#故障排除)

---

## 参与 SDK 开发

### 开发环境设置

#### 1. 克隆仓库

```bash
git clone https://github.com/xilibi2003/x402-sdk-for-solana.git
cd x402-sdk-for-solana
```

#### 2. 安装依赖

```bash
pnpm install
```

#### 3. 构建 SDK

```bash
pnpm build
```

### 项目结构

```
x402-sdk-for-solana/
├── lib/                        # 核心库代码
│   ├── x402/                  # X402 协议实现
│   │   ├── client/           # 客户端功能
│   │   ├── facilitator/      # Facilitator 功能
│   │   ├── schemes/          # 支付方案（exact）
│   │   ├── shared/           # 共享工具和类型
│   │   └── types/            # TypeScript 类型定义
│   ├── x402-express/         # Express 中间件
│   └── x402-fetch/           # Fetch 封装器
├── examples/                  # 示例代码
│   ├── facilitator.ts        # Facilitator 示例
│   ├── server_express.ts     # Server 示例
│   └── client_fetch.ts       # Client 示例
├── scripts/                   # 工具脚本
│   └── setup-localnet.ts     # Localnet 自动化设置
├── dist/                      # 构建输出（自动生成）
├── index.ts                   # 主入口文件
├── tsconfig.json             # TypeScript 配置
├── package.json              # 包配置
├── .env                       # Facilitator 配置
├── .env_server               # Server 配置
└── .env_client               # Client 配置
```

### SDK 模块说明

#### 主模块 (`x402-sdk-for-solana`)
- **入口文件**: `index.ts`
- **主要导出**: `paymentMiddleware`、类型定义
- **用途**: 服务端集成

#### Express 中间件 (`x402-sdk-for-solana/express`)
- **路径**: `lib/x402-express/`
- **导出**: `paymentMiddleware`
- **用途**: Express 应用集成

#### Client 模块 (`x402-sdk-for-solana/client`)
- **路径**: `lib/x402/client/`
- **导出**: `createPaymentHeader`、支付选择器
- **用途**: 客户端支付头创建

#### Facilitator 模块 (`x402-sdk-for-solana/facilitator`)
- **路径**: `lib/x402/facilitator/`
- **导出**: `verify`、`settle`
- **用途**: 支付验证和结算服务

#### Types 模块 (`x402-sdk-for-solana/types`)
- **路径**: `lib/x402/types/`
- **导出**: 所有 TypeScript 类型和接口
- **用途**: 类型定义

#### Fetch 模块 (`x402-sdk-for-solana/fetch`)
- **路径**: `lib/x402-fetch/`
- **导出**: `wrapFetchWithPayment`、`createSigner`、`decodeXPaymentResponse`
- **用途**: 客户端 Fetch 封装

### 本地开发和测试

#### 必需工具

- **Node.js**: >= 18.0.0
- **pnpm**: >= 10.0.0
- **Solana CLI Tools** (用于 localnet 测试):
  - `solana-cli`
  - `spl-token-cli`

#### 安装 Solana CLI Tools

```bash
# macOS/Linux
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# 验证安装
solana --version
spl-token --version
```

#### 本地测试步骤

1. **启动 Solana Localnet**

```bash
solana-test-validator
```

2. **运行自动化设置脚本**

```bash
pnpm setup-localnet
```

这会自动完成以下操作：
- 生成 3 个密钥对（facilitator、server、client）
- 为所有账户空投 SOL
- 创建自定义 SPL Token
- 为所有账户创建 Token 账户并充值
- 输出配置好的环境变量

3. **配置环境变量**

将脚本输出的环境变量分别保存到 `.env_facilitator`、`.env_server` 和 `.env_client` 文件中。

4. **启动测试服务**

切换到 expamples 目录下，在三个不同的终端中分别运行：

```bash
# 终端 1 - Facilitator
pnpm run facilitator

# 终端 2 - Server
pnpm run server

# 终端 3 - Client
pnpm run client
```

### 开发流程

#### 添加新功能

```bash
# 1. 创建功能分支
git checkout -b feature/my-feature

# 2. 在 lib/ 目录下编辑代码

# 3. 构建测试
pnpm build

# 4. 在 examples/ 中测试功能
pnpm run facilitator   # 启动 facilitator
pnpm run server        # 启动 server
pnpm run client        # 测试 client

# 5. 提交更改
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature
```

#### 修复 Bug

```bash
# 1. 创建修复分支
git checkout -b fix/bug-description

# 2. 修复 bug

# 3. 测试修复
pnpm build
pnpm run client

# 4. 提交修复
git add .
git commit -m "fix: bug description"
git push origin fix/bug-description
```

#### 提交 Pull Request

1. Fork 本仓库
2. 创建功能分支
3. 提交更改并推送到你的 fork
4. 创建 Pull Request
5. 等待代码审查

#### 代码提交检查清单

在提交 PR 之前，请确保：

- [ ] 代码遵循项目的编码规范
- [ ] 添加了必要的类型定义
- [ ] 更新了相关文档
- [ ] 在 examples/ 中添加了使用示例
- [ ] 构建成功 (`pnpm build`)
- [ ] 本地测试通过
- [ ] 更新了 CHANGELOG.md（如果适用）

---

## 构建和发布 SDK

### 准备发布

#### 1. 更新版本号

根据语义化版本规范更新版本：

```bash
# 补丁版本（bug 修复）: 0.1.0 -> 0.1.1
npm version patch

# 次要版本（新功能，向后兼容）: 0.1.0 -> 0.2.0
npm version minor

# 主要版本（破坏性更改）: 0.1.0 -> 1.0.0
npm version major
```

#### 2. 更新 package.json 信息

确保以下字段正确：

```json
{
  "name": "x402-sdk-for-solana",
  "version": "0.1.1",
  "description": "TypeScript SDK for X402 protocol on Solana",
  "repository": {
    "type": "git",
    "url": "https://github.com/xilibi2003/x402-sdk-for-solana"
  },
  "bugs": {
    "url": "https://github.com/xilibi2003/x402-sdk-for-solana/issues"
  },
  "homepage": "https://github.com/xilibi2003/x402-sdk-for-solana#readme",
  "author": "Your Name <your.email@example.com>"
}
```

#### 3. 构建项目

```bash
# 清理旧的构建
pnpm clean

# 构建项目
pnpm build

# 检查构建产物
ls -la dist/
```

#### 4. 检查打包内容

预览将要发布的内容：

```bash
npm pack --dry-run
```

确保：
- ✅ `dist/` 目录被包含
- ✅ `README.md` 被包含
- ✅ `LICENSE` 被包含
- ❌ `node_modules/` 没有被包含
- ❌ `.env` 文件没有被包含
- ❌ `examples/` 没有被包含

### 发布到 npm

#### 首次发布

**1. 注册 npm 账号**

如果还没有 npm 账号：
1. 访问 https://www.npmjs.com/signup
2. 注册一个新账号

**2. 登录 npm**

```bash
npm login
```

输入你的用户名、密码和邮箱。

**3. 发布包**

```bash
# 首次发布为公开包
npm publish --access public
```

> **注意**: 使用 `--access public` 标志是因为默认情况下，scoped 包（以 @ 开头的包名）是私有的。

#### 后续发布

```bash
# 1. 更新版本号
npm version patch  # 或 minor, major

# 2. 构建项目
pnpm build

# 3. 推送到 Git
git push && git push --tags

# 4. 发布新版本
npm publish
```

#### 使用 pnpm 发布

如果你使用 pnpm 作为包管理器：

```bash
# 登录
pnpm login

# 发布
pnpm publish --access public
```

#### 发布 Beta 版本

```bash
# 1. 创建 beta 版本
npm version prerelease --preid=beta

# 2. 发布为 beta tag
npm publish --tag beta --access public
```

用户可以这样安装 beta 版本：
```bash
npm install x402-sdk-for-solana@beta
```

#### 发布后验证

**1. 在 npm 上查看**

访问: https://www.npmjs.com/package/x402-sdk-for-solana

**2. 测试安装**

在一个新的项目中测试安装：

```bash
mkdir test-install
cd test-install
npm init -y
npm install x402-sdk-for-solana
```

**3. 测试导入**

创建 `test.mjs`:

```javascript
import { paymentMiddleware } from 'x402-sdk-for-solana';
import { wrapFetchWithPayment } from 'x402-sdk-for-solana/fetch';

console.log('Import successful!');
console.log('paymentMiddleware:', typeof paymentMiddleware);
console.log('wrapFetchWithPayment:', typeof wrapFetchWithPayment);
```

运行测试：
```bash
node test.mjs
```

### 版本管理

#### 语义化版本 (Semantic Versioning)

- **MAJOR** (主版本): 不兼容的 API 更改
  - 例：`1.0.0` → `2.0.0`
  - 情况：删除导出、重命名函数、修改参数

- **MINOR** (次版本): 向后兼容的新功能
  - 例：`1.0.0` → `1.1.0`
  - 情况：添加新导出、新功能

- **PATCH** (补丁): 向后兼容的 bug 修复
  - 例：`1.0.0` → `1.0.1`
  - 情况：修复 bug、优化性能

#### 维护 CHANGELOG

在 `CHANGELOG.md` 中记录每个版本的更改：

```markdown
# Changelog

## [0.1.1] - 2025-01-20

### Added
- 添加 x402-fetch 模块支持客户端自动支付

### Fixed
- 修复 TypeScript 编译错误

## [0.1.0] - 2025-01-15

### Added
- 初始版本发布
- Express 中间件支持
- 自定义 SPL Token 支持
```

#### 使用 Git Tags

每次发布时创建 git tag:

```bash
git tag -a v0.1.1 -m "Release version 0.1.1"
git push origin v0.1.1
```

### 自动化发布

#### GitHub Actions 配置

创建 `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install
      - run: pnpm build
      - run: pnpm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

#### 设置 NPM_TOKEN

1. **在 npm 官网生成 Access Token**:
   - 访问 https://www.npmjs.com/settings/your-username/tokens
   - 点击 "Generate New Token"
   - 选择 "Automation" 类型
   - 复制生成的 token

2. **在 GitHub 仓库中添加 Secret**:
   - 进入仓库的 Settings > Secrets and variables > Actions
   - 点击 "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: 粘贴你的 npm token
   - 点击 "Add secret"
 
---

## 相关链接

- [npm 发布文档](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [语义化版本规范](https://semver.org/)
- [npm 包最佳实践](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

---

**祝你贡献顺利！🚀**
