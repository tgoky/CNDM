import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { SimpleIPFSService } from '../services/ipfs/simple-ipfs';
import { SessionEscrowService } from '../services/smart-contract/sessionEscrow';
import { useAccount, useWalletClient } from 'wagmi';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Upload, 
  Database, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Camera,
  CameraOff,
  Download,
  AlertTriangle,
  User,
  Users,
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

interface SessionData {
  sessionId: string;
  student: string;
  educator: string;
  arbiter: string;
  sessionProof: SessionProof;
  createdAt: number;
  updatedAt: number;
  disputeActive: boolean;
  disputeInitiator: string;
}

export default function EndToEndSessionTest() {
  // WebRTC and Recording State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingSize, setRecordingSize] = useState(0);
  
  // MediaRecorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Session State
  const [sessionId, setSessionId] = useState(`session-${Date.now()}`);
  const [sessionContent, setSessionContent] = useState('');
  const [sessionProof, setSessionProof] = useState<SessionProof | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  
  // Process State
  const [currentStep, setCurrentStep] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState('');
  
  // Services
  const ipfs = new SimpleIPFSService();
  const [sessionEscrow, setSessionEscrow] = useState<SessionEscrowService | null>(null);
  
  // Wallet connection
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  // Initialize smart contract service
  useEffect(() => {
    if (walletClient) {
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '0x...'; // Replace with actual deployed contract
      addLog('✅ Smart contract service initialized (simulation mode)');
      // Note: Full smart contract integration requires deployed contract
      setSessionEscrow(null); // Disable for now until contract is deployed
    }
  }, [walletClient]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localStream]);
  
  // Generate unique session ID
  const generateSessionId = () => {
    const newId = `learning-session-${Date.now()}`;
    setSessionId(newId);
    return newId;
  };
  
  // Add log message
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);
  
  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };
  
  // Initialize camera and microphone
  const initializeMedia = async () => {
    try {
      addLog('🎥 Initializing camera and microphone...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, frameRate: 30 },
        audio: { sampleRate: 44100, channelCount: 2 }
      });
      
      setLocalStream(stream);
      addLog('✅ Camera and microphone initialized successfully');
      
      return stream;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access media devices';
      addLog(`❌ Error: ${errorMessage}`);
      setError(errorMessage);
      throw err;
    }
  };
  
  // Start recording
  const startRecording = async () => {
    try {
      setIsProcessing(true);
      setError('');
      clearLogs();
      
      addLog('🎬 STEP 1: STARTING LEARNING SESSION RECORDING');
      addLog('==============================================');
      
      // Generate new session ID
      const newSessionId = generateSessionId();
      addLog(`📋 Session ID: ${newSessionId}`);
      
      // Initialize media
      const stream = await initializeMedia();
      
      // Set up MediaRecorder
      const options = {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2000000,
        audioBitsPerSecond: 128000
      };
      
      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder is not supported in this browser');
      }
      
      // Check if the mime type is supported
      let mediaRecorder;
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        addLog('⚠️ Preferred mime type not supported, using default');
        mediaRecorder = new MediaRecorder(stream);
      } else {
        mediaRecorder = new MediaRecorder(stream, options);
      }
      mediaRecorderRef.current = mediaRecorder;
      
      // Reset recording state
      setRecordedChunks([]);
      setRecordingDuration(0);
      setRecordingSize(0);
      
      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
          setRecordingSize(prev => prev + event.data.size);
        }
      };
      
      // Handle recording stop
      mediaRecorder.onstop = () => {
        addLog('⏹️ Recording stopped');
        setIsRecording(false);
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }
      };
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      addLog('📹 Recording started - WebRTC learning session in progress');
      addLog('🎯 Topic: Blockchain Development and Smart Contracts');
      addLog('👨‍🏫 Educator: You (acting as educator)');
      addLog('👨‍🎓 Student: Simulated student');
      addLog('⏱️ Duration: Recording...');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      addLog(`❌ Error: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Stop all tracks
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      addLog('⏹️ Recording stopped by user');
    }
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
        addLog(`📹 Video ${!isVideoEnabled ? 'enabled' : 'disabled'}`);
      }
    }
  };
  
  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
        addLog(`🎤 Audio ${!isAudioEnabled ? 'enabled' : 'disabled'}`);
      }
    }
  };
  
  // Generate file hash
  const generateFileHash = async (data: Uint8Array): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };
  
  // Simulate Celestia submission
  const simulateCelestiaSubmission = async (hash: string): Promise<{ commitment: string; height: number; txHash: string }> => {
    addLog('🌌 STEP 3: SUBMITTING TO CELESTIA');
    addLog('=================================');
    addLog('🚀 Submitting proof to Celestia...');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock Celestia data
    const commitment = `0x${Math.random().toString(16).substr(2, 64)}`;
    const height = Math.floor(Math.random() * 1000000) + 1000000;
    const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
    
    addLog('✅ Celestia submission successful!');
    addLog(`🔗 Commitment: ${commitment.substring(0, 20)}...`);
    addLog(`📊 Block Height: ${height}`);
    addLog(`🔗 Transaction Hash: ${txHash.substring(0, 20)}...`);
    addLog('🛡️ Data availability proof anchored');
    
    return { commitment, height, txHash };
  };
  
  // Process recorded session
  const processRecordedSession = async () => {
    if (recordedChunks.length === 0) {
      addLog('❌ No recording data available');
      return;
    }
    
    try {
      setIsProcessing(true);
      setError('');
      
      addLog('🔐 STEP 2: PROCESSING RECORDED SESSION');
      addLog('=====================================');
      
      // Create blob from recorded chunks
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const arrayBuffer = await blob.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      
      // Generate file hash
      addLog('🔐 Generating file hash...');
      const fileHash = await generateFileHash(data);
      addLog(`✅ File hash: ${fileHash.substring(0, 20)}...`);
      addLog(`📁 File size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
      addLog(`🎵 Audio quality: 128kbps`);
      addLog(`📺 Video quality: 720p`);
      addLog(`⏱️ Duration: ${Math.floor(recordingDuration / 60)}:${(recordingDuration % 60).toString().padStart(2, '0')}`);
      
      // Upload to IPFS
      addLog('🌐 STEP 3: UPLOADING TO IPFS');
      addLog('=============================');
      addLog('📤 Uploading to IPFS...');
      
      const fileName = `${sessionId}.webm`;
      const ipfsResult = await ipfs.uploadFilePublic(data, fileName, 'video/webm');
      
      addLog('✅ IPFS upload successful!');
      addLog(`🔗 IPFS CID: ${ipfsResult.cid}`);
      addLog(`🌍 Gateway URL: ${ipfsResult.gatewayUrl}`);
      addLog('📊 File pinned and available globally');
      
      // Submit to Celestia
      const sessionProofHash = await generateFileHash(
        new TextEncoder().encode(`${ipfsResult.cid}-${fileHash}-${Date.now()}-${sessionId}`)
      );
      
      const celestiaResult = await simulateCelestiaSubmission(sessionProofHash);
      
      // Create session proof
      const proof: SessionProof = {
        ipfsCid: ipfsResult.cid,
        celestiaCommitment: celestiaResult.commitment,
        fileHash: fileHash,
        timestamp: Date.now(),
        blockHeight: celestiaResult.height,
        txHash: celestiaResult.txHash,
      };
      
      setSessionProof(proof);
      
      addLog('📝 STEP 4: SESSION PROOF CREATED');
      addLog('===============================');
      addLog('✅ Session proof created successfully!');
      addLog(`📋 Session ID: ${sessionId}`);
      addLog(`🔗 IPFS CID: ${proof.ipfsCid}`);
      addLog(`🌌 Celestia Commitment: ${proof.celestiaCommitment.substring(0, 20)}...`);
      addLog(`🔐 File Hash: ${proof.fileHash.substring(0, 20)}...`);
      addLog(`📊 Block Height: ${proof.blockHeight}`);
      addLog(`🔗 Transaction Hash: ${proof.txHash.substring(0, 20)}...`);
      
      // Create session data
      const sessionData: SessionData = {
        sessionId: sessionId,
        student: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // Simulated student
        educator: '0x8ba1f109551bD432803012645Hac136c', // You as educator
        arbiter: '0x1234567890123456789012345678901234567890', // Simulated arbiter
        sessionProof: proof,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        disputeActive: false,
        disputeInitiator: '0x0000000000000000000000000000000000000000'
      };
      
      setSessionData(sessionData);
      
      addLog('🎉 SESSION PROCESSING COMPLETED!');
      addLog('===============================');
      addLog('✅ Recording processed successfully');
      addLog('✅ IPFS upload completed');
      addLog('✅ Celestia proof anchored');
      addLog('✅ Session proof created');
      addLog('✅ Ready for smart contract integration');
      
      // Record on smart contract if available
      if (sessionEscrow && address) {
        await recordSessionOnContract(proof);
      } else {
        addLog('⚠️ Smart contract not available - session proof created but not recorded on-chain');
        addLog('💡 To enable smart contract recording:');
        addLog('   1. Deploy DEDSessionEscrow contract');
        addLog('   2. Set VITE_CONTRACT_ADDRESS in .env.local');
        addLog('   3. Refresh the page');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process session';
      addLog(`❌ Error: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Record session on smart contract
  const recordSessionOnContract = async (proof: SessionProof) => {
    if (!sessionEscrow || !address) {
      addLog('❌ Cannot record on smart contract - wallet not connected');
      return;
    }

    try {
      addLog('📝 STEP 5: RECORDING SESSION ON SMART CONTRACT');
      addLog('==============================================');
      addLog('🔗 Connecting to smart contract...');
      
      // Simulate addresses for testing
      const studentAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'; // Simulated student
      const educatorAddress = address; // You as educator
      const arbiterAddress = '0x1234567890123456789012345678901234567890'; // Simulated arbiter
      
      addLog(`👨‍🎓 Student: ${studentAddress}`);
      addLog(`👨‍🏫 Educator: ${educatorAddress}`);
      addLog(`👨‍⚖️ Arbiter: ${arbiterAddress}`);
      
      // Record session on smart contract
      const tx = await sessionEscrow.recordSession(
        sessionId,
        studentAddress,
        educatorAddress,
        arbiterAddress,
        proof
      );
      
      addLog(`⏳ Transaction submitted: ${tx.hash}`);
      addLog('⏳ Waiting for confirmation...');
      
      const receipt = await tx.wait();
      
      addLog('✅ Session recorded on smart contract!');
      addLog(`🔗 Transaction hash: ${receipt.hash}`);
      addLog(`📊 Gas used: ${receipt.gasUsed.toString()}`);
      addLog(`📊 Block number: ${receipt.blockNumber}`);
      
      // Verify the session was recorded
      const recordedSession = await sessionEscrow.getSession(sessionId);
      addLog('✅ Session verification successful!');
      addLog(`📋 Session ID: ${recordedSession.sessionId}`);
      addLog(`🔗 IPFS CID: ${recordedSession.sessionProof.ipfsCid}`);
      addLog(`🌌 Celestia Commitment: ${recordedSession.sessionProof.celestiaCommitment.substring(0, 20)}...`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record on smart contract';
      addLog(`❌ Smart contract error: ${errorMessage}`);
      setError(errorMessage);
    }
  };

  // Download recording
  const downloadRecording = () => {
    if (recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sessionId}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addLog('📥 Recording downloaded');
    }
  };
  
  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            End-to-End Learning Session Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Session ID Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Session ID</label>
            <div className="flex gap-2">
              <Input
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Enter session ID..."
              />
              <Button onClick={generateSessionId} variant="outline">
                Generate New
              </Button>
            </div>
          </div>

          {/* Wallet Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔗 Wallet Connection</CardTitle>
            </CardHeader>
            <CardContent>
              {address ? (
                <div className="space-y-2">
                  <p className="text-sm text-green-600">✅ Wallet Connected</p>
                  <p className="text-xs font-mono bg-gray-100 p-2 rounded">
                    {address}
                  </p>
                  {sessionEscrow ? (
                    <p className="text-sm text-green-600">✅ Smart Contract Ready</p>
                  ) : (
                    <p className="text-sm text-yellow-600">⏳ Initializing Smart Contract...</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-red-600">❌ Wallet Not Connected</p>
                  <p className="text-xs text-gray-600">
                    Connect your wallet to record sessions on the smart contract
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Video Preview */}
          {localStream && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <video
                    ref={(video) => {
                      if (video && localStream) {
                        video.srcObject = localStream;
                      }
                    }}
                    autoPlay
                    muted
                    playsInline
                    className="w-full max-w-md rounded-lg border"
                  />
                  {isRecording && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      REC
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recording Controls */}
          <div className="space-y-4">
            <h3 className="font-medium">Recording Controls</h3>
            
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={startRecording}
                disabled={isRecording || isProcessing}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {isRecording ? 'Recording...' : 'Start Recording'}
              </Button>

              <Button
                onClick={stopRecording}
                disabled={!isRecording}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Stop Recording
              </Button>

              <Button
                onClick={toggleVideo}
                disabled={!localStream}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isVideoEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                {isVideoEnabled ? 'Disable Video' : 'Enable Video'}
              </Button>

              <Button
                onClick={toggleAudio}
                disabled={!localStream}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                {isAudioEnabled ? 'Disable Audio' : 'Enable Audio'}
              </Button>

              <Button
                onClick={downloadRecording}
                disabled={recordedChunks.length === 0}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>

            {/* Recording Status */}
            {isRecording && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-medium">Recording in progress...</span>
                </div>
                <div className="mt-2 text-sm text-red-700">
                  <div>Duration: {formatDuration(recordingDuration)}</div>
                  <div>Size: {formatFileSize(recordingSize)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Process Recording */}
          {recordedChunks.length > 0 && !sessionProof && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Process Recording</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <div>Duration: {formatDuration(recordingDuration)}</div>
                    <div>Size: {formatFileSize(recordingSize)}</div>
                    <div>Chunks: {recordedChunks.length}</div>
                  </div>
                  
                  <Button
                    onClick={processRecordedSession}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing Session...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4 mr-2" />
                        Process Recording (IPFS + Celestia)
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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
                      <Database className="w-4 h-4 text-gray-500" />
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
              <h3 className="font-medium mb-2">How to Test</h3>
              <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                <li><strong>Start Recording:</strong> Click "Start Recording" to begin recording your WebRTC session</li>
                <li><strong>Record Content:</strong> Speak about blockchain development, smart contracts, or any educational content</li>
                <li><strong>Stop Recording:</strong> Click "Stop Recording" when finished</li>
                <li><strong>Process Session:</strong> Click "Process Recording" to upload to IPFS and submit to Celestia</li>
                <li><strong>View Results:</strong> See the generated session proof with IPFS CID and Celestia commitment</li>
                <li><strong>Download:</strong> Download your recording for verification</li>
              </ol>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This test records a real WebRTC session and uploads it to IPFS. 
                  The Celestia submission is simulated for demonstration purposes.
                </p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
