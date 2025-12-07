
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Users, 
  CheckCircle, 
  DollarSign, 
  ArrowUpDown,
  Loader2,
  AlertCircle,
  Crown,
  Plus,
  User
} from 'lucide-react'
import { useAccount } from 'wagmi'
import { useApplyListing, ListingState } from '@/hooks/use-apply-listing'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'

interface ListingManagementProps {
  listingAddress: string
  creatorAddress: string
}

export function ListingManagement({ listingAddress, creatorAddress }: ListingManagementProps) {
  const { toast } = useToast()
  const [educatorAddress, setEducatorAddress] = useState('')
  const [educatorShares, setEducatorShares] = useState('100')
  const [showAddEducatorForm, setShowAddEducatorForm] = useState(false)
  const [studentAddress, setStudentAddress] = useState('')
  const [showAddStudentForm, setShowAddStudentForm] = useState(false)
  
  // Safety check for required props
  if (!listingAddress || !creatorAddress) {
    console.error('ListingManagement: Missing required props', { listingAddress, creatorAddress })
    return (
      <Card>
        <CardContent>
          <p className="text-muted-foreground">Error: Missing listing information</p>
        </CardContent>
      </Card>
    )
  }
  
  const { 
    listingState,
    postAmount,
    finalizeEducators,
    confirmListing,
    releaseEscrow,
    refundEscrow,
    applyAsEducator,
    applyAsStudent,
    makeDeposit,
    potentialEducators,
    isCurrentUserEducator,
    isCurrentUserStudent,
    address: currentUserAddress,
    isOwner,
    isCreator,
    isFinalizingPending,
    isConfirmingPending,
    isReleasingPending,
    isRefundingPending,
    isDepositingPending,
    isFinalizeConfirmed,
    isConfirmConfirmed,
    isReleaseConfirmed,
    isRefundConfirmed,
    isDepositConfirmed,
    finalizeError,
    confirmError,
    releaseError,
    refundError,
    depositError
  } = useApplyListing(listingAddress, creatorAddress)

  // Debug information
  try {
    console.log('ListingManagement Debug:', {
      listingAddress,
      creatorAddress,
      listingState,
      potentialEducators: potentialEducators ? {
        addresses: potentialEducators[0] || [],
        shares: potentialEducators[1] || []
      } : null,
      isCurrentUserEducator
    })
  } catch (error) {
    console.error('Error in debug logging:', error)
  }



  const handleFinalizeEducators = async () => {
    try {
      await finalizeEducators()
      toast({
        title: "Success",
        description: "Educators finalized successfully! Escrow contract created.",
      })
    } catch (error) {
      console.error('Error finalizing educators:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to finalize educators. Please try again.'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleConfirmListing = async () => {
    try {
      await confirmListing()
    } catch (error) {
      console.error('Error confirming listing:', error)
      toast({
        title: "Error",
        description: "Failed to confirm listing. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleReleaseEscrow = async () => {
    try {
      await releaseEscrow()
    } catch (error) {
      console.error('Error releasing escrow:', error)
      toast({
        title: "Error",
        description: "Failed to release escrow. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRefundEscrow = async () => {
    try {
      await refundEscrow()
    } catch (error) {
      console.error('Error refunding escrow:', error)
      toast({
        title: "Error",
        description: "Failed to refund escrow. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleMakeDeposit = async () => {
    try {
      await makeDeposit()
      toast({
        title: "Success",
        description: "Deposit made successfully!",
      })
    } catch (error) {
      console.error('Error making deposit:', error)
      toast({
        title: "Error",
        description: `Failed to make deposit: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    }
  }

  const handleAddStudent = async (studentAddress: string) => {
    try {
      if (!studentAddress || studentAddress.trim() === '') {
        throw new Error('Please enter a valid student address')
      }
      
      // Safety check for isOwner
      const currentIsOwner = currentUserAddress && creatorAddress && currentUserAddress.toLowerCase() === creatorAddress.toLowerCase()
      
      console.log('Adding student:', {
        studentAddress,
        listingAddress,
        creatorAddress,
        currentIsOwner,
        listingState
      })
      
      await applyAsStudent(studentAddress)
      toast({
        title: "Success",
        description: `Added student ${studentAddress.slice(0, 6)}...${studentAddress.slice(-4)} successfully!`,
      })
      
      // Reset form
      setShowAddStudentForm(false)
      setStudentAddress('')
    } catch (error) {
      console.error('Error adding student:', error)
      toast({
        title: "Error",
        description: `Failed to add student: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    }
  }

  const handleAddSelfAsEducator = async () => {
    try {
      if (!currentUserAddress) {
        throw new Error('No wallet connected')
      }
      
      // Check if already an educator
      if (isCurrentUserEducator) {
        toast({
          title: "Info",
          description: "You are already an educator for this listing.",
        })
        return
      }
      
      console.log('Adding self as educator:', {
        currentUserAddress,
        listingAddress,
        creatorAddress,
        isOwner,
        listingState
      })
      
      await applyAsEducator(currentUserAddress, 100)
      toast({
        title: "Success",
        description: "Added yourself as an educator successfully!",
      })
    } catch (error) {
      console.error('Error adding self as educator:', error)
      toast({
        title: "Error",
        description: `Failed to add yourself as educator: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    }
  }

  const handleAddSelfAsStudent = async () => {
    try {
      if (!currentUserAddress) {
        throw new Error('No wallet connected')
      }
      
      // Check if already a student
      if (isCurrentUserStudent) {
        toast({
          title: "Info",
          description: "You are already a student for this listing.",
        })
        return
      }
      
      console.log('Adding self as student:', {
        currentUserAddress,
        listingAddress,
        creatorAddress,
        isOwner,
        listingState
      })
      
      await applyAsStudent(currentUserAddress)
      toast({
        title: "Success",
        description: "Added yourself as a student successfully!",
      })
    } catch (error) {
      console.error('Error adding self as student:', error)
      toast({
        title: "Error",
        description: `Failed to add yourself as student: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    }
  }

  const handleAddEducator = async (educatorAddress: string, shares: number = 100) => {
    try {
      if (!educatorAddress || educatorAddress.trim() === '') {
        throw new Error('Please enter a valid educator address')
      }
      
      // Safety check for isOwner
      const currentIsOwner = currentUserAddress && creatorAddress && currentUserAddress.toLowerCase() === creatorAddress.toLowerCase()
      
      console.log('Adding educator:', {
        educatorAddress,
        shares,
        listingAddress,
        creatorAddress,
        currentIsOwner,
        listingState
      })
      
      await applyAsEducator(educatorAddress, shares)
      toast({
        title: "Success",
        description: `Added educator ${educatorAddress.slice(0, 6)}...${educatorAddress.slice(-4)} successfully!`,
      })
    } catch (error) {
      console.error('Error adding educator:', error)
      toast({
        title: "Error",
        description: `Failed to add educator: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    }
  }

  const getAvailableActions = () => {
    const actions = []

    // Finalize Educators - only available in AcceptingParticipants state
    if (listingState === 'AcceptingParticipants') {
      actions.push({
        id: 'finalize-educators',
        title: 'Finalize Educators',
        description: 'Lock in the educator roster and create escrow contract',
        action: handleFinalizeEducators,
        icon: <Users className="w-4 h-4" />,
        variant: 'default' as const,
        loading: isFinalizingPending
      })
      
      // Add test button for adding self as educator
      actions.push({
        id: 'add-self-educator',
        title: 'Add Self as Educator (Test)',
        description: 'Test adding yourself as an educator with 100 shares',
        action: handleAddSelfAsEducator,
        icon: <Users className="w-4 h-4" />,
        variant: 'outline' as const,
        loading: false
      })
      
      // Add test button for adding self as student
      actions.push({
        id: 'add-self-student',
        title: 'Add Self as Student (Test)',
        description: 'Test adding yourself as a student',
        action: handleAddSelfAsStudent,
        icon: <User className="w-4 h-4" />,
        variant: 'outline' as const,
        loading: false
      })
      
      // Add button to show educator form
      actions.push({
        id: 'add-educator-form',
        title: 'Add Another Educator',
        description: 'Add a different educator to the listing',
        action: () => setShowAddEducatorForm(!showAddEducatorForm),
        icon: <Plus className="w-4 h-4" />,
        variant: 'outline' as const,
        loading: false
      })
      
      // Add button to show student form
      actions.push({
        id: 'add-student-form',
        title: 'Add Student',
        description: 'Add a student to the listing',
        action: () => setShowAddStudentForm(!showAddStudentForm),
        icon: <User className="w-4 h-4" />,
        variant: 'outline' as const,
        loading: false
      })
    }

    // Confirm Listing - only available in AwaitingConfirm state
    if (listingState === 'AwaitingConfirm') {
      actions.push({
        id: 'confirm-listing',
        title: 'Confirm & Start Lesson',
        description: 'Begin the educational session',
        action: handleConfirmListing,
        icon: <CheckCircle className="w-4 h-4" />,
        variant: 'default' as const,
        loading: isConfirmingPending
      })
    }

    // Student Deposit - only available in AcceptingDeposit state for students
    if (listingState === 'AcceptingDeposit' && isCurrentUserStudent) {
      actions.push({
        id: 'make-deposit',
        title: 'Make Deposit',
        description: `Deposit ${postAmount ? `${Number(postAmount) / 1e18} ETH` : 'payment'} to join the lesson`,
        action: handleMakeDeposit,
        icon: <DollarSign className="w-4 h-4" />,
        variant: 'default' as const,
        loading: isDepositingPending
      })
    }

    // Release/Refund Escrow - only available in InProgress state
    if (listingState === 'InProgress') {
      actions.push(
        {
          id: 'release-escrow',
          title: 'Release to Educators',
          description: 'Release escrow funds to educators',
          action: handleReleaseEscrow,
          icon: <DollarSign className="w-4 h-4" />,
                  variant: 'default' as const,
        loading: isReleasingPending
        },
        {
          id: 'refund-escrow',
          title: 'Refund to Students',
          description: 'Refund escrow funds to students',
          action: handleRefundEscrow,
          icon: <ArrowUpDown className="w-4 h-4" />,
                  variant: 'outline' as const,
        loading: isRefundingPending
        }
      )
    }

    return actions
  }

  const availableActions = getAvailableActions()

  if (availableActions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Owner Actions
          </CardTitle>
          <CardDescription>
            Manage your listing and control the lesson flow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No actions available in current state</p>
            <p className="text-xs">Current state: {listingState}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5" />
          Owner Actions
        </CardTitle>
        <CardDescription>
          Manage your listing and control the lesson flow
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Information */}
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Current Status</h3>
              <p className="text-sm text-muted-foreground">State: {listingState}</p>
              <p className="text-sm text-muted-foreground">
                Potential Educators: {potentialEducators && potentialEducators[0] ? potentialEducators[0].length : 0}
              </p>
              <p className="text-sm text-muted-foreground">
                You are educator: {isCurrentUserEducator ? 'Yes' : 'No'}
              </p>
              {listingState === 'AcceptingDeposit' && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800 font-medium">Waiting for Student Deposits</p>
                  <p className="text-xs text-blue-600">
                    Students need to deposit {postAmount ? `${Number(postAmount) / 1e18} ETH` : 'payment'} to proceed
                  </p>
                </div>
              )}
              {listingState === 'AwaitingConfirm' && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800 font-medium">Ready to Start Lesson</p>
                  <p className="text-xs text-green-600">
                    All deposits received. Click "Confirm & Start Lesson" to begin
                  </p>
                </div>
              )}
            </div>
            <Badge variant="outline">
              {listingState}
            </Badge>
          </div>
        </div>

        {availableActions.map((action) => (
          <div key={action.id} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {action.icon}
                <div>
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </div>
              <Button
                onClick={action.action}
                variant={action.variant}
                disabled={action.loading || isFinalizingPending || isConfirmingPending || isReleasingPending || isRefundingPending || isDepositingPending}
                className="min-w-[120px]"
              >
                {action.loading || isFinalizingPending || isConfirmingPending || isReleasingPending || isRefundingPending || isDepositingPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  action.title
                )}
              </Button>
            </div>
          </div>
        ))}

        {/* Add Educator Form */}
        {showAddEducatorForm && (
          <div className="p-4 border rounded-lg bg-muted/30">
            <h3 className="font-semibold mb-3">Add Educator</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="educator-address">Educator Address</Label>
                <Input
                  id="educator-address"
                  type="text"
                  placeholder="0x..."
                  value={educatorAddress}
                  onChange={(e) => setEducatorAddress(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="educator-shares">Shares (default: 100)</Label>
                <Input
                  id="educator-shares"
                  type="number"
                  placeholder="100"
                  value={educatorShares}
                  onChange={(e) => setEducatorShares(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAddEducator(educatorAddress, parseInt(educatorShares) || 100)}
                  disabled={!educatorAddress.trim()}
                  className="flex-1"
                >
                  Add Educator
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddEducatorForm(false)
                    setEducatorAddress('')
                    setEducatorShares('100')
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add Student Form */}
        {showAddStudentForm && (
          <div className="p-4 border rounded-lg bg-muted/30">
            <h3 className="font-semibold mb-3">Add Student</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="student-address">Student Address</Label>
                <Input
                  id="student-address"
                  type="text"
                  placeholder="0x..."
                  value={studentAddress}
                  onChange={(e) => setStudentAddress(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAddStudent(studentAddress)}
                  disabled={!studentAddress.trim()}
                  className="flex-1"
                >
                  Add Student
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddStudentForm(false)
                    setStudentAddress('')
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {(finalizeError || confirmError || releaseError || refundError) && (
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Transaction Error</span>
            </div>
            <p className="text-sm text-red-600 mt-1">
              {(finalizeError || confirmError || releaseError || refundError)?.message || 'An error occurred while processing the transaction'}
            </p>
          </div>
        )}

        {/* Success Messages */}
        {isFinalizeConfirmed && (
          <div className="p-4 border border-green-200 rounded-lg bg-green-50">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Educators Finalized</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Educators have been finalized successfully! The listing is now ready to accept deposits.
            </p>
          </div>
        )}

        {isConfirmConfirmed && (
          <div className="p-4 border border-green-200 rounded-lg bg-green-50">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Listing Confirmed</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Listing confirmed! The lesson is now in progress.
            </p>
          </div>
        )}

        {isReleaseConfirmed && (
          <div className="p-4 border border-green-200 rounded-lg bg-green-50">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Escrow Released</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Escrow released to educators successfully!
            </p>
          </div>
        )}

        {isRefundConfirmed && (
          <div className="p-4 border border-green-200 rounded-lg bg-green-50">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Escrow Refunded</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Escrow refunded to students successfully!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 