"use client";

import React from 'react';
import { format } from 'date-fns'; // For formatting timestamps
import { Check, CheckCheck } from 'lucide-react'; // For message status icons

export interface Message {
  id: string;
  text: string;
  timestamp: number | Date;
  fromMe: boolean;
  senderName?: string; // Optional: for group chats or if displaying sender for incoming
  status?: 'sent' | 'delivered' | 'read' | 'pending' | 'error'; // For outgoing messages
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location' | 'reaction' | 'revoked' | 'unknown';
  content?: any; // For non-text messages
}

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isOutgoing = message.fromMe;
  const alignment = isOutgoing ? 'justify-end' : 'justify-start';
  const bgColor = isOutgoing ? 'bg-green-100 dark:bg-green-700' : 'bg-white dark:bg-gray-700';
  const textColor = isOutgoing ? 'text-green-900 dark:text-green-50' : 'text-gray-800 dark:text-gray-100';
  const bubbleStyles = isOutgoing ? 'rounded-l-lg rounded-br-lg' : 'rounded-r-lg rounded-bl-lg';

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return <p className={`text-sm ${textColor}`}>{message.text}</p>;
      // TODO: Add rendering for other message types (image, video, etc.)
      // For example:
      // case 'image':
      //   return <img src={message.content?.url} alt={message.content?.caption || 'Image'} className="max-w-xs rounded-lg" />;
      default:
        return <p className={`text-sm italic ${textColor}`}>[Unsupported message type: {message.type}]</p>;
    }
  };

  const renderStatusIcon = () => {
    if (!isOutgoing || !message.status) return null;
    switch (message.status) {
      case 'sent':
        return <Check size={16} className="text-gray-500 dark:text-gray-400" />;
      case 'delivered':
        return <CheckCheck size={16} className="text-gray-500 dark:text-gray-400" />;
      case 'read':
        return <CheckCheck size={16} className="text-blue-500" />;
      case 'pending':
        return <Check size={16} className="text-gray-400 dark:text-gray-500 animate-pulse" />; // Or a clock icon
      case 'error':
        return <span className="text-red-500 text-xs">!</span>; // Or an error icon
      default:
        return null;
    }
  };

  return (
    <div className={`flex ${alignment} mb-2`}>
      <div className={`max-w-xs md:max-w-md lg:max-w-lg px-3 py-2 rounded-lg shadow ${bgColor} ${bubbleStyles}`}>
        {!isOutgoing && message.senderName && (
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-0.5">{message.senderName}</p>
        )}
        {renderMessageContent()}
        <div className="flex items-center justify-end mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
            {format(new Date(message.timestamp), 'HH:mm')}
          </span>
          {isOutgoing && renderStatusIcon()}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;

