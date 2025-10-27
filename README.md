# X402 SDK for Solana

一个基于 X402 协议的 Solana 支付网关的 TypeScript SDK(基于 [x402](https://github.com/coinbase/x402) 实现)，快速为你的应用接入访问付费功能（Pay-per-use），支持配置任意 Solana 网络、配置任意的 SPL Token 。

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

### 项目配置

**重要**: 由于 x402-sdk-for-solana 使用 **ES Module (ESM)** 格式发布，您的项目需要在 `package.json` 中添加以下配置：

```json
{
  "type": "module"
}
```

这告诉 Node.js 将您的项目作为 ES Module 处理，这样才能正确导入 SDK 的模块。

 

## 快速开始

根据你的使用场景，选择相应的集成方式：

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
    undefined,
    undefined, 
    {
      svmConfig: {
        rpcUrl: "https://api.devnet.solana.com"  // 自定义 RPC URL（可选）
      }
    }
  );

  // 使用 fetchWithPayment 发起请求
  // 函数检查到 402 状态码后，解析支付要求 header 中的 `x-payment-required` 
  //  创建并签署支付交易，附加支付信息（x-payment header）重新发送请求
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


### 本地开发和测试 

example 准备了一个简单的示例，方便本地测试。

#### 启动 Solana Localnet

在终端中运行：

```bash
solana-test-validator
```

保持该终端运行，在新终端中继续以下步骤。

#### 自动化设置脚本 

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


运行自动化设置脚本，它会：
- 生成 3 个密钥对（facilitator、server、client）
- 为所有账户空投 SOL
- 创建自定义 SPL Token
- 为所有账户创建 Token 账户并充值
- 输出配置好的环境变量



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

创建 Express 支付中间件，为指定的路由添加 X402 支付保护。

#### 功能概述

`paymentMiddleware` 是一个智能的 Express 中间件，它会：

1. **拦截请求** - 检查请求是否匹配受保护的路由，确保只有付费用户才能访问受保护内容
2. **验证支付** - 通过 Facilitator 验证用户的支付凭证
3. **执行路由** - 验证通过后执行实际的业务逻辑
4. **结算支付** - 只有在路由成功执行后才提交支付到区块链
5. **返回响应** - 将受保护的内容返回给用户


#### 工作流程

```
请求到达
  ↓
检查是否匹配受保护路由
  ├─ 不匹配 → 直接放行
  └─ 匹配 ↓
检查 X-PAYMENT header
  ├─ 无 → 返回 402 + 支付要求
  │   ├─ 浏览器 → HTML Paywall
  │   └─ API → JSON 格式
  └─ 有 ↓
验证支付
  ├─ 失败 → 返回 402 错误
  └─ 成功 ↓
执行受保护的路由
  ↓
检查执行结果
  ├─ 失败 (statusCode >= 400) → 不结算支付
  └─ 成功 ↓
结算支付（提交到区块链）
  ↓
返回受保护内容 + X-PAYMENT-RESPONSE
```

#### 参数详解

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `payTo` | `Address \| SolanaAddress` | ✅ | 接收支付的地址 |
| `routes` | `RoutesConfig` | ✅ | 路由配置对象，定义哪些路由需要支付以及价格 |
| `facilitator` | `FacilitatorConfig` | ⚠️ | Facilitator 服务配置，用于验证和结算支付 |
| `paywall` | `PaywallConfig` | ⚠️ | Paywall 配置，用于自定义浏览器用户看到的支付页面 |
| `x402Config` | `X402Config` | ⚠️ | X402 自定义配置，如自定义 RPC URL 和 Token |

#### 类型定义

##### RoutesConfig

```typescript
type RoutesConfig = {
  [route: string]: {
    price: string | number;  // 美元价格（如 "0.01"）或原子单位（如 10000）
    network: Network;        // 支付网络：'solana-localnet' | 'solana-devnet' | 'solana'
    config?: {
      description?: string;        // 端点描述
      mimeType?: string;           // 响应的 MIME 类型
      maxTimeoutSeconds?: number;  // 最大超时时间（默认 60 秒）
      discoverable?: boolean;      // 是否可被发现（默认 true）
      customPaywallHtml?: string;  // 自定义 Paywall HTML
    };
  };
};
```

**路由模式支持：**
- `"GET /weather"` - 精确匹配
- `"POST /api/*"` - 通配符匹配
- `"/premium/*"` - 匹配所有 HTTP 方法

##### FacilitatorConfig

```typescript
type FacilitatorConfig = {
  url: string;  // Facilitator 服务地址
  createAuthHeaders?: () => Promise<{
    verify?: Record<string, string>;   // 验证端点的认证头
    settle?: Record<string, string>;   // 结算端点的认证头
  }>;
};
```

##### PaywallConfig

```typescript
type PaywallConfig = {
  cdpClientKey?: string;         // Coinbase Developer Platform API 密钥
  appName?: string;              // 应用名称，显示在钱包连接界面
  appLogo?: string;              // 应用 Logo URL
  sessionTokenEndpoint?: string; // 会话令牌端点（用于 Onramp）
};
```

**说明：** Paywall 配置仅在浏览器用户访问时生效，用于自定义支付页面的品牌和体验。

##### X402Config

```typescript
interface X402Config {
  svmConfig?: {
    rpcUrl?: string;  // 自定义 Solana RPC URL
    defaultToken?: {
      address: string;   // Token Mint 地址
      decimals: number;  // Token 小数位数
      name: string;      // Token 名称
    };
  };
}
```

#### 使用示例

**基础用法：**

```typescript
import express from "express";
import { paymentMiddleware } from "x402-sdk-for-solana";

const app = express();

app.use(
  paymentMiddleware(
    "YOUR_SOLANA_ADDRESS",
    {
      "GET /weather": {
        price: 0.01,  // $0.01 USDC
        network: "solana-devnet"
      }
    },
    { url: "http://localhost:3002" }
  )
);

app.get("/weather", (req, res) => {
  res.json({ temp: 72, condition: "sunny" });
});

app.listen(4021);
```

**高级用法：**

```typescript
app.use(
  paymentMiddleware(
    "YOUR_SOLANA_ADDRESS",
    {
      // 不同路由不同价格
      "GET /weather": {
        price: 0.01,
        network: "solana-devnet",
        config: {
          description: "实时天气数据",
          maxTimeoutSeconds: 120
        }
      },
      "POST /premium/*": {
        price: 0.1,
        network: "solana-devnet",
        config: {
          description: "高级 API 服务"
        }
      }
    },
    // Facilitator 配置
    {
      url: "https://your-facilitator.com",
      createAuthHeaders: async () => ({
        verify: { "Authorization": "Bearer token" },
        settle: { "Authorization": "Bearer token" }
      })
    },
    // Paywall 配置
    {
      appName: "My Weather API",
      appLogo: "/logo.png",
      cdpClientKey: "your-cdp-key"
    },
    // X402 配置
    {
      svmConfig: {
        rpcUrl: "http://localhost:8899",
        defaultToken: {
          address: "YOUR_TOKEN_MINT",
          decimals: 6,
          name: "USDC"
        }
      }
    }
  )
);
```


---

### 客户端 API `wrapFetchWithPayment(fetch, walletClient, maxValue?, paymentRequirementsSelector?, config?)`

创建一个支持 X402 自动支付的 fetch 包装器。

#### 功能概述

`wrapFetchWithPayment` 将标准的 `fetch` API 包装成一个"支付感知"的版本，它会：

1. **发送初始请求** - 像普通 fetch 一样发送请求
2. **检测 402 响应** - 自动识别需要支付的端点
3. **解析支付要求** - 从响应中提取支付信息
4. **验证金额** - 检查支付金额是否在允许的范围内， maxValue 防止意外的大额支付
5. **创建并签署支付** - 使用提供的钱包自动创建支付交易
6. **重新请求** - 附加支付凭证重新发送请求
7. **返回内容** - 返回受保护的内容

#### 工作流程

```
fetchWithPayment(url)
  ↓
发送初始请求
  ↓
收到响应
  ├─ 200 → 直接返回
  └─ 402 → 需要支付 ↓
解析支付要求
  ↓
选择支付方式（paymentRequirementsSelector）
  ↓
验证金额 <= maxValue
  ├─ 超出 → 抛出错误
  └─ 通过 ↓
创建并签署支付交易
  ↓
附加 X-PAYMENT header 重新请求
  ↓
返回受保护内容
```

#### 参数详解

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `fetch` | `typeof globalThis.fetch` | ✅ | 要包装的 fetch 函数（通常是 `globalThis.fetch`） |
| `walletClient` | `Signer \| MultiNetworkSigner` | ✅ | 用于签署支付的钱包客户端 |
| `maxValue` | `bigint` | ⚠️ | 允许自动支付的最大金额（原子单位），默认 0.1 USDC |
| `paymentRequirementsSelector` | `PaymentRequirementsSelector` | ⚠️ | 自定义支付方式选择器 |
| `config` | `X402Config` | ⚠️ | X402 配置（如自定义 RPC URL） |

#### 类型定义

##### PaymentRequirementsSelector

```typescript
type PaymentRequirementsSelector = (
  paymentRequirements: PaymentRequirements[],  // 所有可用的支付选项
  network?: Network | Network[],                // 客户端支持的网络
  scheme?: "exact"                              // 支付方案
) => PaymentRequirements;                       // 返回选中的支付方式
```

**默认选择策略：**
1. 优先选择 Base 网络（费用低）
2. 筛选匹配客户端网络的选项
3. 优先选择 USDC Token
4. 如果都不匹配，选择第一个

#### 使用示例

**基础用法：**

```typescript
import {
  wrapFetchWithPayment,
  createSigner
} from "x402-sdk-for-solana/fetch";

async function fetchProtectedAPI() {
  // 创建签名者
  const signer = await createSigner(
    "solana-devnet",
    "YOUR_PRIVATE_KEY_BASE58"
  );

  // 包装 fetch
  const fetchWithPayment = wrapFetchWithPayment(fetch, signer);

  // 使用方式与普通 fetch 完全相同
  const response = await fetchWithPayment("http://localhost:4021/weather");
  const data = await response.json();

  console.log("Weather:", data);
}
```

**自定义最大支付金额：**

```typescript
// 允许最多支付 1 USDC
const fetchWithPayment = wrapFetchWithPayment(
  fetch,
  signer,
  BigInt(1 * 10 ** 6)  // 1 USDC = 1,000,000 最小单位
);
```

**自定义支付选择器：**

```typescript
// 总是选择最便宜的支付方式
const cheapestSelector = (requirements: PaymentRequirements[]) => {
  return requirements.reduce((cheapest, current) =>
    BigInt(current.maxAmountRequired) < BigInt(cheapest.maxAmountRequired)
      ? current
      : cheapest
  );
};

const fetchWithPayment = wrapFetchWithPayment(
  fetch,
  signer,
  BigInt(1 * 10 ** 6),
  cheapestSelector  // 使用自定义选择器
);
```

**自定义 RPC URL：**

```typescript
const fetchWithPayment = wrapFetchWithPayment(
  fetch,
  signer,
  undefined,  // 使用默认 maxValue
  undefined,  // 使用默认选择器
  {
    svmConfig: {
      rpcUrl: "http://localhost:8899"  // 自定义 RPC URL
    }
  }
);
```

**完整示例：**

```typescript
import {
  wrapFetchWithPayment,
  createSigner,
  decodeXPaymentResponse
} from "x402-sdk-for-solana/fetch";

async function main() {
  const signer = await createSigner("solana-devnet", process.env.PRIVATE_KEY!);

  const fetchWithPayment = wrapFetchWithPayment(
    fetch,
    signer,
    BigInt(10 * 10 ** 6),  // 最多支付 10 USDC
    undefined,
    {
      svmConfig: {
        rpcUrl: "https://api.devnet.solana.com"
      }
    }
  );

  try {
    const response = await fetchWithPayment("http://localhost:4021/weather", {
      method: "GET"
    });

    const data = await response.json();
    console.log("Data:", data);

    // 解析支付响应
    const paymentResponse = decodeXPaymentResponse(
      response.headers.get("x-payment-response")!
    );
    console.log("Payment:", paymentResponse);

  } catch (error) {
    if (error.message === "Payment amount exceeds maximum allowed") {
      console.error("支付金额超出限制！");
    } else {
      console.error("请求失败:", error);
    }
  }
}
```

#### maxValue 详解

`maxValue` 是一个重要的安全参数，用于防止意外的大额支付：
 

**金额计算示例：**
- USDC 有 6 位小数
- 1 USDC = 1,000,000 最小单位
- 0.1 USDC = 100,000 最小单位
- 公式：`BigInt(金额 * 10 ** decimals)`



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