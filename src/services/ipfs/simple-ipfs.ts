import { IPFSUploadResult } from '../recording/types';

export class SimpleIPFSService {
  private gatewayUrl: string;
  private apiUrl: string;

  constructor(gatewayUrl: string = 'https://ipfs.io/ipfs/', apiUrl: string = 'https://ipfs.infura.io:5001/api/v0') {
    this.gatewayUrl = gatewayUrl;
    this.apiUrl = apiUrl;
  }

  /**
   * Upload file to IPFS using Infura IPFS API
   */
  async uploadFile(
    file: ArrayBuffer | Uint8Array,
    fileName: string,
    mimeType: string = 'application/octet-stream'
  ): Promise<IPFSUploadResult> {
    try {
      console.log(`Uploading file ${fileName} to IPFS via Infura...`);
      
      // Create FormData for upload
      const formData = new FormData();
      const blob = new Blob([file], { type: mimeType });
      formData.append('file', blob, fileName);
      
      // Upload to Infura IPFS
      const response = await fetch(`${this.apiUrl}/add`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Basic ${btoa(`${import.meta.env.VITE_INFURA_PROJECT_ID}:${import.meta.env.VITE_INFURA_PROJECT_SECRET}`)}`
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      const cid = result.Hash;
      const gatewayUrl = `${this.gatewayUrl}${cid}`;
      
      console.log(`File uploaded successfully. CID: ${cid}`);
      
      return {
        cid,
        size: file.byteLength || file.length,
        gatewayUrl,
      };
    } catch (error) {
      console.error('Failed to upload file to IPFS:', error);
      throw new Error(`IPFS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload file using public IPFS pinning service
   */
  async uploadFilePublic(
    file: ArrayBuffer | Uint8Array,
    fileName: string,
    mimeType: string = 'application/octet-stream'
  ): Promise<IPFSUploadResult> {
    try {
      console.log(`Uploading file ${fileName} to public IPFS...`);
      
      // Create FormData for upload
      const formData = new FormData();
      const blob = new Blob([file], { type: mimeType });
      formData.append('file', blob, fileName);
      
      // Upload to public IPFS pinning service
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        body: formData,
        headers: {
          'pinata_api_key': import.meta.env.VITE_PINATA_API_KEY || '',
          'pinata_secret_api_key': import.meta.env.VITE_PINATA_SECRET_KEY || ''
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      const cid = result.IpfsHash;
      const gatewayUrl = `${this.gatewayUrl}${cid}`;
      
      console.log(`File uploaded successfully. CID: ${cid}`);
      
      return {
        cid,
        size: file.byteLength || file.length,
        gatewayUrl,
      };
    } catch (error) {
      console.error('Failed to upload file to IPFS:', error);
      throw new Error(`IPFS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve file from IPFS using CID
   */
  async retrieveFile(cid: string): Promise<ArrayBuffer> {
    try {
      console.log(`Retrieving file from IPFS: ${cid}`);
      
      const response = await fetch(`${this.gatewayUrl}${cid}`);
      
      if (!response.ok) {
        throw new Error(`Failed to retrieve file: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return arrayBuffer;
    } catch (error) {
      console.error('Failed to retrieve file from IPFS:', error);
      throw new Error(`IPFS retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a file exists on IPFS
   */
  async fileExists(cid: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.gatewayUrl}${cid}`, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Failed to check file existence:', error);
      return false;
    }
  }

  /**
   * Get file metadata from IPFS
   */
  async getFileMetadata(cid: string): Promise<{
    cid: string;
    size: number;
    gatewayUrl: string;
  }> {
    try {
      const response = await fetch(`${this.gatewayUrl}${cid}`, { method: 'HEAD' });
      
      if (!response.ok) {
        throw new Error(`Failed to get file metadata: ${response.statusText}`);
      }
      
      const contentLength = response.headers.get('content-length');
      const size = contentLength ? parseInt(contentLength, 10) : 0;
      
      return {
        cid,
        size,
        gatewayUrl: `${this.gatewayUrl}${cid}`,
      };
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      throw new Error(`Metadata retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default SimpleIPFSService;
