/**
 * X402 SDK for Solana
 *
 * A TypeScript SDK for implementing pay-per-use API access with SPL tokens on Solana.
 *
 * @packageDocumentation
 */

// Express Middleware - Main exports for server-side usage
export { paymentMiddleware } from "./lib/x402-express/index.js";

// Client exports
export { createPaymentHeader } from "./lib/x402/client/index.js";

// Facilitator exports - re-export everything from facilitator
export * from "./lib/x402/facilitator/index.js";

// Type exports
export type {
  // Config types
  X402Config,
  TokenConfig,
  SvmConfig,

  // Network types
  Network,
  SupportedEVMNetworks,
  SupportedSVMNetworks,

  // Payment types
  Money,
  Price,
  PaymentRequirements,
  PaymentPayload,

  // Route types
  Resource,
  RouteConfig,
  RoutesConfig,
  PaymentMiddlewareConfig,

  // Middleware types
  FacilitatorConfig,
  PaywallConfig,
} from "./lib/x402/types/index.js";

// SVM specific exports
export { createSvmConnectedClient } from "./lib/x402/shared/svm/wallet.js";
export type { SvmSigner, SvmConnectedClient } from "./lib/x402/shared/svm/wallet.js";
export { getRpcClient } from "./lib/x402/shared/svm/rpc.js";

// Address type from @solana/kit
export type { Address as SolanaAddress } from "@solana/kit";

// EVM specific exports (if needed)
export { getUsdcChainConfigForChain } from "./lib/x402/shared/evm/usdc.js";

// Schemes
export * as exact from "./lib/x402/schemes/exact/index.js";

// Shared utilities
export {
  processPriceToAtomicAmount,
  getDefaultAsset,
} from "./lib/x402/shared/middleware.js";

// Version
export const VERSION = "1.0.0";
