import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Clock, 
  Users, 
  BookOpen, 
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

interface EndSessionModalProps {
  isOpen: boolean
  onClose: () => void
  listingAddress: string
  creatorAddress: string
  currentUserAddress: string
  sessionData: {
    subject: string
    topic: string
    participants: Array<{
      address: string
      name: string
      role: string
    }>
    state: string
  }
}

export function EndSessionModal({ 
  isOpen, 
  onClose, 
  listingAddress, 
  creatorAddress,
  currentUserAddress,
  sessionData 
}: EndSessionModalProps) {
  const [isEnding, setIsEnding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const isCreator = currentUserAddress && creatorAddress && 
    currentUserAddress.toLowerCase() === creatorAddress.toLowerCase()

  const canEndSession = isCreator && sessionData.state === 'InProgress'

  const endSession = async () => {
    if (!canEndSession) return

    setError(null)
    setIsEnding(true)

    try {
      // Call releaseEscrow to end the session and release funds
      await writeContract({
        address: listingAddress as `0x${string}`,
        abi: [
          {
            "inputs": [],
            "name": "releaseEscrow",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: 'releaseEscrow',
      })
    } catch (err: any) {
      console.error('Error ending session:', err)
      setError(err.message || 'Failed to end session')
      setIsEnding(false)
    }
  }

  // Handle successful transaction
  if (isSuccess && !isEnding) {
    setIsEnding(false)
    // Close modal and trigger reputation feedback
    setTimeout(() => {
      onClose()
    }, 2000)
  }

  const participantCount = sessionData.participants.length
  const educators = sessionData.participants.filter(p => p.role === 'educator').length
  const students = sessionData.participants.filter(p => p.role === 'student').length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5" />
          <h2 className="text-lg font-semibold">End Learning Session</h2>
        </div>
        
        <p className="text-gray-600 mb-4">
          End the current learning session and release funds to educators. This action cannot be undone.
        </p>

        <div className="space-y-4">
          {/* Session Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{sessionData.subject}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{sessionData.topic}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{participantCount} participants</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    {educators} educators
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {students} students
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What happens when you end the session */}
          <Card className="bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-800 text-base">What happens when you end the session?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-blue-700">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Funds are released to educators via PaymentSplitter</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Listing state changes from "InProgress" to "Released"</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Reputation feedback becomes available for all participants</span>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Session cannot be resumed once ended</span>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {isSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Session ended successfully! Funds have been released to educators.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isPending || isConfirming}
            className="flex-1"
          >
            Cancel
          </Button>
          
          <Button 
            onClick={endSession}
            disabled={!canEndSession || isPending || isConfirming}
            className="bg-red-600 hover:bg-red-700 flex-1"
          >
            {isPending || isConfirming ? 'Ending Session...' : 'End Session'}
          </Button>
        </div>
      </div>
    </div>
  )
} 