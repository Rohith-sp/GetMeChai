import axios from 'axios';

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
const PINATA_JWT = process.env.PINATA_JWT;

// Pinata API endpoints
const PINATA_PIN_FILE_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const PINATA_PIN_JSON_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

/**
 * Upload file to IPFS via Pinata
 * @param {File} file - File to upload
 * @param {Object} metadata - Optional metadata
 * @returns {Promise<{ipfsHash: string, url: string}>}
 */
export async function uploadToIPFS(file, metadata = {}) {
  if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_SECRET_KEY)) {
    throw new Error('Pinata credentials not configured');
  }

  // Define file type categories with size limits
  const fileCategories = {
    images: {
      types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      maxSize: 10 * 1024 * 1024, // 10MB
    },
    videos: {
      types: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
      maxSize: 100 * 1024 * 1024, // 100MB
    },
    audio: {
      types: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm'],
      maxSize: 50 * 1024 * 1024, // 50MB
    },
    documents: {
      types: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
      maxSize: 25 * 1024 * 1024, // 25MB
    },
    archives: {
      types: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
      maxSize: 50 * 1024 * 1024, // 50MB
    },
  };

  // Find which category the file belongs to
  let category = null;
  let maxSize = 100 * 1024 * 1024; // Default max size

  for (const [catName, catInfo] of Object.entries(fileCategories)) {
    if (catInfo.types.includes(file.type)) {
      category = catName;
      maxSize = catInfo.maxSize;
      break;
    }
  }

  // Validate file type
  if (!category) {
    throw new Error('Invalid file type. Allowed: Images, Videos, Audio, PDFs, Documents, Archives');
  }

  // Validate file size based on category
  if (file.size > maxSize) {
    const maxSizeMB = Math.floor(maxSize / (1024 * 1024));
    throw new Error(`File too large. Maximum size for ${category} is ${maxSizeMB}MB`);
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    // Add metadata
    const pinataMetadata = {
      name: metadata.name || file.name,
      keyvalues: {
        uploadedBy: metadata.uploadedBy || 'getmechai',
        timestamp: new Date().toISOString(),
        ...metadata.keyvalues,
      },
    };
    formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

    // Pin options
    const pinataOptions = {
      cidVersion: 1,
    };
    formData.append('pinataOptions', JSON.stringify(pinataOptions));

    // Upload to Pinata
    const headers = PINATA_JWT
      ? { Authorization: `Bearer ${PINATA_JWT}` }
      : {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        };

    const response = await axios.post(PINATA_PIN_FILE_URL, formData, {
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data',
      },
      maxBodyLength: Infinity,
    });

    const ipfsHash = response.data.IpfsHash;
    
    return {
      ipfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      size: file.size,
      type: file.type,
    };
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to upload to IPFS');
  }
}

/**
 * Upload JSON metadata to IPFS
 * @param {Object} json - JSON data to upload
 * @returns {Promise<{ipfsHash: string, url: string}>}
 */
export async function uploadJSONToIPFS(json) {
  if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_SECRET_KEY)) {
    throw new Error('Pinata credentials not configured');
  }

  try {
    const headers = PINATA_JWT
      ? { Authorization: `Bearer ${PINATA_JWT}` }
      : {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        };

    const response = await axios.post(
      PINATA_PIN_JSON_URL,
      {
        pinataContent: json,
        pinataMetadata: {
          name: `metadata-${Date.now()}.json`,
        },
      },
      { headers }
    );

    const ipfsHash = response.data.IpfsHash;
    
    return {
      ipfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
    };
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to upload JSON to IPFS');
  }
}

/**
 * Get IPFS content URL
 * @param {string} ipfsHash - IPFS hash
 * @returns {string} Gateway URL
 */
export function getIPFSUrl(ipfsHash) {
  if (!ipfsHash) return '';
  
  // Remove ipfs:// prefix if present
  const hash = ipfsHash.replace('ipfs://', '');
  
  return `https://gateway.pinata.cloud/ipfs/${hash}`;
}

/**
 * Validate IPFS hash format
 * @param {string} hash - IPFS hash to validate
 * @returns {boolean}
 */
export function isValidIPFSHash(hash) {
  // CIDv0: Qm + 44 base58 characters
  const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  // CIDv1: starts with b (base32) or z (base58)
  const cidv1Regex = /^(b[a-z2-7]{58}|z[1-9A-HJ-NP-Za-km-z]{48,})$/;
  
  return cidv0Regex.test(hash) || cidv1Regex.test(hash);
}
