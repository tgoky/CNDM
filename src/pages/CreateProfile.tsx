import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileForm } from '@/components/ProfileForm'
import { WalletButton } from '@/components/WalletButton'
import { User, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const CreateProfile = () => {
  const { address, isConnected } = useAccount()
  const navigate = useNavigate()

  const handleProfileSuccess = () => {
    // Navigate to profile page after successful creation
    navigate('/profile')
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
            <CardDescription>
              You need to connect your wallet to create your profile
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <User className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Create Your Profile</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Set up your profile to start teaching or learning on the platform. 
          Profiles are created automatically when you create your first listing, 
          but you can also create one manually here.
        </p>
      </div>

      {/* Profile Creation Form */}
      <div className="max-w-2xl mx-auto">
        <ProfileForm onSuccess={handleProfileSuccess} />
      </div>

      {/* Benefits Section */}
      <div className="mt-12 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Why Create a Profile?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Build Your Identity</h3>
              <p className="text-sm text-muted-foreground">
                Create a professional profile that showcases your expertise and experience
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Start Teaching</h3>
              <p className="text-sm text-muted-foreground">
                Create listings and share your knowledge with students worldwide
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Join Classes</h3>
              <p className="text-sm text-muted-foreground">
                Enroll in lessons and expand your skills with expert educators
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-12 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Profile Tips</CardTitle>
            <CardDescription>
              Make your profile stand out with these helpful tips
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Display Name</h4>
              <p className="text-sm text-muted-foreground">
                Choose a professional name that represents you well. This is how others will see you on the platform.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Bio</h4>
              <p className="text-sm text-muted-foreground">
                Write a compelling bio that highlights your expertise, experience, and what you can offer to students.
                Include your teaching style and areas of specialization.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Keep It Updated</h4>
              <p className="text-sm text-muted-foreground">
                Regularly update your profile with new skills, certifications, and achievements to maintain relevance.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CreateProfile 