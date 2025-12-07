import { useReadContract } from 'wagmi'
import { useAccount } from 'wagmi'

interface ContractDebuggerProps {
  listingAddress: string
}

export function ContractDebugger({ listingAddress }: ContractDebuggerProps) {
  const { address: currentUserAddress } = useAccount()

  // Read owner
  const { data: owner, error: ownerError } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: [
      {
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'owner',
  })

  // Read creator
  const { data: creator, error: creatorError } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: [
      {
        "inputs": [],
        "name": "getCreator",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'getCreator',
  })

  // Read listing state
  const { data: listingState, error: stateError } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: [
      {
        "inputs": [],
        "name": "getStateString",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'getStateString',
  })

  // Check permissions
  const isOwner = currentUserAddress && owner && currentUserAddress.toLowerCase() === owner.toLowerCase()
  const isCreator = currentUserAddress && creator && currentUserAddress.toLowerCase() === creator.toLowerCase()
  const canCallReleaseEscrow = isOwner || isCreator

  return (
    <div className="p-4 border rounded-lg bg-blue-50">
      <h3 className="text-lg font-semibold mb-4">Contract Debugger</h3>
      
      <div className="space-y-2">
        <div>
          <span className="font-medium">Current User:</span> 
          <span className="ml-2 px-2 py-1 rounded text-sm bg-gray-100 text-gray-800">
            {currentUserAddress || 'Not connected'}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Contract Owner:</span> 
          <span className="ml-2 px-2 py-1 rounded text-sm bg-gray-100 text-gray-800">
            {owner || 'Loading...'}
          </span>
          {ownerError && (
            <span className="ml-2 text-red-500 text-xs">Error: {ownerError.message}</span>
          )}
        </div>
        
        <div>
          <span className="font-medium">Contract Creator:</span> 
          <span className="ml-2 px-2 py-1 rounded text-sm bg-gray-100 text-gray-800">
            {creator || 'Loading...'}
          </span>
          {creatorError && (
            <span className="ml-2 text-red-500 text-xs">Error: {creatorError.message}</span>
          )}
        </div>
        
        <div>
          <span className="font-medium">Listing State:</span> 
          <span className="ml-2 px-2 py-1 rounded text-sm bg-gray-100 text-gray-800">
            {listingState || 'Loading...'}
          </span>
          {stateError && (
            <span className="ml-2 text-red-500 text-xs">Error: {stateError.message}</span>
          )}
        </div>
        
        <div>
          <span className="font-medium">Is Owner:</span> 
          <span className={`ml-2 px-2 py-1 rounded text-sm ${
            isOwner ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isOwner ? 'Yes' : 'No'}
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
          <span className="font-medium">Can Call ReleaseEscrow:</span> 
          <span className={`ml-2 px-2 py-1 rounded text-sm ${
            canCallReleaseEscrow ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {canCallReleaseEscrow ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      {!canCallReleaseEscrow && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-800">
          <strong>Permission Issue:</strong> You are neither the owner nor creator of this listing.
          <br />
          <strong>Owner:</strong> {owner} (This should be the DEDIndex contract)
          <br />
          <strong>Creator:</strong> {creator} (This should be your address)
        </div>
      )}
    </div>
  )
} 