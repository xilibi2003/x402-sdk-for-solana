import { execSync } from "child_process";
import { base58 } from "@scure/base";

const LOCALNET_URL = "http://127.0.0.1:8899";
const DECIMALS = 6;
const INITIAL_MINT_AMOUNT = 1000; // 1000 tokens

function execCommand(command: string): string {
  try {
    return execSync(command, { encoding: "utf8" });
  } catch (error: any) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    throw error;
  }
}

async function main() {
  console.log("=== Solana Localnet Automated Setup ===\n");

  // Create temporary directory for keys
  const fs = await import("fs/promises");
  const tmpDir = "./tmp/x402-setup";
  await fs.mkdir(tmpDir, { recursive: true });

  // Generate keypairs using solana-keygen
  console.log("1. Generating keypairs...\n");

  const facilitatorKeyFile = `${tmpDir}/facilitator.json`;
  const serverKeyFile = `${tmpDir}/server.json`;
  const clientKeyFile = `${tmpDir}/client.json`;

  execCommand(`solana-keygen new --no-bip39-passphrase --silent --force --outfile ${facilitatorKeyFile}`);
  execCommand(`solana-keygen new --no-bip39-passphrase --silent --force --outfile ${serverKeyFile}`);
  execCommand(`solana-keygen new --no-bip39-passphrase --silent --force --outfile ${clientKeyFile}`);

  // Get addresses
  const facilitatorAddress = execCommand(`solana-keygen pubkey ${facilitatorKeyFile}`).trim();
  const serverAddress = execCommand(`solana-keygen pubkey ${serverKeyFile}`).trim();
  const clientAddress = execCommand(`solana-keygen pubkey ${clientKeyFile}`).trim();

  // Read private keys from files and encode to base58
  const facilitatorKeyJson = JSON.parse(await fs.readFile(facilitatorKeyFile, "utf8"));
  const serverKeyJson = JSON.parse(await fs.readFile(serverKeyFile, "utf8"));
  const clientKeyJson = JSON.parse(await fs.readFile(clientKeyFile, "utf8"));

  const facilitatorPrivateKey = base58.encode(new Uint8Array(facilitatorKeyJson));
  const serverPrivateKey = base58.encode(new Uint8Array(serverKeyJson));
  const clientPrivateKey = base58.encode(new Uint8Array(clientKeyJson));

  console.log("Facilitator (Fee Payer):");
  console.log(`  Private Key: ${facilitatorPrivateKey}`);
  console.log(`  Address: ${facilitatorAddress}\n`);

  console.log("Server (Payment Receiver):");
  console.log(`  Private Key: ${serverPrivateKey}`);
  console.log(`  Address: ${serverAddress}\n`);

  console.log("Client (Payment Sender):");
  console.log(`  Private Key: ${clientPrivateKey}`);
  console.log(`  Address: ${clientAddress}\n`);

  // Airdrop SOL to all accounts
  console.log("2. Airdropping SOL to all accounts...\n");

  console.log("Facilitator:");
  console.log(execCommand(`solana airdrop 10 ${facilitatorAddress} --url ${LOCALNET_URL}`));

  console.log("Server:");
  console.log(execCommand(`solana airdrop 10 ${serverAddress} --url ${LOCALNET_URL}`));

  console.log("Client:");
  console.log(execCommand(`solana airdrop 10 ${clientAddress} --url ${LOCALNET_URL}`));

  // Create USDC token mint
  console.log("\n3. Creating USDC token mint...\n");

  const createMintOutput = execCommand(
    `spl-token create-token --decimals ${DECIMALS} --url ${LOCALNET_URL} --fee-payer ${facilitatorKeyFile} --mint-authority ${facilitatorKeyFile}`
  );
  const mintMatch = createMintOutput.match(/Creating token (\w+)/);
  if (!mintMatch) {
    throw new Error("Failed to parse mint address from output");
  }
  const mintAddress = mintMatch[1];
  console.log(`✓ Token Mint Address: ${mintAddress}\n`);

  // Create token accounts and mint tokens
  console.log("4. Creating Associated Token Accounts and minting tokens...\n");

  const accounts = [
    { name: "Facilitator", address: facilitatorAddress },
    { name: "Server", address: serverAddress },
    { name: "Client", address: clientAddress },
  ];

  for (const account of accounts) {
    console.log(`${account.name}:`);

    // Create token account
    const createAccountOutput = execCommand(
      `spl-token create-account ${mintAddress} --owner ${account.address} --url ${LOCALNET_URL} --fee-payer ${facilitatorKeyFile}`
    );
    console.log(`  ${createAccountOutput.trim()}`);

    // Parse ATA address from output
    const ataMatch = createAccountOutput.match(/Creating account (\w+)/);
    if (!ataMatch) {
      throw new Error("Failed to parse ATA address from output");
    }
    const ataAddress = ataMatch[1];

    // Mint tokens to the ATA address
    const mintToOutput = execCommand(
      `spl-token mint ${mintAddress} ${INITIAL_MINT_AMOUNT} ${ataAddress} --url ${LOCALNET_URL} --mint-authority ${facilitatorKeyFile} --fee-payer ${facilitatorKeyFile}`
    );
    console.log(`  ${mintToOutput.trim()}\n`);
  }

  // Cleanup temp files
  await fs.rm(tmpDir, { recursive: true });

  console.log("=== Setup Complete! ===\n");

  console.log("Environment Variables for .env:");
  console.log(`SVM_PRIVATE_KEY=${facilitatorPrivateKey}`);
  console.log(`SVM_NETWORK=solana-localnet`);
  console.log(`SVM_RPC_URL=${LOCALNET_URL}`);
  console.log(`PORT=3002\n`);

  console.log("Environment Variables for .env_server:");
  console.log(`FACILITATOR_URL=http://localhost:3002`);
  console.log(`NETWORK=solana-localnet`);
  console.log(`ADDRESS=${serverAddress}`);
  console.log(`TOKEN_MINT_ADDRESS=${mintAddress}`);
  console.log(`TOKEN_DECIMALS=${DECIMALS}`);
  console.log(`TOKEN_NAME=USDC\n`);

  console.log("Environment Variables for .env_client:");
  console.log(`SVM_NETWORK=solana-localnet`);
  console.log(`SVM_RPC_URL=${LOCALNET_URL}`);
  console.log(`USER_SVM_PRIVATE_KEY=${clientPrivateKey}\n`);

  console.log("Next steps:");
  console.log("1. Copy the environment variables above to your .env files");
  console.log("2. Start the facilitator: pnpm run facilitator");
  console.log("3. Start the server: npx tsx examples/server_express.ts");
  console.log("4. Run the client: npx tsx examples/client_fetch.ts");
}

main().catch(console.error);
