import { useState, useEffect } from 'react'
import { useProfile } from '@/hooks/use-profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, User, Plus, Edit, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ProfileFormProps {
  userAddress?: string
  onSuccess?: () => void
}

export function ProfileForm({ userAddress, onSuccess }: ProfileFormProps) {
  const { toast } = useToast()
  const { profileData, isLoading, createProfile, updateProfile, hasProfile } = useProfile(userAddress)
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    displayName: '',
    bio: ''
  })
  const [error, setError] = useState<string | null>(null)

  // Initialize form data when profile data is loaded
  useEffect(() => {
    if (profileData) {
      setFormData({
        displayName: profileData.displayName,
        bio: profileData.bio
      })
    }
  }, [profileData])

  const handleInputChange = (field: 'displayName' | 'bio', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null) // Clear error when user starts typing
  }

  const handleCreateProfile = async () => {
    try {
      setError(null)
      await createProfile()
      toast({
        title: "Profile Created",
        description: "Your profile has been created successfully!",
      })
      onSuccess?.()
    } catch (error: any) {
      console.error('Error creating profile:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create profile'
      setError(errorMessage)
      
      // Show specific toast based on error type
      if (errorMessage.includes('Profile already exists')) {
        toast({
          title: "Profile Already Exists",
          description: "You already have a profile. You can update it below.",
        })
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
  }

  const handleUpdateProfile = async () => {
    try {
      setError(null)
      await updateProfile(formData.displayName, formData.bio)
      setIsEditing(false)
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      })
      onSuccess?.()
    } catch (error) {
      console.error('Error updating profile:', error)
      setError(error instanceof Error ? error.message : 'Failed to update profile')
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSave = () => {
    if (hasProfile) {
      handleUpdateProfile()
    } else {
      handleCreateProfile()
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading profile...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {hasProfile ? <User className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {hasProfile ? 'Edit Profile' : 'Create Profile'}
            </CardTitle>
            <CardDescription>
              {hasProfile 
                ? 'Update your profile information and bio'
                : 'Profiles are created automatically when you create your first listing. You can manually create one here or start by creating a listing.'
              }
            </CardDescription>
          </div>
          {hasProfile && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              placeholder="Enter your display name"
              maxLength={50}
              disabled={hasProfile && !isEditing}
            />
            <p className="text-xs text-muted-foreground">
              {formData.displayName.length}/50 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={500}
              disabled={hasProfile && !isEditing}
            />
            <p className="text-xs text-muted-foreground">
              {formData.bio.length}/500 characters
            </p>
          </div>

          {(hasProfile && isEditing) && (
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={isLoading || !formData.displayName.trim()}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  setFormData({
                    displayName: profileData?.displayName || '',
                    bio: profileData?.bio || ''
                  })
                  setError(null)
                }}
              >
                Cancel
              </Button>
            </div>
          )}

          {!hasProfile && (
            <Button
              onClick={handleCreateProfile}
              disabled={isLoading || !formData.displayName.trim()}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Profile
            </Button>
          )}
        </div>

        {hasProfile && !isEditing && (
          <div className="p-4 bg-muted/30 rounded-lg">
            <h3 className="font-semibold mb-2">Current Profile</h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Display Name:</span>
                <p className="text-sm text-muted-foreground">{profileData?.displayName || 'Not set'}</p>
              </div>
              <div>
                <span className="font-medium">Bio:</span>
                <p className="text-sm text-muted-foreground">{profileData?.bio || 'No bio set'}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 