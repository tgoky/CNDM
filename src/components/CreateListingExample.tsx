import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { CONTRACT_ADDRESSES, DED_INDEX_ABI } from '@/lib/web3'

/**
 * Example component demonstrating how to create a listing using DEDIndex contract
 * This shows the proper way to call the submitListing function
 */
export const CreateListingExample = () => {
  const { isConnected } = useAccount()
  const [formData, setFormData] = useState({
    subject: 'Mathematics',
    topic: 'Linear Algebra',
    objectives: 'Learn matrix operations and vector spaces',
    tokenAmount: '0.1'
  })

  // Contract write hook
  const { 
    data: hash, 
    writeContract, 
    isPending: isSubmitting, 
    error: submitError 
  } = useWriteContract()

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!writeContract) {
      console.error('Write contract function not ready')
      return
    }

    try {
      // Call the DEDIndex submitListing function
      await writeContract({
        address: CONTRACT_ADDRESSES.DEDIndex as `0x${string}`,
        abi: DED_INDEX_ABI,
        functionName: 'submitListing',
        args: [
          formData.subject,           // subject
          formData.topic,             // topic  
          formData.objectives,        // objectives
          BigInt(Math.floor(parseFloat(formData.tokenAmount) * Math.pow(10, 18))) // postAmount (0.1 ETH in wei)
        ],
      })
    } catch (error) {
      console.error('Error submitting listing:', error)
    }
  }

  if (!isConnected) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>Please connect your wallet to create a listing</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Listing Example</CardTitle>
        <CardDescription>
          This demonstrates calling the DEDIndex submitListing function
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="objectives">Learning Objectives</Label>
            <Textarea
              id="objectives"
              value={formData.objectives}
              onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="tokenAmount">Amount (ETH)</Label>
            <Input
              id="tokenAmount"
              type="number"
              step="0.01"
              value={formData.tokenAmount}
              onChange={(e) => setFormData({ ...formData, tokenAmount: e.target.value })}
              required
            />
          </div>

          {/* Status Display */}
          {isConfirmed && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">Listing created successfully!</span>
            </div>
          )}

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700">Error: {submitError.message}</span>
            </div>
          )}

          {hash && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                Transaction Hash: {hash}
              </p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting || isConfirming}
          >
            {isSubmitting || isConfirming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isSubmitting ? 'Submitting...' : 'Confirming...'}
              </>
            ) : (
              'Create Listing'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 