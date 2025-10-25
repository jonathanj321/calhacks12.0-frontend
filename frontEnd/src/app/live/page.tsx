'use client';

import React, { useState, useRef, useEffect } from 'react';

// --- Inline SVG Icons ---
const IconCheck = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const IconCamera = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const IconMic = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
);

const IconWifi = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" x2="12.01" y1="20" y2="20" />
    </svg>
);

const IconWifiOff = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="1" x2="23" y1="1" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
      <path d="M5 12.55a11 11 0 0 1 5.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
      <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" x2="12.01" y1="20" y2="20" />
    </svg>
);
// --- End SVG Icons ---

// A simple in-page modal component
const Modal = ({ message, onClose }: { message: string, onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
        <IconCheck className="h-6 w-6 text-green-600" />
      </div>
      <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Success</h3>
      <p className="text-sm text-gray-500 mt-2">{message}</p>
      <button
        onClick={onClose}
        className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
      >
        Close
      </button>
    </div>
  </div>
);

/**
 * This component now acts as a "viewer" or "listener".
 * It connects to the backend and ONLY receives transcript updates.
 * The video element is a placeholder, waiting for a video stream (e.g., WebRTC or HLS).
 */
export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const webSocketRef = useRef<WebSocket | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [interimText, setInterimText] = useState('');
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<string[]>([]);

  // --- Placeholder for uploading screenshot ---
  const uploadScreenshot = async (imageBlob: Blob | null) => {
    if (!imageBlob) return;
    console.log('Uploading screenshot...', imageBlob);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Upload complete');
    setModalMessage('Screenshot saved and uploaded successfully!');
  };

  // --- Take a Screenshot of the Video Element ---
  const takeScreenshot = () => {
    if (!videoRef.current) {
      console.warn('Video element not available.');
      return;
    }
    
    // Check if video has content
    if (videoRef.current.readyState < 1 || videoRef.current.videoWidth === 0) {
      console.warn('Video stream not active or loaded, cannot take screenshot.');
      setModalMessage('Video stream is not active.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          uploadScreenshot(blob); // Upload to backend (placeholder)
          const url = URL.createObjectURL(blob);
          setScreenshots(prev => [...prev, url]);
        }
      }, 'image/png');
    }
  };

  // --- WebSocket Connection Logic ---
  const connectWebSocket = () => {
    // Disconnect if already connected
    if (webSocketRef.current) {
      webSocketRef.current.close();
    }

    // NOTE: Replace with your deployed backend URL
    const ws = new WebSocket('ws://localhost:3000/api/clients');
    webSocketRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to backend transcript server.');
      setIsConnected(true);
      setTranscription('');
      setInterimText('Listening for audio stream...');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'transcript_update') {
          const newText = data.text;
          
          if (data.is_final) {
            setTranscription(prev => prev + newText + ' ');
            setInterimText('');
          } else {
            setInterimText(newText);
          }
        }
      } catch (e) {
        console.error("Error parsing WebSocket message:", e);
      }
    };

    ws.onerror = (e) => {
      console.error('WebSocket Error:', e);
      setInterimText('[CONNECTION ERROR]');
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket closed.');
      if (isConnected) { // Only show disconnected if it was previously connected
        setInterimText('Disconnected from stream.');
      }
      setIsConnected(false);
    };
  };

  // Connect on mount and handle cleanup
  useEffect(() => {
    connectWebSocket(); // Connect when component loads

    return () => {
      webSocketRef.current?.close(); // Disconnect on unmount
      screenshots.forEach(url => URL.revokeObjectURL(url)); // Cleanup screenshot URLs
    };
  }, [screenshots]); // Re-run effect if screenshots change (for cleanup)

  return (
    <div className="p-6 md:p-10 space-y-6 bg-gray-50 min-h-screen">
      {modalMessage && <Modal message={modalMessage} onClose={() => setModalMessage(null)} />}
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content (Left) */}
        <div className="flex-1 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Live Stream Viewer</h1>
          
          {/* Video Preview */}
          <div className="bg-black rounded-lg shadow-md overflow-hidden aspect-video max-w-4xl mx-auto relative">
            {/* This video element is now a PLACEHOLDER.
              You will need a video streaming solution (like WebRTC or HLS)
              to send a video feed from your phone to this element.
              The backend we built only handles AUDIO for transcription.
            */}
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover"></video>
            
            {/* Static placeholder text */}
            <div className="absolute inset-0 flex items-center justify-center flex-col text-gray-400 pointer-events-none">
              <IconCamera className="w-16 h-16" />
              <p className="mt-2">Video stream will appear here...</p>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-4 items-center justify-center max-w-4xl mx-auto">
            <button
              onClick={takeScreenshot}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-md font-medium text-white shadow-sm transition-colors bg-blue-600 hover:bg-blue-700"
            >
              <IconCamera className="w-5 h-5" />
              Take Screenshot
            </button>
          </div>

          {/* Key Visuals (Screenshots) Section */}
          <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">Key Visuals</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {screenshots.length > 0 ? (
                screenshots.map((src, index) => (
                  <div key={index} className="aspect-video bg-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <img src={src} alt={`Screenshot ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))
              ) : (
                <p className="text-gray-500 col-span-full">Screenshots will appear here...</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar (Right) - Live Transcription */}
        <div className="w-full lg:w-full lg:max-w-sm space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">Live Transcription</h2>
          
          {/* Connection Status Button */}
          <button
            onClick={connectWebSocket} // Re-connect if disconnected
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-md font-medium text-white shadow-sm transition-colors w-full
              ${isConnected ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {isConnected ? <IconWifi className="w-5 h-5" /> : <IconWifiOff className="w-5 h-5" />}
            {isConnected ? 'Connected to Stream' : 'Disconnected (Click to Reconnect)'}
          </button>
          
          {/* Transcription Output */}
          <div className="w-full bg-white p-4 rounded-lg shadow-md border border-gray-200 h-[400px] lg:h-[calc(100vh-200px)] overflow-y-auto">
            <p className="text-gray-700 whitespace-pre-wrap">
              {/* Display the accumulated final text */}
              {transcription}
              
              {/* Display the current, non-final (interim) text */}
              <span className="text-gray-400 italic">
                {interimText}
              </span>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

