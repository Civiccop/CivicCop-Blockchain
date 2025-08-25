import {
  createPublicClient,
  createWalletClient,
  http,
  custom,
  type PublicClient,
  type WalletClient,
} from "viem";
import { celoAlfajores } from "viem/chains";

// RPC URLs
const DEFAULT_RPC = celoAlfajores.rpcUrls.default.http[0];
const FORNO_RPC = "https://alfajores-forno.celo-testnet.org";

// Factory contract address (deployed on Alfajores)
export const FACTORY_ADDRESS = "0x6Dcbd404e62151Bea13e3670b231F5846AB1dA97";

// cCOP token address on Alfajores Testnet (official from Celo docs)
export const CCOP_ADDRESS = "0xe6A57340f0df6E020c1c0a80bC6E13048601f0d4";

// Public client for read-only operations (e.g., fetching vaults)
const rawPublicClient = createPublicClient({
  chain: celoAlfajores,
  transport: http(DEFAULT_RPC),
});

export const publicClient = rawPublicClient;
export const getTypedPublicClient = (): PublicClient => rawPublicClient;

// Public client for simulations and withdraw calls
export const fornoClient = createPublicClient({
  chain: celoAlfajores,
  transport: http(FORNO_RPC),
});

// Wallet client for MetaMask signing (browser only)
export const getWalletClient = (): WalletClient | null => {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    return createWalletClient({
      chain: celoAlfajores,
      transport: custom((window as any).ethereum),
    });
  }
  return null;
};
