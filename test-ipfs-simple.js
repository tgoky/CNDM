// Simple test script for IPFS upload functionality
// Run with: node test-ipfs-simple.js

import { SimpleIPFSService } from './src/services/ipfs/simple-ipfs.js';

async function testIPFSUpload() {
  console.log('🧪 Testing IPFS Upload Functionality...\n');
  
  // Create IPFS service
  const ipfs = new SimpleIPFSService();
  
  // Test data
  const testData = Buffer.from('Hello from DED Learning Platform! This is a test upload to IPFS.', 'utf8');
  const fileName = `test-upload-${Date.now()}.txt`;
  const mimeType = 'text/plain';
  
  console.log('📤 Uploading test file...');
  console.log(`File: ${fileName}`);
  console.log(`Size: ${testData.length} bytes`);
  console.log(`Type: ${mimeType}\n`);
  
  try {
    // Try Pinata upload (requires environment variables)
    console.log('🔄 Trying Pinata upload...');
    const result = await ipfs.uploadFilePublic(testData, fileName, mimeType);
    
    console.log('✅ Upload successful!');
    console.log(`CID: ${result.cid}`);
    console.log(`Size: ${result.size} bytes`);
    console.log(`Gateway URL: ${result.gatewayUrl}\n`);
    
    // Test file retrieval
    console.log('🔄 Testing file retrieval...');
    try {
      const retrievedData = await ipfs.retrieveFile(result.cid);
      const retrievedText = retrievedData.toString('utf8');
      
      if (retrievedText === testData.toString('utf8')) {
        console.log('✅ File retrieval successful!');
        console.log(`Retrieved content: "${retrievedText}"`);
      } else {
        console.log('❌ Retrieved content does not match original');
      }
    } catch (retrieveError) {
      console.log('❌ File retrieval failed:', retrieveError.message);
    }
    
    // Test file existence check
    console.log('\n🔄 Testing file existence check...');
    try {
      const exists = await ipfs.fileExists(result.cid);
      console.log(`File exists: ${exists ? '✅ Yes' : '❌ No'}`);
    } catch (existsError) {
      console.log('❌ Existence check failed:', existsError.message);
    }
    
    console.log('\n🎉 Test completed successfully!');
    console.log(`\n📋 Summary:`);
    console.log(`- File uploaded to IPFS`);
    console.log(`- CID: ${result.cid}`);
    console.log(`- You can view it at: ${result.gatewayUrl}`);
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure you have created .env.local file');
    console.log('2. Check that VITE_PINATA_API_KEY and VITE_PINATA_SECRET_KEY are set');
    console.log('3. Verify your Pinata API keys are correct');
    console.log('4. Check your internet connection');
  }
}

// Run the test
testIPFSUpload().catch(console.error);
