import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi'
import { CONTRACT_ADDRESSES } from '@/lib/contract-addresses'
import { useState, useEffect } from 'react'

// ABI for DEDProfile contract functions
const DED_PROFILE_ABI = [
  {
    "inputs": [],
    "name": "userAddress",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "displayName",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "bio",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_displayName", "type": "string"},
      {"internalType": "string", "name": "_bio", "type": "string"}
    ],
    "name": "updateInfo",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
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
] as const

// ABI for DEDIndex contract functions
const DED_INDEX_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "profiles",
    "outputs": [{"internalType": "contract DEDProfile", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "hasProfile",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "createProfileForUser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

export interface ProfileData {
  displayName: string
  bio: string
  userAddress: string
  profileAddress: string
  hasProfile: boolean
}

export function useProfile(userAddress?: string) {
  const { address } = useAccount()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Contract write functions
  const { writeContract: writeUpdateProfile, isPending: isUpdating } = useWriteContract()
  const { writeContract: writeCreateProfile, isPending: isCreating } = useWriteContract()

  // Contract read functions
  const { data: hasProfileData } = useReadContract({
    address: CONTRACT_ADDRESSES.DEDIndex as `0x${string}`,
    abi: DED_INDEX_ABI,
    functionName: 'hasProfile',
    args: [userAddress || address || '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: !!userAddress || !!address,
    }
  })



  const { data: profileAddress } = useReadContract({
    address: CONTRACT_ADDRESSES.DEDIndex as `0x${string}`,
    abi: DED_INDEX_ABI,
    functionName: 'profiles',
    args: [userAddress || address || '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: !!userAddress || !!address,
    }
  })

  const { data: profileInfo } = useReadContract({
    address: profileAddress as `0x${string}`,
    abi: DED_PROFILE_ABI,
    functionName: 'getProfileInfo',
    query: {
      enabled: !!profileAddress && profileAddress !== '0x0000000000000000000000000000000000000000',
    }
  })

  // Update profile data when contract data changes
  useEffect(() => {
    if (profileInfo && profileAddress) {
      const [displayName, bio, userAddr] = profileInfo
      setProfileData({
        displayName: displayName || '',
        bio: bio || '',
        userAddress: userAddr,
        profileAddress: profileAddress,
        hasProfile: true
      })
    } else if (hasProfileData === false) {
      setProfileData({
        displayName: '',
        bio: '',
        userAddress: userAddress || address || '',
        profileAddress: '',
        hasProfile: false
      })
    }
  }, [profileInfo, profileAddress, hasProfileData, userAddress, address])

  // Create profile function with proper error handling
  const createProfile = async () => {
    if (!writeCreateProfile || !address) {
      throw new Error('Wallet not connected or write function not available')
    }

    setIsLoading(true)
    try {
      const result = await writeCreateProfile({
        address: CONTRACT_ADDRESSES.DEDIndex as `0x${string}`,
        abi: DED_INDEX_ABI,
        functionName: 'createProfileForUser',
        args: [address],
      } as any)
      
      // Wait for the transaction to be mined
      if (result) {
        // The transaction was submitted successfully
        // The profile data will be updated automatically when the transaction is mined
        // due to the useReadContract hooks watching for changes
      }
    } catch (error: any) {
      console.error('Error creating profile:', error)
      
      // Handle specific error cases
      if (error.message?.includes('ProfileAlreadyExists')) {
        throw new Error('Profile already exists for this user')
      } else if (error.message?.includes('Can only create profile for yourself')) {
        throw new Error('You can only create a profile for yourself')
      } else if (error.message?.includes('Invalid user address')) {
        throw new Error('Invalid user address provided')
      } else {
        throw new Error(error.message || 'Failed to create profile')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Create profile with initial data function
  const createProfileWithData = async (displayName: string, bio: string) => {
    if (!writeCreateProfile || !address) {
      throw new Error('Wallet not connected or write function not available')
    }

    // Validation
    if (!displayName.trim()) {
      throw new Error('Display name cannot be empty')
    }
    if (displayName.length > 50) {
      throw new Error('Display name too long (max 50 characters)')
    }
    if (bio.length > 500) {
      throw new Error('Bio too long (max 500 characters)')
    }



    setIsLoading(true)
    try {
      // Create the profile (this will create an empty profile)
      await writeCreateProfile({
        address: CONTRACT_ADDRESSES.DEDIndex as `0x${string}`,
        abi: DED_INDEX_ABI,
        functionName: 'createProfileForUser',
        args: [address],
      } as any)

      // Note: The profile will be created with empty display name and bio
      // The user will need to update it separately after creation
      // This is the safest approach that works with the current smart contract
    } catch (error: any) {
      console.error('Error creating profile with data:', error)
      
      // Handle specific error cases
      if (error.message?.includes('ProfileAlreadyExists')) {
        throw new Error('Profile already exists for this user')
      } else if (error.message?.includes('Can only create profile for yourself')) {
        throw new Error('You can only create a profile for yourself')
      } else if (error.message?.includes('Invalid user address')) {
        throw new Error('Invalid user address provided')
      } else {
        throw new Error(error.message || 'Failed to create profile')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Update profile function
  const updateProfile = async (displayName: string, bio: string) => {
    if (!writeUpdateProfile || !profileAddress) return

    // Validation
    if (!displayName.trim()) {
      throw new Error('Display name cannot be empty')
    }
    if (displayName.length > 50) {
      throw new Error('Display name too long (max 50 characters)')
    }
    if (bio.length > 500) {
      throw new Error('Bio too long (max 500 characters)')
    }

    setIsLoading(true)
    try {
      await writeUpdateProfile({
        address: profileAddress as `0x${string}`,
        abi: DED_PROFILE_ABI,
        functionName: 'updateInfo',
        args: [displayName, bio],
      } as any)
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    profileData,
    isLoading: isLoading || isUpdating || isCreating,
    createProfile,
    createProfileWithData,
    updateProfile,
    hasProfile: hasProfileData || false,
    profileAddress
  }
} 