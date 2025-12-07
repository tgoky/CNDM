import { useReadContract } from 'wagmi'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'

interface ReleaseEscrowDebuggerProps {
  listingAddress: string
  onReleaseEscrow: () => void
  isReleasing: boolean
}

export function ReleaseEscrowDebugger({ listingAddress, onReleaseEscrow, isReleasing }: ReleaseEscrowDebuggerProps) {
  const { address: currentUserAddress } = useAccount()

  // Read all required data
  const { data: owner } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: [{ "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }],
    functionName: 'owner',
  })

  const { data: creator } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: [{ "inputs": [], "name": "getCreator", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }],
    functionName: 'getCreator',
  })

  const { data: listingState } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: [{ "inputs": [], "name": "getStateString", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }],
    functionName: 'getStateString',
  })

  const { data: escrowAddress } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: [{ "inputs": [], "name": "escrow", "outputs": [{ "internalType": "address payable", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }],
    functionName: 'escrow',
  })

  const { data: escrowState } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: [{ "inputs": [], "name": "state", "outputs": [{ "internalType": "enum DEDEscrow.State", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }],
    functionName: 'state',
    query: { enabled: !!escrowAddress && escrowAddress !== '0x0000000000000000000000000000000000000000' },
  })

  // Check all conditions
  const isOwner = currentUserAddress && owner && currentUserAddress.toLowerCase() === owner.toLowerCase()
  const isCreator = currentUserAddress && creator && currentUserAddress.toLowerCase() === creator.toLowerCase()
  const hasPermission = isOwner || isCreator
  const isInProgress = listingState === 'InProgress'
  const isEscrowActive = escrowState === 0 // 0 = Active
  const escrowExists = escrowAddress && escrowAddress !== '0x0000000000000000000000000000000000000000'

  // All conditions must be true
  const canRelease = hasPermission && isInProgress && isEscrowActive && escrowExists

  // Get specific error message
  const getErrorMessage = () => {
    if (!currentUserAddress) return "Wallet not connected"
    if (!escrowExists) return "Escrow not created (call finalizeEducators first)"
    if (!hasPermission) return "Not owner or creator"
    if (!isInProgress) return "Listing not in InProgress state (call confirm first)"
    if (!isEscrowActive) return `Escrow not in Active state (current: ${getEscrowStateString(escrowState)})`
    return "All conditions met - should work!"
  }

  const getEscrowStateString = (state: number | undefined) => {
    if (state === undefined) return 'Loading...'
    switch (state) {
      case 0: return 'Active'
      case 1: return 'Refunding'
      case 2: return 'Closed'
      default: return `Unknown (${state})`
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-purple-50">
      <h3 className="text-lg font-semibold mb-4">Release Escrow Debugger</h3>
      
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Permission:</span> 
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              hasPermission ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {hasPermission ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          
          <div>
            <span className="font-medium">Listing State:</span> 
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              isInProgress ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isInProgress ? '✅ InProgress' : `❌ ${listingState}`}
            </span>
          </div>
          
          <div>
            <span className="font-medium">Escrow Exists:</span> 
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              escrowExists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {escrowExists ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          
          <div>
            <span className="font-medium">Escrow State:</span> 
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              isEscrowActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isEscrowActive ? '✅ Active' : `❌ ${getEscrowStateString(escrowState)}`}
            </span>
          </div>
        </div>

        <div className="p-3 bg-gray-100 rounded">
          <div className="font-medium mb-2">Current Values:</div>
          <div className="text-sm space-y-1">
            <div>User: {currentUserAddress || 'Not connected'}</div>
            <div>Owner: {owner || 'Loading...'}</div>
            <div>Creator: {creator || 'Loading...'}</div>
            <div>Escrow Address: {escrowAddress || 'Loading...'}</div>
          </div>
        </div>

        <div className={`p-3 rounded ${
          canRelease ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <strong>Status:</strong> {getErrorMessage()}
        </div>

        <Button 
          onClick={onReleaseEscrow}
          disabled={!canRelease || isReleasing}
          className={`w-full ${
            canRelease ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isReleasing ? 'Releasing...' : 'Release to Educators'}
        </Button>
      </div>
    </div>
  )
} 