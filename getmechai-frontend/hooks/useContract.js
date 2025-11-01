'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACT_CONFIG } from '@/lib/wagmi';
import contractABI from '@/abi/GetMeChai.json';
import toast from 'react-hot-toast';

/**
 * Hook for reading creator data from contract
 */
export function useCreatorData(address) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: contractABI.abi,
    functionName: 'creators',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  return {
    creator: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for reading post data from contract
 */
export function usePostData(postId) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: contractABI.abi,
    functionName: 'posts',
    args: postId ? [postId] : undefined,
    enabled: postId !== null && postId !== undefined,
  });

  return {
    post: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for checking subscription status
 */
export function useSubscriptionStatus(subscriberAddress, creatorAddress) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: contractABI.abi,
    functionName: 'isSubscribed',
    args: subscriberAddress && creatorAddress ? [subscriberAddress, creatorAddress] : undefined,
    enabled: !!subscriberAddress && !!creatorAddress,
  });

  return {
    isSubscribed: data || false,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for reading subscription details
 */
export function useSubscriptionData(subscriberAddress, creatorAddress) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: contractABI.abi,
    functionName: 'subscriptions',
    args: subscriberAddress && creatorAddress ? [subscriberAddress, creatorAddress] : undefined,
    enabled: !!subscriberAddress && !!creatorAddress,
  });

  return {
    subscription: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for reading creator earnings
 */
export function useCreatorEarnings(address) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_CONFIG.address,
    abi: contractABI.abi,
    functionName: 'creatorEarnings',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  return {
    earnings: data ? formatEther(data) : '0',
    earningsWei: data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for registering as a creator
 */
export function useRegisterCreator() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const registerCreator = async (name, priceInEth) => {
    try {
      const priceWei = parseEther(priceInEth.toString());
      
      await writeContract({
        address: CONTRACT_CONFIG.address,
        abi: contractABI.abi,
        functionName: 'registerCreator',
        args: [name, priceWei],
      });
    } catch (err) {
      toast.error(err.reason || err.message || 'Failed to register');
      throw err;
    }
  };

  return {
    registerCreator,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook for adding a post
 */
export function useAddPost() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const addPost = async (ipfsHash, isFree) => {
    try {
      await writeContract({
        address: CONTRACT_CONFIG.address,
        abi: contractABI.abi,
        functionName: 'addPost',
        args: [ipfsHash, isFree],
      });
    } catch (err) {
      toast.error(err.message || 'Failed to add post');
      throw err;
    }
  };

  return {
    addPost,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook for subscribing to a creator
 */
export function useSubscribe() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const subscribe = async (creatorAddress, priceInEth) => {
    try {
      const priceWei = parseEther(priceInEth.toString());
      
      await writeContract({
        address: CONTRACT_CONFIG.address,
        abi: contractABI.abi,
        functionName: 'subscribe',
        args: [creatorAddress],
        value: priceWei,
      });
    } catch (err) {
      toast.error(err.message || 'Failed to subscribe');
      throw err;
    }
  };

  return {
    subscribe,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook for depositing autopay balance
 */
export function useDepositAutoPay() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const depositAutoPay = async (creatorAddress, amountInEth) => {
    try {
      const amountWei = parseEther(amountInEth.toString());
      
      await writeContract({
        address: CONTRACT_CONFIG.address,
        abi: contractABI.abi,
        functionName: 'depositAutoPay',
        args: [creatorAddress],
        value: amountWei,
      });
    } catch (err) {
      toast.error(err.message || 'Failed to deposit');
      throw err;
    }
  };

  return {
    depositAutoPay,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook for renewing subscription
 */
export function useRenewSubscription() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const renewSubscription = async (creatorAddress) => {
    try {
      await writeContract({
        address: CONTRACT_CONFIG.address,
        abi: contractABI.abi,
        functionName: 'renewSubscription',
        args: [creatorAddress],
      });
    } catch (err) {
      toast.error(err.message || 'Failed to renew');
      throw err;
    }
  };

  return {
    renewSubscription,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook for contributing to a post
 */
export function useContribute() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const contribute = async (postId, amountInEth) => {
    try {
      const amountWei = parseEther(amountInEth.toString());
      
      await writeContract({
        address: CONTRACT_CONFIG.address,
        abi: contractABI.abi,
        functionName: 'contribute',
        args: [postId],
        value: amountWei,
      });
    } catch (err) {
      toast.error(err.message || 'Failed to contribute');
      throw err;
    }
  };

  return {
    contribute,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook for withdrawing earnings
 */
export function useWithdrawEarnings() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const withdrawEarnings = async () => {
    try {
      await writeContract({
        address: CONTRACT_CONFIG.address,
        abi: contractABI.abi,
        functionName: 'withdrawEarnings',
      });
    } catch (err) {
      toast.error(err.message || 'Failed to withdraw');
      throw err;
    }
  };

  return {
    withdrawEarnings,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
