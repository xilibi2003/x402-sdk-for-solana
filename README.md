# X402 SDK for Solana

一个基于 X402 协议的 Solana 支付网关的 TypeScript SDK，快速为你的应用接入访问付费功能（Pay-per-use），支持配置任意 Solana 网络、配置任意的 SPL Token 。

[![npm version](https://img.shields.io/npm/v/x402-sdk-for-solana.svg)](https://www.npmjs.com/package/x402-sdk-for-solana)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 目录

- [功能特性](#功能特性)
- [安装](#安装)
- [快速开始](#快速开始)
  - [在 Server 中集成](#在-server-中集成)
  - [在 Client 中集成](#在-client-中集成)
  - [创建自己的 Facilitator](#创建自己的-facilitator)
  - [本地开发和测试](#本地开发和测试)
- [API 文档](#api-文档)


## X402 工作流程

### 角色说明

- **Client**: 发起请求并支付费用的用户
- **Server**: 提供受保护 API 的服务提供者
- **Facilitator**: 负责交易验证和提交
- **Solana Network**: 区块链网络，记录所有交易

工作流程：

1. **Client** 向 Server 发送请求
2. **Server** 返回 402 状态码和支付要求
3. **Client** 创建并签署支付交易
4. **Client** 将签名的交易附加到 X-PAYMENT header 重新请求
5. **Server** 通过 **Facilitator** 验证支付
6. **Facilitator** 将交易提交到 **Solana** 网络
7. **Server** 返回受保护的数据



## 功能特性

- ✅ **Solana 支付集成**：支持通过 SPL Token 进行小额支付
- ✅ **Express 中间件**：简单易用的 Express 中间件，一行代码保护 API 端点
- ✅ **客户端 Fetch 封装**：自动处理 402 支付的 fetch 包装器
- ✅ **Facilitator 支持**：内置支付验证和结算服务
- ✅ **自定义 Token 支持**：支持任何 SPL Token
- ✅ **多网络支持**：支持 solana-localnet、solana-devnet 和 solana
- ✅ **TypeScript 支持**：完整的类型定义

## 安装

使用 npm、yarn 或 pnpm 安装 SDK：

```bash
# 使用 npm
npm install x402-sdk-for-solana

# 使用 yarn
yarn add x402-sdk-for-solana

# 使用 pnpm
pnpm add x402-sdk-for-solana
```

### 必需依赖

- **Node.js**: >= 18.0.0

## 快速开始

根据你的使用场景，选择相应的集成方式：

### 在 Server 中集成

在你的服务端应用中集成 X402 SDK，实现在用户支付后才可访问某个服务器资源。

#### 1. 安装

```bash
npm install x402-sdk-for-solana express dotenv
```


#### 配置 server 环境变量

```
FACILITATOR_URL=http://localhost:3002
NETWORK=solana-localnet
ADDRESS=你的server地址
TOKEN_MINT_ADDRESS=你的token地址
TOKEN_DECIMALS=6
TOKEN_NAME=USDC
```

| 变量 | 描述 | 必需 |
|------|------|------|
| `FACILITATOR_URL` | Facilitator 服务地址 | ✅ |
| `NETWORK` | 支付网络 | ✅ |
| `ADDRESS` | 接收支付的地址 | ✅ |
| `TOKEN_MINT_ADDRESS` | Token Mint 地址 | ⚠️ 可选 |
| `TOKEN_DECIMALS` | Token 小数位数 | ⚠️ 可选 |
| `TOKEN_NAME` | Token 名称 | ⚠️ 可选 |

> ⚠️ 如果不配置 Token 相关变量，将使用 `lib/x402/types/shared/evm/config.ts`  默认定义的 USDC。


参考[本地开发和测试](#本地开发和测试)


#### 2. 创建 Express 服务器

```typescript
import express from "express";
import { paymentMiddleware } from "x402-sdk-for-solana";
import type { Resource, SolanaAddress, X402Config } from "x402-sdk-for-solana";

const app = express();

// 配置支付中间件
app.use(
  paymentMiddleware(
    "YOUR_SOLANA_ADDRESS" as SolanaAddress,  // 接收支付的地址
    {
      "GET /weather": {
        price: "0.0018",  // 每次请求需要支付多少的 Token 
        network: "solana-devnet"
      }
    },
    { url: "https://your-facilitator-url.com" }  // Facilitator 服务地址
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

app.listen(4021, () => {
  console.log("Server running on port 4021");
});
```

#### 3. 使用自定义 Token

```typescript
const x402Config: X402Config = {
  svmConfig: {
    defaultToken: {
      address: "YOUR_TOKEN_MINT_ADDRESS",
      decimals: 6,
      name: "USDC",
    },
  },
};

app.use(
  paymentMiddleware(
    payTo,
    routes,
    { url: facilitatorUrl },
    undefined,  // paywall config
    x402Config  // 传入自定义 token 配置
  )
);
```

### 在 Client 中集成

在你的客户端应用中集成 X402 SDK，调用受保护的 API：

#### 1. 安装

```bash
npm install x402-sdk-for-solana
```


#### 2. 配置 client 环境变量


```
SVM_NETWORK=solana-localnet
SVM_RPC_URL=http://127.0.0.1:8899
USER_SVM_PRIVATE_KEY=你的client私钥
```

| 变量 | 描述 | 示例 |
|------|------|------|
| `SVM_NETWORK` | Solana 网络 | `solana-localnet` |
| `SVM_RPC_URL` | RPC 节点 URL | `http://127.0.0.1:8899` |
| `USER_SVM_PRIVATE_KEY` | 用户私钥（Base58 格式） | `3E8kogunw...` |


#### 3. 使用 Fetch 包装器

```typescript
import {
  wrapFetchWithPayment,
  createSigner,
  decodeXPaymentResponse
} from "x402-sdk-for-solana/fetch";

async function callProtectedAPI() {
  // 创建签名者
  const signer = await createSigner(
    "solana-devnet",  // 网络
    "YOUR_PRIVATE_KEY_BASE58"  // 你的私钥
  );

  // 包装 fetch
  const fetchWithPayment = wrapFetchWithPayment(
    fetch,
    signer,
    BigInt(100000),  // 最大支付金额（可选）
    undefined,  // payment requirements selector（可选）
    {
      svmConfig: {
        rpcUrl: "https://api.devnet.solana.com"  // 自定义 RPC URL（可选）
      }
    }
  );

  // 发起请求
  const response = await fetchWithPayment("http://localhost:4021/weather", {
    method: "GET"
  });

  const data = await response.json();
  console.log("Response:", data);

  // 解析支付响应
  const paymentResponse = decodeXPaymentResponse(
    response.headers.get("x-payment-response")!
  );
  console.log("Payment:", paymentResponse);
}

callProtectedAPI();
```

### 创建自己的 Facilitator

部署你自己的 Facilitator 服务来验证和结算支付：

#### 1. 安装

```bash
npm install x402-sdk-for-solana express
```

#### 2. 配置环境变量

```bash
# 创建 .env 文件（facilitator 配置）
SVM_PRIVATE_KEY=你的facilitator私钥
SVM_NETWORK=solana-localnet
SVM_RPC_URL=http://127.0.0.1:8899
PORT=3002
```

| 变量 | 描述 | 示例 |
|------|------|------|
| `SVM_PRIVATE_KEY` | Facilitator 的私钥（Base58 格式） | `4FdeM2Hyx...` |
| `SVM_NETWORK` | Solana 网络 | `solana-localnet` / `solana-devnet` / `solana` |
| `SVM_RPC_URL` | RPC 节点 URL | `http://127.0.0.1:8899` |
| `PORT` | Facilitator 服务端口 | `3002` |


可参考[本地开发和测试](#本地开发和测试) 

#### 3. 创建 Facilitator 服务

```typescript
import express from "express";
import { verify, settle } from "x402-sdk-for-solana/facilitator";
import {
  PaymentRequirementsSchema,
  PaymentPayloadSchema,
  createSigner,
  SupportedSVMNetworks,
  type X402Config,
} from "x402-sdk-for-solana/types";

const app = express();
app.use(express.json());

const PRIVATE_KEY = process.env.SVM_PRIVATE_KEY!;
const NETWORK = process.env.SVM_NETWORK || "solana-devnet";
const RPC_URL = process.env.SVM_RPC_URL;

// 配置 
const x402Config: X402Config | undefined = RPC_URL
  ? { svmConfig: { rpcUrl: RPC_URL } }
  : undefined;

// 验证端点
app.post("/verify", async (req, res) => {
  try {
    const { paymentPayload, paymentRequirements } = req.body;

    const parsedRequirements = PaymentRequirementsSchema.parse(paymentRequirements);
    const parsedPayload = PaymentPayloadSchema.parse(paymentPayload);

    const signer = await createSigner(parsedRequirements.network, PRIVATE_KEY);
    const result = await verify(signer, parsedPayload, parsedRequirements, x402Config);

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: "Invalid request" });
  }
});

// 结算端点
app.post("/settle", async (req, res) => {
  try {
    const { paymentPayload, paymentRequirements } = req.body;

    const parsedRequirements = PaymentRequirementsSchema.parse(paymentRequirements);
    const parsedPayload = PaymentPayloadSchema.parse(paymentPayload);

    const signer = await createSigner(parsedRequirements.network, PRIVATE_KEY);
    const result = await settle(signer, parsedPayload, parsedRequirements, x402Config);

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: "Invalid request" });
  }
});

// 支持的支付类型
app.get("/supported", async (req, res) => {
  const signer = await createSigner(NETWORK, PRIVATE_KEY);
  res.json({
    kinds: [{
      x402Version: 1,
      scheme: "exact",
      network: NETWORK,
    }]
  });
});

app.listen(3002, () => {
  console.log("Facilitator running on port 3002");
});
```

### 本地开发和测试 

example 准备了一个简单的示例，方便本地测试。

#### 启动 Solana Localnet

在终端中运行：

```bash
solana-test-validator
```

保持该终端运行，在新终端中继续以下步骤。

#### 自动化设置脚本 

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


#### 启动本地测试服务

在三个不同的终端中分别运行：

**终端 1 - Facilitator :**
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


### 参考示例 及 NPM 脚本

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


## 贡献指南

欢迎贡献！详细的开发指南请参阅 [参与贡献](./Contribute.md) 部分。 

## 许可证

MIT

## 相关链接

- [npm 包](https://www.npmjs.com/package/x402-sdk-for-solana)
- [GitHub 仓库](https://github.com/xilibi2003/x402-sdk-for-solana)
- [Solana 文档](https://docs.solana.com/)
- [SPL Token 文档](https://spl.solana.com/token)
- [Express 文档](https://expressjs.com/)
- [SDK 发布指南](./SDK_PUBLISHING_GUIDE.md)

## 支持

如有问题或建议，请：

1. 查看 [Issues](https://github.com/xilibi2003/x402-sdk-for-solana/issues)
2. 搜索已有的问题
3. 创建新的 Issue