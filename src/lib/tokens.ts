// src/lib/tokens.ts
import { Address } from "viem";
import { CCOP_ADDRESS } from "./viem"; // 👈 usamos la dirección oficial exportada en viem.ts

// ✅ ABI mínimo ERC20 estándar
const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "sender", type: "address" },
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
] as const;

// ✅ Centralizamos todos los tokens soportados con su ABI
export const TOKENS: Record<
  string,
  {
    address: Address;
    symbol: string;
    decimals: number;
    label: string;
    abi: typeof ERC20_ABI;
  }
> = {
  ccop: {
    address: CCOP_ADDRESS as Address,
    symbol: "cCOP",
    decimals: 18,
    label: "COP$ (cCOP)",
    abi: ERC20_ABI,
  },
  celo: {
    address: "0x471ece3750da237f93b8e339c536989b8978a438" as Address, // CELO en Alfajores/Mainnet
    symbol: "CELO",
    decimals: 18,
    label: "CELO",
    abi: ERC20_ABI,
  },
};

// ✅ Helper: buscar token por address
export function getTokenByAddress(address: string) {
  const addr = address.toLowerCase();
  return Object.values(TOKENS).find((t) => t.address.toLowerCase() === addr);
}
