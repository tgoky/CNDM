import { useState, useEffect, useRef, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { ListingParticipant } from './use-listing-session'
import { useRecording } from './use-recording'
import { RecordingConfig } from '../services/recording/types'

interface WebRTCPeer {
  id: string
  connection: RTCPeerConnection
  stream?: MediaStream
  isConnected: boolean
}

interface WebRTCMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave' | 'participant-update'
  from: string
  to?: string
  data: any
}

interface UseWebRTCSessionWithRecordingOptions {
  listingAddress?: string
  participants?: ListingParticipant[]
  recordingConfig?: Partial<RecordingConfig>
  autoStartRecording?: boolean
  autoStopRecording?: boolean
}

export function useWebRTCSessionWithRecording(options: UseWebRTCSessionWithRecordingOptions = {}) {
  const { 
    listingAddress, 
    participants, 
    recordingConfig,
    autoStartRecording = false,
    autoStopRecording = true
  } = options

  const { address } = useAccount()
  const [peers, setPeers] = useState<Map<string, WebRTCPeer>>(new Map())
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  
  // Recording functionality
  const recording = useRecording({
    sessionId: listingAddress,
    listingAddress,
    studentAddress: address,
    educatorAddress: participants?.find(p => p.role === 'educator')?.address,
    arbiterAddress: participants?.find(p => p.role === 'arbiter')?.address,
    config: recordingConfig,
    autoUpload: true
  })
  
  // Prevent rapid join/leave cycles
  const joinTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const processedMessagesRef = useRef<Set<string>>(new Set())
  const lastMessageTimeRef = useRef<Map<string, number>>(new Map())
  
  // WebRTC configuration
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }

  // Signaling connection (simulated for now - would need a real signaling server)
  const signalingRef = useRef<WebSocket | null>(null)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())

  // Initialize local media stream
  const initializeLocalStream = useCallback(async () => {
    try {
      console.log('Requesting camera/microphone access...')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      console.log('Media stream obtained:', stream.getTracks().map(t => t.kind))
      setLocalStream(stream)
      
      // Initialize recording with the stream
      await recording.initializeRecording(stream)
      
      return stream
    } catch (error) {
      console.error('Error accessing media devices:', error)
      setError('Failed to access camera/microphone')
      throw error
    }
  }, [recording])

  // Create peer connection
  const createPeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection(rtcConfig)
    
    // Add local stream tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream)
      })
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalingMessage({
          type: 'ice-candidate',
          from: address || '',
          to: peerId,
          data: event.candidate
        })
      }
    }

    // Handle incoming streams
    peerConnection.ontrack = (event) => {
      const peerId = Array.from(peerConnectionsRef.current.entries())
        .find(([_, pc]) => pc === peerConnection)?.[0]
      
      if (peerId) {
        setPeers(prev => {
          const newPeers = new Map(prev)
          const peer = newPeers.get(peerId)
          if (peer) {
            peer.stream = event.streams[0]
            peer.isConnected = true
          }
          return newPeers
        })
      }
    }

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      const peerId = Array.from(peerConnectionsRef.current.entries())
        .find(([_, pc]) => pc === peerConnection)?.[0]
      
      if (peerId) {
        setPeers(prev => {
          const newPeers = new Map(prev)
          const peer = newPeers.get(peerId)
          if (peer) {
            peer.isConnected = peerConnection.connectionState === 'connected'
          }
          return newPeers
        })
      }
    }

    return peerConnection
  }, [localStream, address])

  // Send signaling message (simulated)
  const sendSignalingMessage = useCallback((message: WebRTCMessage) => {
    // TEMPORARILY DISABLE ALL SIGNALING TO PREVENT LOOPS
    // In a real implementation, this would send to a signaling server
    console.log('Signaling disabled (temporary):', message)
    return
    
    // Rate limiting - prevent sending messages too frequently
    const messageKey = `${message.type}-${message.from}`
    const now = Date.now()
    const lastTime = lastMessageTimeRef.current.get(messageKey) || 0
    if (now - lastTime < 1000) { // 1 second cooldown
      console.log('Rate limited message:', messageKey)
      return
    }
    lastMessageTimeRef.current.set(messageKey, now)
    
    // In a real implementation, this would send to a signaling server
    console.log('Signaling message:', message)
    
    // Simulate receiving the message (for demo purposes)
    // Only process messages from other participants to avoid loops
    if (message.from !== address) {
      setTimeout(() => {
        handleSignalingMessage(message)
      }, 100)
    }
  }, [address, listingAddress])

  // Handle incoming signaling messages
  const handleSignalingMessage = useCallback(async (message: WebRTCMessage) => {
    // TEMPORARILY DISABLE ALL SIGNALING TO PREVENT LOOPS
    console.log('Signaling handling disabled (temporary):', message)
    return
    
    // Ignore own messages and messages without proper from address
    if (message.from === address || !message.from) return
    
    // Skip for demo mode
    if (listingAddress === 'demo') return
    
    // Prevent duplicate message processing with better deduplication
    const messageId = `${message.type}-${message.from}-${JSON.stringify(message.data)}`
    if (processedMessagesRef.current.has(messageId)) {
      console.log('Skipping duplicate message:', messageId)
      return
    }
    processedMessagesRef.current.add(messageId)
    
    // Clean up old message IDs (keep only last 50)
    if (processedMessagesRef.current.size > 50) {
      const ids = Array.from(processedMessagesRef.current)
      processedMessagesRef.current.clear()
      ids.slice(-25).forEach(id => processedMessagesRef.current.add(id))
    }

    switch (message.type) {
      case 'join':
        // New participant joined
        if (message.from && !peerConnectionsRef.current.has(message.from)) {
          const peerConnection = createPeerConnection(message.from)
          peerConnectionsRef.current.set(message.from, peerConnection)
          
          setPeers(prev => {
            const newPeers = new Map(prev)
            newPeers.set(message.from, {
              id: message.from,
              connection: peerConnection,
              isConnected: false
            })
            return newPeers
          })

          // Send offer to new peer
          try {
            const offer = await peerConnection.createOffer()
            await peerConnection.setLocalDescription(offer)
            sendSignalingMessage({
              type: 'offer',
              from: address || '',
              to: message.from,
              data: offer
            })
          } catch (error) {
            console.error('Error creating offer:', error)
          }
        }
        break

      case 'offer':
        // Received offer from peer
        const peerConnection = peerConnectionsRef.current.get(message.from)
        if (peerConnection) {
          try {
            await peerConnection.setRemoteDescription(message.data)
            const answer = await peerConnection.createAnswer()
            await peerConnection.setLocalDescription(answer)
            sendSignalingMessage({
              type: 'answer',
              from: address || '',
              to: message.from,
              data: answer
            })
          } catch (error) {
            console.error('Error handling offer:', error)
          }
        }
        break

      case 'answer':
        // Received answer from peer
        const pc = peerConnectionsRef.current.get(message.from)
        if (pc) {
          try {
            await pc.setRemoteDescription(message.data)
          } catch (error) {
            console.error('Error handling answer:', error)
          }
        }
        break

      case 'ice-candidate':
        // Received ICE candidate
        const connection = peerConnectionsRef.current.get(message.from)
        if (connection) {
          try {
            await connection.addIceCandidate(message.data)
          } catch (error) {
            console.error('Error adding ICE candidate:', error)
          }
        }
        break

      case 'leave':
        // Participant left
        const leavingConnection = peerConnectionsRef.current.get(message.from)
        if (leavingConnection) {
          leavingConnection.close()
          peerConnectionsRef.current.delete(message.from)
          setPeers(prev => {
            const newPeers = new Map(prev)
            newPeers.delete(message.from)
            return newPeers
          })
        }
        break
    }
  }, [address, createPeerConnection, sendSignalingMessage])

  // Join the session
  const joinSession = useCallback(async () => {
    if (!address || !listingAddress || !participants) return
    
    // Prevent rapid join attempts
    if (joinTimeoutRef.current) {
      clearTimeout(joinTimeoutRef.current)
    }
    
    // Clear processed messages to prevent loops
    processedMessagesRef.current.clear()

    setIsConnecting(true)
    setError(null)
    
    // For demo mode, just initialize local stream without signaling
    if (listingAddress === 'demo') {
      try {
        await initializeLocalStream()
        setIsConnected(true)
        
        // Auto-start recording if enabled
        if (autoStartRecording) {
          await recording.startRecording()
        }
        
        return
      } catch (error) {
        console.error('Error in demo mode:', error)
        setError('Failed to access camera/microphone')
      } finally {
        setIsConnecting(false)
      }
      return
    }

    try {
      // Initialize local stream only (no signaling for now)
      await initializeLocalStream()
      setIsConnected(true)
      
      // Auto-start recording if enabled
      if (autoStartRecording) {
        await recording.startRecording()
      }
      
      console.log('Session joined successfully (local stream only)')
    } catch (error) {
      console.error('Error joining session:', error)
      setError('Failed to join session')
    } finally {
      setIsConnecting(false)
    }
  }, [address, listingAddress, participants, initializeLocalStream, recording, autoStartRecording])

  // Leave the session
  const leaveSession = useCallback(async () => {
    // Clear any pending timeouts
    if (joinTimeoutRef.current) {
      clearTimeout(joinTimeoutRef.current)
    }
    
    // Clear processed messages and rate limiting
    processedMessagesRef.current.clear()
    lastMessageTimeRef.current.clear()
    
    // Stop recording if active
    if (recording.isRecording) {
      try {
        await recording.stopRecording()
      } catch (error) {
        console.error('Error stopping recording:', error)
      }
    }
    
    // No signaling for now
    console.log('Leaving session (no signaling)')

    // Close all peer connections
    peerConnectionsRef.current.forEach(connection => {
      connection.close()
    })
    peerConnectionsRef.current.clear()

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }

    setPeers(new Map())
    setIsConnected(false)
  }, [address, listingAddress, localStream, recording])

  // Toggle local video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }, [localStream])

  // Toggle local audio
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
      }
    }
  }, [localStream])

  // Recording controls
  const startRecording = useCallback(async () => {
    try {
      await recording.startRecording()
    } catch (error) {
      console.error('Error starting recording:', error)
      setError('Failed to start recording')
    }
  }, [recording])

  const stopRecording = useCallback(async () => {
    try {
      await recording.stopRecording()
    } catch (error) {
      console.error('Error stopping recording:', error)
      setError('Failed to stop recording')
    }
  }, [recording])

  const pauseRecording = useCallback(() => {
    recording.pauseRecording()
  }, [recording])

  const resumeRecording = useCallback(() => {
    recording.resumeRecording()
  }, [recording])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Only cleanup if we're actually connected
      if (isConnected) {
        console.log('Component unmounting, cleaning up session...')
        leaveSession()
      }
    }
  }, []) // Remove leaveSession from dependencies to prevent premature cleanup

  return {
    // WebRTC State
    peers: Array.from(peers.values()),
    localStream,
    isConnected,
    isConnecting,
    error,
    isVideoEnabled,
    isAudioEnabled,
    
    // WebRTC Actions
    joinSession,
    leaveSession,
    toggleVideo,
    toggleAudio,
    
    // Recording State
    isRecording: recording.isRecording,
    isRecordingPaused: recording.isPaused,
    recordingDuration: recording.duration,
    recordingError: recording.error,
    isUploading: recording.isUploading,
    sessionProof: recording.sessionProof,
    recordingStatus: recording.recordingStatus,
    
    // Recording Actions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    uploadRecording: recording.uploadRecording,
    resetRecording: recording.resetRecording,
    
    // Utilities
    getPeerStream: (peerId: string) => peers.get(peerId)?.stream,
    isPeerConnected: (peerId: string) => peers.get(peerId)?.isConnected || false,
    formatDuration: recording.formatDuration,
    canRecord: recording.canRecord,
    canUpload: recording.canUpload
  }
}
