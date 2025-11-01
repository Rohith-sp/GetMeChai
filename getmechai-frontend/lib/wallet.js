"use client";

import { http, createConfig } from "wagmi";
import { mainnet, sepolia, hardhat } from "wagmi/chains";
import { injected, metaMask, walletConnect } from "wagmi/connectors";

// WalletConnect Project ID (replace with your own from https://cloud.walletconnect.com)
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID";

// Configure chains
export const chains = [sepolia, hardhat, mainnet];

// Configure connectors
const connectors = [
  injected(),
  metaMask(),
  walletConnect({ 
    projectId,
    showQrModal: true,
  }),
];

// Create wagmi config
export const config = createConfig({
  chains,
  connectors,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
});

// Helper function to get the current chain
export const getCurrentChain = () => {
  if (typeof window === "undefined") return sepolia;
  
  const chainId = window.ethereum?.chainId;
  if (!chainId) return sepolia;
  
  const chain = chains.find((c) => c.id === parseInt(chainId, 16));
  return chain || sepolia;
};

// Helper function to switch network
export const switchNetwork = async (chainId) => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No wallet detected");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
  } catch (error) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      const chain = chains.find((c) => c.id === chainId);
      if (!chain) throw new Error("Chain not found");

      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${chainId.toString(16)}`,
            chainName: chain.name,
            nativeCurrency: chain.nativeCurrency,
            rpcUrls: chain.rpcUrls.default.http,
            blockExplorerUrls: chain.blockExplorers?.default.url ? [chain.blockExplorers.default.url] : [],
          },
        ],
      });
    } else {
      throw error;
    }
  }
};

// Helper function to format address
export const formatAddress = (address) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Helper function to format balance
export const formatBalance = (balance, decimals = 4) => {
  if (!balance) return "0";
  const num = parseFloat(balance);
  return num.toFixed(decimals);
};
