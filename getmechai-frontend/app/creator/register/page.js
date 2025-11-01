"use client";

import { useState, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import { useSidebar } from "@/contexts/SidebarContext";
import { useRegisterCreator } from "@/hooks/useContract";
import toast from "react-hot-toast";
import ConnectWalletPrompt from "@/components/ConnectWalletPrompt";
import { getCreatorProfile } from "@/lib/contract";

export default function CreatorRegister() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const router = useRouter();
  const { isOpen } = useSidebar();
  const [formData, setFormData] = useState({
    name: "",
    subscriptionPrice: "",
  });
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const { registerCreator, isPending, isConfirming, isSuccess, hash } = useRegisterCreator();

  // Handle successful registration
  useEffect(() => {
    if (isSuccess && hash) {
      toast.success('Registration confirmed! Redirecting to dashboard...');
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }
  }, [isSuccess, hash, router]);

  // Show connect wallet prompt if not connected
  if (!isConnected) {
    return <ConnectWalletPrompt message="Please connect your wallet to register as a creator and start earning" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if on correct network
    if (chainId !== 31337) {
      const errorMsg = `Wrong network! Please switch to Hardhat Local (Chain ID: 31337). You're on chain ${chainId}`;
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!formData.name || !formData.subscriptionPrice) {
      setError("Please fill in all fields");
      toast.error("Please fill in all fields");
      return;
    }

    if (parseFloat(formData.subscriptionPrice) <= 0) {
      setError("Subscription price must be greater than 0");
      toast.error("Subscription price must be greater than 0");
      return;
    }

    try {
      setError("");
      setIsRegistering(true);
      
      // Check if already registered
      const profile = await getCreatorProfile(address);
      if (profile.isRegistered) {
        setError("You are already registered as a creator");
        toast.error("You are already registered as a creator");
        setTimeout(() => router.push("/dashboard"), 1500);
        setIsRegistering(false);
        return;
      }
      
      // Call the registration function - this will trigger MetaMask
      await registerCreator(formData.name, formData.subscriptionPrice);
      
      // Don't redirect here - wait for isSuccess in useEffect
    } catch (err) {
      setIsRegistering(false);
      
      // Extract meaningful error message
      let errorMsg = "Failed to register. Please try again.";
      
      if (err.message) {
        if (err.message.includes("circuit breaker")) {
          errorMsg = "MetaMask blocked the request. Please:\n1. Open MetaMask → Settings → Advanced\n2. Click 'Clear activity tab data'\n3. Refresh this page and try again";
        } else if (err.message.includes("Already registered")) {
          errorMsg = "You are already registered as a creator";
          setTimeout(() => router.push("/dashboard"), 1500);
        } else if (err.message.includes("Invalid price")) {
          errorMsg = "Subscription price must be greater than 0";
        } else if (err.message.includes("rejected") || err.message.includes("denied") || err.message.includes("User rejected")) {
          errorMsg = "Transaction was rejected. Please try again.";
        } else {
          errorMsg = err.message;
        }
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <PageHeader />

      <main className={`flex-1 overflow-x-hidden transition-all duration-300 ${isOpen ? 'ml-72' : 'ml-0'} ${!isOpen ? 'pt-20' : ''}`}>
        <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Image src="/avatar.gif" alt="Creator" width={60} height={60} />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Become a Creator
              </h1>
              <Image src="/coin.gif" alt="Earn" width={60} height={60} />
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Start earning from your content and connect with your supporters
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                >
                  Creator Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your creator name"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-900"
                  required
                />
              </div>

              {/* Subscription Price Field */}
              <div>
                <label
                  htmlFor="subscriptionPrice"
                  className="block text-sm font-medium text-gray-900 dark:text-white mb-2"
                >
                  Subscription Price (ETH per 30 days) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="subscriptionPrice"
                    name="subscriptionPrice"
                    value={formData.subscriptionPrice}
                    onChange={handleChange}
                    placeholder="0.01"
                    step="0.001"
                    min="0.001"
                    className="w-full px-4 py-3 pr-16 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-900"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">ETH</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  Subscribers will pay this amount every 30 days to access your content
                </p>
              </div>

              {/* Wallet Address Display */}
              {isConnected && (
                <div className="bg-purple-50 dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-2">
                    Your Wallet Address
                  </p>
                  <p className="text-sm font-mono text-purple-700 dark:text-purple-200 break-all bg-white dark:bg-gray-900 p-3 rounded border border-purple-100 dark:border-purple-800">
                    {address}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending || isConfirming || isSuccess || !isConnected}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Waiting for wallet approval...
                  </span>
                ) : isConfirming ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Confirming on blockchain...
                  </span>
                ) : isSuccess ? (
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Registration Successful!
                  </span>
                ) : !isConnected ? (
                  "Connect Wallet to Register"
                ) : (
                  "Register as Creator"
                )}
              </button>
            </form>

            {/* Info Box */}
            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                💡 What happens next?
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                <li>• Your profile will be created on the blockchain</li>
                <li>• Set your subscription price (subscribers pay every 30 days)</li>
                <li>• Upload exclusive content for your subscribers</li>
                <li>• Earn from subscriptions and contributions</li>
                <li>• Withdraw earnings instantly to your wallet</li>
              </ul>
            </div>

            {/* Pricing Examples */}
            <div className="mt-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">
                💰 Suggested Pricing
              </h3>
              <div className="grid grid-cols-3 gap-2 text-xs text-purple-800 dark:text-purple-400">
                <div className="text-center p-2 bg-white dark:bg-purple-900/30 rounded">
                  <p className="font-semibold">Starter</p>
                  <p>0.01 ETH</p>
                </div>
                <div className="text-center p-2 bg-white dark:bg-purple-900/30 rounded">
                  <p className="font-semibold">Standard</p>
                  <p>0.05 ETH</p>
                </div>
                <div className="text-center p-2 bg-white dark:bg-purple-900/30 rounded">
                  <p className="font-semibold">Premium</p>
                  <p>0.1 ETH</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
