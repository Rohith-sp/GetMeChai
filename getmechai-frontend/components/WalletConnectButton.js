"use client";

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, useBalance } from "wagmi";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function WalletConnectButton() {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount();
  const { connect, connectors, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Get ETH balance
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address: address,
  });

  const expectedChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "31337");

  // Handle connection status changes - only show toast once per session
  useEffect(() => {
    if (isConnected && address) {
      const toastKey = `wallet_connected_${address}`;
      const hasShownToast = sessionStorage.getItem(toastKey);
      
      if (!hasShownToast) {
        toast.success(`Connected to ${formatAddress(address)}`);
        sessionStorage.setItem(toastKey, 'true');
        
        // Check if on correct network
        if (chainId !== expectedChainId) {
          toast.error(`Wrong network! Please switch to ${expectedChainId === 31337 ? 'Hardhat Local' : 'the correct network'}`);
        }
      }
    }
    
    // Clear flag when disconnected
    if (!isConnected && address) {
      const toastKey = `wallet_connected_${address}`;
      sessionStorage.removeItem(toastKey);
    }
  }, [isConnected, address, chainId, expectedChainId]);

  // Handle connection errors
  useEffect(() => {
    if (connectError) {
      toast.error(connectError.message || "Failed to connect wallet");
    }
  }, [connectError]);

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = async (connector) => {
    try {
      await connect({ connector });
      setShowDropdown(false);
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to connect. Please try again.");
    }
  };

  const handleDisconnect = () => {
    // Clear the toast flag for this address
    if (address) {
      const toastKey = `wallet_connected_${address}`;
      sessionStorage.removeItem(toastKey);
    }
    disconnect();
    setShowDropdown(false);
    toast.success("Wallet disconnected");
  };

  if (isConnected) {
    return (
      <>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
        >
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>{formatAddress(address)}</span>
          <svg
            className={`w-4 h-4 transition-transform ${
              showDropdown ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {showDropdown && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
              className="absolute inset-0"
              onClick={() => setShowDropdown(false)}
            ></div>
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md max-h-[80vh] overflow-hidden animate-scale-in">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Connected Wallet
                  </h3>
                  <button
                    onClick={() => setShowDropdown(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">
                    {address}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Balance Display */}
                <div className="px-4 py-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Balance</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {balanceLoading ? (
                      <span className="text-sm">Loading...</span>
                    ) : balance ? (
                      <>
                        {parseFloat(balance.formatted).toFixed(4)} <span className="text-sm text-gray-600 dark:text-gray-400">{balance.symbol}</span>
                      </>
                    ) : (
                      <span className="text-sm">0.0000 ETH</span>
                    )}
                  </p>
                </div>

                {chainId !== expectedChainId && (
                  <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium flex items-center gap-2">
                      <span className="text-lg">⚠️</span>
                      <span>Wrong Network</span>
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-2">
                      Please switch to {expectedChainId === 31337 ? 'Hardhat Local (Chain ID: 31337)' : `Chain ID: ${expectedChainId}`}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleDisconnect}
                  className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors flex items-center justify-center space-x-2 font-medium"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Disconnect Wallet</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isConnecting}
        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </button>

      {showDropdown && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setShowDropdown(false)}
          ></div>
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md max-h-[80vh] overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Connect Wallet
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Choose your preferred wallet
                  </p>
                </div>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-thin">
              <div className="space-y-3">
                {connectors
                  .filter((connector, index, self) => 
                    index === self.findIndex((c) => c.id === connector.id)
                  )
                  .map((connector, index) => (
                  <button
                    key={`${connector.id}-${index}`}
                    onClick={() => handleConnect(connector)}
                    disabled={isConnecting}
                    className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 rounded-xl transition-all flex items-center space-x-4 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-white text-lg font-bold">
                        {connector.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {connector.name}
                      </p>
                      {connector.name.toLowerCase().includes('metamask') && (
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                          ⭐ Recommended
                        </p>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
