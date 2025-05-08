"use client";

import React, { useState, FormEvent } from 'react';
import { Send } from 'lucide-react'; // Using Lucide for icons

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  isLoading?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim() === '') return;
    onSendMessage(text.trim());
    setText(''); // Clear input after sending
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center"
    >
      {/* Placeholder for attachment button - Future enhancement */}
      {/* 
      <button type="button" className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">
        <Paperclip size={20} /> 
      </button> 
      */}
      
      <input 
        type="text" 
        value={text} 
        onChange={(e) => setText(e.target.value)} 
        placeholder="اكتب رسالتك هنا..." 
        className="flex-1 px-4 py-2 mx-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        disabled={isLoading}
      />
      <button 
        type="submit" 
        className="p-2 text-white bg-blue-500 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        disabled={isLoading || text.trim() === ''}
      >
        <Send size={20} />
      </button>
    </form>
  );
};

export default MessageInput;

