# SDK 开发指南

## 参与 SDK 开发

如果你想为 SDK 贡献代码或发布自己的版本，请遵循以下步骤：

### 1. 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/xilibi2003/x402-sdk-for-solana.git
cd x402-sdk-for-solana

# 安装依赖
pnpm install

# 构建 SDK
pnpm build
```

### 2. 项目结构

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
├── dist/                      # 构建输出（自动生成）
├── index.ts                   # 主入口文件
├── tsconfig.json             # TypeScript 配置
└── package.json              # 包配置
```

### 3. SDK 模块说明

#### 主模块 (`x402-sdk-for-solana`)
- 主要导出：`paymentMiddleware`、类型定义
- 入口文件：`index.ts`
- 用途：服务端集成

#### Express 中间件 (`x402-sdk-for-solana/express`)
- 路径：`lib/x402-express/`
- 导出：`paymentMiddleware`
- 用途：Express 应用集成

#### Client 模块 (`x402-sdk-for-solana/client`)
- 路径：`lib/x402/client/`
- 导出：`createPaymentHeader`、支付选择器
- 用途：客户端支付头创建

#### Facilitator 模块 (`x402-sdk-for-solana/facilitator`)
- 路径：`lib/x402/facilitator/`
- 导出：`verify`、`settle`
- 用途：支付验证和结算服务

#### Types 模块 (`x402-sdk-for-solana/types`)
- 路径：`lib/x402/types/`
- 导出：所有 TypeScript 类型和接口
- 用途：类型定义

#### Fetch 模块 (`x402-sdk-for-solana/fetch`)
- 路径：`lib/x402-fetch/`
- 导出：`wrapFetchWithPayment`、`createSigner`
- 用途：客户端 Fetch 封装


### 项目结构

```
x402-sdk-for-solana/
├── lib/                    # 核心库代码
│   ├── x402/              # X402 协议实现
│   │   ├── schemes/       # 支付方案
│   │   ├── shared/        # 共享工具
│   │   ├── svm/           # Solana VM 集成
│   │   └── types/         # TypeScript 类型
│   └── x402-express/      # Express 中间件
├── examples/              # 示例代码
│   ├── facilitator.ts     # Facilitator 示例
│   ├── server_express.ts  # Server 示例
│   └── client_fetch.ts    # Client 示例
├── scripts/               # 工具脚本
│   └── setup-localnet.ts  # Localnet 自动化设置
├── .env                   # Facilitator 配置
├── .env_server            # Server 配置
├── .env_client            # Client 配置
└── package.json
```

### 本地开发和测试

如果你想在本地开发和测试完整的 X402 系统：

#### 必需工具

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **Solana CLI Tools**:
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

#### 1. 克隆仓库

```bash
git clone https://github.com/xilibi2003/x402-sdk-for-solana.git
cd x402-sdk-for-solana
```

#### 2. 安装依赖

```bash
pnpm install
```


### 构建项目

```bash
pnpm build
```



### 4. 开发流程

#### 添加新功能

```bash
# 1. 创建功能分支
git checkout -b feature/my-feature

# 2. 进行开发
# 在 lib/ 目录下编辑代码

# 3. 构建测试
pnpm build

# 4. 在 examples/ 中测试功能
pnpm run facilitator   # 启动 facilitator
pnpm run server        # 启动 server
pnpm run client        # 测试 client

# 5. 提交更改
git add .
git commit -m "feat: add my feature"
```



### 5. 构建和发布

#### 准备发布

```bash
# 1. 更新版本号
npm version patch   # 补丁版本 (0.1.0 -> 0.1.1)
npm version minor   # 次版本 (0.1.0 -> 0.2.0)
npm version major   # 主版本 (0.1.0 -> 1.0.0)

# 2. 构建项目
pnpm build

# 3. 检查构建产物
ls -la dist/

# 4. 预览发布内容
npm pack --dry-run
```

#### 发布到 npm

```bash
# 1. 登录 npm（首次发布需要）
npm login

# 2. 发布包
npm publish --access public

# 3. 验证发布
npm view x402-sdk-for-solana
```

#### 发布 Beta 版本

```bash
# 1. 创建 beta 版本
npm version prerelease --preid=beta

# 2. 发布为 beta tag
npm publish --tag beta --access public

# 用户可以这样安装 beta 版本：
# npm install x402-sdk-for-solana@beta
```

# SDK 发布指南

本文档介绍如何将 X402 SDK for Solana 发布到 npm 注册表。

## 发布前准备清单

### 1. 更新版本号

在 `package.json` 中更新版本号：

```bash
# 补丁版本（bug 修复）
npm version patch

# 次要版本（新功能，向后兼容）
npm version minor

# 主要版本（破坏性更改）
npm version major
```

### 2. 更新 package.json 中的仓库信息

确保更新以下字段为你的实际 GitHub 仓库信息：

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/x402-sdk-for-solana"
  },
  "bugs": {
    "url": "https://github.com/yourusername/x402-sdk-for-solana/issues"
  },
  "homepage": "https://github.com/yourusername/x402-sdk-for-solana#readme",
  "author": "Your Name <your.email@example.com>"
}
```

### 3. 确保所有测试通过

```bash
# 运行测试（如果有）
pnpm test

# 检查 lint
pnpm lint

