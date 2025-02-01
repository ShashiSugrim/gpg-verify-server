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