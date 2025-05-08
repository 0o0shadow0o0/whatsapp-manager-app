"use client";

import React, { useRef, useEffect } from 'react';
import MessageItem, { Message } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  // onFetchMoreMessages?: () => void; // For infinite scrolling
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // Scroll to bottom when new messages arrive

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">جاري تحميل الرسائل...</p>
        {/* TODO: Add a spinner component */}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">لا توجد رسائل في هذه المحادثة. ابدأ بإرسال رسالة!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* TODO: Implement infinite scroll loader if onFetchMoreMessages is provided */}
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;

