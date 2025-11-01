'use client';

import { http, createConfig } from 'wagmi';
import { hardhat, sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Define chains based on environment
const chains = process.env.NODE_ENV === 'production' 
  ? [sepolia] 
  : [hardhat, sepolia];

// Create Wagmi config
export const config = createConfig({
  chains,
  connectors: [
    injected({ 
      shimDisconnect: true,
      target: 'metaMask' 
    }),
  ],
  transports: {
    [hardhat.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545'),
    [sepolia.id]: http(),
  },
  ssr: true,
});

// Contract configuration
export const CONTRACT_CONFIG = {
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337'),
};

// Validate configuration
if (!CONTRACT_CONFIG.address) {
  // Contract address not configured
}
