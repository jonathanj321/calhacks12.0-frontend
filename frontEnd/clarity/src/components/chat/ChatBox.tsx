import { useState, useRef, useEffect } from 'react';

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

type ChatBoxProps = {
  conceptContext?: string;
  questionContext?: string;
};

export default function ChatBox({ conceptContext, questionContext }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add initial bot message when concept changes
  useEffect(() => {
    if (conceptContext) {
      let initialMessage = `I'm here to help you with ${conceptContext}. What would you like to know?`;
      
      // If there's question context, add it to the initial message
      if (questionContext) {
        initialMessage = `I see you're looking at "${questionContext}" How can I help you with this problem?`;
      }
      
      setMessages([
        {
          id: Date.now().toString(),
          content: initialMessage,
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    }
  }, [conceptContext, questionContext]);

  // Don't auto-scroll to bottom of messages on initial load
  useEffect(() => {
    // Only auto-scroll when user sends a message or gets a response
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    // In a real implementation, this would call the Claude API
    // For now, we'll simulate a response
    setTimeout(() => {
      let responseContent = `This is a simulated response about ${conceptContext || 'algorithms'} based on your question: "${inputValue}"`;
      
      // Customize response if question context is available
      if (questionContext) {
        responseContent = `This is a simulated response about ${conceptContext}: "${questionContext}" based on your question: "${inputValue}"`;
      }
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="h-96 border border-gray-300 rounded-xl flex flex-col bg-gray-50">
      <div className="p-4 bg-blue-600 text-white rounded-t-xl">
        <h3 className="font-medium">Clarity Assistant</h3>
        {conceptContext && (
          <p className="text-sm text-blue-100">Context: {conceptContext}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`max-w-3/4 p-3 rounded-lg ${
              message.sender === 'user' 
                ? 'bg-blue-500 text-white ml-auto' 
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            {message.content}
          </div>
        ))}
        
        {isLoading && (
          <div className="bg-gray-200 text-gray-800 p-3 rounded-lg max-w-3/4 flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-300 flex">
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={questionContext 
            ? `Ask about ${questionContext}...` 
            : `Ask about ${conceptContext || 'algorithms'}...`
          }
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          autoFocus={false}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading || !inputValue.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
} 