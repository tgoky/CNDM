import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useListingSession } from '../hooks/use-listing-session';
import { useWebRTCSessionWithRecording } from '../hooks/use-webrtc-session-with-recording';
import { RecordingControls } from '../components/RecordingControls';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Share2, 
  Users, 
  MessageCircle,
  Settings,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function LearningSessionWithRecording() {
  console.log('LearningSessionWithRecording component starting...');
  
  try {
    const { address, isConnected } = useAccount();
    const { id: listingId } = useParams();
    const navigate = useNavigate();
  
    // WebRTC state
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
    const [isVideoBlocked, setIsVideoBlocked] = useState(false);
    const [hasManuallyJoined, setHasManuallyJoined] = useState(false);
    const [isEndSessionModalOpen, setIsEndSessionModalOpen] = useState(false);
    const [isReputationModalOpen, setIsReputationModalOpen] = useState(false);
    
    // Video refs
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const screenShareRef = useRef<HTMLVideoElement>(null);
    const hasAutoJoinedRef = useRef(false);
    const videoInitializedRef = useRef(false);
    
    // Dynamic listing data
    const { sessionData, isLoading: sessionLoading } = useListingSession(listingId);
    
    // WebRTC session with recording
    const {
      // WebRTC State
      peers,
      localStream,
      isConnected: isWebRTCConnected,
      isConnecting,
      error: webrtcError,
      isVideoEnabled,
      isAudioEnabled,
      joinSession,
      leaveSession,
      toggleVideo,
      toggleAudio,
      
      // Recording State
      isRecording,
      isRecordingPaused,
      recordingDuration,
      recordingError,
      isUploading,
      sessionProof,
      recordingStatus,
      
      // Recording Actions
      startRecording,
      stopRecording,
      pauseRecording,
      resumeRecording,
      uploadRecording,
      resetRecording,
      
      // Utilities
      formatDuration,
      canRecord,
      canUpload
    } = useWebRTCSessionWithRecording({
      listingAddress: listingId,
      participants: sessionData?.participants || [],
      autoStartRecording: false,
      autoStopRecording: true
    });
    
    // Auto-join session when listing is confirmed and user is participant
    useEffect(() => {
      try {
        if (isConnected && // Check if wallet is connected
            sessionData?.isCurrentUserParticipant && 
            sessionData.state === 'InProgress' && 
            !hasAutoJoinedRef.current &&
            !hasManuallyJoined) {
          
          console.log('Auto-joining session...', {
            isConnected,
            isCurrentUserParticipant: sessionData.isCurrentUserParticipant,
            state: sessionData.state,
            hasAutoJoined: hasAutoJoinedRef.current,
            hasManuallyJoined
          });
          
          hasAutoJoinedRef.current = true;
          joinSession();
        }
      } catch (error) {
        console.error('Error in auto-join effect:', error);
      }
    }, [isConnected, sessionData, hasManuallyJoined, joinSession]);

    // Initialize video when stream is available
    useEffect(() => {
      if (localStream && localVideoRef.current && !videoInitializedRef.current) {
        console.log('Setting up local video stream...');
        localVideoRef.current.srcObject = localStream;
        videoInitializedRef.current = true;
      }
    }, [localStream]);

    // Handle video track changes
    useEffect(() => {
      if (localStream && localVideoRef.current) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            console.log('Video track ended');
            setIsVideoBlocked(true);
          };
        }
      }
    }, [localStream]);

    const toggleScreenShare = async () => {
      console.log('toggleScreenShare called, current state:', isScreenSharing);
      
      if (!isScreenSharing) {
        try {
          console.log('Starting screen share...');
          console.log('Checking if getDisplayMedia is available:', !!navigator.mediaDevices?.getDisplayMedia);
          
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false
          });
          
          console.log('Screen share stream obtained:', stream);
          console.log('Stream tracks:', stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));
          
          // Store the stream and set state to render the video element
          setScreenShareStream(stream);
          setIsScreenSharing(true);
          
          // Wait for the component to re-render and create the video element
          setTimeout(async () => {
            if (screenShareRef.current) {
              console.log('Setting screen share srcObject...');
              screenShareRef.current.srcObject = stream;
              
              // Try to play the screen share video
              try {
                await screenShareRef.current.play();
                console.log('Screen share video playing successfully');
              } catch (error) {
                console.error('Error playing screen share video:', error);
              }
            } else {
              console.error('screenShareRef.current is still null after timeout!');
            }
          }, 100);
          
        } catch (error) {
          console.error('Error sharing screen:', error);
          setIsScreenSharing(false);
        }
      } else {
        console.log('Stopping screen share...');
        if (screenShareRef.current?.srcObject) {
          const stream = screenShareRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          screenShareRef.current.srcObject = null;
        }
        if (screenShareStream) {
          screenShareStream.getTracks().forEach(track => track.stop());
          setScreenShareStream(null);
        }
        setIsScreenSharing(false);
      }
    };

    const copySessionLink = () => {
      navigator.clipboard.writeText(window.location.href);
    };

    const handleEndSession = async () => {
      try {
        // Stop recording if active
        if (isRecording) {
          await stopRecording();
        }
        
        // Leave WebRTC session
        await leaveSession();
        
        // Navigate back to listing or dashboard
        navigate('/marketplace');
      } catch (error) {
        console.error('Error ending session:', error);
      }
    };

    if (sessionLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading session...</p>
          </div>
        </div>
      );
    }

    if (!sessionData) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Not Found</h2>
            <p className="text-gray-600 mb-4">The requested learning session could not be found.</p>
            <Button onClick={() => navigate('/marketplace')}>
              Back to Marketplace
            </Button>
          </div>
        </div>
      );
    }

    if (!sessionData.isCurrentUserParticipant) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You are not authorized to join this session.</p>
            <Button onClick={() => navigate('/marketplace')}>
              Back to Marketplace
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-900">
                  {sessionData.title}
                </h1>
                <Badge variant={sessionData.state === 'InProgress' ? 'default' : 'secondary'}>
                  {sessionData.state}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Participants
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChatOpen(!isChatOpen)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copySessionLink}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsEndSessionModalOpen(true)}
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  End Session
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Video Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Local Video */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Your Video</span>
                    <div className="flex items-center space-x-2">
                      {isVideoBlocked && (
                        <Badge variant="destructive" className="text-xs">
                          Camera Blocked
                        </Badge>
                      )}
                      {isWebRTCConnected && (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    {isVideoBlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
                        <div className="text-center">
                          <VideoOff className="w-12 h-12 mx-auto mb-2" />
                          <p>Camera is blocked or unavailable</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Screen Share */}
              {isScreenSharing && (
                <Card>
                  <CardHeader>
                    <CardTitle>Screen Share</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                      <video
                        ref={screenShareRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Remote Participants */}
              {peers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Other Participants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {peers.map((peer) => (
                        <div key={peer.id} className="relative bg-black rounded-lg overflow-hidden aspect-video">
                          <video
                            srcObject={peer.stream}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-2 left-2 text-white text-sm">
                            {peer.id.slice(0, 6)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recording Controls */}
              <RecordingControls
                isRecording={isRecording}
                isPaused={isRecordingPaused}
                duration={recordingDuration}
                error={recordingError}
                isUploading={isUploading}
                recordingStatus={recordingStatus}
                sessionProof={sessionProof}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onPauseRecording={pauseRecording}
                onResumeRecording={resumeRecording}
                onUploadRecording={uploadRecording}
                onResetRecording={resetRecording}
                formatDuration={formatDuration}
                canRecord={canRecord}
                canUpload={canUpload}
              />

              {/* Controls */}
              <Card>
                <CardHeader>
                  <CardTitle>Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Button
                      variant={isVideoEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={toggleVideo}
                      disabled={isVideoBlocked}
                    >
                      {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </Button>
                    
                    <Button
                      variant={isAudioEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={toggleAudio}
                    >
                      {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </Button>
                    
                    <Button
                      variant={isScreenSharing ? "default" : "outline"}
                      size="sm"
                      onClick={toggleScreenShare}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {!isWebRTCConnected && (
                    <Button
                      onClick={() => {
                        setHasManuallyJoined(true);
                        joinSession();
                      }}
                      disabled={isConnecting}
                      className="w-full"
                    >
                      {isConnecting ? 'Connecting...' : 'Join Session'}
                    </Button>
                  )}

                  {isWebRTCConnected && (
                    <Button
                      variant="destructive"
                      onClick={leaveSession}
                      className="w-full"
                    >
                      <PhoneOff className="w-4 h-4 mr-2" />
                      Leave Session
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Session Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Session Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={sessionData.state === 'InProgress' ? 'default' : 'secondary'}>
                      {sessionData.state}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span>{formatDuration(recordingDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Participants:</span>
                    <span>{peers.length + 1}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* End Session Modal */}
        {isEndSessionModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>End Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Are you sure you want to end this learning session?</p>
                {isRecording && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Recording is in progress. It will be stopped and uploaded automatically.
                    </p>
                  </div>
                )}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEndSessionModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleEndSession}
                    className="flex-1"
                  >
                    End Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error in LearningSessionWithRecording component:', error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">An error occurred while loading the session.</p>
          <Button onClick={() => navigate('/marketplace')}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }
}
