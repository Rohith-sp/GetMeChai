import { ethers } from "ethers";
import contractArtifact from "../abi/GetMeChai.json";

// Extract ABI from the artifact
const contractABI = contractArtifact.abi;

// Contract address - update this after deploying your contract
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Validate contract address format
const isValidAddress = (address) => {
  return address && /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Cache to prevent redundant contract verification checks
let contractVerified = false;
let contractInstance = null;

// Reset contract cache (useful when switching networks or contracts)
export const resetContractCache = () => {
  contractVerified = false;
  contractInstance = null;
};

// Get contract instance with signer
export const getContract = async () => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not found. Please install MetaMask to use this app.");
  }

  if (!isValidAddress(CONTRACT_ADDRESS)) {
    throw new Error("Invalid contract address. Please check your configuration.");
  }

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    // Use getAddress to ensure proper address format (checksum)
    const validatedAddress = ethers.getAddress(CONTRACT_ADDRESS);
    return new ethers.Contract(validatedAddress, contractABI, signer);
  } catch (error) {
    throw error;
  }
};

// Get contract instance with provider (read-only)
export const getContractReadOnly = async () => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not found");
  }

  if (!isValidAddress(CONTRACT_ADDRESS)) {
    throw new Error("Invalid contract address. Please check your configuration.");
  }

  // Return cached instance if already verified
  if (contractVerified && contractInstance) {
    return contractInstance;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    // Use getAddress to ensure proper address format (checksum)
    const validatedAddress = ethers.getAddress(CONTRACT_ADDRESS);
    const contract = new ethers.Contract(validatedAddress, contractABI, provider);
    
    // Only verify contract exists once to avoid circuit breaker
    if (!contractVerified) {
      try {
        const code = await provider.getCode(validatedAddress);
        if (code === '0x') {
          console.warn("No contract found at address:", validatedAddress);
          throw new Error("No contract found at this address. Please deploy the contract first.");
        }
        contractVerified = true;
      } catch (codeError) {
        console.error("Error checking contract code:", codeError);
        // If we can't check the code, assume the contract exists to avoid blocking the UI
        contractVerified = true;
      }
    }
    
    contractInstance = contract;
    return contract;
  } catch (error) {
    console.error("Contract connection error:", error);
    // Always throw the error to ensure real contract usage
    throw new Error("Failed to connect to contract. Make sure the contract is deployed.");
  }
}



// Register as a creator
export const registerCreator = async ({ name, subscriptionPrice }) => {
  try {
    const contract = await getContract();
    // Convert price to wei
    const priceInWei = ethers.parseEther(subscriptionPrice.toString());
    const tx = await contract.registerCreator(name, priceInWei);
    await tx.wait();
    return tx;
  } catch (error) {
    throw new Error(error.reason || error.message || "Failed to register creator");
  }
};

// Create a new post
export const createPost = async ({ contentUrl, isFree }) => {
  try {
    const contract = await getContract();
    // Extract IPFS hash from URL if needed
    let ipfsHash = contentUrl;
    if (contentUrl.includes('ipfs://')) {
      ipfsHash = contentUrl.replace('ipfs://', '');
    } else if (contentUrl.includes('/ipfs/')) {
      ipfsHash = contentUrl.split('/ipfs/')[1];
    }
    
    const tx = await contract.addPost(ipfsHash, isFree !== false);
    await tx.wait();
    return tx;
  } catch (error) {
    throw new Error(error.reason || error.message || "Failed to create post");
  }
};

// Contribute to a post
export const contribute = async (postId, amount) => {
  try {
    const contract = await getContract();
    const contributionAmount = ethers.parseEther(amount.toString());
    const tx = await contract.contribute(postId, {
      value: contributionAmount,
    });
    await tx.wait();
    return tx;
  } catch (error) {
    throw new Error(error.reason || error.message || "Failed to contribute");
  }
};

