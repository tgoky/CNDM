import { useState } from 'react'
import { useAccount } from 'wagmi'
import { CONTRACTS } from '@/lib/web3'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Star, 
  BookOpen, 
  MessageSquare,
  TrendingUp,
  Award,
  Calendar,
  DollarSign,
  TestTube
} from 'lucide-react'
import { WalletButton } from '@/components/WalletButton'
import { ProfileForm } from '@/components/ProfileForm'
import { useProfile } from '@/hooks/use-profile'

const Profile = () => {
  const { address, isConnected } = useAccount()
  const { profileData, hasProfile } = useProfile()
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Mock data for demonstration
  const mockProfileData = {
    displayName: profileData?.displayName || 'Alex Chen',
    bio: profileData?.bio || 'Passionate full-stack developer with 5+ years of experience in React, Node.js, and blockchain development. Love teaching and sharing knowledge with the community.',
    isEducator: true,
    expertise: ['React', 'Node.js', 'Blockchain', 'TypeScript', 'Web3']
  }

  const stats = [
    { label: 'Reputation Score', value: '4.9', icon: Star, color: 'text-warning' },
    { label: 'Completed Lessons', value: '47', icon: BookOpen, color: 'text-primary' },
    { label: 'Total Earnings', value: '2,340', icon: DollarSign, color: 'text-success' },
    { label: 'Active Listings', value: '8', icon: TrendingUp, color: 'text-accent' },
  ]

  const recentReviews = [
    {
      id: 1,
      reviewer: 'Sarah Kim',
      rating: 5,
      comment: 'Excellent teacher! Explained React concepts very clearly and provided great examples.',
      date: '2 days ago',
      course: 'Advanced React Patterns'
    },
    {
      id: 2,
      reviewer: 'Jordan Taylor',
      rating: 5,
      comment: 'Very knowledgeable about Web3 development. Helped me understand smart contracts.',
      date: '1 week ago',
      course: 'Web3 Development Basics'
    },
    {
      id: 3,
      reviewer: 'Maria Rodriguez',
      rating: 4,
      comment: 'Good session on TypeScript. Would recommend for intermediate developers.',
      date: '2 weeks ago',
      course: 'TypeScript Best Practices'
    }
  ]

  const handleProfileSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
            <CardDescription>
              You need to connect your wallet to view your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WalletButton className="mx-auto" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile information and view your reputation on the platform
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          <ProfileForm onSuccess={handleProfileSuccess} />
          
          {/* Profile Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Display
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarFallback className="text-2xl bg-primary/10">
                    {mockProfileData.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm text-muted-foreground">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="font-medium">{mockProfileData.displayName}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{mockProfileData.bio}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {mockProfileData.expertise.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={mockProfileData.isEducator ? "default" : "secondary"}>
                    {mockProfileData.isEducator ? "Educator" : "Student"}
                  </Badge>
                  {mockProfileData.isEducator && (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                      <Award className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="text-center">
                  <CardContent className="p-4">
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="reviews" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="reviews">Reviews & Ratings</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              <TabsTrigger value="earnings">Earnings History</TabsTrigger>
              <TabsTrigger value="contracts">Contract Test</TabsTrigger>
            </TabsList>

            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Reviews & Ratings
                  </CardTitle>
                  <CardDescription>
                    See what others are saying about your teaching
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Rating Summary */}
                    <div className="flex items-center gap-6 p-6 bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-warning">4.9</div>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="w-4 h-4 text-warning fill-warning" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Average Rating</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-2xl font-bold">{recentReviews.length} Reviews</p>
                        <p className="text-muted-foreground">From completed lessons</p>
                      </div>
                    </div>

                    {/* Individual Reviews */}
                    <div className="space-y-4">
                      {recentReviews.map((review) => (
                        <div key={review.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium">{review.reviewer}</p>
                              <p className="text-sm text-muted-foreground">{review.course}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    className={`w-3 h-3 ${
                                      star <= review.rating 
                                        ? 'text-warning fill-warning' 
                                        : 'text-muted-foreground'
                                    }`} 
                                  />
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground">{review.date}</p>
                            </div>
                          </div>
                          <p className="text-sm">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Recent activity will be displayed here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="earnings">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Earnings History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Earnings history will be displayed here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contracts">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="w-5 h-5" />
                    Smart Contract Test
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Contract Status */}
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h3 className="font-semibold mb-2">Contract Status</h3>
                      <p className="text-sm text-muted-foreground">
                        Contract addresses: {Object.values(CONTRACTS).every(addr => addr && addr !== '0x...') ? 'Configured' : 'Not configured'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Wallet connected: {isConnected ? 'Yes' : 'No'}
                      </p>
                    </div>

                    {/* Simple Test Buttons */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Quick Tests</h3>
                        <div className="space-y-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              console.log('Contract addresses:', CONTRACTS)
                              console.log('Wallet address:', address)
                              alert('Check browser console for contract info')
                            }}
                          >
                            Log Contract Info
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              if (typeof window !== 'undefined' && window.ethereum) {
                                alert('MetaMask is available!')
                              } else {
                                alert('MetaMask not detected')
                              }
                            }}
                          >
                            Check MetaMask
                          </Button>
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold mb-2">How to Test</h3>
                        <ol className="text-sm space-y-1">
                          <li>1. Deploy your contracts to local Hardhat node</li>
                          <li>2. Update addresses in src/lib/contract-addresses.ts</li>
                          <li>3. Connect your wallet</li>
                          <li>4. Use browser console to test contract calls</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default Profile