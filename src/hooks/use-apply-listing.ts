import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi'
import { CONTRACT_ADDRESSES } from '@/lib/contract-addresses'
import { useState } from 'react'

// ABI for DEDListing contract functions
const DED_LISTING_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "student",
        "type": "address"
      }
    ],
    "name": "allowStudent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "educator",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "shares",
        "type": "uint256"
      }
    ],
    "name": "addPotentialEducator",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "studentDeposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "confirm",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "releaseEscrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "refundEscrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "finalizeEducators",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getStateString",
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
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "potentialEducatorList",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "whoIs",
        "type": "address"
      }
    ],
    "name": "isStudent",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "whoIs",
        "type": "address"
      }
    ],
    "name": "isEducator",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
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
    "name": "studentCount",
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
  },
  {
    "inputs": [],
    "name": "getCreator",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "escrow",
    "outputs": [
      {
        "internalType": "address payable",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPotentialEducators",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "educators",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "shares",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export type ListingState = 
  | 'Created'
  | 'AcceptingParticipants'
  | 'AcceptingDeposit'
  | 'AwaitingConfirm'
  | 'InProgress'
  | 'Refunded'
  | 'Released'

export interface ListingStatus {
  state: ListingState
  isStudent: boolean
  isEducator: boolean
  postAmount: bigint
}

export function useApplyListing(listingAddress?: string, creatorAddress?: string) {
  const { address } = useAccount()
  const [isApplying, setIsApplying] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)
  const [isRefunding, setIsRefunding] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)

  // Read the actual owner from the contract
  const { data: contractOwner, error: ownerError } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: DED_LISTING_ABI,
    functionName: 'owner',
    query: {
      enabled: !!listingAddress,
    },
  })

  // Read contract functions
  const { data: listingState } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: DED_LISTING_ABI,
    functionName: 'getStateString',
    enabled: !!listingAddress,
  })

  const { data: postAmount } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: DED_LISTING_ABI,
    functionName: 'postAmount',
    enabled: !!listingAddress,
  })

  const { data: listingOwner } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: DED_LISTING_ABI,
    functionName: 'owner',
    enabled: !!listingAddress,
  })

  const { data: isCurrentUserStudent } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: DED_LISTING_ABI,
    functionName: 'isStudent',
    args: [address as `0x${string}`],
    enabled: !!listingAddress && !!address,
  })

  const { data: isCurrentUserEducator } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: DED_LISTING_ABI,
    functionName: 'isEducator',
    args: [address as `0x${string}`],
    enabled: !!listingAddress && !!address,
  })

  const { data: potentialEducators } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: DED_LISTING_ABI,
    functionName: 'getPotentialEducators',
    enabled: !!listingAddress,
  })

  const { data: studentCount } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: DED_LISTING_ABI,
    functionName: 'studentCount',
    enabled: !!listingAddress,
  })

  // Read escrow state
  const { data: escrowState, error: escrowError } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: DED_LISTING_ABI,
    functionName: 'escrow',
    query: {
      enabled: !!listingAddress,
    },
  })

  // Debug escrow address
  console.log('Escrow Debug:', {
    listingAddress,
    escrowState,
    escrowError,
    escrowAddress: escrowState
  })

  // Read escrow state from the escrow contract
  const { data: escrowContractState, error: escrowContractError } = useReadContract({
    address: escrowState as `0x${string}`,
    abi: [
      {
        "inputs": [],
        "name": "state",
        "outputs": [
          {
            "internalType": "enum DEDEscrow.State",
            "name": "",
            "type": "uint8"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'state',
    query: {
      enabled: !!escrowState && escrowState !== '0x0000000000000000000000000000000000000000',
    },
  })

  // Debug escrow contract state
  console.log('Escrow Contract Debug:', {
    escrowAddress: escrowState,
    escrowContractState,
    escrowContractError
  })

  // Write contract functions
  const { 
    data: applyHash, 
    writeContract: writeApplyContract, 
    isPending: isApplyingPending, 
    error: applyError 
  } = useWriteContract()

  const { 
    data: depositHash, 
    writeContract: writeDepositContract, 
    isPending: isDepositingPending, 
    error: depositError 
  } = useWriteContract()

  const { 
    data: confirmHash, 
    writeContract: writeConfirmContract, 
    isPending: isConfirmingPending, 
    error: confirmError 
  } = useWriteContract()

  const { 
    data: releaseHash, 
    writeContract: writeReleaseContract, 
    isPending: isReleasingPending, 
    error: releaseError 
  } = useWriteContract()

  const { 
    data: refundHash, 
    writeContract: writeRefundContract, 
    isPending: isRefundingPending, 
    error: refundError 
  } = useWriteContract()

  const { 
    data: finalizeHash, 
    writeContract: writeFinalizeContract, 
    isPending: isFinalizingPending, 
    error: finalizeError 
  } = useWriteContract()

  // Wait for transactions
  const { isLoading: isApplyConfirming, isSuccess: isApplyConfirmed } = useWaitForTransactionReceipt({
    hash: applyHash,
  })

  const { isLoading: isDepositConfirming, isSuccess: isDepositConfirmed } = useWaitForTransactionReceipt({
    hash: depositHash,
  })

  const { isLoading: isConfirmConfirming, isSuccess: isConfirmConfirmed } = useWaitForTransactionReceipt({
    hash: confirmHash,
  })

  const { isLoading: isReleaseConfirming, isSuccess: isReleaseConfirmed } = useWaitForTransactionReceipt({
    hash: releaseHash,
  })

  const { isLoading: isRefundConfirming, isSuccess: isRefundConfirmed } = useWaitForTransactionReceipt({
    hash: refundHash,
  })

  const { isLoading: isFinalizeConfirming, isSuccess: isFinalizeConfirmed } = useWaitForTransactionReceipt({
    hash: finalizeHash,
  })

  // Check if current user is the listing owner using the creator address
  // DEDListing owner is set to DEDIndex address, so we use the actual creator address
  const isOwner = address && creatorAddress && address.toLowerCase() === creatorAddress.toLowerCase()
  
  // Debug logging for isOwner calculation
  console.log('isOwner calculation:', {
    address,
    creatorAddress,
    isOwner,
    addressLower: address?.toLowerCase(),
    creatorAddressLower: creatorAddress?.toLowerCase()
  })
  
  // Log any errors for debugging
  if (ownerError) {
    console.error('Error reading contract owner:', ownerError)
  }

  // Apply as student (only owner can do this)
  const applyAsStudent = async (studentAddress: string) => {
    if (!writeApplyContract || !listingAddress) return
    
    // Safety check for isOwner
    const currentIsOwner = address && creatorAddress && address.toLowerCase() === creatorAddress.toLowerCase()
    
    if (!currentIsOwner) {
      throw new Error('Only the listing owner can add students')
    }

    setIsApplying(true)
    try {
      await writeApplyContract({
        address: listingAddress as `0x${string}`,
        abi: DED_LISTING_ABI,
        functionName: 'allowStudent',
        args: [studentAddress as `0x${string}`],
      } as any)
    } catch (error) {
      console.error('Error applying as student:', error)
      throw error
    } finally {
      setIsApplying(false)
    }
  }

  // Function to check if an educator is already in the potential educators list
  const checkIfEducatorAdded = (educatorAddress: string): boolean => {
    if (!potentialEducators || !potentialEducators[0]) {
      return false
    }
    
    const addresses = potentialEducators[0] as string[]
    return addresses.some(addr => addr.toLowerCase() === educatorAddress.toLowerCase())
  }

  // Apply as educator (only owner can do this)
  const applyAsEducator = async (educatorAddress: string, shares: number = 100) => {
    if (!writeApplyContract || !listingAddress) {
      console.error('Missing writeApplyContract or listingAddress')
      return
    }
    
    // Safety check for isOwner
    const currentIsOwner = address && creatorAddress && address.toLowerCase() === creatorAddress.toLowerCase()
    
    if (!currentIsOwner) {
      console.error('User is not the owner. Current address:', address, 'Creator address:', creatorAddress)
      throw new Error('Only the listing owner can add educators')
    }

    // Check if listing state allows adding educators
    if (listingState !== 'AcceptingParticipants') {
      throw new Error(`Cannot add educators. Current state: ${listingState}. Must be in 'AcceptingParticipants' state.`)
    }

    // Validate educator address
    if (!educatorAddress || educatorAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('Invalid educator address: Address cannot be zero')
    }

    // Validate shares
    if (shares <= 0) {
      throw new Error('Invalid shares: Shares must be greater than 0')
    }

    // Check if the educator is already added (simplified for now)
    const alreadyAdded = checkIfEducatorAdded(educatorAddress)
    if (alreadyAdded) {
      console.log('Educator already added:', educatorAddress)
      throw new Error('This educator is already in the potential educators list')
    }

    console.log('Adding educator:', {
      educatorAddress,
      shares,
      listingAddress,
      currentIsOwner,
      listingState,
      potentialEducators: potentialEducators ? {
        addresses: potentialEducators[0] || [],
        shares: potentialEducators[1] || []
      } : null,
      // Additional debugging for transaction failure
      contractOwner: contractOwner,
      isContractOwner: address && contractOwner && address.toLowerCase() === (contractOwner as string).toLowerCase(),
      validationChecks: {
        hasWriteContract: !!writeApplyContract,
        hasListingAddress: !!listingAddress,
        isOwner: currentIsOwner,
        correctState: listingState === 'AcceptingParticipants',
        validAddress: educatorAddress && educatorAddress !== '0x0000000000000000000000000000000000000000',
        validShares: shares > 0,
        notAlreadyAdded: !checkIfEducatorAdded(educatorAddress)
      }
    })
    
    setIsApplying(true)
    try {
      await writeApplyContract({
        address: listingAddress as `0x${string}`,
        abi: DED_LISTING_ABI,
        functionName: 'addPotentialEducator',
        args: [educatorAddress as `0x${string}`, BigInt(shares)],
      } as any)
    } catch (error) {
      console.error('Error applying as educator:', error)
      throw error
    } finally {
      setIsApplying(false)
    }
  }

  // Finalize educators (only owner can do this)
  const finalizeEducators = async () => {
    if (!writeFinalizeContract || !listingAddress) return
    
    // Safety check for isOwner
    const currentIsOwner = address && creatorAddress && address.toLowerCase() === creatorAddress.toLowerCase()
    
    if (!currentIsOwner) {
      throw new Error('Only the listing owner can finalize educators')
    }

    // Check if listing state allows finalization
    if (listingState !== 'AcceptingParticipants') {
      throw new Error(`Cannot finalize educators. Current state: ${listingState}. Must be in 'AcceptingParticipants' state.`)
    }

    // Check if there are potential educators
    if (!potentialEducators || !potentialEducators[0] || potentialEducators[0].length === 0) {
      throw new Error('Cannot finalize educators. No potential educators have been added.')
    }

    // Debug information
    console.log('FinalizeEducators Debug:', {
      listingAddress,
      listingState,
      isOwner: address && creatorAddress && address.toLowerCase() === creatorAddress.toLowerCase(),
      address,
      creatorAddress,
      potentialEducators,
      // Additional debugging for transaction failure
      contractOwner: contractOwner,
      isContractOwner: address && contractOwner && address.toLowerCase() === (contractOwner as string).toLowerCase(),
      validationChecks: {
        hasWriteContract: !!writeFinalizeContract,
        hasListingAddress: !!listingAddress,
        isOwner: currentIsOwner,
        correctState: listingState === 'AcceptingParticipants',
        hasEducators: potentialEducators && potentialEducators[0] && potentialEducators[0].length > 0,
        educatorCount: potentialEducators ? potentialEducators[0].length : 0
      }
    })

    setIsFinalizing(true)
    try {
      await writeFinalizeContract({
        address: listingAddress as `0x${string}`,
        abi: DED_LISTING_ABI,
        functionName: 'finalizeEducators',
      } as any)
    } catch (error) {
      console.error('Error finalizing educators:', error)
      throw error
    } finally {
      setIsFinalizing(false)
    }
  }

  // Make deposit (only allowed students can do this)
  const makeDeposit = async () => {
    if (!writeDepositContract || !listingAddress || !postAmount) return
    if (!isCurrentUserStudent) {
      throw new Error('You must be an approved student to make a deposit')
    }

    setIsDepositing(true)
    try {
      await writeDepositContract({
        address: listingAddress as `0x${string}`,
        abi: DED_LISTING_ABI,
        functionName: 'studentDeposit',
        value: postAmount,
      } as any)
    } catch (error) {
      console.error('Error making deposit:', error)
      throw error
    } finally {
      setIsDepositing(false)
    }
  }

  // Confirm listing (only owner or creator can do this)
  const confirmListing = async () => {
    if (!writeConfirmContract || !listingAddress) return
    
    // The smart contract will handle the permission check
    // The onlyOwnerOrCreator modifier allows both owner (DEDIndex) and creator to call this function
    // We don't need to do client-side validation here

    setIsConfirming(true)
    try {
      await writeConfirmContract({
        address: listingAddress as `0x${string}`,
        abi: DED_LISTING_ABI,
        functionName: 'confirm',
      } as any)
    } catch (error) {
      console.error('Error confirming listing:', error)
      throw error
    } finally {
      setIsConfirming(false)
    }
  }

  // Release escrow (only owner or creator can do this)
  const releaseEscrow = async () => {
    if (!writeReleaseContract || !listingAddress) return
    
    // Check if current user is the creator (who can now release escrow)
    const currentIsCreator = address && creatorAddress && address.toLowerCase() === creatorAddress.toLowerCase()
    
    if (!currentIsCreator) {
      throw new Error('Only the listing creator can release escrow')
    }

    setIsReleasing(true)
    try {
      await writeReleaseContract({
        address: listingAddress as `0x${string}`,
        abi: DED_LISTING_ABI,
        functionName: 'releaseEscrow',
      } as any)
    } catch (error) {
      console.error('Error releasing escrow:', error)
      throw error
    } finally {
      setIsReleasing(false)
    }
  }

  // Refund escrow (only owner or creator can do this)
  const refundEscrow = async () => {
    if (!writeRefundContract || !listingAddress) return
    
    // Check if current user is the creator (who can now refund escrow)
    const currentIsCreator = address && creatorAddress && address.toLowerCase() === creatorAddress.toLowerCase()
    
    if (!currentIsCreator) {
      throw new Error('Only the listing creator can refund escrow')
    }

    setIsRefunding(true)
    try {
      await writeRefundContract({
        address: listingAddress as `0x${string}`,
        abi: DED_LISTING_ABI,
        functionName: 'refundEscrow',
      } as any)
    } catch (error) {
      console.error('Error refunding escrow:', error)
      throw error
    } finally {
      setIsRefunding(false)
    }
  }

  return {
    // State
    listingState: listingState as ListingState,
    postAmount,
    isOwner: address && listingOwner && address.toLowerCase() === listingOwner.toLowerCase(),
    isCreator: address && creatorAddress && address.toLowerCase() === creatorAddress.toLowerCase(),
    isCurrentUserStudent: isCurrentUserStudent || false,
    isCurrentUserEducator: isCurrentUserEducator || false,
    potentialEducators,
    studentCount: studentCount || 0,
    address,
    escrowState: escrowContractState, // Add escrow state to return object
    
    // Apply functions
    applyAsStudent,
    applyAsEducator,
    finalizeEducators,
    makeDeposit,
    confirmListing,
    releaseEscrow,
    refundEscrow,
    
    // Loading states
    isApplying: isApplying || isApplyingPending || isApplyConfirming,
    isDepositing: isDepositing || isDepositingPending || isDepositConfirming,
    isConfirming: isConfirming || isConfirmingPending || isConfirmConfirming,
    isReleasing: isReleasing || isReleasingPending || isReleaseConfirming,
    isRefunding: isRefunding || isRefundingPending || isRefundConfirming,
    isFinalizing: isFinalizing || isFinalizingPending || isFinalizeConfirming,
    
    // Success states
    isApplyConfirmed,
    isDepositConfirmed,
    isConfirmConfirmed,
    isReleaseConfirmed,
    isRefundConfirmed,
    isFinalizeConfirmed,
    
    // Errors
    applyError,
    depositError,
    confirmError,
    releaseError,
    refundError,
    finalizeError,
  }
} 