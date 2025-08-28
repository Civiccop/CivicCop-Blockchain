"use client";

import { useEffect, useState } from "react";
import type { Abi, WalletClient, Address } from "viem";
import { decodeErrorResult, formatUnits } from "viem";
import { celoAlfajores } from "viem/chains";
import { FACTORY_ADDRESS, fornoClient } from "../lib/viem";
import { TOKENS } from "../lib/tokens";
import { vaultAbi } from "../lib/vaultAbi";

const CCOP = TOKENS.ccop;

const ERC20_ABI = [
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
] as const;

type Vault = {
  id: bigint;
  creator: string;
  token: string;
  amount: bigint;
  unlockTime: bigint;
  withdrawn: boolean;
  symbol?: string;
  decimals?: number;
};

type Props = {
  account?: Address;
  walletClient: WalletClient | null;
  refreshKey?: number;
  onRefresh?: () => void;
};

export default function VaultList({
  account,
  walletClient,
  refreshKey = 0,
  onRefresh,
}: Props) {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<bigint | null>(null);
  const [error, setError] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!account) {
      setVaults([]);
      return;
    }
    setLoading(true);

    (async () => {
      try {
        const len = (await fornoClient.readContract({
          address: FACTORY_ADDRESS,
          abi: vaultAbi as Abi,
          functionName: "userVaultsLength",
          args: [account],
        })) as bigint;

        if (len === 0n) {
          setVaults([]);
          return;
        }

        const ids = await Promise.all(
          Array.from(
            { length: Number(len) },
            (_, i) =>
              fornoClient.readContract({
                address: FACTORY_ADDRESS,
                abi: vaultAbi as Abi,
                functionName: "userVaults",
                args: [account, BigInt(i)],
              }) as Promise<bigint>,
          ),
        );

        const data = await Promise.all(
          ids.map(async (vaultId) => {
            const [creator, token, amount, unlockTime, withdrawn] =
              (await fornoClient.readContract({
                address: FACTORY_ADDRESS,
                abi: vaultAbi as Abi,
                functionName: "vaults",
                args: [vaultId],
              })) as [string, string, bigint, bigint, boolean];

            let symbol = "TOKEN";
            let decimals = 18;

            try {
              if (token !== "0x0000000000000000000000000000000000000000") {
                symbol = (await fornoClient.readContract({
                  address: token as `0x${string}`,
                  abi: ERC20_ABI,
                  functionName: "symbol",
                })) as string;

                decimals = Number(
                  await fornoClient.readContract({
                    address: token as `0x${string}`,
                    abi: ERC20_ABI,
                    functionName: "decimals",
                  }),
                );
              } else {
                // native CELO
                symbol = "CELO";
                decimals = 18;
              }
            } catch {
              console.warn(`No se pudo leer metadata ERC20 de ${token}`);
            }

            return {
              id: vaultId,
              creator,
              token,
              amount,
              unlockTime,
              withdrawn,
              symbol,
              decimals,
            } as Vault;
          }),
        );

        setVaults(data);
      } catch (err) {
        console.error("Error al leer bóvedas:", err);
        setVaults([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [account, refreshKey]);

  async function withdrawVault(id: bigint) {
    if (!walletClient || !account) return;
    const vault = vaults.find((v) => v.id === id);
    if (!vault) return;

    const isOwner = vault.creator.toLowerCase() === account.toLowerCase();
    const unlocked = Number(vault.unlockTime) * 1000 <= Date.now();
    if (!isOwner) {
      alert("⚠️ Solo el responsable designado puede retirar esta bóveda.");
      return;
    }
    if (!unlocked) {
      alert("⏳ Aún no ha llegado el tiempo de desbloqueo.");
      return;
    }

    setWithdrawingId(id);
    setError((e) => ({ ...e, [id.toString()]: "" }));

    try {
      const chainId = await walletClient.getChainId();
      if (chainId !== celoAlfajores.id) {
        await (window as any).ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${celoAlfajores.id.toString(16)}` }],
        });
      }

      try {
        const { request } = await fornoClient.simulateContract({
          chain: celoAlfajores,
          address: FACTORY_ADDRESS,
          abi: vaultAbi as Abi,
          functionName: "withdraw",
          args: [id],
          account,
        });

        const gasPrice = await fornoClient.getGasPrice();
        const txHash = await walletClient.writeContract({
          ...request,
        });

        console.log("✅ Transacción enviada:", txHash);
        onRefresh?.();
      } catch (simErr: unknown) {
        console.error("Error en simulación de retiro:", simErr);
        const msg =
          (simErr as any)?.cause?.data?.message ||
          (simErr as any)?.shortMessage ||
          (simErr as Error).message ||
          "Reversión sin motivo específico";
        setError((e) => ({ ...e, [id.toString()]: msg }));
        alert("❌ Retiro rechazado:\n" + msg);
        setWithdrawingId(null);
        return;
      }

      const gas = await fornoClient.estimateContractGas({
        address: FACTORY_ADDRESS,
        abi: vaultAbi as Abi,
        functionName: "withdraw",
        args: [id],
        account,
      });
      const gasWithBuffer = (gas * 110n) / 100n;
      const gasPrice = await fornoClient.getGasPrice();

      const txHash = await walletClient.writeContract({
        chain: celoAlfajores,
        address: FACTORY_ADDRESS,
        abi: vaultAbi as Abi,
        functionName: "withdraw",
        args: [id],
        account,
        gas: gasWithBuffer,
        gasPrice,
      });

      console.log("✅ Transacción enviada:", txHash);
      onRefresh?.();
    } catch (err: unknown) {
      console.error("Error al retirar:", err);
      const msg =
        (err as any)?.shortMessage ||
        (err as Error).message ||
        "Error desconocido";
      setError((e) => ({ ...e, [id.toString()]: String(msg) }));
      alert("❌ No se pudo retirar la bóveda:\n" + String(msg));
    } finally {
      setWithdrawingId(null);
    }
  }

  if (!account)
    return (
      <p className="text-gray-600">
        Conecta tu wallet para consultar las bóvedas asignadas.
      </p>
    );
  if (loading)
    return <p className="text-gray-600">Cargando información de bóvedas…</p>;
  if (vaults.length === 0)
    return (
      <p className="text-gray-600">No se registraron bóvedas a tu nombre.</p>
    );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-lg text-blue-900">
        Bóvedas Auditables
      </h2>
      {vaults.map((v) => {
        const unlocked = Number(v.unlockTime) * 1000 <= Date.now();
        const key = v.id.toString();
        const formatted = v.decimals
          ? formatUnits(v.amount, v.decimals)
          : v.amount.toString();
        const label =
          v.token.toLowerCase() === CCOP.address.toLowerCase()
            ? `COP$ (${CCOP.symbol})`
            : v.symbol || v.token;

        return (
          <div
            key={key}
            className="p-4 bg-white rounded-lg shadow-sm text-black border border-blue-200"
          >
            <p>
              <strong>ID:</strong> {key}
            </p>
            <p>
              <strong>Token:</strong> {label}
            </p>
            <p>
              <strong>Monto asignado:</strong> {formatted} {v.symbol}
            </p>
            <p>
              <strong>Fecha de desbloqueo:</strong>{" "}
              {new Date(Number(v.unlockTime) * 1000).toLocaleString()}
            </p>
            <p>
              <strong>Estado:</strong>{" "}
              {v.withdrawn ? "Retirado" : "En custodia"}
            </p>

            {!v.withdrawn && unlocked && isOwner(v.creator, account) && (
              <button
                onClick={() => withdrawVault(v.id)}
                disabled={withdrawingId === v.id}
                className="mt-2 px-4 py-1 bg-green-700 text-white rounded hover:bg-green-800 disabled:opacity-50"
              >
                {withdrawingId === v.id
                  ? "Procesando retiro…"
                  : "Retirar fondos"}
              </button>
            )}

            {error[key] && (
              <p className="text-red-600 mt-2 whitespace-pre-wrap">
                Error: {error[key]}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function isOwner(creator: string, account: Address) {
  return creator.toLowerCase() === account.toLowerCase();
}
