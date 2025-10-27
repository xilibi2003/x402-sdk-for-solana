import { config } from "dotenv";
import express from "express";
import { paymentMiddleware } from "x402-sdk-for-solana";
import type { Resource, SolanaAddress, X402Config } from "x402-sdk-for-solana";
config({ path: '.env_server' });

const facilitatorUrl = process.env.FACILITATOR_URL as Resource;
const payTo = process.env.ADDRESS as `0x${string}` | SolanaAddress;
const network = (process.env.NETWORK || "solana-devnet") as any;
const tokenMintAddress = process.env.TOKEN_MINT_ADDRESS;
const tokenDecimals = process.env.TOKEN_DECIMALS ? parseInt(process.env.TOKEN_DECIMALS) : undefined;
const tokenName = process.env.TOKEN_NAME;

console.log('facilitatorUrl', facilitatorUrl);
console.log('payTo', payTo);
console.log('network', network);
if (tokenMintAddress && tokenDecimals && tokenName) {
  console.log('Custom token config:');
  console.log('  address:', tokenMintAddress);
  console.log('  decimals:', tokenDecimals);
  console.log('  name:', tokenName);
}

if (!facilitatorUrl || !payTo) {
  console.error("Missing required environment variables: FACILITATOR_URL, ADDRESS");
  process.exit(1);
}

const app = express();

// Build X402 config with custom token if provided
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

// 支付中间件会检查请求的 URL 是否需要支付
// 如果用户请求没有 X-PAYMENT header，会返回一个 402 状态码，并包含支付要求 `x-payment-required` 
// 如果请求包含 X-PAYMENT header，则调用 Facilitator 验证支付，验证成功，调用 Facilitator 结算，返回受保护内容，同时添加支付响应头 X-PAYMENT-RESPONSE
app.use(
  paymentMiddleware(
    payTo,
    {
      "GET /weather": {
        price: "0.0018", // amount
        network: network, // configured via NETWORK env variable
      },
      "GET /premium/content": {
        price: "0.15",
        network: network,
      },
    },
    {
      url: facilitatorUrl,
    },
    undefined, // paywall config： 配置希望在支付页面显示的内容
    x402Config, // X402 config with custom token
  ),
);

app.get("/weather", (req, res) => {
  res.send({
    report: {
      weather: "sunny",
      temperature: 70,
    },
  });
});

app.get("/premium/content", (req, res) => {
  res.send({
    content: "This is premium content",
  });
});

app.listen(4021, () => {
  console.log(`Server listening at http://localhost:${4021}`);
});
