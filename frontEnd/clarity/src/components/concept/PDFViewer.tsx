import { useState, useEffect } from 'react';

type PDFViewerProps = {
  url: string;
  onClose: () => void;
};

export default function PDFViewer({ url, onClose }: PDFViewerProps) {
  const [content, setContent] = useState<string>('Loading...');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPDF() {
      try {
        setIsLoading(true);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to load file: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        setContent(text);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setIsLoading(false);
      }
    }

    fetchPDF();
  }, [url]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">PDF Viewer (Demo)</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-auto flex-grow">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500">
              <p className="font-bold">Error:</p>
              <p>{error}</p>
              <p className="mt-4 text-sm text-gray-600">
                Note: In a production environment, you would have actual PDF files here instead of text files.
              </p>
            </div>
          ) : (
            <div className="prose max-w-none">
              <div className="bg-gray-100 p-4 rounded mb-4">
                <p className="text-sm text-gray-600 italic">
                  Note: This is a text file simulating a PDF for demonstration purposes.
                  In a real application, this would display an actual PDF document.
                </p>
              </div>
              <pre className="whitespace-pre-wrap">{content}</pre>
            </div>
          )}
        </div>
        
        <div className="px-4 py-3 bg-gray-50 text-right rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 