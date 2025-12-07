import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet, LogOut, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WalletButtonProps {
  className?: string
}

export function WalletButton({ className }: WalletButtonProps) {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [copied, setCopied] = useState(false)

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected && address) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge 
          variant="outline" 
          className="bg-success/10 border-success/30 text-success cursor-pointer hover:bg-success/20 transition-colors"
          onClick={handleCopyAddress}
        >
          <div className="w-2 h-2 bg-success rounded-full mr-2" />
          {formatAddress(address)}
          {copied ? (
            <Check className="w-3 h-3 ml-1" />
          ) : (
            <Copy className="w-3 h-3 ml-1" />
          )}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="wallet"
      onClick={() => connect({ connector: connectors[0] })}
      className={className}
    >
      <Wallet className="w-4 h-4 mr-2" />
      Connect Wallet
    </Button>
  )
}