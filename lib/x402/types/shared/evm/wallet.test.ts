import { describe, expect, it, vi } from "vitest";
import { base, baseSepolia, avalancheFuji } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { createConnectedClient, createSigner } from "./wallet";

// Mock viem modules
vi.mock("viem", async () => {
  const actual = await vi.importActual("viem");
  return {
    ...actual,
    createPublicClient: vi.fn().mockImplementation(({ chain, transport }) => ({
      chain,
      transport,
      extend: vi.fn().mockReturnValue({
        chain,
        transport,
        // Mock public client methods
        getBlockNumber: vi.fn(),
        getBalance: vi.fn(),
      }),
    })),
    createWalletClient: vi.fn().mockImplementation(({ chain, transport, account }) => ({
      chain,
      transport,
      account,
      extend: vi.fn().mockReturnValue({
        chain,
        transport,
        account,
        // Mock wallet client methods
        sendTransaction: vi.fn(),
        signMessage: vi.fn(),
      }),
    })),
    http: vi.fn().mockReturnValue("mock-transport"),
    publicActions: vi.fn(),
  };
});

vi.mock("viem/accounts", () => ({
  privateKeyToAccount: vi.fn().mockImplementation(privateKey => ({
    address: "0x1234567890123456789012345678901234567890",
    privateKey,
    type: "local",
    source: "privateKey",
    sign: vi.fn(),
    signMessage: vi.fn(),
    signTransaction: vi.fn(),
    signTypedData: vi.fn(),
  })),
}));

describe("createConnectedClient", () => {
  it("should create a public client for base network", () => {
    const client = createConnectedClient("base");

    expect(client.chain).toEqual(base);
    expect(client.transport).toBe("mock-transport");
  });

  it("should create a public client for base-sepolia network", () => {
    const client = createConnectedClient("base-sepolia");

    expect(client.chain).toEqual(baseSepolia);
    expect(client.transport).toBe("mock-transport");
  });

  it("should create a public client for avalanche-fuji network", () => {
    const client = createConnectedClient("avalanche-fuji");

    expect(client.chain).toEqual(avalancheFuji);
    expect(client.transport).toBe("mock-transport");
  });

  it("should throw an error for unsupported network", () => {
    expect(() => createConnectedClient("unsupported-network")).toThrow(
      "Unsupported network: unsupported-network",
    );
  });

  it("should throw an error for empty network", () => {
    expect(() => createConnectedClient("")).toThrow("NETWORK environment variable is not set");
  });

  it("should throw an error for undefined network", () => {
    expect(() => createConnectedClient(undefined as unknown as string)).toThrow(
      "NETWORK environment variable is not set",
    );
  });
});

describe("createSigner", () => {
  const mockPrivateKey =
    "0x1234567890123456789012345678901234567890123456789012345678901234" as const;

  it("should create a wallet client for base network with private key", () => {
    const signer = createSigner("base", mockPrivateKey);

    expect(signer.chain).toEqual(base);
    expect(signer.transport).toBe("mock-transport");
    expect(signer.account).toBeDefined();
    expect(signer.account.address).toBe("0x1234567890123456789012345678901234567890");
    expect(privateKeyToAccount).toHaveBeenCalledWith(mockPrivateKey);
  });

  it("should create a wallet client for base-sepolia network with private key", () => {
    const signer = createSigner("base-sepolia", mockPrivateKey);

    expect(signer.chain).toEqual(baseSepolia);
    expect(signer.transport).toBe("mock-transport");
    expect(signer.account).toBeDefined();
    expect(signer.account.address).toBe("0x1234567890123456789012345678901234567890");
    expect(privateKeyToAccount).toHaveBeenCalledWith(mockPrivateKey);
  });

  it("should create a wallet client for avalanche-fuji network with private key", () => {
    const signer = createSigner("avalanche-fuji", mockPrivateKey);

    expect(signer.chain).toEqual(avalancheFuji);
    expect(signer.transport).toBe("mock-transport");
    expect(signer.account).toBeDefined();
    expect(signer.account.address).toBe("0x1234567890123456789012345678901234567890");
    expect(privateKeyToAccount).toHaveBeenCalledWith(mockPrivateKey);
  });

  it("should throw an error for unsupported network", () => {
    expect(() => createSigner("unsupported-network", mockPrivateKey)).toThrow(
      "Unsupported network: unsupported-network",
    );
  });

  it("should throw an error for empty network", () => {
    expect(() => createSigner("", mockPrivateKey)).toThrow(
      "NETWORK environment variable is not set",
    );
  });

  it("should throw an error for undefined network", () => {
    expect(() => createSigner(undefined as unknown as string, mockPrivateKey)).toThrow(
      "NETWORK environment variable is not set",
    );
  });

  it("should handle different private key formats", () => {
    const differentPrivateKey =
      "0xabcdef1234567890123456789012345678901234567890123456789012345678" as const;
    const signer = createSigner("base", differentPrivateKey);

    expect(privateKeyToAccount).toHaveBeenCalledWith(differentPrivateKey);
    expect(signer.account).toBeDefined();
  });

  it("should create unique signers for the same network with different private keys", () => {
    const privateKey1 =
      "0x1111111111111111111111111111111111111111111111111111111111111111" as const;
    const privateKey2 =
      "0x2222222222222222222222222222222222222222222222222222222222222222" as const;

    const signer1 = createSigner("base", privateKey1);
    const signer2 = createSigner("base", privateKey2);

    expect(signer1.account).toBeDefined();
    expect(signer2.account).toBeDefined();
    expect(privateKeyToAccount).toHaveBeenCalledWith(privateKey1);
    expect(privateKeyToAccount).toHaveBeenCalledWith(privateKey2);
  });
});
