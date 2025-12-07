import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'
import { CONTRACT_ADDRESSES } from './contract-addresses'

// Web3Modal project ID - in production this would be from environment
const projectId = 'YOUR_PROJECT_ID'

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

// Smart contract addresses (these would be deployed contracts)
export const CONTRACTS = CONTRACT_ADDRESSES

// Re-export CONTRACT_ADDRESSES for use in other files
export { CONTRACT_ADDRESSES }

// Contract ABIs (simplified for demo)
export const TOKEN_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
] as const

export const PROFILE_ABI = [
  'function createProfile(string memory displayName, string memory bio)',
  'function getProfile(address user) view returns (tuple(string displayName, string bio, bool isEducator))',
  'function updateProfile(string memory displayName, string memory bio)',
] as const

export const LISTING_ABI = [
  'function createListing(string memory subject, string memory topic, string memory description, uint256 tokenAmount)',
  'function getListings() view returns (tuple(uint256 id, address creator, string subject, string topic, uint256 amount)[])',
  'function applyToListing(uint256 listingId, string memory message, uint256 barterAmount)',
] as const

// DEDIndex specific ABI for submitListing function
export const DED_INDEX_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_subject",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_topic",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_objectives",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_postAmount",
        "type": "uint256"
      }
    ],
    "name": "submitListing",
    "outputs": [
      {
        "internalType": "contract DEDListing",
        "name": "newListing",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// Utility functions
export const formatTokenAmount = (amount: bigint, decimals = 18): string => {
  return (Number(amount) / Math.pow(10, decimals)).toFixed(4)
}

export const parseTokenAmount = (amount: string, decimals = 18): bigint => {
  return BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals)))
}

// Helper function to validate listing data before submission
export const validateListingData = (data: {
  subject: string
  topic: string
  objectives: string
  tokenAmount: string
}) => {
  const errors: string[] = []
  
  if (!data.subject.trim()) {
    errors.push('Subject is required')
  }
  
  if (!data.topic.trim()) {
    errors.push('Topic is required')
  }
  
  if (!data.objectives.trim()) {
    errors.push('Learning objectives are required')
  }
  
  if (!data.tokenAmount || parseFloat(data.tokenAmount) < 1) {
    errors.push('Token amount must be at least 1 DED token')
  }
  
  return errors
}

// Helper function to format listing data for contract submission
export const formatListingData = (data: {
  subject: string
  topic: string
  objectives: string
  tokenAmount: string
}) => {
  return {
    subject: data.subject.trim(),
    topic: data.topic.trim(),
    objectives: data.objectives.trim(),
    postAmount: parseTokenAmount(data.tokenAmount)
  }
}