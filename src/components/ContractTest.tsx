import React, { useState } from 'react'
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi'
import { CONTRACTS, TOKEN_ABI, PROFILE_ABI } from '../lib/web3'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'

export function ContractTest() {
  const { address, isConnected } = useAccount()
  const [tokenAmount, setTokenAmount] = useState('')
  const [profileName, setProfileName] = useState('')
  const [profileBio, setProfileBio] = useState('')

  // Check if contracts are configured (have real addresses)
  const contractsConfigured = Object.values(CONTRACTS).every(addr => addr && addr !== '0x...')

  // Read token balance
  const { data: tokenBalance, isLoading: balanceLoading } = useContractRead({
    address: CONTRACTS.DEDToken as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: isConnected && !!address && contractsConfigured,
  })

  // Read profile data
  const { data: profileData, isLoading: profileLoading } = useContractRead({
    address: CONTRACTS.DEDProfile as `0x${string}`,
    abi: PROFILE_ABI,
    functionName: 'getProfile',
    args: [address],
    enabled: isConnected && !!address && contractsConfigured,
  })

  // Create profile transaction
  const { data: createProfileData, write: createProfile } = useContractWrite({
    address: CONTRACTS.DEDProfile as `0x${string}`,
    abi: PROFILE_ABI,
    functionName: 'createProfile',
  })

  const { isLoading: createProfileLoading } = useWaitForTransaction({
    hash: createProfileData?.hash,
  })

  // Transfer tokens transaction
  const { data: transferData, write: transferTokens } = useContractWrite({
    address: CONTRACTS.DEDToken as `0x${string}`,
    abi: TOKEN_ABI,
    functionName: 'transfer',
  })

  const { isLoading: transferLoading } = useWaitForTransaction({
    hash: transferData?.hash,
  })

  const handleCreateProfile = () => {
    if (createProfile && profileName && profileBio) {
      createProfile({
        args: [profileName, profileBio],
      })
    }
  }

  const handleTransfer = () => {
    if (transferTokens && tokenAmount && address) {
      // Transfer to yourself for demo (replace with actual recipient)
      const amount = BigInt(Math.floor(parseFloat(tokenAmount) * 10 ** 18))
      transferTokens({
        args: [address, amount],
      })
    }
  }

  if (!contractsConfigured) {
    return (
      <Alert>
        <AlertDescription>
          Contract addresses not configured. Update the addresses in src/lib/web3.ts to test.
        </AlertDescription>
      </Alert>
    )
  }

  if (!isConnected) {
    return (
      <Alert>
        <AlertDescription>
          Please connect your wallet to interact with the contracts.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Learning Session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Token Balance */}
          <div>
            <Label>Your DED Token Balance:</Label>
            <div className="text-lg font-semibold">
              {balanceLoading ? 'Loading...' : tokenBalance ? `${Number(tokenBalance) / 10 ** 18} DED` : '0 DED'}
            </div>
          </div>

          {/* Profile Data */}
          <div>
            <Label>Your Profile:</Label>
            <div className="text-sm">
              {profileLoading ? 'Loading...' : profileData ? (
                <div>
                  <div>Name: {profileData[0]}</div>
                  <div>Bio: {profileData[1]}</div>
                  <div>Is Educator: {profileData[2] ? 'Yes' : 'No'}</div>
                </div>
              ) : 'No profile found'}
            </div>
          </div>

          {/* Create Profile Form */}
          <div className="space-y-2">
            <Label>Create/Update Profile</Label>
            <Input
              placeholder="Display Name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
            />
            <Input
              placeholder="Bio"
              value={profileBio}
              onChange={(e) => setProfileBio(e.target.value)}
            />
            <Button 
              onClick={handleCreateProfile}
              disabled={createProfileLoading || !profileName || !profileBio}
            >
              {createProfileLoading ? 'Creating...' : 'Create Profile'}
            </Button>
          </div>

          {/* Transfer Tokens */}
          <div className="space-y-2">
            <Label>Transfer Tokens (to yourself for demo)</Label>
            <Input
              type="number"
              placeholder="Amount"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
            />
            <Button 
              onClick={handleTransfer}
              disabled={transferLoading || !tokenAmount}
            >
              {transferLoading ? 'Transferring...' : 'Transfer'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 