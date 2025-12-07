import { useState, useEffect, useRef } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { 
  User, 
  GraduationCap, 
  DollarSign, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Send,
  Lock
} from 'lucide-react'
import { CONTRACT_ADDRESSES } from '@/lib/contract-addresses'

const LISTING_BROKER_ABI = [
  {
    "inputs": [
      {"internalType": "bytes32", "name": "listingId", "type": "bytes32"},
      {"internalType": "uint256", "name": "proposedAmount", "type": "uint256"},
      {"internalType": "string", "name": "message", "type": "string"},
      {"internalType": "bool", "name": "isEducator", "type": "bool"}
    ],
    "name": "applyToListing",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

const TOKEN_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

interface ListingBrokerApplyModalProps {
  listing: {
    id: string
    address: string
    title: string
    tokenAmount: string
  }
  isOpen: boolean
  onClose: () => void
}

type Step = 'idle' | 'approving' | 'applying'

export function ListingBrokerApplyModal({ listing, isOpen, onClose }: ListingBrokerApplyModalProps) {
  const { address } = useAccount()
  const { toast } = useToast()
  
  const [role, setRole] = useState<'student' | 'educator'>('educator')
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [currentStep, setCurrentStep] = useState<Step>('idle')
  const appliedRef = useRef(false)
  
  // Convert listingAddress to bytes32
  let listingId: `0x${string}` = listing.address.startsWith('0x') 
    ? listing.address as `0x${string}` 
    : `0x${listing.address}` as `0x${string}`
  const hexWithoutPrefix = listingId.slice(2)
  const paddedHex = hexWithoutPrefix.padEnd(64, '0')
  listingId = `0x${paddedHex}` as `0x${string}`
  
  // Approval hook
  const { 
    writeContract: writeApproval,
    data: approvalHash,
    isPending: isApproving,
    error: approvalError,
    reset: resetApproval
  } = useWriteContract()
  
  // Application hook
  const { 
    writeContract: writeApplication,
    data: applyHash,
    isPending: isApplying,
    error: applyError,
    reset: resetApplication
  } = useWriteContract()
  
  const { isLoading: isConfirmingApproval } = useWaitForTransactionReceipt({
    hash: approvalHash,
  })
  
  const { isLoading: isConfirmingApplication } = useWaitForTransactionReceipt({
    hash: applyHash,
  })
  
  // When approval is confirmed, trigger application
  useEffect(() => {
    if (approvalHash && !isConfirmingApproval && currentStep === 'approving') {
      console.log('✅ Approval confirmed! Switching to applying step...')
      setCurrentStep('applying')
    }
  }, [approvalHash, isConfirmingApproval, currentStep])
  
  // When step changes to 'applying', trigger the application
  useEffect(() => {
    if (currentStep === 'applying' && !appliedRef.current) {
      appliedRef.current = true
      console.log('🎯 Triggering application!')
      
      if (!writeApplication) {
        console.error('writeApplication is not available!')
        return
      }
      
      const amountInWei = amount ? BigInt(Number(amount) * 1e18) : 0n
      const isEducatorRole = role === 'educator'
      
      writeApplication({
        address: CONTRACT_ADDRESSES.ListingBroker as `0x${string}`,
        abi: LISTING_BROKER_ABI,
        functionName: 'applyToListing',
        args: [listingId, amountInWei, message, isEducatorRole],
        gas: 500000n,
      } as any)
    }
  }, [currentStep, writeApplication, amount, message, role, listingId])
  
  // Show success message on application confirmation
  useEffect(() => {
    if (applyHash && !isConfirmingApplication) {
      toast({
        title: 'Application submitted',
        description: 'Your application has been submitted successfully!',
      })
      appliedRef.current = false
      setCurrentStep('idle')
      onClose()
    }
  }, [applyHash, isConfirmingApplication, toast, onClose])
  
  // Log errors
  useEffect(() => {
    if (approvalError) {
      console.error('Approval error:', approvalError)
      toast({
        title: 'Approval failed',
        description: approvalError.message,
        variant: 'destructive',
      })
      setCurrentStep('idle')
    }
  }, [approvalError, toast])
  
  useEffect(() => {
    if (applyError) {
      console.error('Application error:', applyError)
      toast({
        title: 'Application failed',
        description: applyError.message,
        variant: 'destructive',
      })
      setCurrentStep('idle')
      appliedRef.current = false
    }
  }, [applyError, toast])
  
  const handleSubmit = () => {
    if (!address) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      })
      return
    }
    
    // Calculate amount in wei
    const amountInWei = amount ? BigInt(Number(amount) * 1e18) : 0n
    
    if (amountInWei === 0n) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      })
      return
    }
    
    const isEducatorRole = role === 'educator'
    
    // Only students need to approve tokens (they're depositing)
    // Educators don't need approval (they're proposing to be paid)
    if (!isEducatorRole) {
      // Start with approval
      setCurrentStep('approving')
      appliedRef.current = false
      
      // Approve tokens first
      writeApproval({
        address: CONTRACT_ADDRESSES.DEDToken as `0x${string}`,
        abi: TOKEN_ABI,
        functionName: 'approve',
        args: [
          CONTRACT_ADDRESSES.ListingBroker as `0x${string}`,
          amountInWei
        ],
      } as any)
    } else {
      // For educators, apply directly (no approval needed)
      setCurrentStep('applying')
      appliedRef.current = false
      
      writeApplication({
        address: CONTRACT_ADDRESSES.ListingBroker as `0x${string}`,
        abi: LISTING_BROKER_ABI,
        functionName: 'applyToListing',
        args: [listingId, amountInWei, message, isEducatorRole],
        gas: 500000n,
      } as any)
    }
  }
  
  const isSubmitting = currentStep !== 'idle'
  const error = approvalError || applyError
  
  if (!isOpen) return null
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Apply to Join</DialogTitle>
          <DialogDescription>
            Submit your application to join this learning session
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label>Apply as</Label>
            <Select value={role} onValueChange={(value: 'student' | 'educator') => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Student
                  </div>
                </SelectItem>
                <SelectItem value="educator">
                  <div className="flex items-center">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Educator
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Amount */}
          <div className="space-y-2">
            <Label>
              {role === 'educator' ? 'Your Proposed Fee (DED)' : 'Your Deposit Amount (DED)'}
            </Label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="1"
                placeholder={listing.tokenAmount.replace(' DED', '')}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              {role === 'educator' 
                ? 'Propose the fee you want to receive (paid by the listing creator)'
                : 'Amount you\'re willing to pay as deposit'
              }
            </p>
          </div>
          
          {/* Message */}
          <div className="space-y-2">
            <Label>Message (Optional)</Label>
            <Textarea
              placeholder="Tell the listing owner why you're a good fit..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
          
          {/* Progress Banner */}
          {currentStep !== 'idle' && (
            <Alert>
              {currentStep === 'approving' ? (
                <>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Step 1/2:</strong> Approving tokens... Please confirm the transaction in your wallet.
                  </AlertDescription>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Step 2/2:</strong> Submitting application... Please confirm the transaction in your wallet.
                  </AlertDescription>
                </>
              )}
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-xs">
                {error.message}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isApproving || isConfirmingApproval || isApplying || isConfirmingApplication}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {currentStep === 'approving' ? 'Approving tokens...' : 'Submitting application...'}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Application
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

