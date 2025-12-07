import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Play, 
  Pause, 
  Square, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Video,
  Mic
} from 'lucide-react';

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  error: string | null;
  isUploading: boolean;
  recordingStatus: 'idle' | 'recording' | 'paused' | 'uploading' | 'completed' | 'failed';
  sessionProof: any;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onUploadRecording: () => void;
  onResetRecording: () => void;
  formatDuration: (ms: number) => string;
  canRecord: boolean;
  canUpload: boolean;
}

export function RecordingControls({
  isRecording,
  isPaused,
  duration,
  error,
  isUploading,
  recordingStatus,
  sessionProof,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onUploadRecording,
  onResetRecording,
  formatDuration,
  canRecord,
  canUpload
}: RecordingControlsProps) {
  const getStatusColor = () => {
    switch (recordingStatus) {
      case 'recording':
        return 'bg-red-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'uploading':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (recordingStatus) {
      case 'recording':
        return 'Recording';
      case 'paused':
        return 'Paused';
      case 'uploading':
        return 'Uploading';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Ready';
    }
  };

  const getStatusIcon = () => {
    switch (recordingStatus) {
      case 'recording':
        return <Video className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'uploading':
        return <Upload className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Mic className="w-4 h-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Session Recording</CardTitle>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
            <Badge variant="outline" className="flex items-center gap-1">
              {getStatusIcon()}
              {getStatusText()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Duration Display */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-2xl font-mono">
            <Clock className="w-6 h-6" />
            {formatDuration(duration)}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Session Proof Display */}
        {sessionProof && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Recording uploaded successfully</span>
            </div>
            <div className="mt-2 text-xs text-green-600">
              <div>IPFS CID: {sessionProof.ipfsCid}</div>
              <div>Transaction: {sessionProof.txHash}</div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-2">
          {!isRecording ? (
            <Button
              onClick={onStartRecording}
              disabled={!canRecord || isUploading}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start Recording
            </Button>
          ) : (
            <>
              {isPaused ? (
                <Button
                  onClick={onResumeRecording}
                  disabled={isUploading}
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Resume
                </Button>
              ) : (
                <Button
                  onClick={onPauseRecording}
                  disabled={isUploading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </Button>
              )}
              
              <Button
                onClick={onStopRecording}
                disabled={isUploading}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Stop
              </Button>
            </>
          )}
        </div>

        {/* Upload Button (if auto-upload is disabled) */}
        {!isUploading && !sessionProof && recordingStatus === 'idle' && canUpload && (
          <div className="flex justify-center">
            <Button
              onClick={onUploadRecording}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Recording
            </Button>
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <Upload className="w-4 h-4 animate-pulse" />
            <span className="text-sm">Uploading to IPFS...</span>
          </div>
        )}

        {/* Reset Button */}
        {sessionProof && (
          <div className="flex justify-center">
            <Button
              onClick={onResetRecording}
              variant="ghost"
              size="sm"
              className="text-gray-500"
            >
              Reset
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
