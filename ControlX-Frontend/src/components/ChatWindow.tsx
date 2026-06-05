import React, { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { fetchWithAuth, markMessagesAsRead } from '../lib/api';

interface Message {
  id?: number;
  sender: { id: number; fullName: string }; 
  recipient: { id: number; fullName: string } | null;
  text?: string; 
  content?: string;
  messageText?: string;
  timestamp: string;
}

interface ChatWindowProps {
  currentUser: any;
  selectedAgentId: number | null;
  missionId: number;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ currentUser, selectedAgentId, missionId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const stompClientRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!missionId || !currentUser.id) return;

    const fetchHistory = async () => {
      try {
        if (selectedAgentId === null) {
            setMessages([]);
            return;
        }
        const response = await fetchWithAuth(`/chat/mission/${missionId}/between/${currentUser.id}/and/${selectedAgentId}`);
        if (response.ok) {
           const data = await response.json();
           setMessages(data);

           // הוספנו: מסמנים את כל ההודעות כ"נקראו" ברגע שפתחנו את חלון הצ'אט!
           await markMessagesAsRead(missionId, selectedAgentId, currentUser.id);
        }
      } catch (error) {
        console.error("Failed to load chat history", error);
      }
    };

    fetchHistory();

    const socket = new SockJS('http://localhost:8080/ws-chat');
    const client = Stomp.over(socket);
    client.debug = () => {}; 

    client.connect({}, () => {
      setIsConnected(true);
      const myTopic = selectedAgentId === null 
         ? `/topic/messages/mission/${missionId}/broadcast` 
         : `/topic/messages/mission/${missionId}/user/${currentUser.id}`;
      
      client.subscribe(myTopic, (message) => {
        const receivedMessage = JSON.parse(message.body);
        setMessages((prev) => [...prev, receivedMessage]); 
      });
    }, (error: any) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.disconnect();
      }
    };
  }, [currentUser.id, selectedAgentId, missionId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const chatRequest = {
      missionId: missionId,
      senderId: currentUser.id,
      recipientId: selectedAgentId,
      text: newMessage,
    };

    try {
      const response = await fetchWithAuth('/chat/send', {
        method: 'POST',
        body: JSON.stringify(chatRequest)
      });

      if (response.ok) {
        const savedMsg = await response.json();
        setMessages((prev) => [...prev, savedMsg]);
        setNewMessage('');
      }
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden relative font-mono">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 z-10 flex flex-col">
        {messages.length === 0 ? (
           <div className="m-auto text-center text-emerald-900/50 font-black uppercase tracking-widest text-[10px]">
             {selectedAgentId === null ? "BROADCAST CHANNEL INITIATED." : "NO TRANSMISSIONS YET."}
           </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender.id === currentUser.id;
            return (
              <div key={msg.id || index} className={`flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2 ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                {!isMe && selectedAgentId === null && (
                    <span className="text-[9px] text-emerald-500 font-black mb-1 uppercase tracking-widest pl-1">
                        [{msg.sender.fullName}]
                    </span>
                )}
                <div className={`px-4 py-2.5 text-xs font-bold leading-relaxed tracking-wide shadow-md ${
                  isMe
                  ? 'bg-emerald-900/40 text-emerald-100 border border-emerald-700/50 rounded-tl-xl rounded-tr-xl rounded-bl-xl'
                  : 'bg-[#02120e] text-emerald-300 border border-emerald-900/50 rounded-tl-xl rounded-tr-xl rounded-br-xl'
                }`}>
                  {msg.text || msg.content || msg.messageText}
                </div>
                <span className="text-[9px] text-emerald-700/70 font-black tracking-widest mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 bg-black/80 border-t-2 border-emerald-900/50 flex gap-2 z-10 shrink-0">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="TYPE TRANSMISSION..."
          disabled={!isConnected}
          className="flex-1 bg-[#010a08] text-emerald-300 text-xs font-bold tracking-wider border border-emerald-800/50 px-3 py-2 focus:outline-none focus:border-emerald-500 placeholder:text-emerald-900/50 placeholder:font-black rounded-sm"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || !isConnected}
          className="bg-emerald-600 hover:bg-emerald-400 text-black px-6 font-black uppercase text-[10px] tracking-widest disabled:opacity-30 disabled:hover:bg-emerald-600 transition-colors rounded-sm"
        >
          SEND
        </button>
      </form>
    </div>
  );
};