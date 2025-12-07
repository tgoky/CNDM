#!/bin/bash

echo "🚀 Setting up IPFS Test Environment..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Recording Service Configuration
VITE_RECORDING_API_URL=http://localhost:3001/api

# IPFS Configuration
VITE_IPFS_GATEWAY_URL=https://ipfs.io/ipfs/

# Pinata Configuration (Get these from pinata.cloud)
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
EOF
    echo "✅ .env.local file created!"
else
    echo "✅ .env.local file already exists"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Get your Pinata API keys from https://pinata.cloud"
echo "2. Update .env.local with your actual API keys"
echo "3. Run: npm run dev"
echo "4. Visit: http://localhost:5173/ipfs-test"
echo ""
echo "🎉 Setup complete! Happy testing!"
