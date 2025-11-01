"use client";

import { useState, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAddPost } from "@/hooks/useContract";
import ConnectWalletPrompt from "@/components/ConnectWalletPrompt";
import toast from "react-hot-toast";

export default function UploadContent() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const router = useRouter();
  const { isOpen } = useSidebar();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    contentUrl: "",
    minTipAmount: "",
    isPremium: false,
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const { addPost, isPending, isConfirming, isSuccess, hash } = useAddPost();

  // Handle successful post creation
  useEffect(() => {
    if (isSuccess && hash) {
      toast.success('Post created successfully! Redirecting...');
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }
  }, [isSuccess, hash, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      setError("Please connect your wallet first");
      toast.error("Please connect your wallet first");
      return;
    }

    if (!formData.contentUrl) {
      setError("Please upload a file or enter an IPFS URL");
      toast.error("Please upload a file or enter an IPFS URL");
      return;
    }

    try {
      setError("");

      // Extract IPFS hash from URL
      let ipfsHash = formData.contentUrl;
      if (formData.contentUrl.includes('/ipfs/')) {
        ipfsHash = formData.contentUrl.split('/ipfs/')[1];
      } else if (formData.contentUrl.includes('ipfs://')) {
        ipfsHash = formData.contentUrl.replace('ipfs://', '');
      }

      // Call addPost hook - this will trigger MetaMask
      await addPost(ipfsHash, !formData.isPremium);
      
      // Don't redirect here - wait for isSuccess in useEffect
    } catch (err) {
      const errorMsg = typeof err === 'string' ? err : (err?.message || err?.reason || 'Failed to create post. Please try again.');
      console.error('Post creation error:', err);
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError("");

      // Create preview for images and videos
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview({ type: 'image', url: reader.result });
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview({ type: 'video', url: reader.result });
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview({ type: 'file', name: file.name, size: file.size });
      }

      // Upload to IPFS
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('uploaderAddress', address);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Server returned invalid response');
      }
      
      if (!response.ok) {
        const errorMsg = data?.error || data?.message || `Upload failed with status ${response.status}`;
        throw new Error(errorMsg || 'Upload failed. Please try again.');
      }
      
      if (!data || !data.url) {
        throw new Error('Server returned invalid data. Missing URL.');
      }
      
      setFormData(prev => ({ ...prev, contentUrl: data.url }));
      setUploadedFile({ name: file.name, size: file.size, type: file.type, url: data.url });
    } catch (err) {
      // Extract meaningful error message
      let errorMessage = 'Failed to upload file. Please try again.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.error) {
        errorMessage = err.error;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err && Object.keys(err).length === 0) {
        // Empty object error - likely from a failed promise or network issue
        errorMessage = 'Upload failed. Please check:\n1. Your Pinata API keys are correct\n2. You have internet connection\n3. The file type and size are valid';
      } else {
        // Last resort: try to stringify
        try {
          const stringified = JSON.stringify(err);
          errorMessage = stringified !== '{}' ? stringified : 'An unknown error occurred during upload';
        } catch {
          errorMessage = 'An unknown error occurred during upload';
        }
      }
      
      const finalError = typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : String(errorMessage);
      setError(finalError);
      toast.error(finalError);
      setFilePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFilePreview(null);
    setFormData(prev => ({ ...prev, contentUrl: '' }));
  };

  // Show connect wallet prompt if not connected
  if (!isConnected) {
    return <ConnectWalletPrompt message="Please connect your wallet to upload content and become a creator" />;
  }

  // Check network
  useEffect(() => {
    if (chainId && chainId !== 31337) {
      toast.error(`Wrong network! Please switch to Hardhat Local (Chain ID: 31337). You're on chain ${chainId}`);
    }
  }, [chainId]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <PageHeader />

      <main className={`flex-1 overflow-x-hidden transition-all duration-300 ${isOpen ? 'ml-72' : 'ml-0'} ${!isOpen ? 'pt-20' : ''}`}>
        <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="text-purple-600 dark:text-purple-400 hover:underline mb-4 flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <div className="flex items-center gap-4 mb-2">
              <Image src="/avatar.gif" alt="Upload" width={50} height={50} />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Upload Content
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Share your exclusive content with your supporters
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Field */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter content title"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* Description Field */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your content..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  required
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Content (Optional - or use URL below)
                </label>
                
                {!uploadedFile ? (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-purple-500 dark:hover:border-purple-400 transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar,.7z"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Images (10MB), Videos (100MB), Audio (50MB), PDFs & Docs (25MB)
                        </p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    {filePreview?.type === 'image' && (
                      <div className="mb-3">
                        <Image src={filePreview.url} alt="Preview" width={400} height={300} className="rounded-lg max-h-64 object-cover mx-auto" />
                      </div>
                    )}
                    {filePreview?.type === 'video' && (
                      <div className="mb-3">
                        <video src={filePreview.url} controls className="rounded-lg max-h-64 mx-auto" />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{uploadedFile.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Or Manual URL */}
              <div>
                <label
                  htmlFor="contentUrl"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Or Enter IPFS URL Directly *
                </label>
                <input
                  type="text"
                  id="contentUrl"
                  name="contentUrl"
                  value={formData.contentUrl}
                  onChange={handleChange}
                  placeholder="https://gateway.pinata.cloud/ipfs/QmXxx... or QmXxx..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={!!uploadedFile}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  You can paste an IPFS URL or hash here instead of uploading a file
                </p>
              </div>

              {/* Premium Content Toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPremium"
                  name="isPremium"
                  checked={formData.isPremium}
                  onChange={handleChange}
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor="isPremium"
                  className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Premium Content (Requires minimum tip to unlock)
                </label>
              </div>

              {/* Minimum Tip Amount (shown only if premium) */}
              {formData.isPremium && (
                <div>
                  <label
                    htmlFor="minTipAmount"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Minimum Tip Amount (ETH)
                  </label>
                  <input
                    type="number"
                    id="minTipAmount"
                    name="minTipAmount"
                    value={formData.minTipAmount}
                    onChange={handleChange}
                    placeholder="0.01"
                    step="0.001"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Supporters must tip at least this amount to unlock this content
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
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || isConfirming || isSuccess || !isConnected}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      Post Created!
                    </span>
                  ) : (
                    "Create Post"
                  )}
                </button>
              </div>
            </form>

            {/* Info Box */}
            <div className="mt-8 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">
                💡 Supported Content Types & Size Limits
              </h3>
              <ul className="text-sm text-purple-800 dark:text-purple-400 space-y-1">
                <li>• <strong>Images:</strong> JPEG, PNG, GIF, WebP, SVG (Max 10MB)</li>
                <li>• <strong>Videos:</strong> MP4, WebM, QuickTime, AVI (Max 100MB)</li>
                <li>• <strong>Audio:</strong> MP3, WAV, OGG, M4A (Max 50MB)</li>
                <li>• <strong>Documents:</strong> PDF, Word, Text files (Max 25MB)</li>
                <li>• <strong>Archives:</strong> ZIP, RAR, 7Z (Max 50MB)</li>
                <li>• All content is stored on IPFS and referenced on-chain</li>
              </ul>
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
