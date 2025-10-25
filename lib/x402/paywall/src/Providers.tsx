import { OnchainKitProvider } from "@coinbase/onchainkit";
import type { ReactNode } from "react";
import { base, baseSepolia } from "viem/chains";
import "./window.d.ts";

type ProvidersProps = {
  children: ReactNode;
};

/**
 * Providers component for the paywall
 *
 * @param props - The component props
 * @param props.children - The children of the Providers component
 * @returns The Providers component
 */
export function Providers({ children }: ProvidersProps) {
  const { testnet, cdpClientKey, appName, appLogo } = window.x402;

  return (
    <OnchainKitProvider
      apiKey={cdpClientKey || undefined}
      chain={testnet ? baseSepolia : base}
      config={{
        appearance: {
          mode: "light",
          theme: "base",
          name: appName || undefined,
          logo: appLogo || undefined,
        },
        wallet: {
          display: "modal",
          supportedWallets: {
            rabby: true,
            trust: true,
            frame: true,
          },
        },
      }}
    >
      {children}
    </OnchainKitProvider>
  );
}
