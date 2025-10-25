# 自定义 Token 配置指南

本 SDK 现在支持通过环境变量配置自定义 SPL Token，而不仅限于使用 USDC。

## 配置方式

### 1. 在 Server 端配置

编辑 `.env_server` 文件，添加以下环境变量：

```bash
# 必需的配置
FACILITATOR_URL=http://localhost:3002
NETWORK=solana-localnet
ADDRESS=your-receiver-address

# 可选的自定义 Token 配置（不配置时默认使用 USDC）
TOKEN_MINT_ADDRESS=usdrxLChKFKAnztF9SHEKPUGNx6tvD97air6ebAKmKb
TOKEN_DECIMALS=6
TOKEN_NAME=USDC
```

### 2. 配置说明

- `TOKEN_MINT_ADDRESS`: SPL Token 的 mint 地址
- `TOKEN_DECIMALS`: Token 的小数位数（例如 USDC 是 6）
- `TOKEN_NAME`: Token 的名称（用于日志和显示）

### 3. 使用示例

在 `examples/server_express.ts` 中：

```typescript
import { config } from "dotenv";
import express from "express";
import { paymentMiddleware, Resource, type SolanaAddress, type X402Config } from "../lib/x402-express";

config({ path: '.env_server' });

// 读取环境变量
const tokenMintAddress = process.env.TOKEN_MINT_ADDRESS;
const tokenDecimals = process.env.TOKEN_DECIMALS ? parseInt(process.env.TOKEN_DECIMALS) : undefined;
const tokenName = process.env.TOKEN_NAME;

// 构建 X402 配置
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

// 使用配置
app.use(
  paymentMiddleware(
    payTo,
    {
      "GET /weather": {
        price: "$0.0018",  // 这个价格会根据配置的 token 和 decimals 自动转换
        network: network,
      },
    },
    { url: facilitatorUrl },
    undefined,  // paywall config
    x402Config, // X402 config with custom token
  ),
);
```

## 工作原理

1. 当你在路由中使用字符串价格（如 `"$0.0018"`）时，系统会：
   - 如果配置了自定义 token，使用自定义 token 的地址和 decimals
   - 如果没有配置，默认使用 USDC

2. 价格转换公式：
   ```
   atomicAmount = priceInDollars * (10 ** decimals)
   ```

   例如：`$0.0018` with 6 decimals = 1800 atomic units

## 支持的网络

自定义 token 配置适用于所有 Solana 网络：
- `solana-localnet`
- `solana-devnet`
- `solana`（mainnet）

## 注意事项

1. 确保 `TOKEN_DECIMALS` 与实际 token mint 的 decimals 一致
2. 确保支付方账户有足够的该 token 余额
3. 如果使用 localnet，需要先创建 token mint 和相关账户
4. Facilitator 需要有该网络的 SOL 余额来支付交易费用

## 示例：使用自定义 SPL Token

假设你想使用自己创建的 token：

```bash
# .env_server
TOKEN_MINT_ADDRESS=YourTokenMintAddress123456789
TOKEN_DECIMALS=9
TOKEN_NAME=MyToken
```

然后在代码中定义价格：

```typescript
{
  "GET /api": {
    price: "$1.00",  // 将转换为 1000000000 atomic units (1 * 10^9)
    network: "solana-devnet",
  }
}
```
