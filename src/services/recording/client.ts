import { RecordingConfig, RecordingEvent, SessionProof, IPFSUploadResult } from './types';
import { RecordingAPI, UploadRecordingRequest } from './api';

export class RecordingClient {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private isRecording = false;
  private isPaused = false;
  private startTime: number = 0;
  private duration = 0;
  private config: RecordingConfig;

  constructor(config: Partial<RecordingConfig> = {}) {
    this.config = {
      videoBitrate: 2000000,
      audioBitrate: 128000,
      resolution: '1280x720',
      frameRate: 30,
      mimeType: 'video/webm;codecs=vp8,opus',
      ...config
    };
  }

  /**
   * Initialize recording with a media stream
   */
  async initialize(stream: MediaStream): Promise<void> {
    this.stream = stream;
    
    // Check if MediaRecorder supports the desired mime type
    if (!MediaRecorder.isTypeSupported(this.config.mimeType)) {
      throw new Error(`MIME type ${this.config.mimeType} is not supported`);
    }

    // Create MediaRecorder with configuration
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: this.config.mimeType,
      videoBitsPerSecond: this.config.videoBitrate,
      audioBitsPerSecond: this.config.audioBitrate
    });

    this.setupEventHandlers();
  }

  /**
   * Start recording
   */
  async startRecording(): Promise<void> {
    if (!this.mediaRecorder) {
      throw new Error('Recording not initialized. Call initialize() first.');
    }

    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    this.recordedChunks = [];
    this.isRecording = true;
    this.isPaused = false;
    this.startTime = Date.now();
    this.duration = 0;

    // Start recording with 1-second intervals for data collection
    this.mediaRecorder.start(1000);

    this.emit('recording_started', {
      type: 'recording_started',
      sessionId: '',
      timestamp: new Date()
    });
  }

  /**
   * Stop recording and return the recorded blob
   */
  async stopRecording(): Promise<Blob> {
    if (!this.mediaRecorder || !this.isRecording) {
      throw new Error('No recording in progress');
    }

    return new Promise((resolve, reject) => {
      const handleStop = () => {
        this.isRecording = false;
        this.isPaused = false;
        this.duration = Date.now() - this.startTime;

        const blob = new Blob(this.recordedChunks, { type: this.config.mimeType });
        
        this.emit('recording_stopped', {
          type: 'recording_stopped',
          sessionId: '',
          timestamp: new Date()
        });

        resolve(blob);
      };

      this.mediaRecorder.onstop = handleStop;
      this.mediaRecorder.stop();
    });
  }

  /**
   * Pause recording
   */
  pauseRecording(): void {
    if (!this.mediaRecorder || !this.isRecording || this.isPaused) {
      return;
    }

    this.mediaRecorder.pause();
    this.isPaused = true;
    this.duration += Date.now() - this.startTime;

    this.emit('recording_paused', {
      type: 'recording_progress',
      sessionId: '',
      data: { isPaused: true },
      timestamp: new Date()
    });
  }

  /**
   * Resume recording
   */
  resumeRecording(): void {
    if (!this.mediaRecorder || !this.isRecording || !this.isPaused) {
      return;
    }

    this.mediaRecorder.resume();
    this.isPaused = false;
    this.startTime = Date.now();

    this.emit('recording_resumed', {
      type: 'recording_progress',
      sessionId: '',
      data: { isPaused: false },
      timestamp: new Date()
    });
  }

  /**
   * Get current recording status
   */
  getStatus() {
    return {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      duration: this.isRecording ? (this.isPaused ? this.duration : this.duration + (Date.now() - this.startTime)) : 0,
      chunksCount: this.recordedChunks.length
    };
  }

  /**
   * Setup MediaRecorder event handlers
   */
  private setupEventHandlers(): void {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
        
        this.emit('recording_progress', {
          type: 'recording_progress',
          sessionId: '',
          data: {
            chunksCount: this.recordedChunks.length,
            currentDuration: this.isRecording ? (this.isPaused ? this.duration : this.duration + (Date.now() - this.startTime)) : 0
          },
          timestamp: new Date()
        });
      }
    };

    this.mediaRecorder.onerror = (event) => {
      this.emit('recording_failed', {
        type: 'recording_failed',
        sessionId: '',
        data: { error: event },
        timestamp: new Date()
      });
    };
  }

  /**
   * Upload recording to backend for processing
   */
  async uploadRecording(
    sessionId: string,
    listingAddress: string,
    studentAddress: string,
    educatorAddress: string,
    arbiterAddress: string
  ): Promise<SessionProof> {
    if (this.recordedChunks.length === 0) {
      throw new Error('No recording data to upload');
    }

    const blob = new Blob(this.recordedChunks, { type: this.config.mimeType });
    const file = new File([blob], `${sessionId}.webm`, { type: this.config.mimeType });

    const uploadRequest: UploadRecordingRequest = {
      sessionId,
      listingAddress,
      studentAddress,
      educatorAddress,
      arbiterAddress,
      metadata: {
        duration: this.duration,
        mimeType: this.config.mimeType,
        fileSize: blob.size,
        quality: this.config.resolution
      }
    };

    try {
      const result = await RecordingAPI.uploadRecording(file, uploadRequest);
      
      this.emit('recording_completed', {
        type: 'recording_completed',
        sessionId,
        data: result,
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      this.emit('recording_failed', {
        type: 'recording_failed',
        sessionId,
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Event emitter functionality
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: RecordingEvent): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    this.mediaRecorder = null;
    this.stream = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.isPaused = false;
    this.eventListeners.clear();
  }
}
