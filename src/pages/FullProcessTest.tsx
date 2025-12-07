import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { SimpleIPFSService } from '../services/ipfs/simple-ipfs';
import { 
  Upload, 
  Download, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Database, 
  Link, 
  Shield,
  Clock,
  Hash
} from 'lucide-react';

interface SessionProof {
  ipfsCid: string;
  celestiaCommitment: string;
  fileHash: string;
  timestamp: number;
  blockHeight: number;
  txHash: string;
}

export default function FullProcessTest() {
  const [testText, setTestText] = useState('Hello from DED Learning Platform! This is a comprehensive test of the full recording process including IPFS, Celestia, and Ethereum integration.');
  const [sessionProof, setSessionProof] = useState<SessionProof | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const ipfs = new SimpleIPFSService();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // Simulate Celestia integration (in real implementation, this would use actual Celestia SDK)
  const simulateCelestiaSubmission = async (hash: string): Promise<{ commitment: string; height: number; txHash: string }> => {
    addLog('🌌 Submitting proof to Celestia...');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock Celestia data
    const commitment = `0x${Math.random().toString(16).substr(2, 64)}`;
    const height = Math.floor(Math.random() * 1000000) + 1000000;
    const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    addLog(`✅ Celestia submission successful! Commitment: ${commitment.substring(0, 20)}...`);
    addLog(`📊 Block Height: ${height}`);
    addLog(`🔗 Transaction Hash: ${txHash.substring(0, 20)}...`);
    
    return { commitment, height, txHash };
  };

  // Simulate Ethereum smart contract interaction
  const simulateEthereumRecording = async (proof: SessionProof): Promise<string> => {
    addLog('⛓️ Recording session on Ethereum...');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const contractTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    addLog(`✅ Ethereum recording successful! TX: ${contractTxHash.substring(0, 20)}...`);
    
    return contractTxHash;
  };

  // Generate file hash (simplified)
  const generateFileHash = async (data: Uint8Array): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Full process test
  const handleFullProcessTest = async () => {
    setIsProcessing(true);
    setError('');
    setSessionProof(null);
    clearLogs();
    
    try {
      addLog('🚀 Starting full process test...');
      
      // Step 1: Prepare data
      setCurrentStep('Preparing data...');
      addLog('📝 Step 1: Preparing test data...');
      const encoder = new TextEncoder();
      const testData = encoder.encode(testText);
      const fileName = `session-${Date.now()}.txt`;
      
      // Step 2: Generate file hash
      setCurrentStep('Generating file hash...');
      addLog('🔐 Step 2: Generating file hash...');
      const fileHash = await generateFileHash(testData);
      addLog(`✅ File hash: ${fileHash.substring(0, 20)}...`);
      
      // Step 3: Upload to IPFS
      setCurrentStep('Uploading to IPFS...');
      addLog('🌐 Step 3: Uploading to IPFS...');
      const ipfsResult = await ipfs.uploadFilePublic(testData, fileName, 'text/plain');
      addLog(`✅ IPFS upload successful! CID: ${ipfsResult.cid}`);
      addLog(`📊 File size: ${ipfsResult.size} bytes`);
      addLog(`🔗 Gateway URL: ${ipfsResult.gatewayUrl}`);
      
      // Step 4: Create session proof hash
      setCurrentStep('Creating session proof...');
      addLog('🔗 Step 4: Creating session proof hash...');
      const sessionId = `session-${Date.now()}`;
      const sessionProofHash = await generateFileHash(
        encoder.encode(`${ipfsResult.cid}-${fileHash}-${Date.now()}-${sessionId}`)
      );
      addLog(`✅ Session proof hash: ${sessionProofHash.substring(0, 20)}...`);
      
      // Step 5: Submit to Celestia
      setCurrentStep('Submitting to Celestia...');
      addLog('🌌 Step 5: Submitting proof to Celestia...');
      const celestiaResult = await simulateCelestiaSubmission(sessionProofHash);
      
      // Step 6: Create session proof object
      setCurrentStep('Creating session proof object...');
      addLog('📋 Step 6: Creating session proof object...');
      const proof: SessionProof = {
        ipfsCid: ipfsResult.cid,
        celestiaCommitment: celestiaResult.commitment,
        fileHash: fileHash,
        timestamp: Date.now(),
        blockHeight: celestiaResult.height,
        txHash: celestiaResult.txHash,
      };
      
      // Step 7: Record on Ethereum
      setCurrentStep('Recording on Ethereum...');
      addLog('⛓️ Step 7: Recording session on Ethereum...');
      const ethereumTxHash = await simulateEthereumRecording(proof);
      
      // Step 8: Complete
      setCurrentStep('Process completed!');
      addLog('🎉 Step 8: Full process completed successfully!');
      addLog(`📊 Session ID: ${sessionId}`);
      addLog(`🔗 Ethereum TX: ${ethereumTxHash.substring(0, 20)}...`);
      
      setSessionProof(proof);
      addLog('✅ All steps completed successfully!');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Process failed';
      setError(errorMessage);
      addLog(`❌ Error: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  // Test individual components
  const handleIPFSTest = async () => {
    setIsProcessing(true);
    setError('');
    clearLogs();
    
    try {
      addLog('🧪 Testing IPFS upload...');
      const encoder = new TextEncoder();
      const testData = encoder.encode(testText);
      const fileName = `test-${Date.now()}.txt`;
      
      const result = await ipfs.uploadFilePublic(testData, fileName, 'text/plain');
      addLog(`✅ IPFS test successful! CID: ${result.cid}`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'IPFS test failed';
      setError(errorMessage);
      addLog(`❌ IPFS test failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCelestiaTest = async () => {
    setIsProcessing(true);
    setError('');
    clearLogs();
    
    try {
      addLog('🧪 Testing Celestia simulation...');
      const testHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      const result = await simulateCelestiaSubmission(testHash);
      addLog(`✅ Celestia test successful! Commitment: ${result.commitment.substring(0, 20)}...`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Celestia test failed';
      setError(errorMessage);
      addLog(`❌ Celestia test failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerificationTest = async () => {
    if (!sessionProof) return;
    
    setIsProcessing(true);
    setError('');
    clearLogs();
    
    try {
      addLog('🧪 Testing verification process...');
      
      // Verify IPFS file
      addLog('🌐 Verifying IPFS file...');
      const exists = await ipfs.fileExists(sessionProof.ipfsCid);
      if (exists) {
        addLog('✅ IPFS file exists and is accessible');
      } else {
        throw new Error('IPFS file not found');
      }
      
      // Verify file integrity
      addLog('🔐 Verifying file integrity...');
      const data = await ipfs.retrieveFile(sessionProof.ipfsCid);
      const decoder = new TextDecoder('utf8');
      const retrievedText = decoder.decode(data);
      const retrievedHash = await generateFileHash(data);
      
      if (retrievedHash === sessionProof.fileHash) {
        addLog('✅ File integrity verified - hashes match');
      } else {
        throw new Error('File integrity check failed - hashes do not match');
      }
      
      // Verify Celestia commitment (simulated)
      addLog('🌌 Verifying Celestia commitment...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog(`✅ Celestia commitment verified: ${sessionProof.celestiaCommitment.substring(0, 20)}...`);
      
      addLog('🎉 All verification tests passed!');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setError(errorMessage);
      addLog(`❌ Verification failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Full Process Test - IPFS + Celestia + Ethereum
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Text Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Test Data</label>
            <Textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Enter test data for the full process..."
              rows={4}
            />
          </div>

          {/* Process Status */}
          {isProcessing && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="font-medium text-blue-800">{currentStep}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={handleFullProcessTest}
              disabled={isProcessing || !testText.trim()}
              className="w-full"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Database className="w-4 h-4 mr-2" />
              )}
              Full Process Test
            </Button>

            <Button
              onClick={handleIPFSTest}
              disabled={isProcessing}
              variant="outline"
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              IPFS Test
            </Button>

            <Button
              onClick={handleCelestiaTest}
              disabled={isProcessing}
              variant="outline"
              className="w-full"
            >
              <Shield className="w-4 h-4 mr-2" />
              Celestia Test
            </Button>

            <Button
              onClick={handleVerificationTest}
              disabled={isProcessing || !sessionProof}
              variant="outline"
              className="w-full"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Verify
            </Button>
          </div>

          {/* Session Proof Display */}
          {sessionProof && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Session Proof Created!</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">IPFS CID:</span>
                    </div>
                    <code className="block bg-gray-100 p-2 rounded text-xs break-all">
                      {sessionProof.ipfsCid}
                    </code>
                    
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Celestia Commitment:</span>
                    </div>
                    <code className="block bg-gray-100 p-2 rounded text-xs break-all">
                      {sessionProof.celestiaCommitment}
                    </code>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">File Hash:</span>
                    </div>
                    <code className="block bg-gray-100 p-2 rounded text-xs break-all">
                      {sessionProof.fileHash}
                    </code>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Timestamp:</span>
                    </div>
                    <span className="text-xs">{new Date(sessionProof.timestamp).toLocaleString()}</span>
                    
                    <div className="flex items-center gap-2">
                      <Link className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Block Height:</span>
                    </div>
                    <span className="text-xs">{sessionProof.blockHeight}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">Error</span>
                </div>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Process Logs */}
          {logs.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Process Logs</CardTitle>
                  <Button onClick={clearLogs} variant="outline" size="sm">
                    Clear Logs
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="pt-4">
              <h3 className="font-medium mb-2">Test Instructions</h3>
              <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                <li><strong>Full Process Test:</strong> Runs the complete flow: IPFS → Celestia → Ethereum</li>
                <li><strong>IPFS Test:</strong> Tests only the IPFS upload functionality</li>
                <li><strong>Celestia Test:</strong> Tests the Celestia proof submission (simulated)</li>
                <li><strong>Verify:</strong> Verifies the integrity of a completed session proof</li>
              </ol>
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This is a demonstration using simulated Celestia and Ethereum interactions. 
                  In production, these would connect to real networks and smart contracts.
                </p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
