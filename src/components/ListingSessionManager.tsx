import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Video,
  Users
} from 'lucide-react'

const LISTING_ABI = [
  {
    inputs: [],
    name: 'confirm',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'state',
    outputs: [{
      internalType: 'enum Listing.ListingState',
      name: '',
      type: 'uint8'
    }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'studentCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'educatorCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{
      internalType: 'address',
      name: '',
      type: 'address'
    }],
    name: 'allowedStudents',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{
      internalType: 'address',
      name: '',
      type: 'address'
    }],
    name: 'allowedEducators',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

const LISTING_STATE = {
  0: 'Created',
  1: 'AcceptingParticipants',
  2: 'AcceptingDeposit',
  3: 'AwaitingConfirm',
  4: 'InProgress',
  5: 'Refunded',
  6: 'Released'
} as const

interface ListingSessionManagerProps {
  listingAddress: string
  creatorAddress: string
}

export function ListingSessionManager({ 
  listingAddress, 
  creatorAddress 
}: ListingSessionManagerProps) {
  const { address } = useAccount()
  const { toast } = useToast()
  const [isStarting, setIsStarting] = useState(false)
  
  const isOwner = address && creatorAddress && address.toLowerCase() === creatorAddress.toLowerCase()
  
  // Read listing state
  const { data: listingState, refetch: refetchState } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: LISTING_ABI,
    functionName: 'state',
    enabled: !!listingAddress && listingAddress !== '0x0000000000000000000000000000000000000000'
  })
  
  // Read participant counts
  const { data: studentCount } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: LISTING_ABI,
    functionName: 'studentCount',
    enabled: !!listingAddress && listingAddress !== '0x0000000000000000000000000000000000000000'
  })
  
  const { data: educatorCount } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: LISTING_ABI,
    functionName: 'educatorCount',
    enabled: !!listingAddress && listingAddress !== '0x0000000000000000000000000000000000000000'
  })
  
  // Check if current user is student or educator
  const { data: isStudent } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: LISTING_ABI,
    functionName: 'allowedStudents',
    args: address ? [address] : undefined,
    enabled: !!listingAddress && !!address && listingAddress !== '0x0000000000000000000000000000000000000000'
  })
  
  const { data: isEducator } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: LISTING_ABI,
    functionName: 'allowedEducators',
    args: address ? [address] : undefined,
    enabled: !!listingAddress && !!address && listingAddress !== '0x0000000000000000000000000000000000000000'
  })
  
  const { 
    writeContract: startSession,
    data: startHash,
    isPending: isPendingStart,
    error: startError
  } = useWriteContract()
  
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: startHash,
  })
  
  // Handle success
  useEffect(() => {
    if (startHash && !isConfirming) {
      toast({
        title: 'Session started',
        description: 'The learning session has been started successfully!',
      })
      setIsStarting(false)
      refetchState()
    }
  }, [startHash, isConfirming, toast, refetchState])
  
  // Handle errors
  useEffect(() => {
    if (startError) {
      console.error('Start session error:', startError)
      toast({
        title: 'Failed to start session',
        description: startError.message,
        variant: 'destructive',
      })
      setIsStarting(false)
    }
  }, [startError, toast])
  
  const handleStartSession = () => {
    if (!listingAddress || listingAddress === '0x0000000000000000000000000000000000000000') {
      toast({
        title: 'Invalid listing',
        description: 'No valid listing address found',
        variant: 'destructive',
      })
      return
    }
    
    setIsStarting(true)
    
    startSession({
      address: listingAddress as `0x${string}`,
      abi: LISTING_ABI,
      functionName: 'confirm',
    } as any)
  }
  
  const currentState = listingState !== undefined ? LISTING_STATE[listingState as keyof typeof LISTING_STATE] : 'Unknown'
  
  // Only show if this is a Listing contract (not a ListingBroker)
  if (!listingAddress || listingAddress === '0x0000000000000000000000000000000000000000') {
    return null
  }
  
  const canStart = currentState === 'AwaitingConfirm' && (isOwner || isEducator || isStudent)
  const isInProgress = currentState === 'InProgress'
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Session Management
        </CardTitle>
        <CardDescription>
          Manage the learning session state
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current State */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">Current State:</span>
          <Badge variant={isInProgress ? 'default' : 'secondary'}>
            {currentState}
          </Badge>
        </div>
        
        {/* Participants */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Students:
            </span>
            <span className="font-semibold">{studentCount?.toString() || '0'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Educators:
            </span>
            <span className="font-semibold">{educatorCount?.toString() || '0'}</span>
          </div>
        </div>
        
        {/* Status Messages */}
        {isInProgress && (
          <Alert>
            <CheckCircle className="w-4 h-4" />
            <AlertDescription>
              Session is in progress. Participants can join the learning session.
            </AlertDescription>
          </Alert>
        )}
        
        {canStart && (
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Ready to start. Click the button below to begin the learning session.
            </AlertDescription>
          </Alert>
        )}
        
        {currentState === 'AcceptingParticipants' && (
          <Alert variant="warning">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Waiting for participants. Add students and educators first.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Start Session Button */}
        {canStart && (
          <Button
            onClick={handleStartSession}
            disabled={isPendingStart || isConfirming || isStarting}
            className="w-full"
            size="lg"
          >
            {isPendingStart || isConfirming || isStarting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting Session...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Begin Learning Session
              </>
            )}
          </Button>
        )}
        
        {/* Join Session Button (for participants) */}
        {isInProgress && (isEducator || isStudent) && (
          <Button
            asChild
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <a href={`/session/${listingAddress}`}>
              <Video className="w-4 h-4 mr-2" />
              Join Learning Session
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

