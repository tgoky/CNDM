import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  User, 
  GraduationCap, 
  Send,
  Loader2, 
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react'
import { useRequests, StudentRequest, EducatorRequest } from '@/hooks/use-requests'

interface RequestModalProps {
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

export function RequestModal({ listing, isOpen, onClose }: RequestModalProps) {
  const { address } = useAccount()
  const [requestType, setRequestType] = useState<'student' | 'educator'>('student')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [shares, setShares] = useState('100')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  const { submitStudentRequest, submitEducatorRequest } = useRequests()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!address) {
      alert('Please connect your wallet first')
      return
    }

    if (!name.trim()) {
      alert('Please enter your name')
      return
    }

    setIsSubmitting(true)
    try {
      if (requestType === 'student') {
        await submitStudentRequest(listing.address, name.trim(), message.trim())
      } else {
        await submitEducatorRequest(listing.address, name.trim(), parseInt(shares), message.trim())
      }
      setIsSubmitted(true)
    } catch (error) {
      console.error('Error submitting request:', error)
      alert('Failed to submit request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitted) {
      // Reset form when closing after successful submission
      setName('')
      setMessage('')
      setShares('100')
      setRequestType('student')
      setIsSubmitted(false)
    }
    onClose()
  }

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Submitted</DialogTitle>
            <DialogDescription>
              Your request has been sent to the listing owner
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <h3 className="font-semibold text-green-700">Request Submitted Successfully!</h3>
                <p className="text-sm text-green-600">
                  The listing owner will review your request and get back to you.
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-700 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• The listing owner will review your request</li>
                <li>• You'll be notified when they approve or reject it</li>
                <li>• If approved, you can participate in the lesson</li>
              </ul>
            </div>

            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request to Join</DialogTitle>
          <DialogDescription>
            Submit a request to join this educational opportunity
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Request Type */}
          <div className="space-y-2">
            <Label>I want to join as</Label>
            <Select value={requestType} onValueChange={(value: 'student' | 'educator') => setRequestType(value)}>
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

          {/* Name */}
          <div className="space-y-2">
            <Label>Your Name *</Label>
            <Input
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Shares (for educators) */}
          {requestType === 'educator' && (
            <div className="space-y-2">
              <Label>Payment Shares</Label>
              <Input
                type="number"
                placeholder="100"
                min="1"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Your share of the payment (default: 100)
              </p>
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label>Message (Optional)</Label>
            <Textarea
              placeholder={`Tell the listing owner why you want to join as a ${requestType}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Explain your background, experience, or motivation for joining this lesson
            </p>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isSubmitting || !name.trim()}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>

          {/* Cancel Button */}
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            className="w-full"
          >
            Cancel
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
} 