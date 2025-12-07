// Shared types for recording functionality
export interface RecordingConfig {
  videoBitrate: number;
  audioBitrate: number;
  resolution: string;
  frameRate: number;
  mimeType: string;
}

export interface SessionRecording {
  id: string;
  sessionId: string;
  listingAddress: string;
  studentAddress: string;
  educatorAddress: string;
  arbiterAddress: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration: number;
  timestamp: Date;
  status: RecordingStatus;
}

export enum RecordingStatus {
  PENDING = 'pending',
  RECORDING = 'recording',
  ENCRYPTING = 'encrypting',
  UPLOADING = 'uploading',
  ANCHORING = 'anchoring',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface SessionProof {
  ipfsCid: string;
  celestiaCommitment: string;
  fileHash: string;
  timestamp: number;
  blockHeight: number;
  txHash: string;
  metadata: {
    sessionId: string;
    studentAddress: string;
    educatorAddress: string;
    arbiterAddress: string;
    listingAddress: string;
    duration: number;
    fileSize: number;
    mimeType: string;
    quality: string;
  };
}

export interface IPFSUploadResult {
  cid: string;
  size: number;
  gatewayUrl: string;
}

export interface RecordingEvent {
  type: 'recording_started' | 'recording_stopped' | 'recording_progress' | 'recording_completed' | 'recording_failed';
  sessionId: string;
  data?: any;
  timestamp: Date;
}

export interface RecordingControls {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
}
