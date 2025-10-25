import { config } from "dotenv";
import {
  decodeXPaymentResponse,
  wrapFetchWithPayment,
  createSigner
} from "../lib/x402-fetch";

config({ path: '.env_client' });

const svmPrivateKey = process.env.USER_SVM_PRIVATE_KEY || "";
const rpcUrl = process.env.SVM_RPC_URL || "";
const baseURL = "http://localhost:4021"; //process.env.RESOURCE_SERVER_URL as string; // e.g. https://example.com
const endpointPath = "/weather"; // process.env.ENDPOINT_PATH as string; // e.g. /weather
const url = `${baseURL}${endpointPath}`; // e.g. https://example.com/weather

console.log("url", url);

if (!baseURL || !svmPrivateKey || !endpointPath) {
  console.error("Missing required environment variables");
  process.exit(1);
}

/**
 * This example shows how to use the x402-fetch package to make a request to a resource server that requires a payment.
 *
 * To run this example, you need to set the following environment variables:
 * - PRIVATE_KEY: The private key of the signer
 * - RESOURCE_SERVER_URL: The URL of the resource server
 * - ENDPOINT_PATH: The path of the endpoint to call on the resource server
 */
async function main(): Promise<void> {
  // network name: solana-localnet, solana-devnet, solana
  const svmSigner = await createSigner("solana-localnet", svmPrivateKey);
  console.log("fetch payment");

  // 配置自定义 RPC URL 以避免公共节点限流
  // 可以使用 Helius, QuickNode, Alchemy 等提供商的 RPC URL
  const fetchWithPayment = wrapFetchWithPayment(
    fetch,
    svmSigner,
    undefined, // maxValue - 使用默认值
    undefined, // paymentRequirementsSelector - 使用默认值
    {
      svmConfig: {
        rpcUrl: rpcUrl
      }
    }
  );

  try {
    console.log(`fetching... `);
    const response = await fetchWithPayment(url, { method: "GET" });
    console.log("response received");
    const body = await response.json();
    console.log(body);

    const paymentResponse = decodeXPaymentResponse(response.headers.get("x-payment-response")!);
    console.log(paymentResponse);
    return; // 成功，退出函数
  } catch (error) {
    console.warn(`Attempt failed:`, error instanceof Error ? error.message : error);
    throw error;
  }

}

main().catch(error => {
  console.error(error?.response?.data?.error ?? error);
  process.exit(1);
});
