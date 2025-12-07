import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'

export interface StudentRequest {
  id: string
  listingAddress: string
  studentAddress: string
  studentName: string
  message: string
  timestamp: number
  status: 'pending' | 'approved' | 'rejected'
}

export interface EducatorRequest {
  id: string
  listingAddress: string
  educatorAddress: string
  educatorName: string
  shares: number
  message: string
  timestamp: number
  status: 'pending' | 'approved' | 'rejected'
}

export type Request = StudentRequest | EducatorRequest

const STORAGE_KEY = 'ded-listing-requests'

export function useRequests() {
  const { address } = useAccount()
  const [requests, setRequests] = useState<Request[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load requests from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setRequests(parsed)
      }
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save requests to localStorage
  const saveRequests = (newRequests: Request[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRequests))
      setRequests(newRequests)
    } catch (error) {
      console.error('Error saving requests:', error)
    }
  }

  // Submit a student request
  const submitStudentRequest = (listingAddress: string, studentName: string, message: string) => {
    if (!address) throw new Error('Wallet not connected')

    const request: StudentRequest = {
      id: `${listingAddress}-${address}-${Date.now()}`,
      listingAddress,
      studentAddress: address,
      studentName,
      message,
      timestamp: Date.now(),
      status: 'pending'
    }

    const newRequests = [...requests, request]
    saveRequests(newRequests)
    return request
  }

  // Submit an educator request
  const submitEducatorRequest = (listingAddress: string, educatorName: string, shares: number, message: string) => {
    if (!address) throw new Error('Wallet not connected')

    const request: EducatorRequest = {
      id: `${listingAddress}-${address}-${Date.now()}`,
      listingAddress,
      educatorAddress: address,
      educatorName,
      shares,
      message,
      timestamp: Date.now(),
      status: 'pending'
    }

    const newRequests = [...requests, request]
    saveRequests(newRequests)
    return request
  }

  // Update request status
  const updateRequestStatus = (requestId: string, status: 'approved' | 'rejected') => {
    const newRequests = requests.map(request => 
      request.id === requestId ? { ...request, status } : request
    )
    saveRequests(newRequests)
  }

  // Delete a request
  const deleteRequest = (requestId: string) => {
    const newRequests = requests.filter(request => request.id !== requestId)
    saveRequests(newRequests)
  }

  // Get requests for a specific listing
  const getRequestsForListing = (listingAddress: string) => {
    return requests.filter(request => request.listingAddress === listingAddress)
  }

  // Get pending requests for a listing
  const getPendingRequestsForListing = (listingAddress: string) => {
    return requests.filter(request => 
      request.listingAddress === listingAddress && request.status === 'pending'
    )
  }

  // Get requests by user
  const getUserRequests = () => {
    if (!address) return []
    return requests.filter(request => 
      (request as StudentRequest).studentAddress === address || 
      (request as EducatorRequest).educatorAddress === address
    )
  }

  // Get requests where user is the owner (for listings they own)
  const getOwnerRequests = (listingAddresses: string[]) => {
    if (!address) return []
    return requests.filter(request => 
      listingAddresses.includes(request.listingAddress)
    )
  }

  return {
    requests,
    isLoading,
    submitStudentRequest,
    submitEducatorRequest,
    updateRequestStatus,
    deleteRequest,
    getRequestsForListing,
    getPendingRequestsForListing,
    getUserRequests,
    getOwnerRequests
  }
} 