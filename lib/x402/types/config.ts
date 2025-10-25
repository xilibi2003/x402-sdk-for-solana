/**
 * Configuration for custom token assets.
 */
export interface TokenConfig {
  /**
   * Token mint address (for Solana) or contract address (for EVM).
   */
  address: string;
  /**
   * Number of decimals for the token.
   */
  decimals: number;
  /**
   * Token name (e.g., "USDC", "USDT").
   */
  name: string;
  /**
   * EIP-712 configuration for EVM tokens (optional for Solana).
   */
  eip712?: {
    name: string;
    version: string;
  };
}

/**
 * Configuration options for Solana (SVM) RPC connections.
 */
export interface SvmConfig {
  /**
   * Custom RPC URL for Solana connections.
   * If not provided, defaults to public Solana RPC endpoints based on network.
   */
  rpcUrl?: string;
  /**
   * Custom default token configuration.
   * If not provided, defaults to USDC.
   */
  defaultToken?: TokenConfig;
}

/**
 * Configuration options for X402 client and facilitator operations.
 */
export interface X402Config {
  /** Configuration for Solana (SVM) operations */
  svmConfig?: SvmConfig;
  // Future: evmConfig?: EvmConfig for EVM-specific configurations
}
