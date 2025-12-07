// Recording configuration
export const recordingConfig = {
  // API Configuration
  apiUrl: import.meta.env.VITE_RECORDING_API_URL || 'http://localhost:3001/api',
  
  // IPFS Configuration (Updated for Pinata - Easier Setup)
  ipfs: {
    gatewayUrl: import.meta.env.VITE_IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs/',
    pinataApiKey: import.meta.env.VITE_PINATA_API_KEY || '',
    pinataSecretKey: import.meta.env.VITE_PINATA_SECRET_KEY || '',
    // Fallback to Infura IPFS
    infuraProjectId: import.meta.env.VITE_INFURA_PROJECT_ID || '',
    infuraProjectSecret: import.meta.env.VITE_INFURA_PROJECT_SECRET || '',
  },
  
  // Celestia Configuration
  celestia: {
    rpcUrl: import.meta.env.VITE_CELESTIA_RPC_URL || 'https://rpc.celestia-mocha.com',
    namespace: import.meta.env.VITE_CELESTIA_NAMESPACE || '0x0000000000000000000000000000000000000000000000000000000000000001',
  },
  
  // Ethereum Configuration
  ethereum: {
    rpcUrl: import.meta.env.VITE_ETHEREUM_RPC_URL || 'https://sepolia.infura.io/v3/your_infura_key',
    contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || '',
  },
  
  // Recording Quality Settings
  quality: {
    videoBitrate: parseInt(import.meta.env.VITE_RECORDING_VIDEO_BITRATE || '2000000'),
    audioBitrate: parseInt(import.meta.env.VITE_RECORDING_AUDIO_BITRATE || '128000'),
    resolution: import.meta.env.VITE_RECORDING_RESOLUTION || '1280x720',
    frameRate: parseInt(import.meta.env.VITE_RECORDING_FRAME_RATE || '30'),
    mimeType: 'video/webm;codecs=vp8,opus',
  },
  
  // Upload Configuration
  upload: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },
  
  // UI Configuration
  ui: {
    showRecordingControls: true,
    autoStartRecording: false,
    autoStopRecording: true,
    showUploadProgress: true,
    showSessionProof: true,
  }
};

export default recordingConfig;