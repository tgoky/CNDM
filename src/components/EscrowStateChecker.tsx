import { useApplyListing } from '@/hooks/use-apply-listing'

interface EscrowStateCheckerProps {
  listingAddress: string
  creatorAddress: string
}

export function EscrowStateChecker({ listingAddress, creatorAddress }: EscrowStateCheckerProps) {
  const { 
    listingState, 
    escrowState, 
    isCreator,
    isReleasing,
    releaseError 
  } = useApplyListing(listingAddress, creatorAddress)

  // Debug logging
  console.log('EscrowStateChecker Debug:', {
    listingAddress,
    creatorAddress,
    listingState,
    escrowState,
    isCreator
  })

  // Convert escrow state number to readable string
  const getEscrowStateString = (state: number | undefined) => {
    if (state === undefined) return 'Loading...'
    switch (state) {
      case 0: return 'Active'
      case 1: return 'Refunding'
      case 2: return 'Closed'
      default: return `Unknown (${state})`
    }
  }

  const canRelease = listingState === 'InProgress' && escrowState === 0 && isCreator

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Escrow State Checker</h3>
      
      <div className="space-y-2">
        <div>
          <span className="font-medium">Listing State:</span> 
          <span className={`ml-2 px-2 py-1 rounded text-sm ${
            listingState === 'InProgress' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {listingState}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Escrow State:</span> 
          <span className={`ml-2 px-2 py-1 rounded text-sm ${
            escrowState === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {getEscrowStateString(escrowState)}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Is Creator:</span> 
          <span className={`ml-2 px-2 py-1 rounded text-sm ${
            isCreator ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isCreator ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Can Release:</span> 
          <span className={`ml-2 px-2 py-1 rounded text-sm ${
            canRelease ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {canRelease ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      {releaseError && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-800">
          <strong>Release Error:</strong> {releaseError.message}
        </div>
      )}
    </div>
  )
} 