"use client"
import { useState } from "react";

export default function Home() {
  const [publicKeyFile, setPublicKeyFile] = useState<File | null>(null);
  const [hashFile, setHashFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [verificationResult, setVerificationResult] = useState<string>("");
  const [dragActive, setDragActive] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [loadedSize, setLoadedSize] = useState(0);
  const [transferRate, setTransferRate] = useState(0);

  const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

  const deleteButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: '#FF3B30',
    background: 'rgba(255, 59, 48, 0.1)',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    padding: '4px 8px',
    marginLeft: '8px',
    transition: 'background 0.2s',
    ':hover': {
      background: 'rgba(255, 59, 48, 0.2)'
    }
  };

  const clearPublicKey = () => setPublicKeyFile(null);
  const clearHashFile = () => setHashFile(null);
  const clearSignature = () => setSignatureFile(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!publicKeyFile || !hashFile || !signatureFile) return;

    // Client-side size check
    const totalFileSize = publicKeyFile.size + hashFile.size + signatureFile.size;
    if (totalFileSize > MAX_FILE_SIZE) {
      setError("Total files size exceeds 2GB limit");
      setVerificationResult("");
      return;
    }

    setIsLoading(true);
    setError(null);
    setVerificationResult("");
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append("public_key", publicKeyFile);
    formData.append("hash_file", hashFile);
    formData.append("signature_file", signatureFile);

    const startTime = Date.now();
    setTotalSize(totalFileSize);

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const loaded = event.loaded;
          setLoadedSize(loaded);
          const progress = (loaded / totalFileSize) * 100;
          setUploadProgress(progress);
          
          const timeElapsed = (Date.now() - startTime) / 1000;
          const rate = loaded / timeElapsed;
          setTransferRate(rate);
        }
      });

      xhr.onerror = () => {
        if (totalFileSize > MAX_FILE_SIZE) {
          setError("File exceeds the 2GB limit");
        } else {
          setError("Server OVERLOADED!!! Please try again later.");
        }
        setVerificationResult("");
        setIsLoading(false);
      };

      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 413) {
            setError("File exceeds the 2GB limit");
            setVerificationResult("");
          } else if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data.verified) {
                setVerificationResult(`✅ Verification successful!\nFingerprint: ${data.fingerprint}`);
              } else {
                setVerificationResult("❌ Bad signature");
              }
            } catch (e) {
              setError("Invalid server response");
              setVerificationResult("");
            }
          } else if (xhr.status !== 0) {
            setError(xhr.statusText || "Verification failed");
            setVerificationResult("");
          }
          setIsLoading(false);
        }
      };

      xhr.open("POST", `${process.env.NEXT_PUBLIC_BACKEND_URL}/verify`);
      xhr.send(formData);

    } catch (err) {
      setError("Unexpected error occurred");
      setVerificationResult("");
      setIsLoading(false);
    }
  }
  function handleDrag(e: React.DragEvent, field: string) {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(field);
    } else if (e.type === "dragleave") {
      setDragActive(null);
    }
  }

  function handleDrop(e: React.DragEvent, setFile: (file: File | null) => void) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }

  const FileInput = ({ label, file, setFile, id }: {
    label: string;
    file: File | null;
    setFile: (file: File | null) => void;
    id: string;
  }) => (
    <div className="w-full"
         onDragEnter={(e) => handleDrag(e, id)}
         onDragLeave={(e) => handleDrag(e, id)}
         onDragOver={(e) => handleDrag(e, id)}
         onDrop={(e) => handleDrop(e, setFile)}>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
        {file && (
          <span className="text-sm text-gray-500">
            File selected: {file.name}
          </span>
        )}
      </div>
      <label
        htmlFor={id}
        className={`
          w-full min-h-[160px]
          flex flex-col items-center justify-center
          border-2 border-dashed rounded-lg p-6
          transition-all duration-200 cursor-pointer
          relative
          ${dragActive === id 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${file ? 'bg-green-50 border-green-500' : ''}
        `}
      >
        <div className="flex flex-col items-center gap-4 w-full">
          {file ? (
            <>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  if (id === 'public-key') clearPublicKey();
                  else if (id === 'hash-file') clearHashFile();
                  else clearSignature();
                }}
                style={deleteButtonStyle}
                title="Remove file"
                className="absolute top-4 right-4"
              >
                <span>Delete</span> <span>✖</span>
              </button>

              <div className="flex flex-col items-center gap-2 mt-4">
                <svg className="w-8 h-8 text-green-500" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-green-600">File uploaded</span>
              </div>
            </>
          ) : (
            <>
              <svg className="w-8 h-8 text-gray-400" fill="none" strokeWidth="1.5" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
              <span className="text-sm font-medium text-gray-600">Drag & drop or click to upload</span>
            </>
          )}
        </div>
        <input
          id={id}
          name={id}
          type="file"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required={!file}
        />
      </label>
    </div>
  );  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <main className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">GPG Signature Verification</h1>
          <p className="mt-2 text-gray-600">Upload the required files to verify the signature</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FileInput
            label="Upload Public Key"
            file={publicKeyFile}
            setFile={setPublicKeyFile}
            id="public-key"
          />

          <FileInput
            label="Upload File to Test"
            file={hashFile}
            setFile={setHashFile}
            id="hash-file"
          />

          <FileInput
            label="Upload Signature File"
            file={signatureFile}
            setFile={setSignatureFile}
            id="signature-file"
          />

          <button
            type="submit"
            disabled={isLoading || !publicKeyFile || !hashFile || !signatureFile}
            className={`
              w-full py-3 px-4 rounded-md font-medium
              transition-colors focus:outline-none focus:ring-2 
              focus:ring-offset-2 focus:ring-blue-500
              ${isLoading 
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }
            `}
          >
            {isLoading ? 'Verifying...' : 'Verify Signature'}
          </button>

          {isLoading && (
            <div className="w-full mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="text-sm text-gray-600 text-center">
                <span>{Math.round(uploadProgress)}%</span>
                {totalSize > 0 && (
                  <span className="ml-2">
                    ({(loadedSize / 1024 / 1024).toFixed(2)}MB / {(totalSize / 1024 / 1024).toFixed(2)}MB)
                  </span>
                )}
                {transferRate > 0 && (
                  <span className="ml-2">
                    {(transferRate / 1024 / 1024).toFixed(2)} MB/s
                  </span>
                )}
              </div>
            </div>
          )}
        </form>

        {error && (
          <div className="p-4 rounded-lg text-center border bg-red-50 border-red-500 text-red-700">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {verificationResult && !error && (
          <div className={`
            p-4 rounded-lg text-center border
            ${verificationResult.includes('successful') 
              ? 'bg-green-50 border-green-500 text-green-700' 
              : 'bg-red-50 border-red-500 text-red-700'
            }
          `}>
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {verificationResult}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}