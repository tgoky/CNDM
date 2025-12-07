# IPFS Setup Guide for DED Learning Platform

This guide will help you set up IPFS file storage for your learning session recordings.

## Quick Setup (Recommended: Pinata)

### Step 1: Get Pinata API Keys

1. Visit [pinata.cloud](https://pinata.cloud)
2. Sign up for a free account
3. Go to API Keys section
4. Create a new API key with these permissions:
   - `pinFileToIPFS` - Upload files
   - `pinList` - List pinned files
   - `unpin` - Remove files

### Step 2: Create .env.local File

Create a file called `.env.local` in your project root with this content:

```env
# Recording Service Configuration
VITE_RECORDING_API_URL=http://localhost:3001/api

# IPFS Configuration
VITE_IPFS_GATEWAY_URL=https://ipfs.io/ipfs/

# Pinata Configuration (Recommended)
VITE_PINATA_API_KEY=your_pinata_api_key_here
VITE_PINATA_SECRET_KEY=your_pinata_secret_key_here

# Infura Configuration (Alternative)
VITE_INFURA_PROJECT_ID=your_infura_project_id_here
VITE_INFURA_PROJECT_SECRET=your_infura_project_secret_here

# Celestia Configuration
VITE_CELESTIA_RPC_URL=https://rpc.celestia-mocha.com
VITE_CELESTIA_NAMESPACE=0x0000000000000000000000000000000000000000000000000000000000000001

# Ethereum Configuration
VITE_ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/your_infura_key
VITE_CONTRACT_ADDRESS=0x...

# Recording Quality Settings
VITE_RECORDING_VIDEO_BITRATE=2000000
VITE_RECORDING_AUDIO_BITRATE=128000
VITE_RECORDING_RESOLUTION=1280x720
VITE_RECORDING_FRAME_RATE=30
```

### Step 3: Replace Placeholder Values

Replace these placeholders with your actual values:

- `your_pinata_api_key_here` → Your Pinata API Key
- `your_pinata_secret_key_here` → Your Pinata Secret Key
- `your_infura_key` → Your Infura API Key (for Ethereum)
- `0x...` → Your deployed contract address

## Alternative Setup: Infura IPFS

If you prefer Infura IPFS:

1. Visit [infura.io](https://infura.io)
2. Sign up and create a new project
3. Select "IPFS" as the product
4. Get your Project ID and Secret
5. Use these in your `.env.local`:

```env
VITE_INFURA_PROJECT_ID=your_infura_project_id
VITE_INFURA_PROJECT_SECRET=your_infura_project_secret
```

## Testing Your Setup

### Test IPFS Upload

Create a simple test file to verify your setup:

```typescript
// test-ipfs.js
import { SimpleIPFSService } from './src/services/ipfs/simple-ipfs.js';

const ipfs = new SimpleIPFSService();

async function testUpload() {
  try {
    const testData = Buffer.from('Hello, IPFS!');
    const result = await ipfs.uploadFilePublic(testData, 'test.txt', 'text/plain');
    console.log('Upload successful:', result);
    console.log('File URL:', result.gatewayUrl);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}

testUpload();
```

### Test File Retrieval

```typescript
async function testRetrieval(cid) {
  try {
    const data = await ipfs.retrieveFile(cid);
    console.log('Retrieved data:', data.toString());
  } catch (error) {
    console.error('Retrieval failed:', error);
  }
}
```

## Troubleshooting

### Common Issues

1. **API Key Invalid**
   - Verify your API keys are correct
   - Check if keys have proper permissions
   - Ensure keys are not expired

2. **Upload Fails**
   - Check network connectivity
   - Verify file size limits (Pinata: 1GB free tier)
   - Check console for detailed error messages

3. **File Not Accessible**
   - IPFS files may take time to propagate
   - Try different IPFS gateways
   - Check if file was actually uploaded

### IPFS Gateways

If files aren't accessible, try these alternative gateways:

- `https://ipfs.io/ipfs/`
- `https://gateway.pinata.cloud/ipfs/`
- `https://cloudflare-ipfs.com/ipfs/`
- `https://dweb.link/ipfs/`

## Security Notes

- Never commit `.env.local` to version control
- Keep your API keys secure
- Use different keys for development and production
- Rotate keys regularly

## Production Considerations

### Scaling

- **Pinata**: 1GB free, then paid plans
- **Infura**: 5GB free, then paid plans
- **Self-hosted**: Unlimited but requires infrastructure

### Redundancy

Consider using multiple IPFS services for redundancy:

```typescript
class MultiIPFSService {
  private services = [
    new PinataIPFSService(),
    new InfuraIPFSService(),
    new SimpleIPFSService()
  ];

  async uploadFile(file, fileName) {
    for (const service of this.services) {
      try {
        return await service.uploadFile(file, fileName);
      } catch (error) {
        console.warn('Upload failed, trying next service...');
      }
    }
    throw new Error('All services failed');
  }
}
```

## Support

- **Pinata Docs**: [docs.pinata.cloud](https://docs.pinata.cloud)
- **Infura Docs**: [docs.infura.io](https://docs.infura.io)
- **IPFS Docs**: [docs.ipfs.io](https://docs.ipfs.io)

## Next Steps

1. Create your `.env.local` file
2. Get your API keys
3. Test the upload functionality
4. Integrate with your recording system
5. Deploy to production

Your IPFS setup is now ready for storing learning session recordings!
