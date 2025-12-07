import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface ContractTesterProps {
  listingAddress: string
}

export function ContractTester({ listingAddress }: ContractTesterProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { writeContract, data: hash, isPending } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const testReleaseEscrow = async () => {
    setError(null)
    setSuccess(null)
    
    try {
      await writeContract({
        address: listingAddress as `0x${string}`,
        abi: [
          {
            "inputs": [],
            "name": "releaseEscrow",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: 'releaseEscrow',
      })
    } catch (err: any) {
      console.error('Contract call error:', err)
      setError(err.message || 'Unknown error occurred')
    }
  }

  const testConfirm = async () => {
    setError(null)
    setSuccess(null)
    
    try {
      await writeContract({
        address: listingAddress as `0x${string}`,
        abi: [
          {
            "inputs": [],
            "name": "confirm",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: 'confirm',
      })
    } catch (err: any) {
      console.error('Confirm error:', err)
      setError(err.message || 'Unknown error occurred')
    }
  }

  if (isSuccess) {
    setSuccess('Transaction successful!')
  }

  return (
    <div className="p-4 border rounded-lg bg-orange-50">
      <h3 className="text-lg font-semibold mb-4">Contract Tester</h3>
      
      <div className="space-y-4">
        <div>
          <Button 
            onClick={testConfirm}
            disabled={isPending || isConfirming}
            className="mr-2"
          >
            {isPending || isConfirming ? 'Confirming...' : 'Test Confirm'}
          </Button>
          
          <Button 
            onClick={testReleaseEscrow}
            disabled={isPending || isConfirming}
            variant="destructive"
          >
            {isPending || isConfirming ? 'Testing...' : 'Test Release Escrow'}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded text-red-800">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-100 border border-green-300 rounded text-green-800">
            <strong>Success:</strong> {success}
          </div>
        )}

        {hash && (
          <div className="p-3 bg-blue-100 border border-blue-300 rounded text-blue-800">
            <strong>Transaction Hash:</strong> {hash}
          </div>
        )}
      </div>
    </div>
  )
} 