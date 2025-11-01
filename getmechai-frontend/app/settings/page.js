"use client";

import { useState, useEffect } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";
import { useSidebar } from "@/contexts/SidebarContext";
import ConnectWalletPrompt from "@/components/ConnectWalletPrompt";

export default function Settings() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const { isOpen } = useSidebar();
  
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    email: "",
    bio: "",
    profilePicture: "",
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("/avatar.gif");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    // Save profile logic here
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB for profile pictures)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingAvatar(true);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Upload to IPFS
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('uploaderAddress', address);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      setFormData(prev => ({ ...prev, profilePicture: data.url }));
    } catch (error) {
      alert('Failed to upload avatar. Please try again.');
      setAvatarPreview('/avatar.gif');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    router.push("/");
  };

  // Show connect wallet prompt if not connected
  if (!isConnected) {
    return <ConnectWalletPrompt message="Please connect your wallet to access settings and manage your profile" />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <PageHeader />

      <main className={`flex-1 overflow-x-hidden transition-all duration-300 ${isOpen ? 'ml-72' : 'ml-0'} ${!isOpen ? 'pt-20' : ''}`}>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Settings
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Manage your account settings and preferences
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === "profile" ? "" : "border-transparent"
              }`}
              style={{
                color: activeTab === "profile" ? 'var(--accent-primary)' : 'var(--text-secondary)',
                borderColor: activeTab === "profile" ? 'var(--accent-primary)' : 'transparent'
              }}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab("wallet")}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === "wallet" ? "" : "border-transparent"
              }`}
              style={{
                color: activeTab === "wallet" ? 'var(--accent-primary)' : 'var(--text-secondary)',
                borderColor: activeTab === "wallet" ? 'var(--accent-primary)' : 'transparent'
              }}
            >
              Wallet
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="rounded-xl border p-6" style={{ 
              background: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Profile Information
              </h2>
              <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                Update your profile information and how others see you on the platform.
              </p>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Avatar */}
                <div>
                  <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2" style={{ 
                      background: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)'
                    }}>
                      <Image src={avatarPreview} alt="Avatar" width={80} height={80} className="object-cover w-full h-full" />
                    </div>
                    <div>
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer inline-block"
                        style={{
                          background: uploadingAvatar ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-color)',
                          opacity: uploadingAvatar ? 0.6 : 1
                        }}
                      >
                        {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                      </label>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Max 5MB • JPEG, PNG, GIF, WebP
                      </p>
                    </div>
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Username
                  </label>
                  <div className="flex items-center rounded-lg border focus-within:ring-2 focus-within:ring-purple-500 transition-all bg-white dark:bg-gray-800" style={{ 
                    borderColor: 'var(--border-color)'
                  }}>
                    <span className="px-3 text-sm font-semibold text-gray-600 dark:text-gray-400">@</span>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="username"
                      className="flex-1 bg-transparent px-3 py-2.5 outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label htmlFor="displayName" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    value={formData.displayName}
                    onChange={handleChange}
                    placeholder="Your display name"
                    className="w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 focus:ring-purple-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    style={{ 
                      borderColor: 'var(--border-color)'
                    }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 focus:ring-purple-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    style={{ 
                      borderColor: 'var(--border-color)'
                    }}
                  />
                </div>

                {/* Bio */}
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us about yourself..."
                    className="w-full rounded-lg border px-3 py-2.5 outline-none resize-none focus:ring-2 focus:ring-purple-500 transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    style={{ 
                      borderColor: 'var(--border-color)'
                    }}
                  />
                </div>

                {/* Save Button */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    className="px-6 py-2.5 rounded-lg font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Wallet Tab */}
          {activeTab === "wallet" && (
            <div className="rounded-xl border p-6" style={{ 
              background: 'var(--bg-card)',
              borderColor: 'var(--border-color)'
            }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Wallet Settings
              </h2>
              <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                Manage your connected wallet and blockchain settings.
              </p>

              <div className="space-y-6">
                {/* Connected Wallet */}
                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      Connected Wallet
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-green-500">Connected</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                    <Image src="/coin.gif" alt="Wallet" width={40} height={40} />
                    <div className="flex-1">
                      <p className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                        {address?.slice(0, 10)}...{address?.slice(-8)}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Ethereum Mainnet
                      </p>
                    </div>
                  </div>
                </div>

                {/* Disconnect Button */}
                <div className="p-4 rounded-lg border-2 border-red-500/20" style={{ background: 'var(--bg-secondary)' }}>
                  <h3 className="font-medium mb-2 text-red-500">
                    Disconnect Wallet
                  </h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Disconnecting will log you out and you'll need to reconnect to access your account.
                  </p>
                  <button
                    onClick={handleDisconnect}
                    className="px-6 py-2.5 rounded-lg font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                  >
                    Disconnect Wallet
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
