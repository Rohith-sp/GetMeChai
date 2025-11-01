"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ConnectWalletPrompt({ message = "Please connect your wallet to access this page" }) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="max-w-md w-full">
        <div 
          className="rounded-2xl shadow-2xl p-8 text-center border"
          style={{ 
            background: 'var(--bg-card)',
            borderColor: 'var(--border-color)'
          }}
        >
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Wallet Not Connected
          </h2>

          {/* Message */}
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            {message}
          </p>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push("/")}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Go Home & Connect Wallet
            </button>

            <button
              onClick={() => router.back()}
              className="w-full py-3 px-6 rounded-lg font-semibold transition-colors"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)'
              }}
            >
              Go Back
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Don't have a wallet? Install{" "}
              <a 
                href="https://metamask.io/download/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-600 dark:text-purple-400 hover:underline font-medium"
              >
                MetaMask
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
