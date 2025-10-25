import React from 'react';

/**
 * This is the main component for the "Captures" page.
 * It displays a header and a grid of video placeholders.
 * Per project conventions, it is exported as the default 'App' component.
 */
export default function App() {
  
  // An array of mock video data to demonstrate the layout
  const mockVideos = [
    { id: 1, title: 'Gameplay Highlight', duration: '02:30' },
    { id: 2, title: 'Full Match Recording', duration: '45:12' },
    { id: 3, title: 'Quick Clip', duration: '00:45' },
    { id: 4, title: 'Tutorial Session', duration: '15:20' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-6 sm:p-10 font-inter">
      <div className="max-w-7xl mx-auto">
        
        {/* Page Header */}
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-gray-800">
          Captures
        </h1>
        
        {/* Video Grid Placeholder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          
          {/* Map over mock video data to create placeholder cards */}
          {mockVideos.map((video) => (
            <div 
              key={video.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg"
            >
              {/* Aspect-ratio box for the video thumbnail placeholder */}
              <div className="aspect-video bg-gray-200 flex items-center justify-center">
                {/* Simple play icon */}
                <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8.068v3.864a1 1 0 001.555.832l3.197-1.932a1 1 0 000-1.664l-3.197-1.932z" clipRule="evenodd"></path>
                </svg>
              </div>
              
              {/* Video Information */}
              <div className="p-4">
                <p className="font-semibold text-gray-800 truncate" title={video.title}>
                  {video.title}
                </p>
                <p className="text-sm text-gray-500">
                  {video.duration}
                </p>
              </div>
            </div>
          ))}

          {/* A card to indicate adding more videos */}
          <div className="aspect-video bg-transparent border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors">
            <div className="text-center">
              <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              <span className="mt-2 block text-sm font-medium">Add New Capture</span>
            </div>
          </div>

        </div>
        
      </div>
    </div>
  );
}

