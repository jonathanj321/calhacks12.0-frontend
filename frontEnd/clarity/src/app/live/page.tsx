'use client';

import React, { useState, useRef, useEffect } from 'react';

// --- Inline SVG Icons (Replaced lucide-react) ---
// ... (SVG components remain unchanged) ...
const IconCheck = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const IconCamera = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const IconMic = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
);

const IconStopCircle = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <rect width="6" height="6" x="9" y="9" />
  </svg>
);

const IconRadio = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="2" />
    <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48 0a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
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

export default function CapturesPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<string[]>([]); // To store screenshot URLs

  // --- Backend Placeholder Functions ---

  /**
   * Placeholder: Uploads the recorded video blob to the backend/storage.
   */
  const uploadRecording = async (videoBlob: Blob) => {
    console.log('Uploading recording...', videoBlob);
    // In a real app, you'd use fetch() to POST this blob to your backend.
    // ...
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Upload complete');
    setModalMessage('Video recording saved and uploaded successfully!');
  };

  /**
   * Placeholder: Uploads the screenshot blob to the backend/storage.
   */
  const uploadScreenshot = async (imageBlob: Blob | null) => {
    if (!imageBlob) return;
    console.log('Uploading screenshot...', imageBlob);
    // ...
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Upload complete');
    setModalMessage('Screenshot saved and uploaded successfully!');
  };

  /**
   * Placeholder: Sends an audio chunk for live transcription.
   */
  const handleTranscriptionData = (audioChunk: Blob) => {
    console.log('Sending audio chunk for transcription...', audioChunk);
    // ...

    // --- MOCK TRANSCRIPTION ---
    const mockTranscriptions = ["Hello, this is a test.", "Welcome to the lecture.", "We are discussing...", "This is important."];
    const newText = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
    setTranscription(prev => prev + newText + ' ');
  };

  // --- Core Media Functions ---

  const toggleCamera = async () => {
    if (isCameraOn) {
      // Turn camera off
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      mediaStreamRef.current = null;
      setIsCameraOn(false);
      setIsRecording(false);
      setIsTranscribing(false);
    } else {
      // Turn camera on
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        mediaStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      } catch (err) {
        console.error('Error accessing media devices. Please check permissions.', err);
      }
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start recording
      if (!mediaStreamRef.current) {
        console.warn('Please turn on the camera first.');
        return;
      }
      
      const recordedChunks: Blob[] = [];
      mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current, {
        mimeType: 'video/webm'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
        uploadRecording(videoBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  // Take a Screenshot
  const takeScreenshot = () => {
    if (!videoRef.current) {
      console.warn('Please turn on the camera first.');
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
          // Upload to backend
          uploadScreenshot(blob);
          
          // Create a local URL to display the screenshot immediately
          const url = URL.createObjectURL(blob);
          setScreenshots(prev => [...prev, url]);
        }
      }, 'image/png');
    }
  };

  const toggleTranscription = () => {
    if (isTranscribing) {
      // Stop transcription
      setIsTranscribing(false);
      console.log('Stopped transcription.');
    } else {
      // Start transcription
      if (!mediaStreamRef.current) {
        console.warn('Please turn on the camera first.');
        return;
      }
      
      setIsTranscribing(true);
      setTranscription('Starting live transcription... ');
      console.log('Started transcription (simulation).');
      
      // MOCK: Simulate receiving transcription data
      const interval = setInterval(() => {
        if (!isTranscribing) { // Check if it was stopped
           clearInterval(interval);
           return;
        }
        handleTranscriptionData(new Blob()); 
      }, 3000);
      
      mediaRecorderRef.current?.addEventListener('stop', () => clearInterval(interval), { once: true });
    }
  };
  
  // Cleanup
  useEffect(() => {
    // This function is called when the component unmounts
    return () => {
      mediaStreamRef.current?.getTracks().forEach(track => track.stop());
      // Revoke object URLs to prevent memory leaks
      screenshots.forEach(url => URL.revokeObjectURL(url));
    };
  }, [screenshots]); // Dependency on screenshots to clean up old URLs

  return (
    <div className="p-6 md:p-10 space-y-6 bg-gray-50 min-h-screen">
      {modalMessage && <Modal message={modalMessage} onClose={() => setModalMessage(null)} />}
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content (Left) */}
        <div className="flex-1 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Live Capture</h1>
          
          {/* Video Preview */}
          <div className="bg-black rounded-lg shadow-md overflow-hidden aspect-video max-w-4xl mx-auto relative">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover"></video>
            {!isCameraOn && (
              <div className="absolute inset-0 flex items-center justify-center flex-col text-gray-400">
                <IconCamera className="w-16 h-16" />
                <p className="mt-2">Camera is off</p>
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-4 items-center justify-center max-w-4xl mx-auto">
            <button
              onClick={toggleCamera}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-md font-medium text-white shadow-sm transition-colors
                ${isCameraOn ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isCameraOn ? <IconStopCircle className="w-5 h-5" /> : <IconCamera className="w-5 h-5" />}
              {isCameraOn ? 'Stop Camera' : 'Start Camera'}
            </button>

            <button
              onClick={toggleRecording}
              disabled={!isCameraOn}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-md font-medium text-white shadow-sm transition-colors
                ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}
                ${!isCameraOn ? 'bg-gray-400 cursor-not-allowed' : ''}`}
            >
              {isRecording ? <IconStopCircle className="w-5 h-5" /> : <IconRadio className="w-5 h-5" />}
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>

            <button
              onClick={takeScreenshot}
              disabled={!isCameraOn}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-md font-medium text-white shadow-sm transition-colors bg-blue-600 hover:bg-blue-700
                ${!isCameraOn ? 'bg-gray-400 cursor-not-allowed' : ''}`}
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
          <button
            onClick={toggleTranscription}
            disabled={!isCameraOn}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-md font-medium text-white shadow-sm transition-colors w-full
              ${isTranscribing ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}
              ${!isCameraOn ? 'bg-gray-400 cursor-not-allowed' : ''}`}
          >
            <IconMic className="w-5 h-5" />
            {isTranscribing ? 'Stop Transcription' : 'Start Live Transcription'}
          </button>
          <div className="w-full bg-white p-4 rounded-lg shadow-md border border-gray-200 h-[400px] lg:h-[calc(100vh-200px)] overflow-y-auto">
            <p className="text-gray-700 whitespace-pre-wrap">
              {transcription || <span className="text-gray-400">Transcription will appear here...</span>}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

