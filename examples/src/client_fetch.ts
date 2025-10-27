import { config } from "dotenv";
import {
  decodeXPaymentResponse,
  wrapFetchWithPayment,
  createSigner
} from "x402-sdk-for-solana/fetch";

config({ path: '.env_client' });

const svmPrivateKey = process.env.USER_SVM_PRIVATE_KEY || "";
const svmNetwork = (process.env.SVM_NETWORK || "solana-devnet") as any;
const rpcUrl = process.env.SVM_RPC_URL || "";
const need_pay_resource_url = "http://localhost:4021/weather";

console.log("svmNetwork", svmNetwork);
console.log("rpcUrl", rpcUrl || '(using default)');
console.log("need_pay_resource_url", need_pay_resource_url);

if (!need_pay_resource_url || !svmPrivateKey ) {
  console.error("Missing required environment variables");
  process.exit(1);
}

/**
 * This example shows how to use the x402-fetch package to make a request to a resource server that requires a payment.
 *
 * To run this example, you need to set the following environment variables:
 * - PRIVATE_KEY: The private key of the signer
 * - NEED_PAY_RESOURCE_URL: The URL of the resource server that requires a payment
 */
async function main(): Promise<void> {
  // network name: solana-localnet, solana-devnet, solana
  const svmSigner = await createSigner(svmNetwork, svmPrivateKey);
  console.log("fetch payment");

  const fetchWithPayment = wrapFetchWithPayment(
    fetch,
    svmSigner,
    undefined, // maxValue - 确保支付不会超过最大允许值
    undefined, // paymentRequirementsSelector - 选择支付选项
    {
      svmConfig: {
        rpcUrl: rpcUrl
      }
    }
  );

  try {

  // 使用 fetchWithPayment 发起请求
  // 函数检查到 402 状态码后，解析支付要求 header 中的 `x-payment-required` 
  // 创建并签署支付交易，附加支付信息（x-payment header）重新发送请求

    const response = await fetchWithPayment(need_pay_resource_url, { method: "GET" });
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
