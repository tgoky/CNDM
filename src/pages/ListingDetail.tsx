import { useParams, Navigate } from 'react-router-dom'
import { ListingDetail } from '@/components/ListingDetail'
import { useListings } from '@/hooks/use-listings'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

const ListingDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { listings, isLoading, error } = useListings()

  // Find the listing by ID
  const listing = listings.find(l => l.id === id)

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <CardContent>
            <Loader2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold mb-2">Loading listing details</h3>
            <p className="text-muted-foreground">
              Fetching listing information from the blockchain...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <CardContent>
            <h3 className="text-lg font-semibold mb-2">Error loading listing</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!listing) {
    return <Navigate to="/marketplace" replace />
  }

  const handleApply = (listingId: string) => {
    console.log('Applying to listing:', listingId)
    // In a real app, this would open an application modal
  }

  const handleBack = () => {
    // Navigation is handled by the Link component in ListingDetail
  }

  return (
    <ListingDetail
      listing={listing}
      onApply={handleApply}
      onBack={handleBack}
    />
  )
}

export default ListingDetailPage 