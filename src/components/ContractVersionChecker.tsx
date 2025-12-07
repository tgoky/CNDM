import { useReadContract } from 'wagmi'

interface ContractVersionCheckerProps {
  listingAddress: string
}

export function ContractVersionChecker({ listingAddress }: ContractVersionCheckerProps) {
  // Try to read the escrow state to see if the contract has the updated logic
  const { data: escrowState, error: escrowError } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: [
      {
        "inputs": [],
        "name": "escrow",
        "outputs": [
          {
            "internalType": "address payable",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'escrow',
  })

  // Try to read escrow state from the escrow contract
  const { data: escrowContractState, error: escrowContractError } = useReadContract({
    address: escrowState as `0x${string}`,
    abi: [
      {
        "inputs": [],
        "name": "state",
        "outputs": [
          {
            "internalType": "enum DEDEscrow.State",
            "name": "",
            "type": "uint8"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'state',
    query: {
      enabled: !!escrowState && escrowState !== '0x0000000000000000000000000000000000000000',
    },
  })

  const isUpdatedContract = escrowState && escrowState !== '0x0000000000000000000000000000000000000000'

  return (
    <div className="p-4 border rounded-lg bg-yellow-50">
      <h3 className="text-lg font-semibold mb-4">Contract Version Check</h3>
      
      <div className="space-y-2">
        <div>
          <span className="font-medium">Contract Address:</span> 
          <span className="ml-2 px-2 py-1 rounded text-sm bg-gray-100 text-gray-800">
            {listingAddress}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Escrow Address:</span> 
          <span className={`ml-2 px-2 py-1 rounded text-sm ${
            escrowState && escrowState !== '0x0000000000000000000000000000000000000000' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {escrowState || 'Loading...'}
          </span>
        </div>
        
        <div>
          <span className="font-medium">Contract Status:</span> 
          <span className={`ml-2 px-2 py-1 rounded text-sm ${
            isUpdatedContract ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isUpdatedContract ? 'Escrow Found' : 'No Escrow (Old Contract)'}
          </span>
        </div>

        {escrowError && (
          <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
            <strong>Escrow Error:</strong> {escrowError.message}
          </div>
        )}

        {escrowContractError && (
          <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
            <strong>Escrow Contract Error:</strong> {escrowContractError.message}
          </div>
        )}
      </div>

      {!isUpdatedContract && (
        <div className="mt-4 p-3 bg-orange-100 border border-orange-300 rounded text-orange-800">
          <strong>Action Required:</strong> This appears to be an old contract version. 
          You need to deploy the updated DEDListing contract with the fixed releaseEscrow function.
        </div>
      )}
    </div>
  )
} 