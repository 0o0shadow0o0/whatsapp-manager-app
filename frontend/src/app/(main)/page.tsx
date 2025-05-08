"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient';
import io, { Socket } from 'socket.io-client';
import ChatView from '@/components/chat/ChatView'; // Import the ChatView component

// Define types for session status and QR data
interface SessionStatus {
  status: string;
  phoneNumber?: string;
  message?: string;
}

interface QrData {
  qrCode: string;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

const DashboardPage = () => {
  const { admin } = useAuth();
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket.IO connected:', newSocket.id);
      apiClient.get('/whatsapp/session/status')
        .then(response => {
          setSessionStatus(response.data);
          if (response.data.status === 'pending_qr') {
            apiClient.get('/whatsapp/session/qr').catch(console.error);
          }
        })
        .catch(err => {
          console.error('Error fetching initial session status:', err);
          setError('Failed to fetch session status.');
        });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err);
      setError(`Socket connection failed: ${err.message}. Ensure backend is running.`);
    });

    newSocket.on('whatsapp_status_update', (data: SessionStatus) => {
      console.log('Received whatsapp_status_update:', data);
      setSessionStatus(data);
      if (data.status === 'connected') {
        setQrCode(null);
      }
      if (data.status === 'pending_qr') {
        apiClient.get('/whatsapp/session/qr').catch(console.error);
      }
    });

    newSocket.on('whatsapp_qr_updated', (data: QrData) => {
      console.log('Received whatsapp_qr_updated');
      setQrCode(data.qrCode);
      setSessionStatus(prev => ({ ...prev, status: 'pending_qr' } as SessionStatus));
    });

    // new_message and message_update listeners are now primarily handled within ChatView

    return () => {
      if (newSocket) {
        console.log('Cleaning up socket connection from DashboardPage...');
        newSocket.off('connect');
        newSocket.off('disconnect');
        newSocket.off('connect_error');
        newSocket.off('whatsapp_status_update');
        newSocket.off('whatsapp_qr_updated');
        newSocket.disconnect();
      }
    };
  }, []);

  const handleRequestQr = async () => {
    setError(null);
    try {
      await apiClient.get('/whatsapp/session/qr');
    } catch (err: any) {
      console.error('Error requesting QR code:', err);
      setError(err.response?.data?.error || 'Failed to request QR code.');
    }
  };
  
  const handleDisconnectSession = async () => {
    setError(null);
    try {
      await apiClient.post('/whatsapp/session/disconnect');
    } catch (err: any) {
      console.error('Error disconnecting session:', err);
      setError(err.response?.data?.error || 'Failed to disconnect session.');
    }
  };

  if (!admin) {
    return <p>الرجاء تسجيل الدخول لعرض لوحة التحكم.</p>; // This should ideally be handled by ProtectedRoute
  }

  // If not connected and no QR code is available yet, show loading or prompt to connect.
  const showConnectionManagement = sessionStatus?.status !== 'connected';

  return (
    <div className="h-full flex flex-col">
      {error && (
        <div className="p-2 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 sticky top-0 z-10">
          خطأ: {error}
        </div>
      )}

      {showConnectionManagement && (
        <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <h2 className="text-xl font-medium mb-2">إدارة اتصال واتساب</h2>
          {sessionStatus ? (
            <p>الحالة: <span className={`font-semibold ${sessionStatus.status === 'connected' ? 'text-green-600' : 'text-orange-600'}`}>{sessionStatus.status}</span></p>
          ) : (
            <p>جاري تحميل حالة الاتصال...</p>
          )}
          {sessionStatus?.phoneNumber && <p>الرقم المتصل: {sessionStatus.phoneNumber}</p>}
          {sessionStatus?.message && <p>رسالة: {sessionStatus.message}</p>}

          {sessionStatus?.status === 'pending_qr' && qrCode && (
            <div className="mt-4 text-center">
              <h3 className="text-lg font-medium mb-2">امسح رمز QR للربط</h3>
              <div className="flex justify-center">
                <pre className="p-2 bg-gray-100 dark:bg-gray-700 overflow-auto text-xs">{qrCode}</pre>
                {/* TODO: Replace with actual QR image rendering using a library like qrcode.react */}
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">افتح واتساب على هاتفك، ثم امسح الرمز.</p>
            </div>
          )}

          {sessionStatus?.status !== 'connected' && sessionStatus?.status !== 'pending_qr' && (
            <button 
                onClick={handleRequestQr}
                className="mt-4 mr-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                طلب رمز QR / إعادة محاولة الاتصال
            </button>
          )}
          
          {sessionStatus?.status === 'connected' && (
            <button 
              onClick={handleDisconnectSession}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              قطع اتصال واتساب
            </button>
          )}
        </div>
      )}

      {/* Chat Interface - Render ChatView and pass the socket */}
      {/* The ChatView itself will be responsible for its internal layout (ConversationList, MessageList, etc.) */}
      <div className={`flex-grow ${showConnectionManagement ? 'pt-2' : ''}`}>
        {socket ? (
            <ChatView socket={socket} />
        ) : (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">جاري تهيئة واجهة الدردشة...</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;

