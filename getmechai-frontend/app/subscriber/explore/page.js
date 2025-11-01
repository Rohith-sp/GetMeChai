"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import PostCard from "@/components/PostCard";
import { useSidebar } from "@/contexts/SidebarContext";
import { getAllPosts, getAllCreators } from "@/lib/contract";

export default function Explore() {
  const { isConnected } = useAccount();
  const { isOpen } = useSidebar();
  const [posts, setPosts] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts"); // "posts" or "creators"
  const [filter, setFilter] = useState("all"); // "all", "premium", "free"

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);

      // Load all posts
      const allPosts = await getAllPosts();
      setPosts(allPosts);

      // Load all creators
      const allCreators = await getAllCreators();
      setCreators(allCreators);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (filter === "premium") return post.isPremium;
    if (filter === "free") return !post.isPremium;
    return true;
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <PageHeader />

      <main className={`flex-1 overflow-x-hidden transition-all duration-300 ${isOpen ? 'ml-72' : 'ml-0'} ${!isOpen ? 'pt-20' : ''}`}>
        <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Explore Content
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Discover amazing creators and support them with crypto
          </p>
        </div>

        {/* Wallet Connection Required Message */}
        {!isConnected && (
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border-2 border-purple-300 dark:border-purple-600 rounded-xl p-8 text-center mb-8 shadow-lg">
            <div className="flex items-center justify-center mb-4">
              <Image src="/tea.gif" alt="Connect Wallet" width={60} height={60} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Connect Your Wallet
            </h3>
            <p className="text-gray-900 dark:text-white mb-6 text-base font-medium">
              Please connect your wallet to explore creators and view content. Wallet connection is required to interact with the platform.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Click "Connect Wallet" in the sidebar to get started</span>
            </div>
          </div>
        )}

        {/* Tabs - Only show when connected */}
        {isConnected && (
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("posts")}
            className={`pb-4 px-2 font-semibold transition-colors ${
              activeTab === "posts"
                ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab("creators")}
            className={`pb-4 px-2 font-semibold transition-colors ${
              activeTab === "creators"
                ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Creators ({creators.length})
          </button>
        </div>
        )}

        {/* Posts Tab - Only show when connected */}
        {isConnected && activeTab === "posts" && (
          <>
            {/* Filter Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "all"
                    ? "bg-purple-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                All Posts
              </button>
              <button
                onClick={() => setFilter("premium")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "premium"
                    ? "bg-purple-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Premium
              </button>
              <button
                onClick={() => setFilter("free")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === "free"
                    ? "bg-purple-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Free
              </button>
            </div>

            {/* Posts Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading posts...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No posts found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Check back later for new content
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                  <PostCard key={post.id} post={post} isOwner={false} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Creators Tab - Only show when connected */}
        {isConnected && activeTab === "creators" && (
          <>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading creators...</p>
              </div>
            ) : creators.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No creators found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Be the first to become a creator!
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creators.map((creator) => (
                  <div
                    key={creator.address}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow p-6"
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center">
                        <Image 
                          src="/avatar.gif" 
                          alt="Creator avatar" 
                          width={64} 
                          height={64}
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {creator.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {creator.category}
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                      {creator.bio}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {creator.totalPosts || 0} posts
                      </span>
                      <span className="flex items-center gap-1">
                        <Image src="/coin.gif" alt="Coin" width={16} height={16} />
                        {creator.totalTips || "0"} ETH
                      </span>
                    </div>

                    <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:shadow-lg transition-all duration-200">
                      View Profile
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        </div>
      </main>
    </div>
  );
}
