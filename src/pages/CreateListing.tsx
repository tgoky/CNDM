import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Wallet, ArrowLeft, Loader2, CheckCircle, GraduationCap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { WalletButton } from '@/components/WalletButton'
import { validateListingData } from '@/lib/web3'
import { useCreateListing, CreateListingData } from '@/hooks/use-create-listing'

const subjects = [
  'Programming', 'Blockchain', 'Design', 'Marketing', 'Business', 'Music', 'Science', 'Language'
]

const CreateListing = () => {
  const { isConnected } = useAccount()
  const [formData, setFormData] = useState<CreateListingData & { description: string }>({
    subject: '',
    topic: '',
    objectives: '',
    tokenAmount: '',
    description: ''
  })
  const [listingRole, setListingRole] = useState<'student' | 'educator'>('student')
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const { 
    createListing, 
    hash, 
    isSubmitting, 
    isConfirming, 
    isConfirmed, 
    submitError, 
    reset,
    currentStep
  } = useCreateListing()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form data
    const errors = validateListingData(formData)
    
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }
    
    setValidationErrors([])

    try {
      await createListing({
        ...formData,
        role: listingRole
      })
    } catch (error) {
      console.error('Error submitting listing:', error)
    }
  }

  // Show success message when transaction is confirmed
  if (isConfirmed) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="text-center">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Listing Created Successfully!</CardTitle>
            <CardDescription>
              Your listing has been submitted to the blockchain and is now live on the marketplace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700 font-medium mb-1">Transaction Hash:</p>
              <p className="text-xs text-green-600 break-all">
                {hash}
              </p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" asChild className="flex-1">
                <Link to="/marketplace">View Marketplace</Link>
              </Button>
              <Button onClick={() => {
                reset()
                setFormData({
                  subject: '',
                  topic: '',
                  objectives: '',
                  tokenAmount: ''
                })
                setValidationErrors([])
              }} className="flex-1">
                Create Another Listing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
            <CardDescription>
              You need to connect your wallet to create a listing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-6 bg-primary/5 rounded-lg">
                <Wallet className="w-12 h-12 text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Connect your wallet to start creating educational listings and 
                  join the decentralized learning ecosystem.
                </p>
              </div>
              <WalletButton className="mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/marketplace">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-2">Create Learning Listing</h1>
        <p className="text-muted-foreground">
          Create a listing to find educators or offer your teaching services using DED tokens
        </p>
      </div>

      {/* Error Display */}
      {(submitError || validationErrors.length > 0) && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            {submitError && (
              <p className="text-red-600 text-sm mb-2">
                Contract Error: {submitError.message}
              </p>
            )}
            {validationErrors.length > 0 && (
              <div>
                <p className="text-red-600 text-sm font-medium mb-1">Validation Errors:</p>
                <ul className="text-red-600 text-sm list-disc list-inside">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Progress Display */}
      {currentStep && currentStep !== 'idle' && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <p className="text-blue-700 font-medium">
                  {currentStep === 'approving' && '⏳ Waiting for approval transaction...'}
                  {currentStep === 'creating' && '⏳ Creating your listing...'}
                  {currentStep === 'complete' && '✅ Listing created successfully!'}
                </p>
                <p className="text-blue-600 text-sm">
                  {currentStep === 'approving' && 'Please confirm the approval transaction in MetaMask'}
                  {currentStep === 'creating' && 'Please confirm the listing creation in MetaMask'}
                  {currentStep === 'complete' && 'Your listing will appear in the marketplace shortly'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Role Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Your Role</CardTitle>
            <CardDescription>
              Are you creating this listing as a student seeking an educator, or as an educator offering services?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setListingRole('student')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  listingRole === 'student'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    listingRole === 'student' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className={`font-semibold text-lg ${
                    listingRole === 'student' ? 'text-blue-900' : 'text-gray-900'
                  }`}>Student</span>
                </div>
                <p className={`text-sm text-left ${
                  listingRole === 'student' ? 'text-blue-700' : 'text-gray-600'
                }`}>
                  You pay DED tokens upfront. Looking for an educator.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setListingRole('educator')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  listingRole === 'educator'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    listingRole === 'educator' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <span className={`font-semibold text-lg ${
                    listingRole === 'educator' ? 'text-green-900' : 'text-gray-900'
                  }`}>Educator</span>
                </div>
                <p className={`text-sm text-left ${
                  listingRole === 'educator' ? 'text-green-700' : 'text-gray-600'
                }`}>
                  No upfront payment. Students will pay you when they apply.
                </p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Provide the essential details about your learning listing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Specific Topic *</Label>
                <Input
                  id="topic"
                  placeholder="e.g., React Hooks, Smart Contracts"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  maxLength={100}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Max 100 characters
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="objectives">Learning Objectives *</Label>
              <Textarea
                id="objectives"
                placeholder="What specific skills or knowledge should be gained? (e.g., Master React hooks, Understand smart contract development, Learn UI/UX design principles)"
                value={formData.objectives}
                onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                rows={4}
                maxLength={500}
                required
              />
              <p className="text-xs text-muted-foreground">
                Max 500 characters ({formData.objectives.length}/500)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Token Amount */}
        <Card>
          <CardHeader>
            <CardTitle>Compensation</CardTitle>
            <CardDescription>
              Set the amount of DED tokens for this listing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tokenAmount">DED Token Amount *</Label>
              <div className="relative">
                <Input
                  id="tokenAmount"
                  type="number"
                  step="1"
                  min="1"
                  placeholder="50"
                  value={formData.tokenAmount}
                  onChange={(e) => setFormData({ ...formData, tokenAmount: e.target.value })}
                  required
                />
                <Badge className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  DED
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum amount is 1 DED token. The tokens will be held in escrow until the lesson is completed.
              </p>
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> You'll need at least 1 DED token in your wallet. Creating a listing requires two transactions: first approve token spending, then submit the listing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle>Preview Your Listing</CardTitle>
            <CardDescription>
              This is how your listing will appear to other users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-background rounded-lg border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Badge variant="outline" className="text-xs mb-2">
                    {formData.subject || 'Subject'}
                  </Badge>
                  <h3 className="font-semibold text-lg">
                    {formData.subject && formData.topic ? `${formData.subject}: ${formData.topic}` : 'Your listing title will appear here'}
                  </h3>
                  <p className="text-sm text-primary">
                    {formData.topic || 'Specific topic'}
                  </p>
                </div>
                <Badge className="bg-success/10 text-success border-success/30">
                  {formData.tokenAmount || '0'} DED
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formData.objectives || 'Your learning objectives will appear here...'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="button" variant="outline" className="flex-1" asChild>
            <Link to="/marketplace">Cancel</Link>
          </Button>
          <Button 
            type="submit" 
            variant="hero" 
            className="flex-1"
            disabled={isSubmitting || isConfirming}
          >
            {isSubmitting || isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {currentStep === 'approving' && 'Approve Tokens...'}
                {currentStep === 'creating' && 'Create Listing...'}
                {isConfirming && 'Confirming Transaction...'}
                {!currentStep && 'Submitting to Blockchain...'}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Listing
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreateListing