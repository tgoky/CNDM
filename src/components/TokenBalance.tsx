import { useAccount, useBalance } from 'wagmi'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Coins } from 'lucide-react'
import { formatTokenAmount } from '@/lib/web3'

export function TokenBalance() {
  const { address, isConnected } = useAccount()
  const { data: balance, isLoading } = useBalance({
    address,
    // In production, this would be the DED token address
    token: undefined // ETH balance for demo
  })

  if (!isConnected || !address) {
    return null
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Coins className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Your Balance</p>
            <p className="text-xs text-muted-foreground">DED Tokens</p>
          </div>
        </div>
        <div className="text-right">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-6 w-16 bg-muted rounded" />
            </div>
          ) : (
            <Badge variant="outline" className="text-lg font-bold bg-success/10 border-success/30 text-success">
              {balance ? formatTokenAmount(balance.value) : '0.0000'} 
              <span className="ml-1 text-xs font-normal">
                {balance?.symbol || 'ETH'}
              </span>
            </Badge>
          )}
        </div>
      </div>
    </Card>
  )
}