# 确保构建成功
pnpm build
```

### 4. 检查打包内容

使用 `npm pack` 命令预览将要发布的内容：

```bash
npm pack --dry-run
```

这会显示哪些文件会被包含在包中。确保：
- ✅ `dist/` 目录被包含
- ✅ `README.md` 被包含
- ✅ `LICENSE` 被包含（如果有）
- ❌ `node_modules/` 没有被包含
- ❌ `.env` 文件没有被包含
- ❌ `examples/` 没有被包含

## 发布到 npm

### 首次发布

#### 1. 注册 npm 账号

如果还没有 npm 账号：
1. 访问 https://www.npmjs.com/signup
2. 注册一个新账号

#### 2. 登录 npm

```bash
npm login
```

输入你的用户名、密码和邮箱。

#### 3. 发布包

```bash
# 首次发布为公开包
npm publish --access public
```

> **注意**: 使用 `--access public` 标志是因为默认情况下，scoped 包（以 @ 开头的包名）是私有的。

### 后续发布

#### 1. 更新版本号

```bash
npm version patch  # 或 minor, major
```

#### 2. 推送到 Git

```bash
git push && git push --tags
```

#### 3. 发布新版本

```bash
npm publish
```

## 使用 pnpm 发布

如果你使用 pnpm 作为包管理器：

```bash
# 登录
pnpm login

# 发布
pnpm publish --access public
```

## 发布标签

### 发布 Beta 版本

```bash
npm version prerelease --preid=beta
npm publish --tag beta
```

用户可以通过以下方式安装：
```bash
npm install x402-sdk-for-solana@beta
```

### 发布 Alpha 版本

```bash
npm version prerelease --preid=alpha
npm publish --tag alpha
```

### 发布 Next 版本（开发版）

```bash
npm version prerelease --preid=next
npm publish --tag next
```

## 发布后验证

### 1. 在 npm 上查看

访问: https://www.npmjs.com/package/x402-sdk-for-solana

### 2. 测试安装

在一个新的项目中测试安装：

```bash
mkdir test-install
cd test-install
npm init -y
npm install x402-sdk-for-solana
```

### 3. 测试导入

创建 `test.js`:

```javascript
import { paymentMiddleware } from 'x402-sdk-for-solana';
import { paymentMiddleware as expressMiddleware } from 'x402-sdk-for-solana/express';

console.log('Import successful!');
console.log('paymentMiddleware:', typeof paymentMiddleware);
console.log('expressMiddleware:', typeof expressMiddleware);
```

运行测试：
```bash
node test.js
```

## 自动化发布（GitHub Actions）

创建 `.github/workflows/publish.yml`:

```yaml
name: Publish Package

on:
  release:
    types: [created]

jobs:
  build:
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

### 设置 NPM_TOKEN

1. 在 npm 官网生成一个 Access Token:
   - 访问 https://www.npmjs.com/settings/your-username/tokens
   - 点击 "Generate New Token"
   - 选择 "Automation" 类型
   - 复制生成的 token

2. 在 GitHub 仓库中添加 Secret:
   - 进入仓库的 Settings > Secrets and variables > Actions
   - 点击 "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: 粘贴你的 npm token
   - 点击 "Add secret"

## 撤销已发布的版本

如果需要撤销一个版本（仅在发布后72小时内）：

```bash
npm unpublish x402-sdk-for-solana@1.0.0
```

> **警告**: 不推荐撤销已发布的版本，这会影响依赖该版本的用户。最好是发布一个修复版本。

## 弃用某个版本

如果想要标记某个版本为已弃用：

```bash
npm deprecate x402-sdk-for-solana@1.0.0 "This version has been deprecated. Please use v1.0.1 or higher."
```

## 包发布最佳实践

### 1. 使用语义化版本

- **MAJOR**: 破坏性更改（不向后兼容）
- **MINOR**: 新功能（向后兼容）
- **PATCH**: Bug 修复（向后兼容）

示例:
- `1.0.0` → `2.0.0`: 破坏性更改
- `1.0.0` → `1.1.0`: 新功能
- `1.0.0` → `1.0.1`: Bug 修复

### 2. 维护 CHANGELOG

在项目根目录创建 `CHANGELOG.md`:

```markdown
# Changelog

## [1.0.1] - 2025-01-20

### Fixed
- Fixed type error in payment verification

### Changed
- Updated dependencies

## [1.0.0] - 2025-01-15

### Added
- Initial release
- Express middleware for payment processing
- Support for custom SPL tokens
```

### 3. 使用 Git Tags

每次发布时创建 git tag:

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### 4. 编写清晰的发布说明

在 GitHub Releases 中添加详细的发布说明：
- 新功能
- Bug 修复
- 破坏性更改
- 升级指南（如有必要）

## 故障排除

### 问题 1: `npm publish` 失败，显示 "403 Forbidden"

**解决方案:**
- 确保你已登录: `npm whoami`
- 确保你有权限发布该包
- 检查包名是否已被占用

### 问题 2: 包名冲突

**解决方案:**
- 使用 scoped package: `@your-username/x402-sdk-for-solana`
- 在 package.json 中更改包名

### 问题 3: 构建文件缺失

**解决方案:**
- 确保运行了 `pnpm build`
- 检查 `.npmignore` 没有排除 `dist/`
- 使用 `npm pack --dry-run` 验证

## 示例使用

发布后，用户可以这样使用你的 SDK:

```bash
# 安装
npm install x402-sdk-for-solana
# 或
pnpm add x402-sdk-for-solana
```

```typescript
// 使用
import { paymentMiddleware } from 'x402-sdk-for-solana';
import type { X402Config } from 'x402-sdk-for-solana';

// Express middleware
app.use(paymentMiddleware(/* ... */));
```

## 相关链接

- [npm 发布文档](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [语义化版本规范](https://semver.org/)
- [npm 包最佳实践](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)

---

**祝你发布顺利！🚀**
