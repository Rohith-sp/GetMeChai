'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { 
  useSubscriptionData, 
  useDepositAutoPay, 
  useRenewSubscription 
} from '@/hooks/useContract';
import toast from 'react-hot-toast';

export default function SubscriptionManager({ creatorAddress, subscriptionPrice }) {
  const { address } = useAccount();
  const [autoPayAmount, setAutoPayAmount] = useState('');
  const [showAutoPayModal, setShowAutoPayModal] = useState(false);

  // Get subscription data
  const { subscription, isLoading, refetch } = useSubscriptionData(address, creatorAddress);
  
  // AutoPay hooks
  const { 
    depositAutoPay, 
    isPending: isDepositing, 
    isConfirming: isDepositConfirming,
    isSuccess: isDepositSuccess 
  } = useDepositAutoPay();

  const { 
    renewSubscription, 
    isPending: isRenewing, 
    isConfirming: isRenewConfirming,
    isSuccess: isRenewSuccess 
  } = useRenewSubscription();

  // Refetch subscription data after successful transactions
  useEffect(() => {
    if (isDepositSuccess || isRenewSuccess) {
      refetch();
    }
  }, [isDepositSuccess, isRenewSuccess, refetch]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!subscription || !subscription[0]) {
    return null;
  }

  const expiry = new Date(Number(subscription[0]) * 1000);
  const autoPayBalance = subscription[1] ? formatEther(subscription[1]) : '0';
  const isExpired = expiry < new Date();
  const daysRemaining = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));

  const handleDepositAutoPay = async () => {
    if (!autoPayAmount || parseFloat(autoPayAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await depositAutoPay(creatorAddress, autoPayAmount);
      setAutoPayAmount('');
      setShowAutoPayModal(false);
    } catch (error) {
      console.error('AutoPay deposit error:', error);
    }
  };

  const handleRenew = async () => {
    if (parseFloat(autoPayBalance) < parseFloat(formatEther(subscriptionPrice))) {
      toast.error('Insufficient AutoPay balance. Please deposit more funds.');
      return;
    }

    try {
      await renewSubscription(creatorAddress);
    } catch (error) {
      console.error('Renewal error:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Subscription Status
      </h3>

      {/* Subscription Info */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            isExpired 
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
          }`}>
            {isExpired ? 'Expired' : 'Active'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Expires</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {expiry.toLocaleDateString()}
          </span>
        </div>

        {!isExpired && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Days Remaining</span>
            <span className={`text-sm font-medium ${
              daysRemaining <= 7 
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-gray-900 dark:text-white'
            }`}>
              {daysRemaining} days
            </span>
          </div>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400">AutoPay Balance</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {parseFloat(autoPayBalance).toFixed(4)} ETH
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Renew Button */}
        {(isExpired || daysRemaining <= 7) && (
          <button
            onClick={handleRenew}
            disabled={isRenewing || isRenewConfirming || parseFloat(autoPayBalance) < parseFloat(formatEther(subscriptionPrice))}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRenewing || isRenewConfirming ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isRenewing ? 'Renewing...' : 'Confirming...'}
              </span>
            ) : (
              `Renew Subscription (${formatEther(subscriptionPrice)} ETH)`
            )}
          </button>
        )}

        {/* AutoPay Deposit Button */}
        <button
          onClick={() => setShowAutoPayModal(true)}
          className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          💰 Add AutoPay Funds
        </button>
      </div>

      {/* AutoPay Info */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          <strong>💡 AutoPay:</strong> Deposit funds to automatically renew your subscription when it expires. 
          You can renew anytime using your AutoPay balance.
        </p>
      </div>

      {/* AutoPay Modal */}
      {showAutoPayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Deposit AutoPay Funds
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={autoPayAmount}
                onChange={(e) => setAutoPayAmount(e.target.value)}
                placeholder="0.1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Subscription price: {formatEther(subscriptionPrice)} ETH per 30 days
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAutoPayModal(false);
                  setAutoPayAmount('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDepositAutoPay}
                disabled={isDepositing || isDepositConfirming || !autoPayAmount}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDepositing || isDepositConfirming ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isDepositing ? 'Depositing...' : 'Confirming...'}
                  </span>
                ) : (
                  'Deposit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
