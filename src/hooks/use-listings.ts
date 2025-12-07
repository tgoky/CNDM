import { useReadContract, useAccount, useReadContracts } from 'wagmi'
import { CONTRACT_ADDRESSES } from '@/lib/contract-addresses'
import { useState, useEffect, useMemo } from 'react'

// ABI for ListingBroker contract functions
const LISTING_BROKER_ABI = [
  {
    "inputs": [],
    "name": "getListingCreators",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getListings",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "listingId",
            "type": "bytes32"
          },
          {
            "internalType": "address",
            "name": "creator",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "bytes32",
            "name": "subject",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "topic",
            "type": "bytes32"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "objectives",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "address",
            "name": "selectedApplicant",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "finalAmount",
            "type": "uint256"
          }
        ],
        "internalType": "struct ListingBroker.Listing[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// ABI for DEDIndex contract functions (legacy support)
const DED_INDEX_FULL_ABI = [
  {
    "inputs": [],
    "name": "getAllListingCreators",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getListings",
    "outputs": [
      {
        "internalType": "contract DEDListing[]",
        "name": "list",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// ABI for DEDListing contract functions we need
const DED_LISTING_ABI = [
  {
    "inputs": [],
    "name": "subject",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "topic",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "objectives",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "postAmount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// ABI for DEDProfile contract functions we need
const DED_PROFILE_ABI = [
  {
    "inputs": [],
    "name": "getProfileInfo",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export interface Listing {
  id: string
  address: string
  subject: string
  topic: string
  objectives: string
  postAmount: bigint
  owner: string
  tokenAmount: string
  title: string
  description: string
  status: 'open' | 'in-progress' | 'completed'
  createdAt: string
  applicationsCount: number
  creator: {
    address: string
    displayName: string
    reputation: number
    isEducator: boolean
  }
}

export function useListings() {
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Get all listing creators from ListingBroker
  const { data: listingCreators, isLoading: isLoadingCreators, error: creatorsError } = useReadContract({
    address: CONTRACT_ADDRESSES.ListingBroker as `0x${string}`,
    abi: LISTING_BROKER_ABI,
    functionName: 'getListingCreators',
  })

  // Step 2: Get all listings for each creator from ListingBroker
  const listingContracts = useMemo(() => {
    if (!listingCreators || listingCreators.length === 0) return []
    
    return listingCreators.map(creator => ({
      address: CONTRACT_ADDRESSES.ListingBroker as `0x${string}`,
      abi: LISTING_BROKER_ABI,
      functionName: 'getListings',
      args: [creator] as const,
    }))
  }, [listingCreators])

  const { data: listingResults, isLoading: isLoadingAddresses } = useReadContracts({
    contracts: listingContracts,
  })

  // Step 3: Process ListingBroker results - no additional calls needed

  // Step 4: Get profile information for all creators
  const profileContracts = useMemo(() => {
    if (!listingCreators || listingCreators.length === 0) return []
    
    return listingCreators.map(creator => ({
      address: CONTRACT_ADDRESSES.DEDIndex as `0x${string}`,
      abi: DED_INDEX_FULL_ABI,
      functionName: 'profiles',
      args: [creator] as const,
    }))
  }, [listingCreators])

  const { data: profileAddresses, isLoading: isLoadingProfiles } = useReadContracts({
    contracts: profileContracts,
  })

  // Step 5: Get profile details for each profile address
  const profileDetailContracts = useMemo(() => {
    if (!profileAddresses) return []
    
    const contracts = []
    for (const result of profileAddresses) {
      if (result.status === 'success' && result.result && result.result !== '0x0000000000000000000000000000000000000000') {
        contracts.push(
          {
            address: result.result as `0x${string}`,
            abi: DED_PROFILE_ABI,
            functionName: 'getProfileInfo',
          }
        )
      }
    }
    return contracts
  }, [profileAddresses])

  const { data: profileDetails, isLoading: isLoadingProfileDetails } = useReadContracts({
    contracts: profileDetailContracts,
  })

  // Process ListingBroker results
  useEffect(() => {
    console.log('useListings Processing Debug:', {
      isLoadingAddresses,
      listingResultsLength: listingResults?.length || 0,
    })
    
    if (isLoadingAddresses) return
    
    if (listingResults) {
      const newListings: Listing[] = []
      
      // Process ListingBroker results which return full Listing structs
      for (const result of listingResults) {
        if (result.status === 'success' && result.result) {
          const listingsArray = result.result as any[] // Array of Listing structs from ListingBroker
          
          for (const listingData of listingsArray) {
            // Extract subject and topic from bytes32 - truncate null bytes
            const subject = extractStringFromBytes32(listingData.subject)
            const topic = extractStringFromBytes32(listingData.topic)
            
            const listing = formatListingData(
              `0x${listingData.listingId.slice(2)}`, // Use listingId as address
              subject,
              topic,
              listingData.objectives,
              listingData.amount,
              listingData.creator,
              undefined // Profile info
            )
            
            // Set status based on listing state
            if (listingData.isActive) {
              listing.status = 'open'
            } else if (listingData.selectedApplicant && listingData.selectedApplicant !== '0x0000000000000000000000000000000000000000') {
              listing.status = 'in-progress'
            } else {
              listing.status = 'open'
            }
            
            newListings.push(listing)
          }
        }
      }
      
      setListings(newListings)
      setIsLoading(false)
    }
  }, [listingResults, isLoadingAddresses])

  // Helper function to extract string from bytes32
  function extractStringFromBytes32(bytes32Value: string): string {
    // Convert bytes32 hex string to readable string
    // Remove 0x prefix and trim trailing null bytes
    try {
      // Browser-compatible hex to string conversion
      const hex = bytes32Value.replace('0x', '').toLowerCase()
      
      // Convert hex pairs to characters
      let result = ''
      for (let i = 0; i < hex.length; i += 2) {
        const charCode = parseInt(hex.substr(i, 2), 16)
        if (charCode === 0) break // Stop at null byte
        result += String.fromCharCode(charCode)
      }
      
      return result.trim()
    } catch {
      return bytes32Value
    }
  }

  // Fallback to mock data if no real data is available
  useEffect(() => {
    console.log('useListings Debug:', {
      isLoadingCreators,
      listingCreators: listingCreators?.length || 0,
      listingsLength: listings.length,
      shouldShowMock: !isLoadingCreators && listingCreators && listingCreators.length === 0 && listings.length === 0
    })
    
    if (!isLoadingCreators && listingCreators && listingCreators.length === 0 && listings.length === 0) {
      const mockListings: Listing[] = [
        {
          id: '1',
          address: '0x1234567890abcdef1234567890abcdef12345678',
          subject: 'Programming',
          topic: 'React Development',
          objectives: 'Learn advanced React patterns including render props, higher-order components, and performance optimization techniques.',
          postAmount: 50000000000000000000n, // 50 DED
          owner: '0x1234567890abcdef1234567890abcdef12345678',
          tokenAmount: '50.0 DED',
          title: 'Advanced React Patterns and Performance Optimization',
          description: 'Learn advanced React patterns including render props, higher-order components, and performance optimization techniques. Perfect for developers looking to level up their React skills.',
          status: 'open',
          createdAt: '2 days ago',
          applicationsCount: 3,
          creator: {
            address: '0x1234567890abcdef1234567890abcdef12345678',
            displayName: 'Alex Chen',
            reputation: 4.9,
            isEducator: false
          }
        },
        {
          id: '2',
          address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          subject: 'Blockchain',
          topic: 'Smart Contracts',
          objectives: 'Complete introduction to Web3 development, covering Solidity, smart contracts, and dApp development.',
          postAmount: 75000000000000000000n, // 75 DED
          owner: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          tokenAmount: '75.0 DED',
          title: 'Introduction to Web3 and Smart Contract Development',
          description: 'Complete introduction to Web3 development, covering Solidity, smart contracts, and dApp development. Hands-on learning with real projects.',
          status: 'open',
          createdAt: '1 day ago',
          applicationsCount: 7,
          creator: {
            address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
            displayName: 'Sarah Kim',
            reputation: 4.8,
            isEducator: false
          }
        }
      ]
      
      setListings(mockListings)
      setIsLoading(false)
    }
  }, [listingCreators, isLoadingCreators, listings.length])

  const refetch = () => {
    setIsLoading(true)
    setError(null)
    // The data will automatically refetch when dependencies change
  }

  return {
    listings,
    isLoading: isLoading || isLoadingCreators || isLoadingAddresses,
    error: error || creatorsError?.message || null,
    refetch
  }
}

// Helper function to format listing data
export function formatListingData(
  listingAddress: string,
  subject: string,
  topic: string,
  objectives: string,
  postAmount: bigint,
  owner: string,
  profileInfo?: { displayName: string; bio: string }
): Listing {
  // Use profile info if available, otherwise create a display name from the address
  const displayName = profileInfo?.displayName || `${owner.slice(0, 6)}...${owner.slice(-4)}`
  
  return {
    id: listingAddress,
    address: listingAddress,
    subject,
    topic,
    objectives,
    postAmount,
    owner,
    tokenAmount: `${Number(postAmount) / Math.pow(10, 18)} DED`,
    // Create title from subject + topic, but use description field if available for full text
    title: topic && topic.length > 0 ? `${subject}: ${topic}` : subject,
    description: objectives,
    status: 'open' as const,
    createdAt: 'Recently',
    applicationsCount: 0,
    creator: {
      address: owner,
      displayName,
      reputation: 4.5, // Default reputation - could be enhanced with reputation system
      isEducator: false // Default to false (student) - creators on ListingBroker can be students or educators
    }
  }
} 