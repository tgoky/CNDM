import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Star, 
  Clock, 
  DollarSign, 
  User, 
  BookOpen,
  MessageSquare 
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ApplyModal } from './ApplyModal'
import { useApplyListing, ListingState } from '@/hooks/use-apply-listing'

interface ListingCardProps {
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
    applicationsCount: number
    createdAt: string
    status: 'open' | 'in-progress' | 'completed'
  }
  onApply?: (listingId: string) => void
  onView?: (listingId: string) => void
}

export function ListingCard({ listing, onApply, onView }: ListingCardProps) {
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  
  // Get real listing state from blockchain
  const { listingState } = useApplyListing(listing.address, listing.creator.address)

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getStatusColor = (state: ListingState | string) => {
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
      case 'open':
        return 'bg-success/10 text-success border-success/30'
      case 'in-progress':
        return 'bg-warning/10 text-warning border-warning/30'
      case 'completed':
        return 'bg-muted/10 text-muted-foreground border-muted/30'
      default:
        return 'bg-primary/10 text-primary border-primary/30'
    }
  }

  const getStatusText = (state: ListingState | string) => {
    switch (state) {
      case 'Created':
        return 'Created'
      case 'AcceptingParticipants':
        return 'Accepting Participants'
      case 'AcceptingDeposit':
        return 'Accepting Deposits'
      case 'AwaitingConfirm':
        return 'Awaiting Confirmation'
      case 'InProgress':
        return 'In Progress'
      case 'Released':
        return 'Completed'
      case 'Refunded':
        return 'Refunded'
      case 'open':
        return 'Open'
      case 'in-progress':
        return 'In Progress'
      case 'completed':
        return 'Completed'
      default:
        return 'Unknown'
    }
  }

  const canApply = listingState === 'AcceptingParticipants' || listingState === 'AcceptingDeposit' || listingState === 'AwaitingConfirm'

  return (
    <>
      <Card className="hover:shadow-card transition-all duration-200 hover:scale-[1.02] bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {listing.subject}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getStatusColor(listingState || listing.status)}`}
                >
                  {getStatusText(listingState || listing.status)}
                </Badge>
              </div>
              <CardTitle className="text-lg line-clamp-2 mb-1">
                {listing.title}
              </CardTitle>
              <CardDescription className="text-sm font-medium text-primary">
                {listing.topic}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <DollarSign className="w-4 h-4 text-success" />
              <span className="font-bold text-success">{listing.tokenAmount}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {listing.description}
          </p>

          {/* Creator Info */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs bg-primary/10">
                  {listing.creator.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {listing.creator.displayName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatAddress(listing.creator.address)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-warning fill-warning" />
              <span className="text-xs font-medium">{listing.creator.reputation}</span>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                <span>{listing.applicationsCount} applications</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{listing.createdAt}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{listing.creator.isEducator ? 'Educator' : 'Student'}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0 flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            asChild
          >
            <Link to={`/listing/${listing.id}`}>
              <BookOpen className="w-4 h-4 mr-2" />
              View Details
            </Link>
          </Button>
          {canApply && (
            <Button 
              variant="web3" 
              size="sm" 
              className="flex-1"
              onClick={() => setIsApplyModalOpen(true)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {listingState === 'AcceptingParticipants' ? 'Apply' : 
               listingState === 'AcceptingDeposit' ? 'Deposit' :
               listingState === 'AwaitingConfirm' ? 'Confirm' : 'Action'}
            </Button>
          )}
        </CardFooter>
      </Card>

      <ApplyModal
        listing={listing}
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
      />
    </>
  )
}