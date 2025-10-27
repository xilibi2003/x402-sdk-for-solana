import { PaymentRequirements } from "../../types/verify/index.js";

declare global {
  interface Window {
    x402: {
      amount?: number;
      testnet?: boolean;
      paymentRequirements: PaymentRequirements | PaymentRequirements[];
      currentUrl: string;
      cdpClientKey?: string;
      appName?: string;
      appLogo?: string;
      sessionTokenEndpoint?: string;
      config: {
        chainConfig: Record<
          string,
          {
            usdcAddress: string;
            usdcName: string;
          }
        >;
      };
    };
  }
}
