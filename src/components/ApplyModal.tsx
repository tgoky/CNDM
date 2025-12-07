import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  User, 
  GraduationCap, 
  DollarSign, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  X,
  Crown,
  Info,
  Send
} from 'lucide-react'
import { useApplyListing, ListingState } from '@/hooks/use-apply-listing'
import { RequestModal } from './RequestModal'

interface ApplyModalProps {
  listing: {
    id: string
    address: string
    title: string
    subject: string
    topic: string
    description: string
    tokenAmount: string
    creator: {
      address: string
      displayName: string
      reputation: number
      isEducator: boolean
    }
  }
  isOpen: boolean
  onClose: () => void
}

export function ApplyModal({ listing, isOpen, onClose }: ApplyModalProps) {
  const { address } = useAccount()
  const [applicationType, setApplicationType] = useState<'student' | 'educator'>('student')
  const [educatorShares, setEducatorShares] = useState('100')
  const [studentAddress, setStudentAddress] = useState('')
  const [educatorAddress, setEducatorAddress] = useState('')
  const [showRequestModal, setShowRequestModal] = useState(false)
  
  const {
    listingState,
    postAmount,
    isOwner,
    isCurrentUserStudent,
    isCurrentUserEducator,
    applyAsStudent,
    applyAsEducator,
    finalizeEducators,
    makeDeposit,
    confirmListing,
    releaseEscrow,
    refundEscrow,
    isApplying,
    isDepositing,
    isConfirming,
    isReleasing,
    isRefunding,
    isFinalizing,
    isApplyConfirmed,
    isDepositConfirmed,
    isConfirmConfirmed,
    isReleaseConfirmed,
    isRefundConfirmed,
    isFinalizeConfirmed,
    applyError,
    depositError,
    confirmError,
    releaseError,
    refundError,
    finalizeError,
  } = useApplyListing(listing.address, listing.creator.address)

  // Debug information
  console.log('ApplyModal Debug:', {
    listingAddress: listing.address,
    creatorAddress: listing.creator.address,
    isOwner,
    address
  })

  const handleApply = async () => {
    if (!address) return

    try {
      if (applicationType === 'student') {
        const targetAddress = studentAddress || address
        await applyAsStudent(targetAddress)
      } else {
        const targetAddress = educatorAddress || address
        await applyAsEducator(targetAddress, parseInt(educatorShares))
      }
    } catch (error) {
      console.error('Application failed:', error)
    }
  }

  const handleDeposit = async () => {
    try {
      await makeDeposit()
    } catch (error) {
      console.error('Deposit failed:', error)
    }
  }

  const handleConfirm = async () => {
    try {
      await confirmListing()
    } catch (error) {
      console.error('Confirmation failed:', error)
    }
  }

  const handleRelease = async () => {
    try {
      await releaseEscrow()
    } catch (error) {
      console.error('Release failed:', error)
    }
  }

  const handleRefund = async () => {
    try {
      await refundEscrow()
    } catch (error) {
      console.error('Refund failed:', error)
    }
  }

  const handleFinalize = async () => {
    try {
      await finalizeEducators()
    } catch (error) {
      console.error('Finalize failed:', error)
    }
  }

  const getStatusColor = (state: ListingState) => {
    switch (state) {
      case 'Created':
      case 'AcceptingParticipants':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'AcceptingDeposit':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'AwaitingConfirm':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'InProgress':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Released':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Refunded':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getActionButton = () => {
    if (isApplyConfirmed || isDepositConfirmed || isConfirmConfirmed || isReleaseConfirmed || isRefundConfirmed || isFinalizeConfirmed) {
      return (
        <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-green-700 font-medium">Action Completed Successfully!</span>
        </div>
      )
    }

    switch (listingState) {
      case 'AcceptingParticipants':
        if (isOwner) {
          return (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">You are the listing owner</span>
                </div>
                <p className="text-xs text-blue-600">
                  You can add students and educators to this listing
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Application Type</Label>
                  <Select value={applicationType} onValueChange={(value: 'student' | 'educator') => setApplicationType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          Add Student
                        </div>
                      </SelectItem>
                      <SelectItem value="educator">
                        <div className="flex items-center">
                          <GraduationCap className="w-4 h-4 mr-2" />
                          Add Educator
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {applicationType === 'student' && (
                  <div className="space-y-2">
                    <Label>Student Address</Label>
                    <Input
                      placeholder="0x..."
                      value={studentAddress}
                      onChange={(e) => setStudentAddress(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to add yourself
                    </p>
                  </div>
                )}

                {applicationType === 'educator' && (
                  <>
                    <div className="space-y-2">
                      <Label>Educator Address</Label>
                      <Input
                        placeholder="0x..."
                        value={educatorAddress}
                        onChange={(e) => setEducatorAddress(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty to add yourself
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Shares</Label>
                      <Input
                        type="number"
                        value={educatorShares}
                        onChange={(e) => setEducatorShares(e.target.value)}
                        placeholder="100"
                        min="1"
                      />
                      <p className="text-xs text-muted-foreground">
                        Their share of the payment (default: 100)
                      </p>
                    </div>
                  </>
                )}

                <Button 
                  onClick={handleApply} 
                  disabled={isApplying}
                  className="w-full"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      Add {applicationType === 'student' ? 'Student' : 'Educator'}
                    </>
                  )}
                </Button>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Ready to finalize?</span>
                  </div>
                  <p className="text-xs text-blue-600">
                    Once you've added all students and educators, finalize to create the escrow and start accepting deposits.
                  </p>
                </div>

                <Button 
                  onClick={handleFinalize} 
                  disabled={isFinalizing}
                  variant="outline"
                  className="w-full"
                >
                  {isFinalizing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Finalizing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Finalize Educators & Start Deposits
                    </>
                  )}
                </Button>
              </div>
            </div>
          )
        } else {
          return (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700">Request to join</span>
                </div>
                <p className="text-xs text-yellow-600">
                  Submit a request to the listing owner to join as a student or educator.
                </p>
              </div>
              
              <Button 
                onClick={() => setShowRequestModal(true)}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Request to Join
              </Button>
            </div>
          )
        }
      
      case 'AcceptingDeposit':
        if (isCurrentUserStudent) {
          return (
            <Button 
              onClick={handleDeposit} 
              disabled={isDepositing}
              className="w-full"
            >
              {isDepositing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Deposit...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Make Deposit ({Number(postAmount) / Math.pow(10, 18)} DED)
                </>
              )}
            </Button>
          )
        } else {
          return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700">Not an approved student</span>
              </div>
              <p className="text-xs text-yellow-600">
                You need to be added as a student by the listing owner before you can make a deposit.
              </p>
            </div>
          )
        }
      
      case 'AwaitingConfirm':
        if (isOwner) {
          return (
            <Button 
              onClick={handleConfirm} 
              disabled={isConfirming}
              className="w-full"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Lesson Start
                </>
              )}
            </Button>
          )
        } else {
          return (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">Waiting for owner confirmation</span>
              </div>
              <p className="text-xs text-orange-600">
                All deposits have been received. The listing owner needs to confirm the lesson start.
              </p>
            </div>
          )
        }
      
      case 'InProgress':
        if (isOwner) {
          return (
            <div className="space-y-2">
              <Button 
                onClick={handleRelease} 
                disabled={isReleasing}
                className="w-full"
              >
                {isReleasing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Releasing...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Release Payment to Educators
                  </>
                )}
              </Button>
              <Button 
                onClick={handleRefund} 
                disabled={isRefunding}
                variant="outline"
                className="w-full"
              >
                {isRefunding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Refunding...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Refund to Students
                  </>
                )}
              </Button>
            </div>
          )
        } else {
          return (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Lesson in progress</span>
              </div>
              <p className="text-xs text-green-600">
                The lesson is currently active. The owner can release payments or issue refunds.
              </p>
            </div>
          )
        }
      
      default:
        return (
          <div className="text-center text-muted-foreground">
            No actions available for this state
          </div>
        )
    }
  }

  const getErrorDisplay = () => {
    const error = applyError || depositError || confirmError || releaseError || refundError || finalizeError
    if (!error) return null

    return (
      <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
        <span className="text-red-700 text-sm">{error.message}</span>
      </div>
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Listing Actions</DialogTitle>
            <DialogDescription>
              Manage this educational opportunity
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Listing Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Badge variant="outline" className="text-xs mb-1">
                      {listing.subject}
                    </Badge>
                    <h3 className="font-semibold text-sm">{listing.title}</h3>
                  </div>
                  <Badge className="bg-success/10 text-success border-success/30">
                    {listing.tokenAmount}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{listing.description}</p>
              </CardContent>
            </Card>

            {/* Current Status */}
            <div className="space-y-2">
              <Label>Current Status</Label>
              <Badge className={getStatusColor(listingState || 'Created')}>
                {listingState || 'Loading...'}
              </Badge>
            </div>

            {/* User Status */}
            <div className="space-y-2">
              <Label>Your Role</Label>
              <div className="flex gap-2">
                {isOwner && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    <Crown className="w-3 h-3 mr-1" />
                    Owner
                  </Badge>
                )}
                {isCurrentUserStudent && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <User className="w-3 h-3 mr-1" />
                    Student
                  </Badge>
                )}
                {isCurrentUserEducator && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <GraduationCap className="w-3 h-3 mr-1" />
                    Educator
                  </Badge>
                )}
              </div>
            </div>

            {/* Error Display */}
            {getErrorDisplay()}

            {/* Action Button */}
            {getActionButton()}

            {/* Close Button */}
            <Button variant="outline" onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <RequestModal
        listing={listing}
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
      />
    </>
  )
} 