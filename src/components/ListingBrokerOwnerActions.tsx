import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Info, Users, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

interface ListingBrokerOwnerActionsProps {
  listingAddress: string
  creatorAddress: string
}

export function ListingBrokerOwnerActions({ 
  listingAddress, 
  creatorAddress 
}: ListingBrokerOwnerActionsProps) {
  const { address } = useAccount()
  
  const isOwner = address && creatorAddress && address.toLowerCase() === creatorAddress.toLowerCase()
  
  if (!isOwner) {
    return null
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Owner Actions
        </CardTitle>
        <CardDescription>
          Manage your listing and participants
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">
                How ListingBroker works:
              </p>
              <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                <li>Your listing is active and accepting applications</li>
                <li>Educators/students can apply to your listing</li>
                <li>Review applications in the <strong>Requests</strong> section below</li>
                <li>Accept applications to finalize participants</li>
                <li>Payment is collected when you accept an application</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            As the listing owner, you can:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-inside list-disc">
            <li>View and respond to applications</li>
            <li>Accept or reject applicants</li>
            <li>Set the final agreed payment amount</li>
            <li>Manage your listing details</li>
          </ul>
        </div>
        
        <Button 
          asChild 
          className="w-full"
          variant="outline"
        >
          <Link to={`/listing/${listingAddress}`}>
            <Plus className="w-4 h-4 mr-2" />
            View Full Listing Details
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

