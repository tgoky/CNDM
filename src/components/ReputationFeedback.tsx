import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Star, StarFilled } from 'lucide-react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESSES } from '@/lib/contract-addresses'

interface Participant {
  address: string
  displayName: string
  role: 'educator' | 'student' | 'creator'
}

interface ReputationFeedbackProps {
  listingAddress: string
  participants: Participant[]
  currentUserAddress: string
  isSessionCompleted: boolean
}

export function ReputationFeedback({ 
  listingAddress, 
  participants, 
  currentUserAddress,
  isSessionCompleted 
}: ReputationFeedbackProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [submittedFeedback, setSubmittedFeedback] = useState<string[]>([])

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Filter out current user from participants to rate
  const participantsToRate = participants.filter(p => p.address !== currentUserAddress)

  const handleRatingChange = (participantAddress: string, rating: number) => {
    setRatings(prev => ({
      ...prev,
      [participantAddress]: rating
    }))
  }

  const handleCommentChange = (participantAddress: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      [participantAddress]: comment
    }))
  }

  const submitFeedback = async (participantAddress: string, participantRole: string) => {
    const rating = ratings[participantAddress] || 0
    const comment = comments[participantAddress] || ''

    if (rating === 0) {
      alert('Please provide a rating before submitting feedback')
      return
    }

    try {
      // Determine which function to call based on the participant's role
      const isEducatorRating = participantRole === 'educator'
      const functionName = isEducatorRating ? 'rateEducator' : 'rateStudent'
      
      // Create lessonId from listingAddress (you might need to adjust this based on your data structure)
      const lessonId = listingAddress as `0x${string}`
      
      await writeContract({
        address: CONTRACT_ADDRESSES.DEDReputation as `0x${string}`,
        abi: [
          {
            "inputs": [
              { "internalType": "bytes32", "name": "lessonId", "type": "bytes32" },
              { "internalType": "address", "name": isEducatorRating ? "educator" : "student", "type": "address" },
              { "internalType": "uint8", "name": "score", "type": "uint8" }
            ],
            "name": functionName,
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: functionName,
        args: [lessonId, participantAddress as `0x${string}`, rating]
      })

      setSubmittedFeedback(prev => [...prev, participantAddress])
    } catch (error) {
      console.error('Error submitting reputation:', error)
      alert('Failed to submit reputation feedback')
    }
  }

  const renderStars = (participantAddress: string) => {
    const currentRating = ratings[participantAddress] || 0
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRatingChange(participantAddress, star)}
            className="text-yellow-400 hover:text-yellow-500 transition-colors"
          >
            {star <= currentRating ? (
              <StarFilled className="w-5 h-5" />
            ) : (
              <Star className="w-5 h-5" />
            )}
          </button>
        ))}
      </div>
    )
  }

  if (!isSessionCompleted) {
    return (
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">Session Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700">
            Reputation feedback will be available after the session is completed.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (participantsToRate.length === 0) {
    return (
      <Card className="bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">Session Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700">
            No other participants to provide feedback for.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Session Feedback
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Rate your fellow participants and provide feedback on the learning session.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {participantsToRate.map((participant) => {
          const hasSubmitted = submittedFeedback.includes(participant.address)
          const currentRating = ratings[participant.address] || 0
          const currentComment = comments[participant.address] || ''

          return (
            <div key={participant.address} className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>
                    {participant.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-medium">{participant.displayName}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {participant.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {participant.address.slice(0, 6)}...{participant.address.slice(-4)}
                    </span>
                  </div>
                </div>
              </div>

              {hasSubmitted ? (
                <div className="p-3 bg-green-100 border border-green-300 rounded text-green-800">
                  <strong>✅ Feedback submitted!</strong>
                  <div className="mt-1">
                    Rating: {currentRating}/5 stars
                    {currentComment && (
                      <div className="mt-1">
                        Comment: "{currentComment}"
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Rating:</label>
                    {renderStars(participant.address)}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Comment (optional):</label>
                    <textarea
                      value={currentComment}
                      onChange={(e) => handleCommentChange(participant.address, e.target.value)}
                      placeholder="Share your experience with this participant..."
                      className="w-full p-2 border rounded-md text-sm"
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={() => submitFeedback(participant.address, participant.role)}
                    disabled={isPending || isConfirming || currentRating === 0}
                    className="w-full"
                  >
                    {isPending || isConfirming ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </div>
              )}
            </div>
          )
        })}

        {submittedFeedback.length === participantsToRate.length && (
          <div className="p-4 bg-green-100 border border-green-300 rounded text-green-800">
            <strong>🎉 All feedback submitted!</strong>
            <p className="mt-1 text-sm">
              Thank you for providing feedback. This helps build a better learning community.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 