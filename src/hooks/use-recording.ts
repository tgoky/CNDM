import { useState, useEffect, useRef, useCallback } from 'react';
import { RecordingClient } from '../services/recording/client';
import { RecordingEvent, RecordingConfig, SessionProof } from '../services/recording/types';

interface UseRecordingOptions {
  sessionId?: string;
  listingAddress?: string;
  studentAddress?: string;
  educatorAddress?: string;
  arbiterAddress?: string;
  config?: Partial<RecordingConfig>;
  autoUpload?: boolean;
}

export function useRecording(options: UseRecordingOptions = {}) {
  const {
    sessionId,
    listingAddress,
    studentAddress,
    educatorAddress,
    arbiterAddress,
    config,
    autoUpload = true
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sessionProof, setSessionProof] = useState<SessionProof | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'paused' | 'uploading' | 'completed' | 'failed'>('idle');

  const recordingClientRef = useRef<RecordingClient | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize recording client
  useEffect(() => {
    recordingClientRef.current = new RecordingClient(config);
    
    // Set up event listeners
    const client = recordingClientRef.current;
    
    const handleRecordingStarted = () => {
      setIsRecording(true);
      setIsPaused(false);
      setError(null);
      setRecordingStatus('recording');
      startDurationTimer();
    };

    const handleRecordingStopped = () => {
      setIsRecording(false);
      setIsPaused(false);
      stopDurationTimer();
    };

    const handleRecordingPaused = () => {
      setIsPaused(true);
      setRecordingStatus('paused');
    };

    const handleRecordingResumed = () => {
      setIsPaused(false);
      setRecordingStatus('recording');
    };

    const handleRecordingProgress = (event: RecordingEvent) => {
      if (event.data?.currentDuration) {
        setDuration(event.data.currentDuration);
      }
    };

    const handleRecordingCompleted = (event: RecordingEvent) => {
      setRecordingStatus('completed');
      setSessionProof(event.data);
    };

    const handleRecordingFailed = (event: RecordingEvent) => {
      setError(event.data?.error || 'Recording failed');
      setRecordingStatus('failed');
      setIsRecording(false);
      setIsPaused(false);
      stopDurationTimer();
    };

    client.on('recording_started', handleRecordingStarted);
    client.on('recording_stopped', handleRecordingStopped);
    client.on('recording_paused', handleRecordingPaused);
    client.on('recording_resumed', handleRecordingResumed);
    client.on('recording_progress', handleRecordingProgress);
    client.on('recording_completed', handleRecordingCompleted);
    client.on('recording_failed', handleRecordingFailed);

    return () => {
      client.off('recording_started', handleRecordingStarted);
      client.off('recording_stopped', handleRecordingStopped);
      client.off('recording_paused', handleRecordingPaused);
      client.off('recording_resumed', handleRecordingResumed);
      client.off('recording_progress', handleRecordingProgress);
      client.off('recording_completed', handleRecordingCompleted);
      client.off('recording_failed', handleRecordingFailed);
    };
  }, [config]);

  // Duration timer
  const startDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    durationIntervalRef.current = setInterval(() => {
      setDuration(prev => prev + 1000);
    }, 1000);
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  // Initialize recording with stream
  const initializeRecording = useCallback(async (stream: MediaStream) => {
    if (!recordingClientRef.current) {
      throw new Error('Recording client not initialized');
    }

    try {
      setError(null);
      await recordingClientRef.current.initialize(stream);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize recording';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!recordingClientRef.current) {
      throw new Error('Recording client not initialized');
    }

    try {
      setError(null);
      await recordingClientRef.current.startRecording();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (!recordingClientRef.current) {
      throw new Error('Recording client not initialized');
    }

    try {
      setError(null);
      const blob = await recordingClientRef.current.stopRecording();
      
      // Auto-upload if enabled and all required parameters are present
      if (autoUpload && sessionId && listingAddress && studentAddress && educatorAddress && arbiterAddress) {
        setIsUploading(true);
        setRecordingStatus('uploading');
        
        try {
          const proof = await recordingClientRef.current.uploadRecording(
            sessionId,
            listingAddress,
            studentAddress,
            educatorAddress,
            arbiterAddress
          );
          setSessionProof(proof);
        } catch (uploadError) {
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Upload failed';
          setError(errorMessage);
          setRecordingStatus('failed');
        } finally {
          setIsUploading(false);
        }
      }
      
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop recording';
      setError(errorMessage);
      throw err;
    }
  }, [autoUpload, sessionId, listingAddress, studentAddress, educatorAddress, arbiterAddress]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (recordingClientRef.current) {
      recordingClientRef.current.pauseRecording();
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (recordingClientRef.current) {
      recordingClientRef.current.resumeRecording();
    }
  }, []);

  // Manual upload (if auto-upload is disabled)
  const uploadRecording = useCallback(async () => {
    if (!recordingClientRef.current || !sessionId || !listingAddress || !studentAddress || !educatorAddress || !arbiterAddress) {
      throw new Error('Missing required parameters for upload');
    }

    try {
      setIsUploading(true);
      setRecordingStatus('uploading');
      setError(null);

      const proof = await recordingClientRef.current.uploadRecording(
        sessionId,
        listingAddress,
        studentAddress,
        educatorAddress,
        arbiterAddress
      );
      
      setSessionProof(proof);
      setRecordingStatus('completed');
      return proof;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setRecordingStatus('failed');
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [sessionId, listingAddress, studentAddress, educatorAddress, arbiterAddress]);

  // Reset recording state
  const resetRecording = useCallback(() => {
    setDuration(0);
    setError(null);
    setSessionProof(null);
    setRecordingStatus('idle');
    setIsUploading(false);
    stopDurationTimer();
  }, [stopDurationTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingClientRef.current) {
        recordingClientRef.current.cleanup();
      }
      stopDurationTimer();
    };
  }, [stopDurationTimer]);

  // Format duration for display
  const formatDuration = useCallback((ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
  }, []);

  return {
    // State
    isRecording,
    isPaused,
    duration,
    error,
    isUploading,
    sessionProof,
    recordingStatus,
    
    // Actions
    initializeRecording,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    uploadRecording,
    resetRecording,
    
    // Utilities
    formatDuration,
    canRecord: !!recordingClientRef.current,
    canUpload: !!(sessionId && listingAddress && studentAddress && educatorAddress && arbiterAddress)
  };
}
