import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  User, 
  GraduationCap, 
  DollarSign, 
  Calendar,
  MapPin,
  Clock,
  Users,
  BookOpen,
  Target,
  Star
} from 'lucide-react'
import { ApplyModal } from './ApplyModal'
import { ListingBrokerApplyModal } from './ListingBrokerApplyModal'
import { RequestsManager } from './RequestsManager'
import { ListingBrokerRequests } from './ListingBrokerRequests'
import { ListingManagement } from './ListingManagement'
import { ListingBrokerOwnerActions } from './ListingBrokerOwnerActions'
import { DEDListingIntegration } from './DEDListingIntegration'
import { useApplyListing, ListingState } from '@/hooks/use-apply-listing'
import { useListingBrokerDetails } from '@/hooks/use-listing-broker-details'

interface ListingDetailProps {
  listing: {
    id: string
    address: string
    title: string
    subject: string
    topic: string
    description: string
    objectives: string
    tokenAmount: string
    creator: {
      address: string
      displayName: string
      reputation: number
      isEducator: boolean
    }
    applicationsCount: number
    createdAt: string
  }
  onApply: () => void
  onBack: () => void
}

export function ListingDetail({ listing, onApply, onBack }: ListingDetailProps) {
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const { 
    listingState, 
    isOwner, 
    address: currentUserAddress
  } = useApplyListing(listing.address, listing.creator.address)
  
  // Get ListingBroker details for DEDListing integration
  const { listingDetails } = useListingBrokerDetails(listing.address, listing.creator.address)

  // Debug information
  console.log('ListingDetail Debug:', {
    listingAddress: listing.address,
    creatorAddress: listing.creator.address,
    currentUserAddress,
    isOwner,
    calculatedIsOwner: currentUserAddress && listing.creator.address && currentUserAddress.toLowerCase() === listing.creator.address.toLowerCase()
  })

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

  const getStatusText = (state: ListingState) => {
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
        return 'Released'
      case 'Refunded':
        return 'Refunded'
      default:
        return 'Unknown'
    }
  }

  // For ListingBroker listings, always allow applying for non-owners
  // For DEDListing contracts, check the listing state
  const isListingBroker = listing.tokenAmount && listing.tokenAmount.includes('DED')
  
  // Calculate if current user is the owner
  const calculatedIsOwner = currentUserAddress && listing.creator.address && currentUserAddress.toLowerCase() === listing.creator.address.toLowerCase()
  
  // Allow applying if:
  // 1. It's a ListingBroker listing AND user is not the owner
  // 2. It's a DEDListing with AcceptingParticipants/AcceptingDeposit state
  const canApply = isListingBroker 
    ? !calculatedIsOwner 
    : (listingState === 'AcceptingParticipants' || listingState === 'AcceptingDeposit')

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{listing.title}</h1>
          <p className="text-muted-foreground">{listing.subject} • {listing.topic}</p>
        </div>
        <Badge className={getStatusColor(listingState || 'Created')}>
          {getStatusText(listingState || 'Created')}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Listing Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Lesson Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Learning Objectives
                </h3>
                <p className="text-muted-foreground">{listing.objectives}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Cost</p>
                    <p className="text-sm text-muted-foreground">{listing.tokenAmount} DED</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Applications</p>
                    <p className="text-sm text-muted-foreground">{listing.applicationsCount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm text-muted-foreground">
                      {getStatusText(listingState || 'Created')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Creator Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Creator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback>
                    {listing.creator.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{listing.creator.displayName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {listing.creator.isEducator ? 'Educator' : 'Student'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      Reputation: {listing.creator.reputation}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {listing.creator.address.slice(0, 6)}...{listing.creator.address.slice(-4)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              {canApply && (
                <Button 
                  onClick={() => setIsApplyModalOpen(true)}
                  className="w-full"
                >
                  {(currentUserAddress && listing.creator.address && currentUserAddress.toLowerCase() === listing.creator.address.toLowerCase()) ? 'Manage Listing' : 'Apply to Join'}
                </Button>
              )}
              {!canApply && (
                <div className="text-center text-muted-foreground py-4">
                  <p className="text-sm">No actions available</p>
                  <p className="text-xs">This listing is not accepting applications</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ListingBroker Owner Actions (for ListingBroker listings) */}
          {(() => {
            // Use existing isOwner from useApplyListing hook
            const ownerCheck = currentUserAddress && listing.creator.address && currentUserAddress.toLowerCase() === listing.creator.address.toLowerCase()
            
            if (ownerCheck && isListingBroker) {
              return (
                <ListingBrokerOwnerActions 
                  listingAddress={listing.address}
                  creatorAddress={listing.creator.address}
                />
              )
            }
            
            // For DEDListing contracts, show standard ListingManagement
            if (ownerCheck && !isListingBroker) {
              return (
                <ListingManagement 
                  listingAddress={listing.address}
                  creatorAddress={listing.creator.address}
                />
              )
            }
            
            return null
          })()}

          {/* Requests Manager (for owners) - ListingBroker version */}
          {(currentUserAddress && listing.creator.address && currentUserAddress.toLowerCase() === listing.creator.address.toLowerCase()) && (
            <ListingBrokerRequests 
              listingAddress={listing.address}
            />
          )}
          
          {/* DEDListing Integration (for finalized listings) */}
          {listingDetails && !listingDetails.isActive && listingDetails.selectedApplicant && (
            <DEDListingIntegration
              listingAddress={listing.address}
              creatorAddress={listing.creator.address}
              subject={listingDetails.subject}
              topic={listingDetails.topic}
              objectives={listingDetails.objectives}
              tokenAmount={listing.tokenAmount}
              selectedApplicant={listingDetails.selectedApplicant}
            />
          )}
        </div>
      </div>

      {/* Use ListingBrokerApplyModal for ListingBroker listings, ApplyModal for DEDListing */}
      {isListingBroker ? (
        <ListingBrokerApplyModal 
          listing={listing}
          isOpen={isApplyModalOpen} 
          onClose={() => setIsApplyModalOpen(false)} 
        />
      ) : (
        <ApplyModal 
          listing={listing} 
          isOpen={isApplyModalOpen} 
          onClose={() => setIsApplyModalOpen(false)} 
        />
      )}
    </div>
  )
} 