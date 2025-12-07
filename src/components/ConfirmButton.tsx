import { Button } from '@/components/ui/button'

interface ConfirmButtonProps {
  listingState: string
  onConfirm: () => void
  isConfirming: boolean
}

export function ConfirmButton({ listingState, onConfirm, isConfirming }: ConfirmButtonProps) {
  // Only show if listing is in AwaitingConfirm state
  if (listingState !== 'AwaitingConfirm') {
    return null
  }

  return (
    <div className="p-4 border rounded-lg bg-blue-50">
      <h3 className="text-lg font-semibold mb-4">Confirm Listing</h3>
      
      <div className="space-y-3">
        <div className="p-3 bg-blue-100 border border-blue-300 rounded text-blue-800">
          <strong>Action Required:</strong> Your listing is ready to be confirmed and moved to "InProgress" state.
          <br />
          This is required before you can release funds to educators.
        </div>

        <Button 
          onClick={onConfirm}
          disabled={isConfirming}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isConfirming ? 'Confirming...' : 'Confirm Listing'}
        </Button>

        <div className="text-sm text-gray-600">
          <strong>What this does:</strong>
          <ul className="list-disc list-inside mt-1">
            <li>Changes listing state from "AwaitingConfirm" to "InProgress"</li>
            <li>Allows you to call releaseEscrow() after confirmation</li>
            <li>Only the creator or owner can call this function</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 