import { config } from "dotenv";
import express from "express";
import { paymentMiddleware, Resource, type SolanaAddress, type X402Config } from "../lib/x402-express";
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

app.use(
  paymentMiddleware(
    payTo,
    {
      "GET /weather": {
        // USDC amount in dollars
        price: "$0.0018",
        network: network, // configured via NETWORK env variable
      },
      "/premium/*": {
        // Define atomic amounts in any EIP-3009 token
        price: {
          amount: "100000",
          asset: {
            address: "0xabc",
            decimals: 18,
            // omit eip712 for Solana
            eip712: {
              name: "WETH",
              version: "1",
            },
          },
        },
        network: "base-sepolia",
      },
    },
    {
      url: facilitatorUrl,
    },
    undefined, // paywall config
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
