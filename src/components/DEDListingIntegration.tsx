import { useAccount, useReadContract } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Rocket, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

// ListingFactory ABI (simplified for deployment)
const LISTING_FACTORY_ABI = [
  {
    "inputs": [
      {"type": "bytes32", "name": "listingId"},
      {"type": "string", "name": "subject"},
      {"type": "string", "name": "topic"},
      {"type": "string", "name": "objectives"},
      {"type": "uint256", "name": "postAmount"},
      {"type": "address", "name": "creator"},
      {"type": "address", "name": "selectedApplicant"},
      {"type": "address payable", "name": "sessionEscrow"},
      {"type": "address", "name": "paymentSplitter"}
    ],
    "name": "createListingFromBroker",
    "outputs": [{"type": "address", "name": ""}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"type": "bytes32", "name": "listingId"}],
    "name": "getDEDListing",
    "outputs": [{"type": "address", "name": ""}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

interface DEDListingIntegrationProps {
  listingAddress: string
  creatorAddress: string
  subject: string
  topic: string
  objectives: string
  tokenAmount: string
  selectedApplicant: string | null
}

export function DEDListingIntegration({
  listingAddress,
  creatorAddress,
  subject,
  topic,
  objectives,
  tokenAmount,
  selectedApplicant
}: DEDListingIntegrationProps) {
  const { address } = useAccount()
  const isOwner = address && creatorAddress && address.toLowerCase() === creatorAddress.toLowerCase()
  
  if (!isOwner) return null
  
  if (!selectedApplicant || selectedApplicant === '0x0000000000000000000000000000000000000000') {
    return null
  }
  
  // Check if DEDListing already exists
  const listingId = listingAddress.startsWith('0x') 
    ? listingAddress as `0x${string}` 
    : `0x${listingAddress}` as `0x${string}`
  
  const { data: dedListingAddress, isLoading } = useReadContract({
    address: '0x0000000000000000000000000000000000000000' as `0x${string}`, // TODO: Add ListingFactory address
    abi: LISTING_FACTORY_ABI,
    functionName: 'getDEDListing',
    args: [listingId],
    query: { enabled: false } // Disabled until ListingFactory is deployed
  })
  
  const postAmount = tokenAmount.replace(' DED', '').replace(/\s/g, '')
  
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Rocket className="w-5 h-5" />
          Session Management
        </CardTitle>
        <CardDescription className="text-blue-700">
          Deploy a DEDListing contract to manage your learning session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>ListingBroker</strong> handles the marketplace. <strong>DEDListing</strong> manages the actual lesson sessions, rosters, deposits, and payments.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3 p-4 bg-white/50 rounded-lg border border-blue-100">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900">Subject:</span>
            <span className="text-sm text-blue-700">{subject}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900">Topic:</span>
            <span className="text-sm text-blue-700">{topic}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900">Participant:</span>
            <span className="text-sm font-mono text-blue-700">{selectedApplicant.slice(0, 6)}...{selectedApplicant.slice(-4)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900">Amount:</span>
            <span className="text-sm font-semibold text-blue-800">{postAmount} DED</span>
          </div>
        </div>
        
        {dedListingAddress && dedListingAddress !== '0x0000000000000000000000000000000000000000' ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">DEDListing Deployed</span>
            </div>
            <p className="text-sm text-green-700 mt-2">
              Your session contract is ready at:
            </p>
            <p className="text-xs font-mono text-green-600 mt-1 break-all">
              {dedListingAddress}
            </p>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> To deploy DEDListing contracts, you need a ListingFactory contract deployed on Sepolia. This feature is coming soon.
            </p>
          </div>
        )}
        
        <Button 
          disabled={true}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {dedListingAddress && dedListingAddress !== '0x0000000000000000000000000000000000000000' ? (
            <>Manage Session</>
          ) : (
            <>Deploy DEDListing (Coming Soon)</>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

