import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESSES } from '@/lib/contract-addresses'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Users, CheckCircle, XCircle, Send, Loader2, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { ApplicationWarning } from './ApplicationWarning'

// ABI for ListingBroker
const LISTING_BROKER_ABI = [
  {
    "inputs": [{"internalType": "bytes32", "name": "listingId", "type": "bytes32"}],
    "name": "getApplications",
    "outputs": [{
      "components": [
        {"internalType": "address", "name": "applicant", "type": "address"},
        {"internalType": "uint256", "name": "barterAmount", "type": "uint256"},
        {"internalType": "string", "name": "message", "type": "string"},
        {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
        {"internalType": "bool", "name": "isActive", "type": "bool"},
        {"internalType": "bool", "name": "isEducator", "type": "bool"}
      ],
      "internalType": "struct ListingBroker.Application[]",
      "name": "",
      "type": "tuple[]"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "bytes32", "name": "listingId", "type": "bytes32"},
      {"internalType": "uint256", "name": "applicantIndex", "type": "uint256"},
      {"internalType": "bool", "name": "accepted", "type": "bool"},
      {"internalType": "uint256", "name": "finalAmount", "type": "uint256"}
    ],
    "name": "respondToApplication",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

interface ListingBrokerRequestsProps {
  listingAddress: string
}

export function ListingBrokerRequests({ listingAddress }: ListingBrokerRequestsProps) {
  const { address } = useAccount()
  const { toast } = useToast()
  
  // Convert listingAddress to bytes32
  let listingId: `0x${string}` = listingAddress.startsWith('0x') 
    ? listingAddress as `0x${string}` 
    : `0x${listingAddress}` as `0x${string}`
  const hexWithoutPrefix = listingId.slice(2)
  const paddedHex = hexWithoutPrefix.padEnd(64, '0')
  listingId = `0x${paddedHex}` as `0x${string}`
  
  const { data: applications, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.ListingBroker as `0x${string}`,
    abi: LISTING_BROKER_ABI,
    functionName: 'getApplications',
    args: [listingId],
  })
  
  // State for responding to applications
  const [respondingToIndex, setRespondingToIndex] = useState<number | null>(null)
  const [responseType, setResponseType] = useState<'accept' | 'reject' | null>(null)
  const [finalAmount, setFinalAmount] = useState('')
  
  const { 
    writeContract: writeResponse,
    data: responseHash,
    isPending: isResponding,
    error: responseError
  } = useWriteContract()
  
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: responseHash,
  })
  
  // Show success message and refresh on confirmation
  useEffect(() => {
    if (responseHash && !isConfirming) {
      toast({
        title: 'Application processed',
        description: responseType === 'accept' 
          ? 'Application accepted successfully' 
          : 'Application rejected',
      })
      setRespondingToIndex(null)
      setResponseType(null)
      setFinalAmount('')
    }
  }, [responseHash, isConfirming, responseType, toast])
  
  // Log errors
  useEffect(() => {
    if (responseError) {
      console.error('Response error:', responseError)
      console.error('Full error details:', {
        name: responseError.name,
        message: responseError.message,
        shortMessage: (responseError as any).shortMessage,
        code: (responseError as any).code,
        cause: (responseError as any).cause,
        details: (responseError as any).details,
        data: (responseError as any).data
      })
      
      toast({
        title: 'Transaction failed',
        description: responseError.message,
        variant: 'destructive',
      })
      
      // Also show alert for visibility
      alert(`Transaction failed: ${responseError.message}`)
    }
  }, [responseError, toast])
  
  if (isLoading) {
    return null
  }
  
  if (!applications || applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Applications
          </CardTitle>
          <CardDescription>
            No applications yet. Share your listing to get educators/students applying.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }
  
  const activeApplications = applications.filter((app: any) => app.isActive)
  
  if (activeApplications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Applications
          </CardTitle>
          <CardDescription>
            All applications have been processed.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }
  
  const handleRespond = async (index: number, accept: boolean) => {
    const app = activeApplications[index]
    
    if (accept) {
      // For accepting, use the applicant's proposed amount
      // If they didn't specify an amount, use the listing's original amount
      let amount = app.barterAmount
      
      // If amount is 0, we need to fetch the listing amount
      if (amount === 0n) {
        // For now, use 1 DED minimum - in production, fetch from listing
        amount = BigInt(1000000000000000000) // 1 DED
      }
      
      writeResponse({
        address: CONTRACT_ADDRESSES.ListingBroker as `0x${string}`,
        abi: LISTING_BROKER_ABI,
        functionName: 'respondToApplication',
        args: [listingId, BigInt(index), true, amount],
        gas: 1000000n, // Increased gas limit
      } as any)
    } else {
      writeResponse({
        address: CONTRACT_ADDRESSES.ListingBroker as `0x${string}`,
        abi: LISTING_BROKER_ABI,
        functionName: 'respondToApplication',
        args: [listingId, BigInt(index), false, 0n],
        gas: 500000n,
      } as any)
    }
    
    setRespondingToIndex(index)
    setResponseType(accept ? 'accept' : 'reject')
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Applications ({activeApplications.length})
        </CardTitle>
        <CardDescription>
          Review and respond to applications from educators or students
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeApplications.map((application: any, index: number) => (
          <div 
            key={index}
            className="p-4 border rounded-lg space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className={application.isEducator ? 'bg-blue-100' : 'bg-primary/10'}>
                    {application.isEducator ? '👨‍🏫' : '👨‍🎓'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {application.applicant.slice(0, 6)}...{application.applicant.slice(-4)}
                    </p>
                    <Badge variant="outline" className={application.isEducator ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-green-100 text-green-800 border-green-300'}>
                      {application.isEducator ? 'Educator' : 'Student'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {application.applicant}
                  </p>
                </div>
              </div>
              <Badge variant="outline">
                {application.barterAmount > 0n 
                  ? `${Number(application.barterAmount) / 1e18} DED`
                  : 'No amount specified'
                }
              </Badge>
            </div>
            
            {/* Show warning if no amount specified */}
            {application.barterAmount === 0n && (
              <ApplicationWarning 
                isEducator={application.isEducator}
                hasAmount={false}
              />
            )}
            
            {application.message && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{application.message}</p>
              </div>
            )}
            
            {respondingToIndex === index ? (
              <div className="space-y-3 pt-2 border-t">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setRespondingToIndex(null)}
                    variant="outline"
                    size="sm"
                    disabled={isResponding || isConfirming}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleRespond(index, responseType === 'accept')}
                    size="sm"
                    disabled={isResponding || isConfirming}
                  >
                    {isResponding || isConfirming ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {responseType === 'accept' ? 'Accept & Finalize' : 'Confirm Reject'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setResponseType('accept')
                    setRespondingToIndex(index)
                  }}
                  size="sm"
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept
                </Button>
                <Button
                  onClick={() => {
                    setResponseType('reject')
                    setRespondingToIndex(index)
                  }}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}
            
            {responseError && respondingToIndex === index && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-xs">
                  {responseError.message}
                </AlertDescription>
              </Alert>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
