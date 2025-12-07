import { useReadContract } from 'wagmi'
import { Button } from '@/components/ui/button'

interface EscrowStateReaderProps {
  listingAddress: string
}

export function EscrowStateReader({ listingAddress }: EscrowStateReaderProps) {
  // Read escrow address from listing
  const { data: escrowAddress, error: escrowAddressError } = useReadContract({
    address: listingAddress as `0x${string}`,
    abi: [{ "inputs": [], "name": "escrow", "outputs": [{ "internalType": "address payable", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }],
    functionName: 'escrow',
  })

  // Read escrow state
  const { data: escrowState, error: escrowStateError } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: [{ "inputs": [], "name": "state", "outputs": [{ "internalType": "enum DEDEscrow.State", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }],
    functionName: 'state',
    query: { enabled: !!escrowAddress && escrowAddress !== '0x0000000000000000000000000000000000000000' },
  })

  // Read escrow beneficiary
  const { data: escrowBeneficiary, error: beneficiaryError } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: [{ "inputs": [], "name": "escrowBeneficiary", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }],
    functionName: 'escrowBeneficiary',
    query: { enabled: !!escrowAddress && escrowAddress !== '0x0000000000000000000000000000000000000000' },
  })

  // Read total deposits
  const { data: totalDeposits, error: depositsError } = useReadContract({
    address: escrowAddress as `0x${string}`,
    abi: [{ "inputs": [], "name": "totalDeposits", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }],
    functionName: 'totalDeposits',
    query: { enabled: !!escrowAddress && escrowAddress !== '0x0000000000000000000000000000000000000000' },
  })

  const getEscrowStateString = (state: number | undefined) => {
    if (state === undefined) return 'Loading...'
    switch (state) {
      case 0: return 'Active'
      case 1: return 'Refunding'
      case 2: return 'Closed'
      default: return `Unknown (${state})`
    }
  }

  const getStateDescription = (state: number | undefined) => {
    if (state === undefined) return 'Loading...'
    switch (state) {
      case 0: return '✅ Ready for release (can call close())'
      case 1: return '❌ Refunding mode (cannot release)'
      case 2: return '❌ Already closed (cannot release again)'
      default: return `❌ Unknown state (${state})`
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-yellow-50">
      <h3 className="text-lg font-semibold mb-4">Escrow State Reader</h3>
      
      <div className="space-y-3">
        <div>
          <span className="font-medium">Escrow Address:</span> 
          <span className="ml-2 px-2 py-1 rounded text-sm bg-gray-100 text-gray-800">
            {escrowAddress || 'Loading...'}
          </span>
          {escrowAddressError && (
            <span className="ml-2 text-red-500 text-xs">Error: {escrowAddressError.message}</span>
          )}
        </div>

        <div>
          <span className="font-medium">Escrow State:</span> 
          <span className={`ml-2 px-2 py-1 rounded text-sm ${
            escrowState === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {getEscrowStateString(escrowState)} ({escrowState})
          </span>
          {escrowStateError && (
            <span className="ml-2 text-red-500 text-xs">Error: {escrowStateError.message}</span>
          )}
        </div>

        <div>
          <span className="font-medium">State Description:</span> 
          <span className="ml-2 px-2 py-1 rounded text-sm bg-gray-100 text-gray-800">
            {getStateDescription(escrowState)}
          </span>
        </div>

        <div>
          <span className="font-medium">Escrow Beneficiary:</span> 
          <span className="ml-2 px-2 py-1 rounded text-sm bg-gray-100 text-gray-800">
            {escrowBeneficiary || 'Loading...'}
          </span>
          {beneficiaryError && (
            <span className="ml-2 text-red-500 text-xs">Error: {beneficiaryError.message}</span>
          )}
        </div>

        <div>
          <span className="font-medium">Total Deposits:</span> 
          <span className="ml-2 px-2 py-1 rounded text-sm bg-gray-100 text-gray-800">
            {totalDeposits ? `${Number(totalDeposits) / 1e18} ETH` : 'Loading...'}
          </span>
          {depositsError && (
            <span className="ml-2 text-red-500 text-xs">Error: {depositsError.message}</span>
          )}
        </div>

        {escrowState === 0 && (
          <div className="p-3 bg-green-100 border border-green-300 rounded text-green-800">
            <strong>✅ Escrow is in Active state!</strong> The releaseEscrow function should work.
            <br />
            If it's still failing, the issue might be with the listing state or permissions.
          </div>
        )}

        {escrowState === 1 && (
          <div className="p-3 bg-red-100 border border-red-300 rounded text-red-800">
            <strong>❌ Escrow is in Refunding state!</strong> 
            <br />
            Someone called refundEscrow() or enableRefunds(). You cannot release to educators anymore.
          </div>
        )}

        {escrowState === 2 && (
          <div className="p-3 bg-red-100 border border-red-300 rounded text-red-800">
            <strong>❌ Escrow is already Closed!</strong> 
            <br />
            The escrow was already released. You cannot release it again.
          </div>
        )}
      </div>
    </div>
  )
} 