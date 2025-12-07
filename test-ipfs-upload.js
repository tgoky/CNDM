// Test script for IPFS upload functionality
import { SimpleIPFSService } from './src/services/ipfs/simple-ipfs.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testIPFSUpload() {
  console.log('🧪 Testing IPFS Upload Functionality...\n');
  
  // Check if environment variables are set
  const pinataApiKey = process.env.VITE_PINATA_API_KEY;
  const pinataSecretKey = process.env.VITE_PINATA_SECRET_KEY;
  const infuraProjectId = process.env.VITE_INFURA_PROJECT_ID;
  const infuraProjectSecret = process.env.VITE_INFURA_PROJECT_SECRET;
  
  console.log('📋 Environment Check:');
  console.log(`Pinata API Key: ${pinataApiKey ? '✅ Set' : '❌ Not set'}`);
  console.log(`Pinata Secret: ${pinataSecretKey ? '✅ Set' : '❌ Not set'}`);
  console.log(`Infura Project ID: ${infuraProjectId ? '✅ Set' : '❌ Not set'}`);
  console.log(`Infura Secret: ${infuraProjectSecret ? '✅ Set' : '❌ Not set'}\n`);
  
  if (!pinataApiKey && !infuraProjectId) {
    console.error('❌ No IPFS service configured! Please set up Pinata or Infura in your .env.local file.');
    return;
  }
  
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
    // Try Pinata first if available
    if (pinataApiKey && pinataSecretKey) {
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
      
      // Test metadata retrieval
      console.log('\n🔄 Testing metadata retrieval...');
      try {
        const metadata = await ipfs.getFileMetadata(result.cid);
        console.log('✅ Metadata retrieved:');
        console.log(`CID: ${metadata.cid}`);
        console.log(`Size: ${metadata.size} bytes`);
        console.log(`Gateway URL: ${metadata.gatewayUrl}`);
      } catch (metadataError) {
        console.log('❌ Metadata retrieval failed:', metadataError.message);
      }
      
    } else if (infuraProjectId && infuraProjectSecret) {
      console.log('🔄 Trying Infura upload...');
      const result = await ipfs.uploadFile(testData, fileName, mimeType);
      
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
    }
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    console.error('Full error:', error);
  }
  
  console.log('\n🎉 Test completed!');
}

// Run the test
testIPFSUpload().catch(console.error);
