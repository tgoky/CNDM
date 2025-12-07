import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Info } from 'lucide-react'

interface ApplicationWarningProps {
  isEducator: boolean
  hasAmount: boolean
}

export function ApplicationWarning({ isEducator, hasAmount }: ApplicationWarningProps) {
  if (!hasAmount) {
    return (
      <Alert className="bg-yellow-50 border-yellow-200">
        <Info className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>No amount specified.</strong> This {isEducator ? 'educator' : 'student'} did not specify an amount. 
          The listing's original amount will be used when you accept.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="bg-blue-50 border-blue-200">
      <AlertCircle className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <strong>Approval Required:</strong> The applicant must approve token spending before you can accept their application. 
        They will need to submit an approval transaction first.
      </AlertDescription>
    </Alert>
  )
}

