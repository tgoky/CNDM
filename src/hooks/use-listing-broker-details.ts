import { useReadContract } from 'wagmi'
import { CONTRACT_ADDRESSES } from '@/lib/contract-addresses'
import { useMemo } from 'react'

const LISTING_BROKER_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getListings",
    "outputs": [{
      "components": [
        {"internalType": "bytes32", "name": "listingId", "type": "bytes32"},
        {"internalType": "address", "name": "creator", "type": "address"},
        {"internalType": "uint256", "name": "amount", "type": "uint256"},
        {"internalType": "bytes32", "name": "subject", "type": "bytes32"},
        {"internalType": "bytes32", "name": "topic", "type": "bytes32"},
        {"internalType": "string", "name": "description", "type": "string"},
        {"internalType": "string", "name": "objectives", "type": "string"},
        {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
        {"internalType": "bool", "name": "isActive", "type": "bool"},
        {"internalType": "address", "name": "selectedApplicant", "type": "address"},
        {"internalType": "uint256", "name": "finalAmount", "type": "uint256"}
      ],
      "internalType": "struct ListingBroker.Listing[]",
      "name": "",
      "type": "tuple[]"
    }],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export function useListingBrokerDetails(listingAddress: string, creatorAddress: string) {
  const { data: listings, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.ListingBroker as `0x${string}`,
    abi: LISTING_BROKER_ABI,
    functionName: 'getListings',
    args: [creatorAddress as `0x${string}`],
  })
  
  // Helper function to extract string from bytes32
  function extractStringFromBytes32(bytes32Value: string): string {
    try {
      const hex = bytes32Value.replace('0x', '').toLowerCase()
      let result = ''
      for (let i = 0; i < hex.length; i += 2) {
        const charCode = parseInt(hex.substr(i, 2), 16)
        if (charCode === 0) break
        result += String.fromCharCode(charCode)
      }
      return result.trim()
    } catch {
      return bytes32Value
    }
  }
  
  const listingDetails = useMemo(() => {
    if (!listings) return null
    
    // Convert listingAddress to bytes32
    let listingId: `0x${string}` = listingAddress.startsWith('0x') 
      ? listingAddress as `0x${string}` 
      : `0x${listingAddress}` as `0x${string}`
    const hexWithoutPrefix = listingId.slice(2)
    const paddedHex = hexWithoutPrefix.padEnd(64, '0')
    listingId = `0x${paddedHex}` as `0x${string}`
    
    const listing = listings.find(l => l.listingId.toLowerCase() === listingId.toLowerCase())
    
    if (!listing) return null
    
    return {
      subject: extractStringFromBytes32(listing.subject),
      topic: extractStringFromBytes32(listing.topic),
      objectives: listing.objectives,
      amount: listing.amount,
      selectedApplicant: listing.selectedApplicant,
      finalAmount: listing.finalAmount,
      isActive: listing.isActive
    }
  }, [listings, listingAddress])
  
  return {
    listingDetails,
    isLoading
  }
}

