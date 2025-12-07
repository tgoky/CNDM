import { useAccount } from 'wagmi'
import { TokenBalance } from './TokenBalance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import heroImage from '@/assets/hero-education.jpg'
import {
  BookOpen,
  Users,
  TrendingUp,
  Plus,
  Star,
  Clock,
  DollarSign,
  Award,
  ArrowRight,
  CheckCircle2,
  Activity,
  Shield
} from 'lucide-react'
import { useListings } from '@/hooks/use-listings'
import { ListingCard } from './ListingCard'

export function Dashboard() {
  const { isConnected } = useAccount()
  const { listings, isLoading } = useListings()

  // Get featured listings (first 3)
  const featuredListings = listings.slice(0, 3)

  const stats = [
    { 
      label: 'ACTIVE LISTINGS', 
      value: '12', 
      icon: BookOpen,
      change: '+3',
      changeType: 'increase',
      subtitle: 'from last week'
    },
    { 
      label: 'APPLICATIONS', 
      value: '8', 
      icon: Users,
      change: '+2',
      changeType: 'increase',
      subtitle: 'pending review'
    },
    { 
      label: 'COMPLETED', 
      value: '24', 
      icon: Award,
      change: '+4',
      changeType: 'increase',
      subtitle: 'this month'
    },
    { 
      label: 'REPUTATION', 
      value: '4.8', 
      icon: Star,
      change: '+0.2',
      changeType: 'increase',
      subtitle: 'average rating'
    },
  ]

  const recentActivity = [
    {
      id: 1,
      type: 'application',
      title: 'New application for "Advanced React Patterns"',
      subtitle: 'Review pending',
      time: '2 hours ago',
      status: 'pending',
      icon: Users
    },
    {
      id: 2,
      type: 'payment',
      title: 'Payment received for "Web3 Development"',
      subtitle: '250 DED tokens',
      time: '5 hours ago',
      status: 'completed',
      icon: DollarSign
    },
    {
      id: 3,
      type: 'review',
      title: 'New 5-star review from @alice.eth',
      subtitle: 'Excellent teaching skills',
      time: '1 day ago',
      status: 'completed',
      icon: Star
    },
    {
      id: 4,
      type: 'session',
      title: 'Completed session: "Python Basics"',
      subtitle: 'Session duration: 2 hours',
      time: '2 days ago',
      status: 'completed',
      icon: CheckCircle2
    }
  ]

  if (!isConnected) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-full text-xs font-semibold mb-6 border border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5" />
                Decentralized Education Platform
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
                Learn, Teach, and Earn
                <br />
                <span className="text-slate-600 dark:text-slate-400">on Web3</span>
              </h1>
              
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
                Connect your wallet to access a trusted marketplace where students and educators meet, powered by blockchain technology.
              </p>

              <div className="flex items-center justify-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white" />
                  <span>10,000+ Active Users</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white" />
                  <span>5,000+ Sessions Completed</span>
                </div>
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-6 mx-auto border border-slate-200 dark:border-slate-800">
                    <BookOpen className="w-7 h-7 text-slate-900 dark:text-white" />
                  </div>
                  <h3 className="text-xs font-semibold mb-3 text-slate-900 dark:text-white uppercase tracking-wider">
                    Create Listings
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Post learning requests or offer teaching services. All listings are verified on the blockchain.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-6 mx-auto border border-slate-200 dark:border-slate-800">
                    <Shield className="w-7 h-7 text-slate-900 dark:text-white" />
                  </div>
                  <h3 className="text-xs font-semibold mb-3 text-slate-900 dark:text-white uppercase tracking-wider">
                    Secure Payments
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Smart contract escrow ensures safe transactions. Payments are released only after completion.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all">
                <CardContent className="p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-6 mx-auto border border-slate-200 dark:border-slate-800">
                    <Star className="w-7 h-7 text-slate-900 dark:text-white" />
                  </div>
                  <h3 className="text-xs font-semibold mb-3 text-slate-900 dark:text-white uppercase tracking-wider">
                    Build Reputation
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Earn ratings and reviews that are permanently stored on the blockchain.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* CTA Section */}
            <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="relative">
                <div 
                  className="absolute inset-0 opacity-5 dark:opacity-[0.02]"
                  style={{
                    backgroundImage: `url(${heroImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
                <div className="relative bg-slate-900 dark:bg-slate-950 text-white p-12 text-center border border-slate-800">
                  <h2 className="text-2xl md:text-3xl font-bold mb-3 uppercase tracking-wide">
                    Ready to Get Started?
                  </h2>
                  <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                    Connect your wallet to unlock all features and join the decentralized education revolution.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span className="text-sm font-medium">No Registration Fees</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span className="text-sm font-medium">Instant Verification</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const handleApply = (listingId: string) => {
    console.log('Applying to listing:', listingId)
  }

  const handleView = (listingId: string) => {
    console.log('Viewing listing:', listingId)
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight uppercase" style={{ letterSpacing: '0.08em' }}>
              Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm" style={{ letterSpacing: '0.02em' }}>
              Welcome back! Here's your activity overview
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild className="uppercase text-xs font-semibold" style={{ letterSpacing: '0.1em' }}>
              <Link to="/marketplace">
                <BookOpen className="w-4 h-4 mr-2" />
                Browse
              </Link>
            </Button>
            <Button asChild className="uppercase text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900" style={{ letterSpacing: '0.1em' }}>
              <Link to="/create">
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Link>
            </Button>
          </div>
        </div>

        {/* Token Balance */}
        <TokenBalance />

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card 
                key={stat.label} 
                className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all group"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-slate-800 transition-colors">
                      <Icon className="w-5 h-5 text-slate-900 dark:text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">{stat.change}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                      {stat.value}
                    </p>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase" style={{ letterSpacing: '0.1em' }}>
                      {stat.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500" style={{ letterSpacing: '0.01em' }}>
                      {stat.subtitle}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Main Content Area */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left: Featured Listings + Quick Actions - 3/4 width */}
          <div className="lg:col-span-3 space-y-6">
            {/* Featured Listings - Horizontal */}
            {featuredListings.length > 0 && (
              <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3 text-sm uppercase font-semibold" style={{ letterSpacing: '0.1em' }}>
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-slate-900 dark:text-white" />
                        </div>
                        Featured Listings
                      </CardTitle>
                      <CardDescription className="mt-2 text-xs" style={{ letterSpacing: '0.02em' }}>
                        Latest opportunities from the marketplace
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="text-xs uppercase font-semibold" style={{ letterSpacing: '0.1em' }}>
                      <Link to="/marketplace">
                        View All
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    {featuredListings.map(listing => (
                      <Card key={listing.id} className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-all overflow-hidden">
                        <CardContent className="p-5 space-y-4">
                          {/* Category and Status */}
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="secondary" className="text-xs uppercase font-semibold" style={{ letterSpacing: '0.08em' }}>
                              {listing.category || 'Blockchain'}
                            </Badge>
                            <Badge variant="outline" className="text-xs font-semibold" style={{ letterSpacing: '0.05em' }}>
                              {listing.status || 'Completed'}
                            </Badge>
                          </div>

                          {/* Title */}
                          <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-2" style={{ letterSpacing: '0.02em' }}>
                            {listing.title}
                          </h3>

                          {/* Description */}
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2" style={{ letterSpacing: '0.01em' }}>
                            {listing.description}
                          </p>

                          {/* Price */}
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">
                              {listing.price || '0.1'}
                            </span>
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase" style={{ letterSpacing: '0.08em' }}>
                              DED
                            </span>
                          </div>

                          {/* Footer Info */}
                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-semibold">
                                {listing.educator?.slice(0, 2).toUpperCase() || '0x'}
                              </div>
                              <span className="text-xs text-slate-600 dark:text-slate-400 truncate" style={{ letterSpacing: '0.02em' }}>
                                {listing.educator || '0x30f8...6154'}
                              </span>
                              {listing.rating && (
                                <div className="flex items-center gap-1 ml-auto">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                    {listing.rating}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500" style={{ letterSpacing: '0.02em' }}>
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {listing.applications || 0} applications
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {listing.timing || 'Recently'}
                              </span>
                            </div>
                          </div>

                          {/* View Details Button */}
                          <Button 
                            variant="outline" 
                            className="w-full text-xs uppercase font-semibold" 
                            size="sm"
                            onClick={() => handleView(listing.id)}
                            style={{ letterSpacing: '0.1em' }}
                          >
                            <BookOpen className="w-3.5 h-3.5 mr-2" />
                            View Details
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions - Below Featured Listings */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all">
                <CardHeader className="pb-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-slate-900 dark:text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xs uppercase font-semibold" style={{ letterSpacing: '0.1em' }}>For Students</CardTitle>
                      <CardDescription className="text-xs mt-0.5" style={{ letterSpacing: '0.02em' }}>Find educators</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5 p-6">
                  <Button variant="outline" className="w-full justify-start text-xs uppercase font-semibold" size="sm" asChild style={{ letterSpacing: '0.1em' }}>
                    <Link to="/marketplace">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Browse Lessons
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs uppercase font-semibold" size="sm" asChild style={{ letterSpacing: '0.1em' }}>
                    <Link to="/create">
                      <Plus className="w-4 h-4 mr-2" />
                      Post Request
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all">
                <CardHeader className="pb-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                      <Users className="w-5 h-5 text-slate-900 dark:text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xs uppercase font-semibold" style={{ letterSpacing: '0.1em' }}>For Educators</CardTitle>
                      <CardDescription className="text-xs mt-0.5" style={{ letterSpacing: '0.02em' }}>Share knowledge</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2.5 p-6">
                  <Button variant="outline" className="w-full justify-start text-xs uppercase font-semibold" size="sm" asChild style={{ letterSpacing: '0.1em' }}>
                    <Link to="/marketplace">
                      <Users className="w-4 h-4 mr-2" />
                      Find Students
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs uppercase font-semibold" size="sm" asChild style={{ letterSpacing: '0.1em' }}>
                    <Link to="/create">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Offer Services
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right: Recent Activity Sidebar - 1/4 width */}
          <div className="lg:col-span-1">
            <Card className="border-slate-200 dark:border-slate-800 sticky top-20">
              <CardHeader className="pb-5 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="flex items-center gap-3 text-sm uppercase font-semibold" style={{ letterSpacing: '0.1em' }}>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-slate-900 dark:text-white" />
                  </div>
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const ActivityIcon = activity.icon
                    return (
                      <div 
                        key={activity.id} 
                        className="flex gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center flex-shrink-0">
                          <ActivityIcon className="w-4.5 h-4.5 text-slate-900 dark:text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white leading-snug mb-1.5" style={{ letterSpacing: '0.01em' }}>
                            {activity.title}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1.5" style={{ letterSpacing: '0.01em' }}>
                            {activity.subtitle}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500" style={{ letterSpacing: '0.01em' }}>
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}