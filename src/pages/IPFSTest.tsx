import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { SimpleIPFSService } from '../services/ipfs/simple-ipfs';
import { Upload, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function IPFSTest() {
  const [testText, setTestText] = useState('Hello from DED Learning Platform! This is a test upload to IPFS.');
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [retrievedText, setRetrievedText] = useState('');
  const [error, setError] = useState('');

  const ipfs = new SimpleIPFSService();

  const handleUpload = async () => {
    setIsUploading(true);
    setError('');
    setUploadResult(null);

    try {
      const encoder = new TextEncoder();
      const testData = encoder.encode(testText);
      const fileName = `test-upload-${Date.now()}.txt`;
      
      console.log('Uploading to IPFS...', { fileName, size: testData.length });
      
      const result = await ipfs.uploadFilePublic(testData, fileName, 'text/plain');
      
      setUploadResult(result);
      console.log('Upload successful:', result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetrieve = async () => {
    if (!uploadResult?.cid) return;

    setIsRetrieving(true);
    setError('');

    try {
      console.log('Retrieving from IPFS...', uploadResult.cid);
      
      const data = await ipfs.retrieveFile(uploadResult.cid);
      const decoder = new TextDecoder('utf8');
      const text = decoder.decode(data);
      
      setRetrievedText(text);
      console.log('Retrieval successful:', text);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Retrieval failed';
      setError(errorMessage);
      console.error('Retrieval failed:', err);
    } finally {
      setIsRetrieving(false);
    }
  };

  const handleCheckExists = async () => {
    if (!uploadResult?.cid) return;

    try {
      console.log('Checking file existence...', uploadResult.cid);
      
      const exists = await ipfs.fileExists(uploadResult.cid);
      console.log('File exists:', exists);
      
      if (exists) {
        setError('');
      } else {
        setError('File does not exist on IPFS');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Existence check failed';
      setError(errorMessage);
      console.error('Existence check failed:', err);
    }
  };

  const handleGetMetadata = async () => {
    if (!uploadResult?.cid) return;

    try {
      console.log('Getting file metadata...', uploadResult.cid);
      
      const metadata = await ipfs.getFileMetadata(uploadResult.cid);
      console.log('Metadata:', metadata);
      
      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Metadata retrieval failed';
      setError(errorMessage);
      console.error('Metadata retrieval failed:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            IPFS Upload Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Text Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Test Text to Upload</label>
            <Textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Enter text to upload to IPFS..."
              rows={4}
            />
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={isUploading || !testText.trim()}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading to IPFS...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload to IPFS
              </>
            )}
          </Button>

          {/* Upload Result */}
          {uploadResult && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Upload Successful!</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">CID:</span>
                    <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                      {uploadResult.cid}
                    </code>
                  </div>
                  <div>
                    <span className="font-medium">Size:</span> {uploadResult.size} bytes
                  </div>
                  <div>
                    <span className="font-medium">Gateway URL:</span>
                    <a
                      href={uploadResult.gatewayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline"
                    >
                      {uploadResult.gatewayUrl}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">Error</span>
                </div>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Test Actions */}
          {uploadResult && (
            <div className="space-y-4">
              <h3 className="font-medium">Test Actions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={handleRetrieve}
                  disabled={isRetrieving}
                  variant="outline"
                  className="w-full"
                >
                  {isRetrieving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Retrieving...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Retrieve File
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleCheckExists}
                  variant="outline"
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Check Exists
                </Button>

                <Button
                  onClick={handleGetMetadata}
                  variant="outline"
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Get Metadata
                </Button>
              </div>

              {/* Retrieved Text Display */}
              {retrievedText && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800">Retrieved Content</span>
                    </div>
                    <p className="text-sm text-blue-700 bg-white p-3 rounded border">
                      {retrievedText}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Instructions */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="pt-4">
              <h3 className="font-medium mb-2">Setup Instructions</h3>
              <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                <li>Create a <code>.env.local</code> file in your project root</li>
                <li>Add your Pinata API keys:
                  <pre className="mt-1 bg-gray-100 p-2 rounded text-xs">
{`VITE_PINATA_API_KEY=your_api_key_here
VITE_PINATA_SECRET_KEY=your_secret_key_here`}
                  </pre>
                </li>
                <li>Get your API keys from <a href="https://pinata.cloud" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">pinata.cloud</a></li>
                <li>Restart your development server</li>
              </ol>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
