"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import PostCard from "@/components/PostCard";
import ContractError from "@/components/ContractError";
import { useSidebar } from "@/contexts/SidebarContext";
import { getCreatorPosts, getCreatorStats, getCreatorProfile } from "@/lib/contract";
import ConnectWalletPrompt from "@/components/ConnectWalletPrompt";

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { isOpen } = useSidebar();
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({
    totalTips: "0",
    totalSupporters: 0,
    totalPosts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadDashboardData();
    }
  }, [isConnected, address]);

  // Update stats when posts change
  useEffect(() => {
    if (posts.length > 0) {
      setStats(prev => ({
        ...prev,
        totalPosts: posts.length
      }));
    }
  }, [posts]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load creator stats first to check if registered
      const creatorStats = await getCreatorStats(address);
      setStats(creatorStats);
      
      // Check if user is a registered creator
      const profile = await getCreatorProfile(address);
      setIsCreator(profile.isRegistered);
      
      // Load creator posts only if registered
      if (profile.isRegistered) {
        const creatorPosts = await getCreatorPosts(address);
        setPosts(creatorPosts);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return <ConnectWalletPrompt message="Please connect your wallet to view your creator dashboard and manage your content" />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <PageHeader />

      <main className={`flex-1 overflow-x-hidden transition-all duration-300 ${isOpen ? 'ml-72' : 'ml-0'} ${!isOpen ? 'pt-20' : ''}`}>
        <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0 tea-gif-container">
            <Image 
              src="/tea.gif" 
              alt="Tea animation" 
              width={64} 
              height={64}
              className="rounded-lg"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Creator Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your content and track your earnings
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8">
            <ContractError error={error} />
          </div>
        )}

        {/* Not Registered Message */}
        {!loading && !isCreator && !error && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-8 text-center mb-8">
            <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              You're Not Registered as a Creator Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Register as a creator to start uploading content, earning tips, and building your community!
            </p>
            <button
              onClick={() => router.push("/creator/register")}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Register as Creator
            </button>
          </div>
        )}

        {/* Stats Cards */}
        {!error && isCreator && (<>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Tips
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalTips} ETH
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden">
                <Image 
                  src="/coin.gif" 
                  alt="Coin animation" 
                  width={48} 
                  height={48}
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Supporters
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalSupporters}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden">
                <Image 
                  src="/group.gif" 
                  alt="Group animation" 
                  width={48} 
                  height={48}
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Posts
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {posts.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => router.push("/creator/upload")}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
          >
            + Create New Post
          </button>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Posts Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Your Posts
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No posts yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start creating content to engage with your supporters
              </p>
              <button
                onClick={() => router.push("/creator/upload")}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Your First Post
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} isOwner={true} />
              ))}
            </div>
          )}
        </div>
        </>)}
        </div>
      </main>
    </div>
  );
}
