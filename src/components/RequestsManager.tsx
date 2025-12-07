import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  User, 
  GraduationCap, 
  CheckCircle,
  X,
  Clock,
  MessageSquare,
  Crown
} from 'lucide-react'
import { useRequests, Request, StudentRequest, EducatorRequest } from '@/hooks/use-requests'
import { useApplyListing } from '@/hooks/use-apply-listing'

interface RequestsManagerProps {
  listingAddress: string
  listingTitle: string
  creatorAddress: string
}

export function RequestsManager({ listingAddress, listingTitle, creatorAddress }: RequestsManagerProps) {
  const { address } = useAccount()
  const { 
    getRequestsForListing, 
    updateRequestStatus, 
    deleteRequest 
  } = useRequests()
  
  const { applyAsStudent, applyAsEducator, isOwner, address: currentUserAddress } = useApplyListing(listingAddress, creatorAddress)
  
  // Debug information
  console.log('RequestsManager Debug:', {
    listingAddress,
    creatorAddress,
    currentUserAddress,
    isOwner,
    calculatedIsOwner: currentUserAddress && creatorAddress && currentUserAddress.toLowerCase() === creatorAddress.toLowerCase()
  })
  
  const requests = getRequestsForListing(listingAddress)
  const pendingRequests = requests.filter(req => req.status === 'pending')
  const approvedRequests = requests.filter(req => req.status === 'approved')
  const rejectedRequests = requests.filter(req => req.status === 'rejected')
  
  // Debug information
  console.log('RequestsManager Debug:', {
    currentAddress: address,
    isOwner,
    listingAddress
  })
  
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleApprove = async (request: Request) => {
    // Safety check for isOwner
    const currentIsOwner = currentUserAddress && creatorAddress && currentUserAddress.toLowerCase() === creatorAddress.toLowerCase()
    
    if (!currentIsOwner) {
      console.error('User is not the owner. Cannot approve requests.')
      alert('Only the listing owner can approve requests.')
      return
    }

    try {
      if (request.hasOwnProperty('studentAddress')) {
        // It's a student request
        const studentRequest = request as StudentRequest
        console.log('Approving student:', studentRequest.studentAddress)
        await applyAsStudent(studentRequest.studentAddress)
      } else {
        // It's an educator request
        const educatorRequest = request as EducatorRequest
        console.log('Approving educator:', educatorRequest.educatorAddress, 'with shares:', educatorRequest.shares)
        await applyAsEducator(educatorRequest.educatorAddress, educatorRequest.shares)
      }
      
      updateRequestStatus(request.id, 'approved')
    } catch (error) {
      console.error('Error approving request:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve request. Please try again.'
      alert(`Failed to approve request: ${errorMessage}`)
    }
  }

  const handleReject = (requestId: string) => {
    updateRequestStatus(requestId, 'rejected')
  }

  const handleDelete = (requestId: string) => {
    deleteRequest(requestId)
  }

  const getRequestIcon = (request: Request) => {
    return request.hasOwnProperty('studentAddress') ? (
      <User className="w-4 h-4 text-blue-600" />
    ) : (
      <GraduationCap className="w-4 h-4 text-green-600" />
    )
  }

  const getRequestType = (request: Request) => {
    return request.hasOwnProperty('studentAddress') ? 'Student' : 'Educator'
  }

  const getRequestName = (request: Request) => {
    return request.hasOwnProperty('studentAddress') 
      ? (request as StudentRequest).studentName 
      : (request as EducatorRequest).educatorName
  }

  const getRequestAddress = (request: Request) => {
    return request.hasOwnProperty('studentAddress') 
      ? (request as StudentRequest).studentAddress 
      : (request as EducatorRequest).educatorAddress
  }

  // Safety check for isOwner
  const currentIsOwner = currentUserAddress && creatorAddress && currentUserAddress.toLowerCase() === creatorAddress.toLowerCase()
  
  if (!currentIsOwner) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Requests ({requests.length})
        </CardTitle>
        <CardDescription>
          Manage requests from students and educators wanting to join this listing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Requests ({pendingRequests.length})
            </h3>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div key={request.id} className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {getRequestName(request).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          {getRequestIcon(request)}
                          <span className="font-medium">{getRequestName(request)}</span>
                          <Badge variant="outline" className="text-xs">
                            {getRequestType(request)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatAddress(getRequestAddress(request))} • {formatDate(request.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleApprove(request)}
                        className="h-8"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleReject(request.id)}
                        className="h-8"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                  
                  {request.message && (
                    <div className="mb-3">
                      <p className="text-sm text-muted-foreground">
                        "{request.message}"
                      </p>
                    </div>
                  )}

                  {request.hasOwnProperty('shares') && (
                    <div className="text-xs text-muted-foreground">
                      Payment shares: {(request as EducatorRequest).shares}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Requests */}
        {approvedRequests.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Approved ({approvedRequests.length})
            </h3>
            <div className="space-y-2">
              {approvedRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getRequestIcon(request)}
                    <span className="font-medium">{getRequestName(request)}</span>
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200">
                      {getRequestType(request)}
                    </Badge>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleDelete(request.id)}
                    className="h-6 text-red-600 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejected Requests */}
        {rejectedRequests.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <X className="w-4 h-4 text-red-600" />
              Rejected ({rejectedRequests.length})
            </h3>
            <div className="space-y-2">
              {rejectedRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getRequestIcon(request)}
                    <span className="font-medium">{getRequestName(request)}</span>
                    <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-200">
                      {getRequestType(request)}
                    </Badge>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleDelete(request.id)}
                    className="h-6 text-red-600 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Requests */}
        {requests.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No requests yet</p>
            <p className="text-xs">Students and educators can submit requests to join this listing</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 