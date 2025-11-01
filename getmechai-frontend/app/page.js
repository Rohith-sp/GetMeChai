"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import PostCard from "@/components/PostCard";
import { useSidebar } from "@/contexts/SidebarContext";
import { getAllPosts } from "@/lib/contract";

export default function Home() {
  const { isOpen } = useSidebar();
  const { address, isConnected } = useAccount();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected) {
      loadPosts();
    }
  }, [isConnected]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const allPosts = await getAllPosts();
      setPosts(allPosts);
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  // Show explore page for logged-in users
  if (isConnected) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <PageHeader />
        
        <main className={`flex-1 overflow-x-hidden transition-all duration-300 ${isOpen ? 'ml-72' : 'ml-0'} ${!isOpen ? 'pt-20' : ''}`}>
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Explore Content</h1>
              <p className="text-lg text-gray-400">Discover amazing creators and support them with crypto</p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                <p className="mt-4 text-gray-400">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-gray-800 rounded-lg shadow-md p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-white mb-2">No posts found</h3>
                <p className="text-gray-400 mb-4">Be the first creator to post content!</p>
                <Link href="/creator/register" className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  Become a Creator
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} isOwner={post.creator.toLowerCase() === address?.toLowerCase()} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Show landing page for non-logged-in users
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <PageHeader />
      
      <main className={`flex-1 overflow-x-hidden transition-all duration-300 ${isOpen ? 'ml-72' : 'ml-0'}`}>
        {/* Hero Section */}
        <div className={`relative min-h-screen flex items-center justify-center overflow-hidden ${!isOpen ? 'pt-20' : ''}`}>

          <div className="relative z-10 container mx-auto px-4 py-16">
            {/* Hero Content */}
            <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="w-20 h-20 animate-bounce tea-gif-container">
              <Image src="/tea.gif" alt="Tea" width={80} height={80} />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
              Support Creators with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                Crypto
              </span>
            </h1>
            <div className="w-20 h-20 animate-bounce" style={{animationDelay: "0.2s"}}>
              <Image src="/coin.gif" alt="Coin" width={80} height={80} />
            </div>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            GetMeChai is a decentralized platform where fans can support their favorite creators 
            with cryptocurrency tips and unlock exclusive content.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/creator/register"
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              Become a Creator
            </Link>
            <Link
              href="/subscriber/explore"
              className="px-8 py-4 rounded-lg font-semibold border-2 hover:shadow-lg transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-color)'
              }}
            >
              Explore Creators
            </Link>
            </div>
          </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Image src="/coin.gif" alt="Secure" width={48} height={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Secure & Decentralized
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Built on blockchain technology for transparent and secure transactions.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 tea-gif-container">
              <Image src="/tea.gif" alt="Instant" width={48} height={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Instant Payments
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Creators receive tips instantly with low transaction fees.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Image src="/avatar.gif" alt="Exclusive" width={48} height={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Exclusive Content
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Unlock premium content by supporting your favorite creators.
            </p>
          </div>
          </div>
        </div>


        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2025 GetMeChai. Built with ❤️ on the blockchain.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
