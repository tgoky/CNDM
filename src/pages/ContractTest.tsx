import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Badge } from '../components/ui/badge'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Users,
  MessageSquare,
  Share,
  Settings,
  Monitor,
  MonitorOff,
  Copy,
  User,
  BookOpen,
  Clock,
  AlertCircle,
  Lock,
  Star
} from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useListingSession, ListingParticipant } from '../hooks/use-listing-session'
import { useWebRTCSession } from '../hooks/use-webrtc-session'
import { ReputationFeedbackModal } from '../components/ReputationFeedbackModal'
// import { EndSessionModal } from '../components/EndSessionModal'

interface Participant {
  id: string
  name: string
  role: 'educator' | 'student' | 'creator'
  isConnected: boolean
  isVideoEnabled: boolean
  isAudioEnabled: boolean
}

interface Message {
  id: string
  sender: string
  content: string
  timestamp: Date
}

export default function LearningSession() {
  console.log('LearningSession component starting...')
  
  try {
    const { address, isConnected } = useAccount()
    const { id: listingId } = useParams()
    const navigate = useNavigate()
  
  // WebRTC state
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)
  const [isVideoBlocked, setIsVideoBlocked] = useState(false)
  const [hasManuallyJoined, setHasManuallyJoined] = useState(false)
  const [isEndSessionModalOpen, setIsEndSessionModalOpen] = useState(false)
  const [isReputationModalOpen, setIsReputationModalOpen] = useState(false)
  
  // Video refs
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const screenShareRef = useRef<HTMLVideoElement>(null)
  const hasAutoJoinedRef = useRef(false)
  const videoInitializedRef = useRef(false)
  
  // Dynamic listing data
  const { sessionData, isLoading: sessionLoading } = useListingSession(listingId)
  
  // WebRTC session
  const {
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
    toggleAudio
  } = useWebRTCSession(listingId, sessionData?.participants || [])
  
  // Auto-join session when listing is confirmed and user is participant
  useEffect(() => {
    try {
      if (isConnected && // Check if wallet is connected
          sessionData?.isCurrentUserParticipant && 
          sessionData.state === 'InProgress' && 
          !isWebRTCConnected && 
          !isConnecting &&
          !hasAutoJoinedRef.current &&
          !hasManuallyJoined) {
        hasAutoJoinedRef.current = true
        console.log('Auto-joining session...')
        joinSession()
      }
    } catch (error) {
      console.error('Error in auto-join effect:', error)
    }
  }, [isConnected, sessionData?.isCurrentUserParticipant, sessionData?.state, isWebRTCConnected, isConnecting, hasManuallyJoined])
  
  // Convert listing participants to session participants for display
  const displayParticipants = sessionData?.participants?.map((p, index) => {
    try {
      return {
        id: p.address,
        name: p.name,
        role: p.role,
        isConnected: peers.some(peer => peer.id === p.address && peer.isConnected),
        isVideoEnabled: peers.some(peer => peer.id === p.address && peer.stream?.getVideoTracks()[0]?.enabled),
        isAudioEnabled: peers.some(peer => peer.id === p.address && peer.stream?.getAudioTracks()[0]?.enabled)
      }
    } catch (error) {
      console.error('Error mapping participant:', error)
      return {
        id: p.address,
        name: p.name,
        role: p.role,
        isConnected: false,
        isVideoEnabled: false,
        isAudioEnabled: false
      }
    }
  }) || []
  
  const [messages] = useState<Message[]>([
    {
      id: '1',
      sender: 'Dr. Sarah Chen',
      content: 'Welcome everyone! Let\'s start with React fundamentals.',
      timestamp: new Date(Date.now() - 300000)
    },
    {
      id: '2',
      sender: 'Alex Johnson',
      content: 'Great! I\'m excited to learn about hooks.',
      timestamp: new Date(Date.now() - 240000)
    },
    {
      id: '3',
      sender: 'Dr. Sarah Chen',
      content: 'Perfect! Let\'s begin with useState and useEffect.',
      timestamp: new Date(Date.now() - 180000)
    }
  ])
  
  const [newMessage, setNewMessage] = useState('')
  const sessionInfo = {
    title: sessionData?.topic || 'Loading...',
    subject: sessionData?.subject || 'Loading...',
    duration: '2 hours',
    participants: displayParticipants.length
  }

  // Initialize video element properly
  const initializeVideo = useCallback(async () => {
    if (!localVideoRef.current || videoInitializedRef.current) return
    
    try {
      // Ensure video element is properly configured
      localVideoRef.current.muted = true
      localVideoRef.current.playsInline = true
      localVideoRef.current.autoplay = true
      localVideoRef.current.controls = false
      
      videoInitializedRef.current = true
      console.log('Video element initialized')
    } catch (error) {
      console.error('Error initializing video element:', error)
    }
  }, [])

  // Update local video when stream changes
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log('Setting video srcObject:', localStream)
      
      // Initialize video element first
      initializeVideo()
      
      // Clear any existing srcObject first
      localVideoRef.current.srcObject = null
      
      // Set the new stream
      localVideoRef.current.srcObject = localStream
      
      // Handle autoplay restrictions
      const playVideo = async () => {
        try {
          // Wait a bit for the stream to be ready
          await new Promise(resolve => setTimeout(resolve, 200))
          
          if (localVideoRef.current && localVideoRef.current.srcObject) {
            await localVideoRef.current.play()
            console.log('Video playing successfully')
            setIsVideoBlocked(false)
          }
        } catch (error) {
          console.error('Error playing video:', error)
          // If autoplay fails, try with user interaction
          if (error instanceof Error && error.name === 'NotAllowedError') {
            console.log('Autoplay blocked, waiting for user interaction...')
            setIsVideoBlocked(true)
          }
        }
      }
      
      playVideo()
    }
  }, [localStream, initializeVideo])

  // Reset auto-join flag when listing changes
  useEffect(() => {
    hasAutoJoinedRef.current = false
    videoInitializedRef.current = false
    setHasManuallyJoined(false)
  }, [listingId])

  // Handle screen share stream changes
  useEffect(() => {
    if (screenShareRef.current && isScreenSharing && screenShareStream) {
      console.log('Screen share element ready, attempting to play...')
      const playScreenShare = async () => {
        try {
          if (screenShareRef.current) {
            screenShareRef.current.srcObject = screenShareStream
            await screenShareRef.current.play()
            console.log('Screen share video playing successfully')
          }
        } catch (error) {
          console.error('Error playing screen share video:', error)
        }
      }
      playScreenShare()
    }
  }, [isScreenSharing, screenShareStream])

  const toggleScreenShare = async () => {
    console.log('toggleScreenShare called, current state:', isScreenSharing)
    
    if (!isScreenSharing) {
      try {
        console.log('Starting screen share...')
        console.log('Checking if getDisplayMedia is available:', !!navigator.mediaDevices?.getDisplayMedia)
        
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        })
        
        console.log('Screen share stream obtained:', stream)
        console.log('Stream tracks:', stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })))
        
        // Store the stream and set state to render the video element
        setScreenShareStream(stream)
        setIsScreenSharing(true)
        
        // Wait for the component to re-render and create the video element
        setTimeout(async () => {
          if (screenShareRef.current) {
            console.log('Setting screen share srcObject...')
            screenShareRef.current.srcObject = stream
            
            // Try to play the screen share video
            try {
              await screenShareRef.current.play()
              console.log('Screen share video playing successfully')
            } catch (error) {
              console.error('Error playing screen share video:', error)
            }
          } else {
            console.error('screenShareRef.current is still null after timeout!')
          }
        }, 100)
        
      } catch (error) {
        console.error('Error sharing screen:', error)
        setIsScreenSharing(false)
      }
    } else {
      console.log('Stopping screen share...')
      if (screenShareRef.current?.srcObject) {
        const stream = screenShareRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
        screenShareRef.current.srcObject = null
      }
      if (screenShareStream) {
        screenShareStream.getTracks().forEach(track => track.stop())
        setScreenShareStream(null)
      }
      setIsScreenSharing(false)
    }
  }

  const copySessionLink = () => {
    navigator.clipboard.writeText(window.location.href)
  }

  // Loading state
  if (sessionLoading) {
  return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Loading Session...</h2>
          <p className="text-gray-400">Fetching listing data and participants</p>
        </div>
      </div>
    )
  }

  // Wallet not connected
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You need to connect your wallet to join the learning session
              </p>
              <Button>Connect Wallet</Button>
            </CardContent>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Not a participant
  if (sessionData && !sessionData.isCurrentUserParticipant) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-4">
            You are not a participant in this listing. Only approved students and educators can join the learning session.
          </p>
          <div className="space-y-2">
            <Button onClick={() => navigate('/marketplace')} variant="outline">
              Browse Listings
            </Button>
            <Button onClick={() => navigate('/profile')}>
              View Profile
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Listing not found - show demo mode for testing
  if (!sessionData) {
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Listing Not Found</h2>
          <p className="text-gray-400 mb-4">
            The listing you're looking for doesn't exist or you don't have access to it.
          </p>
          <div className="space-y-3">
            <Button onClick={() => navigate('/marketplace')} className="w-full">
              Browse Listings
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                // Enable demo mode
                const demoData = {
                  listingAddress: 'demo',
                  subject: 'Demo Session',
                  topic: 'WebRTC Testing',
                  objectives: 'Testing video call functionality',
                  postAmount: BigInt(0),
                  state: 'InProgress',
                  creator: address || '',
                  participants: [
                    {
                      address: address || '',
                      name: 'Demo User',
                      role: 'creator' as const,
                      isConnected: false,
                      isVideoEnabled: false,
                      isAudioEnabled: false
                    }
                  ],
                  isCurrentUserParticipant: true,
                  currentUserRole: 'creator' as const
                }
                // Force re-render with demo data
                window.location.reload()
              }}
              className="w-full"
            >
              Try Demo Mode
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BookOpen className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-xl font-semibold">{sessionInfo.title}</h1>
              <p className="text-sm text-gray-400">{sessionInfo.subject} • {sessionInfo.duration}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
              Live
            </Badge>
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
              Local Only
            </Badge>
            <Button variant="outline" size="sm" onClick={copySessionLink}>
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Grid */}
          <div className="flex-1 relative bg-black">
            {!isWebRTCConnected ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Video className="w-16 h-16 text-gray-400" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">Ready to Join Session?</h2>
                  <p className="text-gray-400 mb-4">Click the button below to start your learning experience</p>
                  <Button 
                    onClick={async () => {
                      try {
                        setHasManuallyJoined(true)
                        await joinSession()
                        console.log('Session joined, attempting to play video...')
                        
                        // Try to play video after joining with user interaction
                        setTimeout(async () => {
                          if (localVideoRef.current && localVideoRef.current.srcObject) {
                            try {
                              await localVideoRef.current.play()
                              console.log('Video started successfully after user interaction')
                              setIsVideoBlocked(false)
                            } catch (error) {
                              console.error('Error playing video after join:', error)
                              if (error instanceof Error && error.name === 'NotAllowedError') {
                                setIsVideoBlocked(true)
                              }
                            }
                          }
                        }, 500)
                      } catch (error) {
                        console.error('Error joining session:', error)
                      }
                    }} 
                    size="lg" 
                    disabled={isConnecting}
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    {isConnecting ? 'Joining...' : 'Join Session'}
                  </Button>
                  {webrtcError && (
                    <p className="text-red-400 mt-2 text-sm">{webrtcError}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 h-full">
                {/* Local Video */}
                <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    controls={false}
                    className="w-full h-full object-cover"
                    style={{ backgroundColor: '#1f2937' }}
                  />
                  {isVideoBlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Button 
                        onClick={async () => {
                          try {
                            await localVideoRef.current?.play()
                            setIsVideoBlocked(false)
                          } catch (error) {
                            console.error('Error playing video:', error)
                          }
                        }}
                        size="lg"
                      >
                        <Video className="w-5 h-5 mr-2" />
                        Click to Start Video
                      </Button>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4">
                    <Badge variant="secondary">You</Badge>
                  </div>
                </div>

                {/* Peer Videos */}
                {peers.map((peer, index) => (
                  <div key={peer.id} className="relative bg-gray-800 rounded-lg overflow-hidden">
                    <video
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                      ref={(el) => {
                        if (el && peer.stream) {
                          el.srcObject = peer.stream
                        }
                      }}
                    />
                    <div className="absolute bottom-4 left-4">
                      <Badge variant="secondary">
                        {displayParticipants.find(p => p.id === peer.id)?.name || `Peer ${index + 1}`}
                      </Badge>
                    </div>
                  </div>
                ))}

                {/* Screen Share */}
                {isScreenSharing && (
                  <div className="relative bg-gray-800 rounded-lg overflow-hidden lg:col-span-2">
                    <video
                      ref={screenShareRef}
                      autoPlay
                      playsInline
                      muted
                      controls={false}
                      className="w-full h-full object-contain"
                      style={{ backgroundColor: '#1f2937' }}
                    />
                    <div className="absolute top-4 left-4">
                      <Badge variant="destructive">Screen Share</Badge>
                    </div>
                    <div className="absolute top-4 right-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={toggleScreenShare}
                      >
                        <MonitorOff className="w-4 h-4" />
                      </Button>
                    </div>
                    {/* Debug info */}
                    <div className="absolute bottom-4 right-4 text-xs text-white bg-black/50 p-1 rounded">
                      Screen Share Active
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          {isWebRTCConnected && (
            <div className="bg-gray-800 border-t border-gray-700 p-4">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="default"
                  size="lg"
                  onClick={toggleAudio}
                >
                  <Mic className="w-5 h-5" />
                </Button>
                
                <Button
                  variant="default"
                  size="lg"
                  onClick={toggleVideo}
                >
                  <Video className="w-5 h-5" />
                </Button>
                
                <Button
                  variant={isScreenSharing ? "destructive" : "outline"}
                  size="lg"
                  onClick={toggleScreenShare}
                >
                  {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                  {isScreenSharing ? ' Stop Share' : ' Share Screen'}
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
                >
                  <Users className="w-5 h-5" />
                </Button>
                
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={() => setIsChatOpen(!isChatOpen)}
                >
                  <MessageSquare className="w-5 h-5" />
                </Button>
                
                <Button 
                  variant="destructive"
                  size="lg"
                  onClick={leaveSession}
                >
                  <PhoneOff className="w-5 h-5" />
                </Button>

                {/* End Session Button - Temporarily disabled */}
                {/* {sessionData?.creator === address && sessionData?.state === 'InProgress' && (
                  <Button 
                    variant="destructive"
                    size="lg"
                    onClick={() => setIsEndSessionModalOpen(true)}
                    className="bg-red-700 hover:bg-red-800"
                  >
                    <Clock className="w-5 h-5" />
                    End Session
                  </Button>
                )} */}
              </div>
            </div>
          )}
          </div>

          {/* Session Completed Banner */}
          {sessionData?.state === 'Released' && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-green-900">Session Completed!</h3>
                    <p className="text-sm text-green-700">
                      The learning session has been completed. Please provide feedback for your fellow participants.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsReputationModalOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Leave Feedback
                </Button>
              </div>
            </div>
          )}
          
        {/* Sidebar */}
        {(isParticipantsOpen || isChatOpen) && (
          <div className="w-80 bg-gray-800 border-l border-gray-700">
            {isParticipantsOpen && (
              <div className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Participants ({displayParticipants.length})
                </h3>
                <div className="space-y-3">
                  {displayParticipants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-700">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{participant.name}</p>
                        <p className="text-sm text-gray-400 capitalize">{participant.role}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {participant.isConnected && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                        {participant.isVideoEnabled && <Video className="w-4 h-4 text-gray-400" />}
                        {participant.isAudioEnabled && <Mic className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>
                  ))}
                </div>
          </div>
            )}

            {isChatOpen && (
              <div className="p-4 h-full flex flex-col">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Chat
                </h3>
                
                {/* Messages */}
                <div className="flex-1 space-y-3 overflow-y-auto mb-4">
                  {messages.map((message) => (
                    <div key={message.id} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-blue-400">{message.sender}</span>
                        <span className="text-xs text-gray-400">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  ))}
          </div>
          
                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button size="sm">Send</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reputation Feedback Modal */}
        {sessionData && (
          <ReputationFeedbackModal
            isOpen={isReputationModalOpen}
            onClose={() => setIsReputationModalOpen(false)}
            listingAddress={listingId || ''}
            participants={sessionData.participants.map(p => ({
              address: p.address,
              displayName: p.name,
              role: p.role
            }))}
            currentUserAddress={address || ''}
            isSessionCompleted={sessionData.state === 'Released'}
          />
        )}

        {/* End Session Modal - Temporarily disabled */}
        {/* {sessionData && (
          <EndSessionModal
            isOpen={isEndSessionModalOpen}
            onClose={() => setIsEndSessionModalOpen(false)}
            listingAddress={listingId || ''}
            creatorAddress={sessionData.creator}
            currentUserAddress={address || ''}
            sessionData={{
              subject: sessionData.subject,
              topic: sessionData.topic,
              participants: sessionData.participants.map(p => ({
                address: p.address,
                name: p.name,
                role: p.role
              })),
              state: sessionData.state
            }}
          />
        )} */}
      </div>
    </div>
  )
  } catch (error) {
    console.error('Error in LearningSession component:', error)
    return (
      <div className="h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-4">
            An error occurred while loading the learning session. Please try refreshing the page.
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Error: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    )
  }
} 