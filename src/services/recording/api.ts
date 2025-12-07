import axios from 'axios';
import { SessionProof } from './types';

// Configure axios defaults
const api = axios.create({
  baseURL: import.meta.env.VITE_RECORDING_API_URL || 'http://localhost:3001/api',
  timeout: 30000, // 30 seconds timeout for large file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth headers if needed
api.interceptors.request.use(
  (config) => {
    // Add any authentication headers here
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export interface UploadRecordingRequest {
  sessionId: string;
  listingAddress: string;
  studentAddress: string;
  educatorAddress: string;
  arbiterAddress: string;
  metadata: {
    duration: number;
    mimeType: string;
    fileSize: number;
    quality: string;
  };
}

export interface UploadRecordingResponse {
  success: boolean;
  sessionProof: SessionProof;
  message?: string;
}

export class RecordingAPI {
  /**
   * Upload recording file to backend
   */
  static async uploadRecording(
    file: File,
    request: UploadRecordingRequest
  ): Promise<SessionProof> {
    const formData = new FormData();
    formData.append('recording', file);
    formData.append('sessionId', request.sessionId);
    formData.append('listingAddress', request.listingAddress);
    formData.append('studentAddress', request.studentAddress);
    formData.append('educatorAddress', request.educatorAddress);
    formData.append('arbiterAddress', request.arbiterAddress);
    formData.append('metadata', JSON.stringify(request.metadata));

    try {
      const response = await api.post<UploadRecordingResponse>('/recording/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Upload failed');
      }

      return response.data.sessionProof;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Upload failed: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Get recording status
   */
  static async getRecordingStatus(sessionId: string): Promise<{
    status: string;
    progress: number;
    sessionProof?: SessionProof;
  }> {
    try {
      const response = await api.get(`/recording/status/${sessionId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to get status: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Get session proof by session ID
   */
  static async getSessionProof(sessionId: string): Promise<SessionProof> {
    try {
      const response = await api.get(`/recording/proof/${sessionId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to get session proof: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Verify session proof
   */
  static async verifySessionProof(sessionProof: SessionProof): Promise<{
    isValid: boolean;
    message: string;
  }> {
    try {
      const response = await api.post('/recording/verify', sessionProof);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Verification failed: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Get recording statistics
   */
  static async getRecordingStatistics(): Promise<{
    totalRecordings: number;
    totalDuration: number;
    totalSize: number;
    successRate: number;
  }> {
    try {
      const response = await api.get('/recording/statistics');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to get statistics: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Health check
   */
  static async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    version: string;
  }> {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('Recording service is unavailable');
    }
  }
}

export default RecordingAPI;
