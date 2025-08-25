# CivicCop Blockchain – Vault-Lock System with cCOP

This repository contains the evolving implementation of a blockchain-based vault-lock system designed to simulate public procurement flows using the **Colombian peso–pegged stablecoin cCOP**, developed by Mentolabs.

---

## 🚀 Getting Started

Clone the repository and enter the project directory:

```bash
git clone https://github.com/your-username/CivicCop-Blockchain.git
cd CivicCop-Blockchain
bun install
bun run dev
```

> ⚠️ Requires access to cCOP on the Alfajores testnet to function properly.

---

## 📦 Current Version – Milestone 1

**Vault-Lock with cCOP Testnet**

This version demonstrates how public contracts can lock funds until conditions are met (e.g., product delivery, audit verification). As a simplification, funds are locked for a few seconds before being released, proving that **cCOP flows correctly on-chain**.

### ✅ Delivered

- Smart contract deployed and verified on Alfajores testnet
- Integration with cCOP stablecoin
- Local testing environment fully functional
- UI components scaffolded (not yet operational)

### 🔗 Contract Addresses

- **Vault-Lock Contract (cCOP testnet)**  
  [`0xe6A57340f0df6E020c1c0a80bC6E13048601f0d4`](https://alfajores.celoscan.io/address/0xe6A57340f0df6E020c1c0a80bC6E13048601f0d4)

- **Developer Wallet (for verification)**  
  [`0x6Dcbd404e62151Bea13e3670b231F5846AB1dA97`](https://alfajores.celoscan.io/address/0x6Dcbd404e62151Bea13e3670b231F5846AB1dA97)

> ⚠️ Note: Alfajores faucet and swap services are currently down. Migration to Celo Sepolia and updated cCOP support is pending.

---

## 🧭 Coming Soon – Milestone 2

- Fully functional UI for vault creation and tracking
- Improved error handling and user feedback
- Support for multiple tokens beyond cCOP
- Migration to Celo Sepolia testnet (pending ecosystem updates)

---

## 🗂️ Project Structure

### `src/app/`

- `VaultCreation.tsx`: Component to create vaults with cCOP and time lock
- `VaultList.tsx`: Displays vaults associated with the connected wallet
- `layout.tsx`, `page.tsx`: Base layout and main page
- `globals.css`: Global styles

### `src/lib/`

- `tokens.ts`: Defines cCOP token address
- `vaultAbi.ts`: ABI for the vault-lock contract
- `viem.ts`: Blockchain client configuration using Viem

### `abi/`

- `TimeLockVaultFactory.json`: ABI for the main contract
- `IERC20.json`: ERC20 interface for token interactions

---

## 🧰 Tech Stack

- **Next.js** with Bun
- **TypeScript**
- **Viem** for blockchain interactions
- **Celo Testnet (Alfajores)**

---

This project is under active development. Contributions, feedback, and testing are welcome as we build toward a robust blockchain-based public contract system.
