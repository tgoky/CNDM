import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { CONTRACT_ADDRESSES } from '@/lib/contract-addresses'
import { parseTokenAmount } from '@/lib/web3'
import { useState, useEffect, useRef } from 'react'

// ABI for ListingBroker submitListing function
const LISTING_BROKER_ABI = [
  {
    "inputs": [
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
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "submitListing",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// ABI for DEDToken approve function
const TOKEN_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [{"type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// Helper function to convert string to bytes32
function stringToBytes32(str: string): `0x${string}` {
  // Truncate to 31 characters to ensure it fits in bytes32
  const truncated = str.slice(0, 31);
  
  let hex = '';
  for (let i = 0; i < truncated.length; i++) {
    const charCode = truncated.charCodeAt(i);
    hex += charCode.toString(16).padStart(2, '0');
  }
  
  // Pad to exactly 32 bytes (64 hex characters)
  const paddedHex = hex.padEnd(64, '0');
  
  return `0x${paddedHex}` as `0x${string}`;
}

export interface CreateListingData {
  subject: string
  topic: string
  objectives: string
  tokenAmount: string
  description?: string
  role?: 'student' | 'educator'
}

export function useCreateListing() {
  const { address } = useAccount()
  const [currentStep, setCurrentStep] = useState<'idle' | 'approving' | 'creating' | 'complete'>('idle')
  const [pendingData, setPendingData] = useState<CreateListingData | null>(null)
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | null>(null)
  const [listingHash, setListingHash] = useState<`0x${string}` | null>(null)
  
  const { 
    writeContract: writeApproval,
    data: approvalTxHash,
    isPending: isApproving,
    error: approvalError,
    reset: resetApproval
  } = useWriteContract()

  const {
    writeContract: writeListing,
    data: listingTxHash,
    isPending: isCreating,
    error: listingError,
    reset: resetListing
  } = useWriteContract()

  // Wait for approval confirmation
  const { 
    data: approvalReceipt,
    isLoading: isWaitingApproval 
  } = useWaitForTransactionReceipt({
    hash: approvalHash,
  })

  // Wait for listing confirmation
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    data: receipt
  } = useWaitForTransactionReceipt({
    hash: listingHash,
  })

  // Store approval hash when it becomes available
  useEffect(() => {
    if (approvalTxHash && !approvalHash) {
      console.log('Step 2: Approval transaction hash:', approvalTxHash)
      setApprovalHash(approvalTxHash)
    }
  }, [approvalTxHash, approvalHash])

  // Store listing hash when it becomes available
  useEffect(() => {
    if (listingTxHash && !listingHash) {
      console.log('Listing transaction hash:', listingTxHash)
      setListingHash(listingTxHash)
    }
  }, [listingTxHash, listingHash])

  // When approval receipt is confirmed, trigger listing creation
  useEffect(() => {
    if (approvalReceipt && currentStep === 'approving') {
      console.log('✅ Approval confirmed! Switching to creating step...')
      setCurrentStep('creating')
    }
  }, [approvalReceipt, currentStep])

  // When step changes to 'creating', trigger the listing creation
  useEffect(() => {
    if (currentStep === 'creating' && pendingData) {
      console.log('🎯 Triggering listing creation!', { 
        currentStep, 
        hasPendingData: !!pendingData,
        pendingDataSubject: pendingData.subject,
        pendingDataTopic: pendingData.topic
      })
      
      if (!writeListing) {
        console.error('writeListing is not available!')
        return
      }
      
      const tokenAmountInWei = parseTokenAmount(pendingData.tokenAmount)
      
      // Note: Removed payoutMode since submitListing no longer requires upfront payment
      // Payment will be collected from applicant when they're accepted
      
      writeListing({
        address: CONTRACT_ADDRESSES.ListingBroker as `0x${string}`,
        abi: LISTING_BROKER_ABI,
        functionName: 'submitListing',
        args: [
          stringToBytes32(pendingData.subject),
          stringToBytes32(pendingData.topic),
          pendingData.objectives,
          pendingData.objectives,
          tokenAmountInWei
        ],
      } as any)
      
      console.log('📤 submitListing called with:', {
        subject: stringToBytes32(pendingData.subject),
        topic: stringToBytes32(pendingData.topic),
        objectives: pendingData.objectives,
        amount: tokenAmountInWei
      })
      
      setPendingData(null)
    }
  }, [currentStep, pendingData, writeListing])
  
  const createListing = async (listingData: CreateListingData) => {
    if (!writeApproval) {
      throw new Error('Write contract function not ready')
    }

    if (!address) {
      throw new Error('Please connect your wallet')
    }

    // Check if already in progress
    if (currentStep !== 'idle') {
      console.warn('Already processing a listing!')
      return
    }

    console.log('Step 1: Starting listing creation - will approve tokens first...', listingData)
    
    // Store data for later
    setPendingData(listingData)
    
    // Parse token amount
    const tokenAmountInWei = parseTokenAmount(listingData.tokenAmount)
    
    // Set step to approving
    setCurrentStep('approving')
    
    // Approve tokens first (required before submitListing)
    writeApproval({
      address: CONTRACT_ADDRESSES.DEDToken as `0x${string}`,
      abi: TOKEN_ABI,
      functionName: 'approve',
      args: [
        CONTRACT_ADDRESSES.ListingBroker as `0x${string}`,
        tokenAmountInWei
      ],
    } as any)
    
    console.log('Step 2: Approval transaction submitted, waiting for confirmation...')
  }

  const reset = () => {
    resetApproval()
    resetListing()
    setApprovalHash(null)
    setListingHash(null)
    setCurrentStep('idle')
    setPendingData(null)
  }

  const error = approvalError || listingError
  const isSubmitting = isApproving || isCreating || isWaitingApproval

  return {
    createListing,
    hash: listingHash,
    isSubmitting,
    isConfirming,
    isConfirmed,
    submitError: error,
    receipt,
    reset,
    currentStep
  }
}
