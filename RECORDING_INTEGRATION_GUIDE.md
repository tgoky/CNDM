# Recording Integration Guide

This guide explains how to integrate the zoom-session-recorder with the learn-chain-connect frontend application.

## Overview

The integration provides:
- **Real-time WebRTC recording** with MediaRecorder API
- **Automatic IPFS upload** and encryption
- **Celestia proof anchoring** for data availability
- **Ethereum smart contract integration** for session management
- **Dispute resolution** capabilities

## Architecture

```
Frontend (learn-chain-connect)
├── Recording Client (MediaRecorder)
├── WebRTC Session Hook
├── Recording Controls UI
└── API Integration

Backend (zoom-session-recorder)
├── IPFS Upload Service
├── Encryption Service
├── Celestia Integration
├── Ethereum Smart Contracts
└── Session Orchestration
```

## Installation

### 1. Install Dependencies

```bash
cd learn-chain-connect
npm install web3.storage crypto-js axios @types/crypto-js
```

### 2. Environment Configuration

Create a `.env.local` file:

```env
# Recording Service Configuration
VITE_RECORDING_API_URL=http://localhost:3001/api

# IPFS Configuration
VITE_IPFS_GATEWAY_URL=https://ipfs.io/ipfs/

# Web3.Storage Configuration
VITE_WEB3_STORAGE_TOKEN=your_web3_storage_token_here

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

### 3. Backend Setup

Start the zoom-session-recorder backend:

```bash
cd ../zoom-session-recorder
npm install
npm run dev
```

## Usage

### Basic Integration

Replace the existing WebRTC hook with the recording-enabled version:

```typescript
// Before
import { useWebRTCSession } from '../hooks/use-webrtc-session';

// After
import { useWebRTCSessionWithRecording } from '../hooks/use-webrtc-session-with-recording';
```

### Component Integration

Use the new learning session component:

```typescript
import LearningSessionWithRecording from '../pages/LearningSessionWithRecording';

// In your routing
<Route path="/session/:id" element={<LearningSessionWithRecording />} />
```

### Recording Controls

Add recording controls to any component:

```typescript
import { RecordingControls } from '../components/RecordingControls';
import { useRecording } from '../hooks/use-recording';

function MyComponent() {
  const recording = useRecording({
    sessionId: 'session_123',
    listingAddress: '0x...',
    studentAddress: '0x...',
    educatorAddress: '0x...',
    arbiterAddress: '0x...'
  });

  return (
    <RecordingControls
      isRecording={recording.isRecording}
      isPaused={recording.isPaused}
      duration={recording.duration}
      error={recording.error}
      isUploading={recording.isUploading}
      recordingStatus={recording.recordingStatus}
      sessionProof={recording.sessionProof}
      onStartRecording={recording.startRecording}
      onStopRecording={recording.stopRecording}
      onPauseRecording={recording.pauseRecording}
      onResumeRecording={recording.resumeRecording}
      onUploadRecording={recording.uploadRecording}
      onResetRecording={recording.resetRecording}
      formatDuration={recording.formatDuration}
      canRecord={recording.canRecord}
      canUpload={recording.canUpload}
    />
  );
}
```

## API Integration

### Recording API

The `RecordingAPI` class provides methods for:

```typescript
import { RecordingAPI } from '../services/recording/api';

// Upload recording
const sessionProof = await RecordingAPI.uploadRecording(file, {
  sessionId: 'session_123',
  listingAddress: '0x...',
  studentAddress: '0x...',
  educatorAddress: '0x...',
  arbiterAddress: '0x...',
  metadata: {
    duration: 30000,
    mimeType: 'video/webm',
    fileSize: 1024000,
    quality: '1280x720'
  }
});

// Get recording status
const status = await RecordingAPI.getRecordingStatus('session_123');

// Verify session proof
const verification = await RecordingAPI.verifySessionProof(sessionProof);
```

## Configuration

### Recording Quality

Adjust recording quality in the configuration:

```typescript
import { recordingConfig } from '../config/recording';

const customConfig = {
  ...recordingConfig,
  quality: {
    videoBitrate: 4000000, // 4 Mbps
    audioBitrate: 256000,  // 256 kbps
    resolution: '1920x1080', // 1080p
    frameRate: 60,         // 60 FPS
    mimeType: 'video/webm;codecs=vp9,opus'
  }
};
```

### Auto-Recording

Enable automatic recording:

```typescript
const webRTCSession = useWebRTCSessionWithRecording({
  listingAddress: '0x...',
  participants: participants,
  autoStartRecording: true,  // Start recording automatically
  autoStopRecording: true,   // Stop recording when session ends
  recordingConfig: customConfig
});
```

## Error Handling

### Common Errors

1. **Camera/Microphone Access Denied**
   ```typescript
   if (error?.includes('camera') || error?.includes('microphone')) {
     // Show permission request UI
   }
   ```

2. **Recording Not Supported**
   ```typescript
   if (!MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
     // Fallback to different codec
   }
   ```

3. **Upload Failed**
   ```typescript
   if (recordingStatus === 'failed') {
     // Show retry option
   }
   ```

### Retry Logic

Implement retry logic for failed uploads:

```typescript
const retryUpload = async (maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await recording.uploadRecording();
      break;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

## Testing

### Local Testing

1. Start the backend:
   ```bash
   cd zoom-session-recorder
   npm run dev
   ```

2. Start the frontend:
   ```bash
   cd learn-chain-connect
   npm run dev
   ```

3. Navigate to a learning session and test recording

### Production Testing

1. Deploy backend to your server
2. Update `VITE_RECORDING_API_URL` in environment
3. Test with real WebRTC sessions

## Troubleshooting

### Common Issues

1. **Recording not starting**
   - Check browser permissions
   - Verify MediaRecorder support
   - Check console for errors

2. **Upload failing**
   - Verify backend is running
   - Check network connectivity
   - Verify API configuration

3. **Poor recording quality**
   - Adjust bitrate settings
   - Check network bandwidth
   - Verify device capabilities

### Debug Mode

Enable debug logging:

```typescript
// In recording client
const client = new RecordingClient({
  debug: true
});
```

## Security Considerations

1. **Encryption**: All recordings are encrypted before IPFS upload
2. **Access Control**: Only authorized participants can access recordings
3. **Data Privacy**: No recording data is stored locally after upload
4. **Secure Upload**: Use HTTPS for all API communications

## Performance Optimization

1. **Chunked Recording**: Record in small chunks to reduce memory usage
2. **Compression**: Use efficient codecs (VP8/VP9)
3. **Background Processing**: Upload recordings in background
4. **Cleanup**: Remove local recording data after successful upload

## Monitoring

### Recording Metrics

Track recording performance:

```typescript
const metrics = {
  recordingDuration: recording.duration,
  fileSize: recording.fileSize,
  uploadTime: recording.uploadTime,
  successRate: recording.successRate
};
```

### Error Tracking

Monitor recording errors:

```typescript
recording.on('recording_failed', (error) => {
  // Log error to monitoring service
  console.error('Recording failed:', error);
});
```

## Future Enhancements

1. **Real-time Transcription**: Add speech-to-text during recording
2. **AI Analysis**: Automated content analysis for disputes
3. **Multi-format Support**: Support for different video formats
4. **Cloud Storage**: Integration with additional storage providers
5. **Mobile Support**: Optimized recording for mobile devices

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review the API documentation
3. Check GitHub issues
4. Contact the development team

## License

This integration follows the same license as the main DED project.
