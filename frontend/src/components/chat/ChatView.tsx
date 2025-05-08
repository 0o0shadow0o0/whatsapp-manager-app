"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ConversationList from './ConversationList';
import MessageList, { Message } from './MessageList';
import MessageInput from './MessageInput';
import apiClient from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { Socket } from 'socket.io-client'; // Assuming Socket type is available from where it's initialized

interface ChatViewProps {
  socket: Socket | null; // Pass the socket instance for real-time updates
}

const ChatView: React.FC<ChatViewProps> = ({ socket }) => {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { admin } = useAuth();

  // Fetch messages for the active conversation
  const fetchMessages = useCallback(async (jid: string) => {
    if (!admin) return;
    setIsLoadingMessages(true);
    setError(null);
    try {
      const response = await apiClient.get(`/messages/${jid}`);
      // Map backend message format to frontend Message interface
      const formattedMessages: Message[] = response.data.messages.map((msg: any) => ({
        id: msg.messageId, // Use Baileys messageId as frontend id
        text: msg.content?.text || (msg.type === "text" ? msg.content : `[${msg.type}]`), // Basic text extraction
        timestamp: new Date(msg.timestamp),
        fromMe: msg.fromMe,
        senderName: msg.fromMe ? undefined : msg.senderJid.split('@')[0], // Basic sender name
        status: msg.fromMe ? msg.status : undefined,
        type: msg.type,
        content: msg.content,
      }));
      setMessages(formattedMessages);
    } catch (err: any) {
      console.error(`Error fetching messages for ${jid}:`, err);
      setError(err.response?.data?.error || 'Failed to fetch messages.');
      setMessages([]); // Clear messages on error
    }
    setIsLoadingMessages(false);
  }, [admin]);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    }
  }, [activeConversationId, fetchMessages]);

  // Handle new message from socket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: { message: any; conversationJid: string }) => {
      console.log("ChatView: new_message received", data);
      if (data.conversationJid === activeConversationId) {
        // Add to current message list
        const newMessage: Message = {
          id: data.message.key.id,
          text: data.message.message?.conversation || data.message.message?.extendedTextMessage?.text || `[${Object.keys(data.message.message || {})[0]}]`,
          timestamp: new Date(parseInt(data.message.messageTimestamp) * 1000),
          fromMe: data.message.key.fromMe,
          senderName: data.message.key.fromMe ? undefined : (data.message.key.participant || data.message.key.remoteJid).split('@')[0],
          status: data.message.key.fromMe ? (data.message.status || 'sent') : undefined,
          type: Object.keys(data.message.message || {})[0]?.replace('Message','').toLowerCase() as Message['type'] || 'unknown',
          content: data.message.message,
        };
        setMessages(prevMessages => [...prevMessages, newMessage]);
      }
      // TODO: Update conversation list (unread count, last message) - this might be handled at a higher level or via another event
    };

    const handleMessageUpdate = (data: { messageId: string; status: Message['status']; conversationJid: string }) => {
      console.log("ChatView: message_update received", data);
      if (data.conversationJid === activeConversationId) {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === data.messageId ? { ...msg, status: data.status } : msg
          )
        );
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_update', handleMessageUpdate);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_update', handleMessageUpdate);
    };
  }, [socket, activeConversationId]);

  const handleSelectConversation = (jid: string) => {
    setActiveConversationId(jid);
    // Mark conversation as read via API (optional, or handled by backend on fetch)
    apiClient.put(`/conversations/${jid}/read`).catch(console.error);
  };

  const handleSendMessage = async (text: string) => {
    if (!activeConversationId || !admin) return;
    setError(null);
    try {
      // Optimistic update (optional, but good for UX)
      // const optimisticMessage: Message = {
      //   id: `temp-${Date.now()}`,
      //   text,
      //   timestamp: new Date(),
      //   fromMe: true,
      //   status: 'pending',
      //   type: 'text',
      // };
      // setMessages(prev => [...prev, optimisticMessage]);

      await apiClient.post('/messages/send', {
        jid: activeConversationId,
        type: 'text',
        content: { text },
      });
      // Message will be added to state via WebSocket 'new_message' event from backend after successful send
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.error || 'Failed to send message.');
      // Revert optimistic update if it failed
      // setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
    }
  };

  return (
    <div className="flex h-[calc(100vh-theme(space.16))] bg-gray-100 dark:bg-gray-900">
      {/* Sidebar with ConversationList */}
      <div className="w-1/3 lg:w-1/4 border-r border-gray-200 dark:border-gray-700">
        <ConversationList 
          onSelectConversation={handleSelectConversation} 
          activeConversationId={activeConversationId} 
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversationId ? (
          <>
            {/* Chat Header - Placeholder */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h2 className="font-semibold text-gray-800 dark:text-white">{activeConversationId.split('@')[0]}</h2>
              {/* TODO: Add online status, contact info button, etc. */}
            </div>

            {error && (
                <div className="p-2 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200">
                    Error: {error}
                </div>
            )}

            <MessageList messages={messages} isLoading={isLoadingMessages} />
            <MessageInput onSendMessage={handleSendMessage} isLoading={isLoadingMessages} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <p>الرجاء تحديد محادثة لبدء الدردشة.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatView;

