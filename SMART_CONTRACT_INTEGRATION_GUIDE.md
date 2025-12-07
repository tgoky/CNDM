# 🔗 Smart Contract Integration Guide

## Overview

The frontend now includes full smart contract integration for recording learning sessions on the blockchain. This guide explains how to set up and use the complete end-to-end system.

## 🚀 What's New

### ✅ **Smart Contract Service**
- `SessionEscrowService` class for interacting with the DEDSessionEscrow contract
- Full ABI integration with all contract functions
- Wallet connection and transaction signing
- Session recording, retrieval, and dispute management

### ✅ **Enhanced End-to-End Test**
- Real WebRTC recording with camera/microphone
- IPFS upload with CID generation
- Celestia commitment simulation
- **NEW**: Smart contract recording with transaction confirmation
- **NEW**: Wallet connection status display
- **NEW**: Session verification from blockchain

## 🔧 Setup Instructions

### 1. **Deploy the Smart Contract**

First, deploy the `DEDSessionEscrow` contract to your testnet:

```bash
cd /Users/harrislevine/DED/DED
forge script script/DeployDEDSessionEscrow.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
```

### 2. **Update Environment Variables**

Add the deployed contract address to your `.env.local`:

```bash
# Smart Contract
VITE_CONTRACT_ADDRESS=0x... # Replace with your deployed contract address

# IPFS (Pinata)
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_SECRET_KEY=your_pinata_secret_key

# IPFS (Infura - Alternative)
VITE_INFURA_PROJECT_ID=your_infura_project_id
VITE_INFURA_PROJECT_SECRET=your_infura_project_secret
```

### 3. **Start the Frontend**

```bash
cd /Users/harrislevine/DED/learn-chain-connect
npm run dev
```

## 🎯 How It Works

### **Complete Flow:**

1. **🎥 Record Session**: User records WebRTC session with camera/microphone
2. **📁 Process Recording**: Generate file hash and prepare for upload
3. **🌐 Upload to IPFS**: Upload recording file and get CID
4. **🌌 Submit to Celestia**: Submit hash and get commitment (simulated)
5. **📝 Record on Smart Contract**: Store CID and commitment on blockchain
6. **✅ Verify**: Confirm session was recorded successfully

### **Smart Contract Integration:**

```typescript
// 1. Initialize service
const sessionEscrow = new SessionEscrowService(contractAddress, provider);
sessionEscrow.setSigner(signer);

// 2. Record session
const tx = await sessionEscrow.recordSession(
  sessionId,
  studentAddress,
  educatorAddress,
  arbiterAddress,
  sessionProof // Contains CID and commitment
);

// 3. Wait for confirmation
const receipt = await tx.wait();

// 4. Verify recording
const recordedSession = await sessionEscrow.getSession(sessionId);
```

## 🔍 What Gets Stored on Blockchain

### **SessionProof Struct:**
```solidity
struct SessionProof {
    bytes32 commitment;  // Celestia commitment hash
    string cid;         // IPFS CID
    string fileHash;    // File content hash
    uint256 timestamp;  // Recording timestamp
    uint256 blockHeight; // Celestia block height
    string txHash;      // Celestia transaction hash
}
```

### **EscrowSession Struct:**
```solidity
struct EscrowSession {
    string sessionId;
    address student;
    address educator;
    address arbiter;
    SessionProof sessionProof;  // ← Contains CID and commitment
    // ... other fields
}
```

## 🎮 Testing the Complete System

### **1. Connect Wallet**
- Click "Connect Wallet" button
- Select your wallet (MetaMask, WalletConnect, etc.)
- Ensure you're on the correct network (Sepolia testnet)

### **2. Record Session**
- Click "Initialize Camera" to start video preview
- Click "Start Recording" to begin recording
- Speak and move around to create content
- Click "Stop Recording" when done

### **3. Process and Upload**
- Click "Process Session" to:
  - Generate file hash
  - Upload to IPFS (get CID)
  - Submit to Celestia (get commitment)
  - Record on smart contract

### **4. Verify Results**
- Check the logs for success messages
- View the session proof with CID and commitment
- Verify the transaction on Etherscan
- Access the recording using the IPFS CID

## 🔗 Accessing Your Recording

### **Using IPFS CID:**
```
https://ipfs.io/ipfs/{CID}
https://gateway.pinata.cloud/ipfs/{CID}
https://{CID}.ipfs.infura-ipfs.io/
```

### **From Smart Contract:**
```typescript
const session = await sessionEscrow.getSession(sessionId);
const cid = session.sessionProof.cid;
const commitment = session.sessionProof.celestiaCommitment;
```

## 🛠️ Available Functions

### **Session Management:**
- `recordSession()` - Record new session on blockchain
- `getSession()` - Retrieve session data
- `initiateDispute()` - Start dispute process
- `resolveDispute()` - Resolve dispute (arbiter only)

### **Escrow Management:**
- `depositFunds()` - Deposit funds for session
- `closeEscrow()` - Close escrow
- `enableRefunds()` - Enable refunds
- `withdraw()` - Withdraw funds

### **Arbiter Management:**
- `authorizeArbiter()` - Authorize new arbiter
- `isAuthorizedArbiter()` - Check arbiter status
- `getArbiterStake()` - Get arbiter stake amount

## 🚨 Troubleshooting

### **Common Issues:**

1. **"Wallet Not Connected"**
   - Make sure wallet is connected
   - Check network (should be Sepolia testnet)
   - Refresh page and reconnect

2. **"Smart Contract Not Available"**
   - Check `VITE_CONTRACT_ADDRESS` in `.env.local`
   - Ensure contract is deployed
   - Verify contract address is correct

3. **"Transaction Failed"**
   - Check wallet has enough ETH for gas
   - Ensure you're on the correct network
   - Check contract is not paused

4. **"IPFS Upload Failed"**
   - Check Pinata API keys in `.env.local`
   - Verify API keys are valid
   - Check network connection

### **Debug Steps:**

1. **Check Browser Console** for detailed error messages
2. **Verify Environment Variables** are set correctly
3. **Test IPFS Upload** separately using the IPFS Test page
4. **Check Smart Contract** on Etherscan for deployment status

## 🎉 Success Indicators

When everything works correctly, you should see:

```
✅ Camera and microphone initialized successfully
✅ Recording started
✅ Recording stopped
✅ STEP 1: PROCESSING RECORDING
✅ File hash generated: 0x1234...
✅ STEP 2: UPLOADING TO IPFS
✅ IPFS upload successful
✅ CID: QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
✅ STEP 3: SUBMITTING TO CELESTIA
✅ Celestia submission successful
✅ Commitment: 0xabcdef...
✅ STEP 4: CREATING SESSION PROOF
✅ Session proof created
✅ STEP 5: RECORDING SESSION ON SMART CONTRACT
✅ Session recorded on smart contract!
✅ Transaction hash: 0x9876...
✅ Session verification successful!
```

## 🔄 Next Steps

1. **Deploy to Mainnet** when ready for production
2. **Add Real Celestia Integration** (currently simulated)
3. **Implement Dispute Resolution UI** for arbiters
4. **Add Session Management Dashboard** for users
5. **Integrate with DED Token** for payments

## 📚 Additional Resources

- [DEDSessionEscrow Contract](../DED/src/DEDSessionEscrow.sol)
- [End-to-End Test Contract](../DED/test/EndToEndSessionTest.t.sol)
- [IPFS Setup Guide](./IPFS_SETUP_GUIDE.md)
- [Browser Testing Guide](./BROWSER_TESTING_GUIDE.md)

---

**🎯 You now have a complete end-to-end learning session recording system with blockchain integration!**
