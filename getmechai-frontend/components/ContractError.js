"use client";

export default function ContractError({ error }) {
  const isContractNotDeployed = error?.message?.includes("No contract found") || 
                                 error?.message?.includes("missing revert data");

  if (!isContractNotDeployed) {
    return (
      <div className="max-w-2xl mx-auto p-6 rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-900/20">
        <div className="flex items-start gap-4">
          <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Error</h3>
            <p className="text-red-600 dark:text-red-300">{error?.message || "An error occurred"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8 rounded-xl border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
      <div className="flex items-start gap-4">
        <svg className="w-8 h-8 text-yellow-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-yellow-700 dark:text-yellow-400 mb-3">
            ⚠️ Contract Not Deployed
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 mb-4">
            The smart contract hasn't been deployed yet. Please follow these steps:
          </p>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center font-bold">1</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Start Hardhat Node</p>
                <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-1 block">
                  cd getmechai-contracts && npx hardhat node
                </code>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center font-bold">2</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Deploy Contract</p>
                <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-1 block">
                  npx hardhat run scripts/deploy.js --network localhost
                </code>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center font-bold">3</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Update Contract Address</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Copy the deployed address and update it in <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">lib/contract.js</code>
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-sm flex items-center justify-center font-bold">4</span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Refresh Page</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Reload this page after updating the contract address
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>Tip:</strong> See <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">DEPLOYMENT.md</code> for detailed instructions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
