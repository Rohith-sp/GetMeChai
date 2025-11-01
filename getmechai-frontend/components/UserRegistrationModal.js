"use client";

import { useState } from "react";
import Image from "next/image";

export default function UserRegistrationModal({ isOpen, onClose, onSubmit, walletAddress }) {
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    bio: "",
    email: "",
    avatar: null,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border" style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border-color)'
      }}>
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b backdrop-blur-md" style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-color)'
        }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center tea-gif-container" style={{
              background: 'var(--accent-primary)'
            }}>
              <Image src="/tea.gif" alt="Welcome" width={24} height={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Welcome to GetMeChai!
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Complete your profile to get started
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Connected Wallet Display */}
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Connected Wallet
            </label>
            <div className="flex items-center gap-2 font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </div>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Username *
            </label>
            <div className="flex items-center rounded-lg border" style={{ 
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)'
            }}>
              <span className="px-3 text-sm" style={{ color: 'var(--text-muted)' }}>@</span>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="johndoe"
                className="flex-1 bg-transparent px-3 py-2.5 outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Display Name *
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              value={formData.displayName}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2"
              style={{ 
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Email (Optional) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Email (Optional)
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className="w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2"
              style={{ 
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              For notifications and updates
            </p>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself..."
              className="w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 resize-none"
              style={{ 
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Write a few sentences about yourself
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Profile..." : "Complete Registration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
