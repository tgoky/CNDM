import { useReadContract, useAccount } from 'wagmi'
import { CONTRACT_ADDRESSES } from '@/lib/contract-addresses'
import { useState, useEffect } from 'react'

// ABI for DEDListing contract functions
const DED_LISTING_ABI = [
  {
    "inputs": [],
    "name": "subject",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "topic",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "objectives",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "postAmount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "state",
    "outputs": [{"internalType": "enum DEDListing.ListingState", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getStateString",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "allowedStudents",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "allowedEducators",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "studentCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "educatorCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPotentialEducators",
    "outputs": [
      {"internalType": "address[]", "name": "educators", "type": "address[]"},
      {"internalType": "uint256[]", "name": "shares", "type": "uint256[]"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "creator",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
]

// ABI for DEDProfile contract functions
const DED_PROFILE_ABI = [
  {
    "inputs": [],
    "name": "getProfileInfo",
    "outputs": [
      {"internalType": "string", "name": "", "type": "string"},
      {"internalType": "string", "name": "", "type": "string"},
      {"internalType": "address", "name": "", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

// ABI for DEDIndex contract functions
const DED_INDEX_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "profiles",
    "outputs": [{"internalType": "contract DEDProfile", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
]

export interface ListingParticipant {
  address: string
  name: string
  role: 'educator' | 'student' | 'creator'
  isConnected: boolean
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  profileAddress?: string
}

export interface ListingSessionData {
  listingAddress: string
  subject: string
  topic: string
  objectives: string
  postAmount: bigint
  state: string
  creator: string
  participants: ListingParticipant[]
  isCurrentUserParticipant: boolean
  currentUserRole?: 'educator' | 'student' | 'creator'
}

export function useListingSession(listingAddress?: string) {
  const { address } = useAccount()
  const [sessionData, setSessionData] = useState<ListingSessionData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Demo mode for testing
  if (listingAddress === 'demo') {
    return {
      sessionData: {
        listingAddress: 'demo',
        subject: 'Demo Session',
        topic: 'WebRTC Testing',
        objectives: 'Testing video call functionality',
        postAmount: BigInt(0),
        state: 'InProgress',
        creator: address || '',
        participants: [
          {
            address: address || '',
            name: 'Demo User',
            role: 'creator' as const,
            isConnected: false,
            isVideoEnabled: true,
            isAudioEnabled: true
          }
        ],
        isCurrentUserParticipant: true,
        currentUserRole: 'creator' as const
      },
      isLoading: false
    }
  }

  // Read listing basic info
  const { data: subject } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: DED_LISTING_ABI,
    functionName: 'subject',
    query: {
      enabled: !!listingAddress,
    }
  })

  const { data: topic } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: DED_LISTING_ABI,
    functionName: 'topic',
    query: {
      enabled: !!listingAddress,
    }
  })

  const { data: objectives } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: DED_LISTING_ABI,
    functionName: 'objectives',
    query: {
      enabled: !!listingAddress,
    }
  })

  const { data: postAmount } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: DED_LISTING_ABI,
    functionName: 'postAmount',
    query: {
      enabled: !!listingAddress,
    }
  })

  const { data: state } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: DED_LISTING_ABI,
    functionName: 'getStateString',
    query: {
      enabled: !!listingAddress,
    }
  })

  const { data: creator } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: DED_LISTING_ABI,
    functionName: 'creator',
    query: {
      enabled: !!listingAddress,
    }
  })

  const { data: studentCount } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: DED_LISTING_ABI,
    functionName: 'studentCount',
    query: {
      enabled: !!listingAddress,
    }
  })

  const { data: educatorCount } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: DED_LISTING_ABI,
    functionName: 'educatorCount',
    query: {
      enabled: !!listingAddress,
    }
  })

  const { data: potentialEducators } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: DED_LISTING_ABI,
    functionName: 'getPotentialEducators',
    query: {
      enabled: !!listingAddress,
    }
  })

  // Check if current user is a student
  const { data: isCurrentUserStudent } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: DED_LISTING_ABI,
    functionName: 'allowedStudents',
    args: [address || '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: !!listingAddress && !!address,
    }
  })

  // Check if current user is an educator
  const { data: isCurrentUserEducator } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: DED_LISTING_ABI,
    functionName: 'allowedEducators',
    args: [address || '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: !!listingAddress && !!address,
    }
  })

  // Build participants list
  useEffect(() => {
    if (!listingAddress || !potentialEducators) return

    const buildParticipants = async () => {
      setIsLoading(true)
      
      try {
        const participants: ListingParticipant[] = []
        
        // Add creator
        if (creator) {
          const creatorProfileAddress = await fetchProfileAddress(creator)
          const creatorName = await fetchProfileName(creatorProfileAddress)
          
          participants.push({
            address: creator,
            name: creatorName || `Creator (${creator.slice(0, 6)}...)`,
            role: 'creator',
            isConnected: false,
            isVideoEnabled: false,
            isAudioEnabled: false,
            profileAddress: creatorProfileAddress
          })
        }

        // Add educators from potential educators
        if (potentialEducators && potentialEducators[0]) {
          for (const educatorAddress of potentialEducators[0]) {
            if (educatorAddress !== '0x0000000000000000000000000000000000000000') {
              const profileAddress = await fetchProfileAddress(educatorAddress)
              const name = await fetchProfileName(profileAddress)
              
              participants.push({
                address: educatorAddress,
                name: name || `Educator (${educatorAddress.slice(0, 6)}...)`,
                role: 'educator',
                isConnected: false,
                isVideoEnabled: false,
                isAudioEnabled: false,
                profileAddress
              })
            }
          }
        }

        // Determine current user role
        let currentUserRole: 'educator' | 'student' | 'creator' | undefined
        if (address === creator) {
          currentUserRole = 'creator'
        } else if (isCurrentUserEducator) {
          currentUserRole = 'educator'
        } else if (isCurrentUserStudent) {
          currentUserRole = 'student'
        }

        const isCurrentUserParticipant = !!currentUserRole

        setSessionData({
          listingAddress,
          subject: subject || '',
          topic: topic || '',
          objectives: objectives || '',
          postAmount: postAmount || BigInt(0),
          state: state || '',
          creator: creator || '',
          participants,
          isCurrentUserParticipant,
          currentUserRole
        })
      } catch (error) {
        console.error('Error building participants:', error)
      } finally {
        setIsLoading(false)
      }
    }

    buildParticipants()
  }, [
    listingAddress, 
    subject, 
    topic, 
    objectives, 
    postAmount, 
    state, 
    creator, 
    potentialEducators,
    address,
    isCurrentUserStudent,
    isCurrentUserEducator
  ])

  // Helper function to fetch profile address
  const fetchProfileAddress = async (userAddress: string): Promise<string | undefined> => {
    try {
      // This would need to be implemented with proper contract calls
      // For now, return undefined
      return undefined
    } catch (error) {
      console.error('Error fetching profile address:', error)
      return undefined
    }
  }

  // Helper function to fetch profile name
  const fetchProfileName = async (profileAddress?: string): Promise<string | undefined> => {
    if (!profileAddress) return undefined
    
    try {
      // This would need to be implemented with proper contract calls
      // For now, return undefined
      return undefined
    } catch (error) {
      console.error('Error fetching profile name:', error)
      return undefined
    }
  }

  return {
    sessionData,
    isLoading
  }
} 