// Get creator profile
export const getCreatorProfile = async (address) => {
  try {
    const contract = await getContractReadOnly();
    const validatedAddress = ethers.getAddress(address);
    const creator = await contract.creators(validatedAddress);
    const earnings = await contract.creatorEarnings(validatedAddress);
    
    // Check if creator is registered
    if (!creator.isRegistered) {
      return {
        address: validatedAddress,
        name: "",
        subscriptionPrice: "0",
        postIds: [],
        isRegistered: false,
        earnings: "0",
      };
    }
    
    return {
      address: creator.wallet,
      name: creator.name,
      subscriptionPrice: ethers.formatEther(creator.subscriptionPrice),
      postIds: creator.postIds ? creator.postIds.map(id => Number(id)) : [],
      isRegistered: creator.isRegistered,
      earnings: ethers.formatEther(earnings),
    };
  } catch (error) {
    // Return default values on error
    return {
      address: address,
      name: "",
      subscriptionPrice: "0",
      postIds: [],
      isRegistered: false,
      earnings: "0",
    };
  }
};

// Get creator posts
export const getCreatorPosts = async (creatorAddress) => {
  try {
    if (!isValidAddress(creatorAddress)) {
      return [];
    }
    
    const contract = await getContractReadOnly();
    const validatedAddress = ethers.getAddress(creatorAddress);
    
    // First try to get creator info
    try {
      const creator = await contract.creators(validatedAddress);
      
      if (!creator.isRegistered) {
        return [];
      }
      
      // If creator has no postIds array or it's empty, try alternative approach
      if (!creator.postIds || creator.postIds.length === 0) {
        return await getCreatorPostsAlternative(validatedAddress);
      }
      
      // Get all posts for this creator
      const postPromises = creator.postIds.map(async (postId) => {
        try {
          const post = await contract.posts(postId);
          if (!post || post.creator === ethers.ZeroAddress) return null;
          
          return {
            id: Number(postId),
            creator: post.creator,
            creatorName: creator.name || 'Anonymous',
            creatorAddress: post.creator,
            ipfsHash: post.ipfsHash,
            isFree: post.isFree,
            isPremium: !post.isFree,
            contributions: ethers.formatEther(post.contributions),
            contentUrl: `https://gateway.pinata.cloud/ipfs/${post.ipfsHash}`,
            timestamp: Date.now() / 1000,
            title: 'Post #' + Number(postId),
            description: 'Content from ' + creator.name,
          };
        } catch (err) {
          return null;
        }
      });
      
      const posts = await Promise.all(postPromises);
      const validPosts = posts.filter(p => p !== null);
      
      // Sort posts by ID in descending order (newest first)
      validPosts.sort((a, b) => b.id - a.id);
      
      return validPosts;
    } catch (err) {
      return await getCreatorPostsAlternative(validatedAddress);
    }
  } catch (error) {
    return [];
  }
}

// Alternative approach to get creator posts by scanning all posts
const getCreatorPostsAlternative = async (creatorAddress) => {
  try {
    const contract = await getContractReadOnly();
    const posts = [];
    
    // Scan through all possible post IDs
    for (let i = 1; i < 100; i++) {
      try {
        const post = await contract.posts(i);
        
        // Skip if post doesn't exist or doesn't belong to this creator
        if (!post || post.creator !== creatorAddress) continue;
        
        // Get creator info
        const creator = await contract.creators(creatorAddress);
        
        posts.push({
          id: i,
          creator: post.creator,
          creatorName: creator.name || 'Anonymous',
          creatorAddress: post.creator,
          ipfsHash: post.ipfsHash,
          isFree: post.isFree,
          isPremium: !post.isFree,
          contributions: ethers.formatEther(post.contributions),
          contentUrl: `https://gateway.pinata.cloud/ipfs/${post.ipfsHash}`,
          timestamp: Date.now() / 1000,
          title: 'Post #' + i,
          description: 'Content from ' + (creator.name || 'creator'),
        });
      } catch (e) {
        // If we hit an error for this post ID, just continue to the next one
        continue;
      }
    }
    
    // Sort posts by ID in descending order (newest first)
    posts.sort((a, b) => b.id - a.id);
    
    return posts;
  } catch (error) {
    return [];
  }
};

