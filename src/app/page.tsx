"use client";

import { useState, useEffect } from "react";
import VaultCreation from "./VaultCreation";
import VaultList from "./VaultList";
import { publicClient, getWalletClient } from "../lib/viem";
import type { WalletClient, PublicClient } from "viem";

// Dirección de cCOP en Alfajores
const CCOP_ADDRESS = "0xe6A57340f0df6E020c1c0a80bC6E13048601f0d4";

// ABI mínimo ERC20
const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
];

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [account, setAccount] = useState<string>("");
  const [balance, setBalance] = useState<string>("0.0000");
  const [tokenSymbol, setTokenSymbol] = useState<string>("cCOP");
  const [refreshKey, setRefreshKey] = useState(0);

  // Inicializa walletClient en cliente
  useEffect(() => {
    setWalletClient(getWalletClient());
    setIsClient(true);
  }, []);

  // Función para leer balance de cCOP
  async function fetchCcopBalance(addr: string) {
    try {
      const [balWei, decimals, symbol] = await Promise.all([
        publicClient.readContract({
          address: CCOP_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [addr],
        }),
        publicClient.readContract({
          address: CCOP_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "decimals",
        }),
        publicClient.readContract({
          address: CCOP_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "symbol",
        }),
      ]);

      const bal = Number(balWei) / 10 ** Number(decimals);
      setBalance(bal.toFixed(4));

      if (typeof symbol === "string") {
        setTokenSymbol(symbol);
      } else {
        console.warn("Símbolo inesperado:", symbol);
      }
    } catch (err) {
      console.error("Error leyendo balance de cCOP:", err);
    }
  }

  // Conecta MetaMask y obtiene balance
  async function onConnect() {
    if (!walletClient) {
      alert("Instala MetaMask u otra wallet compatible");
      return;
    }
    try {
      const [addr] = (await walletClient.request({
        method: "eth_requestAccounts",
      })) as string[];
      setAccount(addr);
      await fetchCcopBalance(addr);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Error conectando wallet:", err);
    }
  }

  // Polling cada 15s para refrescar balance
  useEffect(() => {
    if (!account) return;
    const interval = setInterval(async () => {
      await fetchCcopBalance(account);
      setRefreshKey((k) => k + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, [account]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Cargando DApp…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-900">
          Wallet Web3
        </h1>

        <button
          onClick={onConnect}
          disabled={!!account}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {account ? "Wallet Conectada" : "Conectar Wallet"}
        </button>

        {account && (
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-600 font-mono break-all">
                {account}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-lg text-blue-900 font-bold">
                {balance} {tokenSymbol}
              </p>
            </div>
          </>
        )}

        <VaultCreation
          account={account}
          walletClient={walletClient}
          publicClient={publicClient}
          balance={balance}
          onRefresh={() => setRefreshKey((k) => k + 1)}
        />
        <VaultList
          account={account}
          walletClient={walletClient}
          publicClient={publicClient}
          refreshKey={refreshKey}
        />
      </div>
    </div>
  );
}
