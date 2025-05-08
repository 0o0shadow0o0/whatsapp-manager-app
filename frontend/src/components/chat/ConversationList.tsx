"use client";

import React from 'react';

// Dummy data for now
const conversations = [
  { id: '1', name: 'مجموعة العمل', lastMessage: 'تمام، سأقوم بذلك.', unread: 2, timestamp: '10:30 ص' },
  { id: '2', name: 'أحمد محمود', lastMessage: 'شكراً جزيلاً!', unread: 0, timestamp: '9:15 ص' },
  { id: '3', name: 'فريق التسويق', lastMessage: 'الاجتماع غداً الساعة 3 عصراً.', unread: 5, timestamp: 'أمس' },
];

interface ConversationItemProps {
  name: string;
  lastMessage: string;
  unread: number;
  timestamp: string;
  onClick: () => void;
  isActive: boolean;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ name, lastMessage, unread, timestamp, onClick, isActive }) => {
  return (
    <div 
      onClick={onClick}
      className={`p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 ${isActive ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
    >
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 dark:text-white">{name}</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">{timestamp}</span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{lastMessage}</p>
      {unread > 0 && (
        <div className="mt-1 flex justify-end">
          <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">{unread}</span>
        </div>
      )}
    </div>
  );
};

interface ConversationListProps {
  onSelectConversation: (conversationId: string) => void;
  activeConversationId: string | null;
}

const ConversationList: React.FC<ConversationListProps> = ({ onSelectConversation, activeConversationId }) => {
  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-800 shadow-md">
      {/* Search/Filter bar - Placeholder */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <input 
          type="text" 
          placeholder="بحث أو بدء محادثة جديدة"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      {
        conversations.map(conv => (
          <ConversationItem 
            key={conv.id}
            name={conv.name}
            lastMessage={conv.lastMessage}
            unread={conv.unread}
            timestamp={conv.timestamp}
            onClick={() => onSelectConversation(conv.id)}
            isActive={conv.id === activeConversationId}
          />
        ))
      }
      {conversations.length === 0 && (
        <p className="p-4 text-center text-gray-500 dark:text-gray-400">لا توجد محادثات لعرضها.</p>
      )}
    </div>
  );
};

export default ConversationList;

