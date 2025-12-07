import { StorachaClient } from '@storacha/client';
import { IPFSUploadResult } from '../recording/types';

export class StorachaIPFSService {
  private client: StorachaClient;

  constructor(apiToken: string) {
    this.client = new StorachaClient(apiToken);
  }

  /**
   * Upload file to IPFS using Storacha
   */
  async uploadFile(
    file: ArrayBuffer | Uint8Array,
    fileName: string,
    mimeType: string = 'application/octet-stream'
  ): Promise<IPFSUploadResult> {
    try {
      console.log(`Uploading file ${fileName} to IPFS via Storacha...`);
      
      // Create a File object for Storacha
      const fileObj = new File([file], fileName, { type: mimeType });
      
      // Upload to Storacha (which uses IPFS under the hood)
      const result = await this.client.upload(fileObj, {
        name: fileName,
        wrapWithDirectory: false,
      });

      const gatewayUrl = `https://ipfs.io/ipfs/${result.cid}`;
      
      console.log(`File uploaded successfully. CID: ${result.cid}`);
      
      return {
        cid: result.cid,
        size: file.byteLength || file.length,
        gatewayUrl,
      };
    } catch (error) {
      console.error('Failed to upload file to IPFS via Storacha:', error);
      throw new Error(`IPFS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve file from IPFS using CID
   */
  async retrieveFile(cid: string): Promise<ArrayBuffer> {
    try {
      console.log(`Retrieving file from IPFS: ${cid}`);
      
      const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
      
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
      const response = await fetch(`https://ipfs.io/ipfs/${cid}`, { method: 'HEAD' });
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
      const response = await fetch(`https://ipfs.io/ipfs/${cid}`, { method: 'HEAD' });
      
      if (!response.ok) {
        throw new Error(`Failed to get file metadata: ${response.statusText}`);
      }
      
      const contentLength = response.headers.get('content-length');
      const size = contentLength ? parseInt(contentLength, 10) : 0;
      
      return {
        cid,
        size,
        gatewayUrl: `https://ipfs.io/ipfs/${cid}`,
      };
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      throw new Error(`Metadata retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default StorachaIPFSService;
