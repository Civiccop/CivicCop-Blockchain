"use client";

import { useState, useEffect } from "react";
import { parseUnits, formatUnits } from "viem";
import { celoAlfajores } from "viem/chains";
import abiJson from "../../abi/TimeLockVaultFactory.json";
import { getTypedPublicClient } from "../lib/viem";
import { TOKENS } from "../lib/tokens";
import type { WalletClient, PublicClient } from "viem";

const factoryAbi = abiJson.abi;
const FACTORY_ADDRESS = "0x6Dcbd404e62151Bea13e3670b231F5846AB1dA97";
const CCOP = TOKENS.ccop;

type Props = {
  account?: string;
  walletClient: WalletClient | null;
  publicClient?: PublicClient;
  onRefresh?: () => void;
};

export default function VaultCreation({
  account,
  walletClient,
  publicClient,
  onRefresh,
}: Props) {
  const client = publicClient ?? getTypedPublicClient();

  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [ccopBalance, setCcopBalance] = useState("0");

  useEffect(() => {
    if (!account) return;
    (async () => {
      try {
        const balWei = await client.readContract({
          address: CCOP.address,
          abi: CCOP.abi,
          functionName: "balanceOf",
          args: [account],
        });
        const decimals = await client.readContract({
          address: CCOP.address,
          abi: CCOP.abi,
          functionName: "decimals",
        });
        const formatted = formatUnits(balWei as bigint, Number(decimals));
        setCcopBalance(formatted);
      } catch (err) {
        console.error("Error al leer balance de cCOP:", err);
        setCcopBalance("0");
      }
    })();
  }, [account, client, txHash]);

  async function createVault() {
    if (!walletClient || !account) return;
    if (!amount || !duration) {
      alert("Debes ingresar monto y duración");
      return;
    }
    setIsLoading(true);
    try {
      const chainId = await walletClient.getChainId();
      if (chainId !== celoAlfajores.id) {
        await (window as any).ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${celoAlfajores.id.toString(16)}` }],
        });
      }

      const parsedAmount = parseUnits(amount, CCOP.decimals);
      const parsedDuration = BigInt(duration);
      const nowTs = BigInt(Math.floor(Date.now() / 1000));
      const unlockTime = nowTs + parsedDuration;

      const { request: approveRequest } = await client.simulateContract({
        chain: celoAlfajores,
        address: CCOP.address,
        abi: CCOP.abi,
        functionName: "approve",
        args: [FACTORY_ADDRESS, parsedAmount],
        account: account as `0x${string}`,
      });

      const approveTx = await walletClient.writeContract(approveRequest);
      console.log("Approve enviado:", approveTx);

      await client.waitForTransactionReceipt({ hash: approveTx });

      const { request } = await client.simulateContract({
        chain: celoAlfajores,
        address: FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: "createVaultERC20",
        args: [CCOP.address, parsedAmount, unlockTime],
        account: account as `0x${string}`,
      });

      const hash = await walletClient.writeContract(request);
      setTxHash(hash);
      onRefresh?.();
    } catch (error: any) {
      console.error("Error al crear bóveda:", error);
      const msg =
        error?.cause?.data?.message ||
        error?.shortMessage ||
        error?.message ||
        "Unknown error";
      alert("Revert/Fail: " + msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function addCcopToMetamask() {
    try {
      await (window as any).ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: CCOP.address,
            symbol: CCOP.symbol,
            decimals: CCOP.decimals,
          },
        },
      });
    } catch (err) {
      console.error("Error al agregar token a MetaMask:", err);
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-blue-900 font-bold">
        Balance disponible: {ccopBalance} {CCOP.symbol}
      </div>

      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-lg text-blue-900 font-bold">
          Monto (COP$ - {CCOP.symbol}):
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Ej. 100000"
          className="px-3 py-2 border rounded-md text-lg text-blue-900"
        />
      </div>

      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-lg text-blue-900 font-bold">
          Duración del bloqueo (segundos):
        </label>
        <input
          type="number"
          min="1"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="Ej. 86400 (1 día)"
          className="px-3 py-2 border rounded-md text-lg text-blue-900"
        />
      </div>

      <button
        onClick={createVault}
        disabled={isLoading}
        className={`w-full px-4 py-2 text-white rounded-md ${
          isLoading ? "bg-gray-400" : "bg-green-700 hover:bg-green-800"
        }`}
      >
        {isLoading
          ? "Registrando compromiso..."
          : "Crear bóveda de transparencia"}
      </button>

      <button
        onClick={addCcopToMetamask}
        className="w-full px-4 py-2 text-white rounded-md bg-blue-600 hover:bg-blue-700"
      >
        Agregar cCOP a MetaMask
      </button>

      {txHash && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800 font-medium">
            Transacción enviada al registro público
          </p>
          <p className="text-xs text-yellow-600 font-mono break-all">
            {txHash}
          </p>
        </div>
      )}
    </div>
  );
}
