# X402 SDK for Solana

一个基于 X402 协议的 Solana 支付网关的 TypeScript SDK，支持通过 SPL Token 进行 HTTP 请求的按使用付费（Pay-per-use）。

## 目录

- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [使用示例](#使用示例)
- [自定义 Token 配置](#自定义-token-配置)
- [开发指南](#开发指南)

## 功能特性

- ✅ **Solana 支付集成**：支持通过 SPL Token 进行小额支付
- ✅ **Express 中间件**：简单易用的 Express 中间件，一行代码保护 API 端点
- ✅ **自定义  Token 支持**：支持任何 SPL Token，不仅限于 USDC
- ✅ **多网络支持**：支持 solana-localnet、solana-devnet 和 solana-mainnet


## 必需依赖

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **Solana CLI Tools** (用于 localnet 开发):
  - `solana-cli`
  - `spl-token-cli`

### 安装 Solana CLI Tools

```bash
# macOS/Linux
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# 验证安装
solana --version
spl-token --version
```

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动 Solana Localnet

在终端中运行：

```bash
solana-test-validator
```

保持该终端运行，在新终端中继续以下步骤。

### 3. 本地测试自动化设置脚本（推荐）

运行自动化设置脚本，它会：
- 生成 3 个密钥对（facilitator、server、client）
- 为所有账户空投 SOL
- 创建自定义 SPL Token
- 为所有账户创建 Token 账户并充值
- 输出配置好的环境变量

```bash
pnpm setup-localnet
```

脚本输出示例：

```
=== Setup Complete! ===

Environment Variables for .env:
SVM_PRIVATE_KEY=4FdeM2Hyx...
SVM_NETWORK=solana-localnet
SVM_RPC_URL=http://127.0.0.1:8899
PORT=3002

Environment Variables for .env_server:
FACILITATOR_URL=http://localhost:3002
NETWORK=solana-localnet
ADDRESS=67uA54AUE...
TOKEN_MINT_ADDRESS=AhV2C7iCk...
TOKEN_DECIMALS=6
TOKEN_NAME=USDC

Environment Variables for .env_client:
SVM_NETWORK=solana-localnet
SVM_RPC_URL=http://127.0.0.1:8899
USER_SVM_PRIVATE_KEY=3E8kogunw...
```

### 4. 配置环境变量

将上述输出的环境变量分别复制到对应的配置文件中：

```bash
# 创建 .env 文件（facilitator 配置）
cat > .env << EOF
SVM_PRIVATE_KEY=你的facilitator私钥
SVM_NETWORK=solana-localnet
SVM_RPC_URL=http://127.0.0.1:8899
PORT=3002
EOF

# 创建 .env_server 文件（server 配置）
cat > .env_server << EOF
FACILITATOR_URL=http://localhost:3002
NETWORK=solana-localnet
ADDRESS=你的server地址
TOKEN_MINT_ADDRESS=你的token地址
TOKEN_DECIMALS=6
TOKEN_NAME=USDC
EOF

# 创建 .env_client 文件（client 配置）
cat > .env_client << EOF
SVM_NETWORK=solana-localnet
SVM_RPC_URL=http://127.0.0.1:8899
USER_SVM_PRIVATE_KEY=你的client私钥
EOF
```

### 5. 启动服务

在三个不同的终端中分别运行：

**终端 1 - Facilitator（支付促成者）:**
```bash
pnpm run facilitator
```

**终端 2 - Server（API 服务器）:**
```bash
pnpm run server
```

**终端 3 - Client（客户端测试）:**
```bash
pnpm run client
```

如果一切正常，你应该看到客户端成功请求并支付了 API 调用费用！

### 快捷命令

清理端口占用并重启服务：
```bash
# 清理被占用的端口
lsof -ti:3002,4021 | xargs kill -9
```

## 配置说明

### Facilitator 配置 (`.env`)

| 变量 | 描述 | 示例 |
|------|------|------|
| `SVM_PRIVATE_KEY` | Facilitator 的私钥（Base58 格式） | `4FdeM2Hyx...` |
| `SVM_NETWORK` | Solana 网络 | `solana-localnet` / `solana-devnet` / `solana` |
| `SVM_RPC_URL` | RPC 节点 URL | `http://127.0.0.1:8899` |
| `PORT` | Facilitator 服务端口 | `3002` |

### Server 配置 (`.env_server`)

| 变量 | 描述 | 必需 |
|------|------|------|
| `FACILITATOR_URL` | Facilitator 服务地址 | ✅ |
| `NETWORK` | 支付网络 | ✅ |
| `ADDRESS` | 接收支付的地址 | ✅ |
| `TOKEN_MINT_ADDRESS` | Token Mint 地址 | ⚠️ 可选 |
| `TOKEN_DECIMALS` | Token 小数位数 | ⚠️ 可选 |
| `TOKEN_NAME` | Token 名称 | ⚠️ 可选 |

> ⚠️ 如果不配置 Token 相关变量，将使用默认的 USDC。

### Client 配置 (`.env_client`)

| 变量 | 描述 | 示例 |
|------|------|------|
| `SVM_NETWORK` | Solana 网络 | `solana-localnet` |
| `SVM_RPC_URL` | RPC 节点 URL | `http://127.0.0.1:8899` |
| `USER_SVM_PRIVATE_KEY` | 用户私钥（Base58 格式） | `3E8kogunw...` |

## 使用示例

### Server 端 - 保护 API 端点

```typescript
import express from "express";
import { config } from "dotenv";
import { paymentMiddleware, type X402Config } from "./lib/x402-express";

config({ path: '.env_server' });

const app = express();

// 基础配置 - 使用默认 USDC
app.use(
  paymentMiddleware(
    process.env.ADDRESS as string,  // 接收地址
    {
      "GET /weather": {
        price: "$0.0018",  // 价格（美元）
        network: "solana-localnet"
      }
    },
    { url: process.env.FACILITATOR_URL }
  )
);

// 定义受保护的路由
app.get("/weather", (req, res) => {
  res.json({
    temperature: 72,
    condition: "sunny",
    location: "San Francisco"
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

### 自定义 Token 配置

```typescript
// 从环境变量读取 Token 配置
const tokenMintAddress = process.env.TOKEN_MINT_ADDRESS;
const tokenDecimals = parseInt(process.env.TOKEN_DECIMALS || "6");
const tokenName = process.env.TOKEN_NAME;

const x402Config: X402Config | undefined =
  tokenMintAddress && tokenDecimals && tokenName
    ? {
        svmConfig: {
          defaultToken: {
            address: tokenMintAddress,
            decimals: tokenDecimals,
            name: tokenName,
          },
        },
      }
    : undefined;

app.use(
  paymentMiddleware(
    payTo,
    {
      "GET /weather": {
        price: "$0.0018",
        network: "solana-localnet",
      },
    },
    { url: facilitatorUrl },
    undefined,  // paywall config
    x402Config  // custom token config
  )
);
```

### Client 端 - 请求受保护的 API

```typescript
import { config } from "dotenv";
import { createSigner } from "./lib/x402/svm";

config({ path: '.env_client' });

const svmPrivateKey = process.env.USER_SVM_PRIVATE_KEY!;
const svmNetwork = process.env.SVM_NETWORK || "solana-localnet";

async function main() {
  const signer = await createSigner(svmNetwork, svmPrivateKey);

  const response = await fetch("http://localhost:3000/weather", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    // SDK 会自动添加 X-PAYMENT header
  });

  if (response.ok) {
    const data = await response.json();
    console.log("Weather data:", data);
  } else if (response.status === 402) {
    const paymentInfo = await response.json();
    console.log("Payment required:", paymentInfo);
  }
}

main();
```


### 工作流程

1. **Client** 向 Server 发送请求
2. **Server** 返回 402 状态码和支付要求
3. **Client** 创建并签署支付交易
4. **Client** 将签名的交易附加到 X-PAYMENT header 重新请求
5. **Server** 通过 **Facilitator** 验证支付
6. **Facilitator** 将交易提交到 **Solana** 网络
7. **Server** 返回受保护的数据

### 角色说明

- **Client**: 发起请求并支付费用的用户
- **Server**: 提供受保护 API 的服务提供者
- **Facilitator**: 支付促成者，负责交易验证和提交
- **Solana Network**: 区块链网络，记录所有交易

## API 文档

### `paymentMiddleware(payTo, routes, facilitator?, paywall?, x402Config?)`

创建 Express 支付中间件。

**参数:**

- `payTo` (string): 接收支付的 Solana 地址
- `routes` (RoutesConfig): 路由配置对象
- `facilitator?` (FacilitatorConfig): Facilitator 配置
- `paywall?` (PaywallConfig): 付费墙配置
- `x402Config?` (X402Config): X402 自定义配置

**返回:**

Express 中间件函数

### RoutesConfig

```typescript
type RoutesConfig = {
  [route: string]: {
    price: string | number;  // 美元价格或原子单位
    network: Network;
    config?: {
      description?: string;
      mimeType?: string;
      maxTimeoutSeconds?: number;
      discoverable?: boolean;
      customPaywallHtml?: string;
    };
  };
};
```

### X402Config

```typescript
interface X402Config {
  svmConfig?: {
    rpcUrl?: string;
    defaultToken?: {
      address: string;
      decimals: number;
      name: string;
    };
  };
}
```
 
## 开发指南

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

### NPM 脚本

```bash
# 自动化设置 localnet 环境
pnpm setup-localnet

# 启动 facilitator
pnpm run facilitator

# 启动 server
pnpm run server

# 运行 client
pnpm run client
```


### 构建项目

```bash
pnpm build
```

## 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT

## 相关链接

- [Solana 文档](https://docs.solana.com/)
- [SPL Token 文档](https://spl.solana.com/token)
- [Express 文档](https://expressjs.com/)

## 支持

如有问题或建议，请：

1. 查看 [故障排除](#故障排除) 部分
2. 搜索已有的 Issues
3. 创建新的 Issue

 
 