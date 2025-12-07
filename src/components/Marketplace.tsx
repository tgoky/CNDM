import { useState } from 'react'
import { ListingCard } from './ListingCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  SlidersHorizontal,
  BookOpen,
  Code,
  Palette,
  TrendingUp,
  Globe,
  Music,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useListings } from '@/hooks/use-listings'
import { areContractsConfigured } from '@/lib/contract-addresses'

const subjects = [
  { id: 'programming', name: 'Programming', icon: Code },
  { id: 'blockchain', name: 'Blockchain', icon: Globe },
  { id: 'design', name: 'Design', icon: Palette },
  { id: 'marketing', name: 'Marketing', icon: TrendingUp },
  { id: 'music', name: 'Music', icon: Music },
  { id: 'business', name: 'Business', icon: BookOpen },
]

export function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [statusFilter, setStatusFilter] = useState('all')

  // Use the listings hook to fetch real data
  const { listings, isLoading, error, refetch } = useListings()

  // Debug information
  console.log('Marketplace Debug:', {
    listingsCount: listings.length,
    isLoading,
    error,
    contractsConfigured: areContractsConfigured(),
    listings: listings.slice(0, 2) // Show first 2 listings for debugging
  })

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.topic.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSubject = selectedSubject === 'all' || 
                          listing.subject.toLowerCase() === selectedSubject
    
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter

    return matchesSearch && matchesSubject && matchesStatus
  })

  const handleApply = (listingId: string) => {
    console.log('Applying to listing:', listingId)
    // In a real app, this would open an application modal
  }

  const handleView = (listingId: string) => {
    console.log('Viewing listing:', listingId)
    // In a real app, this would navigate to the listing detail page
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <CardContent>
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error loading listings</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refetch} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!areContractsConfigured()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <CardContent>
            <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Contracts Not Configured</h3>
            <p className="text-muted-foreground mb-4">
              Some contract addresses are not configured. Please update the contract addresses in src/lib/contract-addresses.ts
            </p>
            <p className="text-sm text-muted-foreground">
              This will prevent real listings from loading. Mock data may be shown instead.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          Education Marketplace
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover personalized learning opportunities or find students to teach. 
          Connect with educators and learners in the decentralized education ecosystem.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search listings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="reputation">Reputation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject Categories */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant={selectedSubject === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedSubject('all')}
        >
          All Subjects
        </Button>
        {subjects.map(subject => {
          const Icon = subject.icon
          return (
            <Button
              key={subject.id}
              variant={selectedSubject === subject.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSubject(subject.id)}
              className="flex items-center gap-2"
            >
              <Icon className="w-4 h-4" />
              {subject.name}
            </Button>
          )
        })}
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {isLoading ? 'Loading listings...' : `${filteredListings.length} Listings Found`}
          </h2>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {isLoading ? 'Loading...' : `Showing ${filteredListings.length} of ${listings.length} listings`}
            </span>
          </div>
        </div>

        {isLoading ? (
          <Card className="p-8 text-center">
            <CardContent>
              <Loader2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold mb-2">Loading listings</h3>
              <p className="text-muted-foreground">
                Fetching the latest educational opportunities from the blockchain...
              </p>
            </CardContent>
          </Card>
        ) : filteredListings.length === 0 ? (
          <Card className="p-8 text-center">
            <CardContent>
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No listings found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search terms to find more results.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onApply={handleApply}
                onView={handleView}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}