// Get all posts (Note: This requires iterating through all post IDs)
export const getAllPosts = async () => {
  try {
    const contract = await getContractReadOnly();
    const posts = [];
    
    // Try to get posts up to a reasonable limit
    // In production, you'd want to emit events and index them
    for (let i = 1; i < 100; i++) {
      try {
        const post = await contract.posts(i);
        
        // Skip if post doesn't exist or has zero address creator
        if (!post || post.creator === ethers.ZeroAddress) continue;
        
        // Get creator info
        const creator = await contract.creators(post.creator);
        
        posts.push({
          id: i,
          creator: post.creator,
          creatorName: creator.name || 'Anonymous',
          creatorAddress: post.creator,
          ipfsHash: post.ipfsHash,
          isFree: post.isFree,
          isPremium: !post.isFree,
          contributions: ethers.formatEther(post.contributions),
          contentUrl: `https://gateway.pinata.cloud/ipfs/${post.ipfsHash}`,
          timestamp: Date.now() / 1000, // Placeholder
          title: 'Post #' + i,
          description: 'Content from creator',
        });
      } catch (e) {
        // If we hit an error for this post ID, just continue to the next one
        console.log(`Error fetching post ${i}:`, e.message);
        continue;
      }
    }
    
    // Sort posts by ID in descending order (newest first)
    posts.sort((a, b) => b.id - a.id);
    
    return posts;
  } catch (error) {
    console.error('Error in getAllPosts:', error);
    return [];
  }
};

// Get all creators (Note: This would require event indexing in production)
export const getAllCreators = async () => {
  try {
    // Since the contract doesn't have a getAllCreators function,
    // we would need to listen to CreatorRegistered events
    // For now, return empty array
    return [];
  } catch (error) {
    return [];
  }
};

// Get creator stats
export const getCreatorStats = async (address) => {
  try {
    const profile = await getCreatorProfile(address);
    const posts = await getCreatorPosts(address);
    
    // Calculate total supporters (unique tippers)
    const supporters = new Set();
    // This would need to be tracked in the contract or via events
    
    return {
      totalTips: profile.earnings || "0",
      totalSupporters: supporters.size,
      totalPosts: posts.length,
    };
  } catch (error) {
    return {
      totalTips: "0",
      totalSupporters: 0,
      totalPosts: 0,
    };
  }
};

// Check if user can access content (free posts or subscribed)
export const canAccessContent = async (postId, userAddress, creatorAddress) => {
  try {
    const contract = await getContractReadOnly();
    const post = await contract.posts(postId);
    
    // If post is free, everyone can access
    if (post.isFree) {
      return true;
    }
    
    // Check if user is subscribed to creator
    const isSubscribed = await contract.isSubscribed(userAddress, creatorAddress);
    return isSubscribed;
  } catch (error) {
    return false;
  }
};

// Withdraw earnings (for creators)
export const withdrawEarnings = async () => {
  try {
    const contract = await getContract();
    const tx = await contract.withdrawEarnings();
    await tx.wait();
    return tx;
  } catch (error) {
    throw new Error(error.reason || error.message || "Failed to withdraw earnings");
  }
};

// Subscribe to a creator
export const subscribe = async (creatorAddress, price) => {
  try {
    const contract = await getContract();
    const priceInWei = ethers.parseEther(price.toString());
    const tx = await contract.subscribe(creatorAddress, {
      value: priceInWei,
    });
    await tx.wait();
    return tx;
  } catch (error) {
    throw new Error(error.reason || error.message || "Failed to subscribe");
  }
};
