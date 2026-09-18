import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  User, 
  Users, 
  Search, 
  Clock, 
  CheckCheck, 
  Sparkles, 
  ArrowLeft, 
  Phone, 
  Building,
  ShieldAlert
} from 'lucide-react';
import { ChatMessage, Renter, Room } from '../../types';
import { subscribeChatMessages, sendChatMessage, markChatAsRead } from '../../services/db';

interface ChatViewProps {
  renters: Renter[];
  rooms: Room[];
  currentUserId?: string;
  currentUserName?: string;
}

export const ChatView: React.FC<ChatViewProps> = ({
  renters,
  rooms,
  currentUserId = 'owner_user',
  currentUserName = 'Prem Niwas Management'
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('all'); // 'all' or renterId
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to all chat messages
  useEffect(() => {
    const unsubscribe = subscribeChatMessages(null, (allMsgs) => {
      setMessages(allMsgs);
    });
    return () => unsubscribe();
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedRecipientId]);

  // Mark unread messages as read when opening a thread
  useEffect(() => {
    if (selectedRecipientId) {
      const unread = messages
        .filter(m => !m.read && m.senderRole === 'renter' && (selectedRecipientId === 'all' || m.senderId === selectedRecipientId))
        .map(m => m.id);
      if (unread.length > 0) {
        markChatAsRead(unread);
      }
    }
  }, [messages, selectedRecipientId]);

  const activeRenters = renters.filter(r => r.status === 'active' || r.status === 'pending_approval');

  // Filter conversations
  const filteredRenters = activeRenters.filter(r => 
    r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(r.roomNumber || '').includes(searchQuery)
  );

  const currentRecipient = selectedRecipientId === 'all' 
    ? { id: 'all', fullName: 'All Tenants (Building Broadcast)', roomNumber: null, phone: '' }
    : activeRenters.find(r => r.id === selectedRecipientId);

  // Filter messages for current view
  const currentThreadMessages = messages.filter(m => {
    if (selectedRecipientId === 'all') {
      return m.receiverId === 'all';
    }
    return (
      (m.senderId === selectedRecipientId && m.receiverId === 'owner') ||
      (m.senderRole === 'owner' && m.receiverId === selectedRecipientId) ||
      m.receiverId === selectedRecipientId ||
      m.senderId === selectedRecipientId
    );
  });

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || sending) return;

    setSending(true);
    try {
      await sendChatMessage({
        buildingId: 'building_prem_niwas',
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: 'owner',
        receiverId: selectedRecipientId,
        receiverName: currentRecipient?.fullName || 'Resident',
        text
      });
      setInputText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPresets = [
    'ðŸ‘‹ Reminder: Monthly rent & electricity bill has been generated.',
    'ðŸ’§ Notice: Overhead water tank sanitization scheduled.',
    '✅ Payment received and verified. Thank you!',
    'ðŸ”§ Maintenance team has been notified and is inspecting.'
  ];

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center space-x-2.5">
          <MessageSquare className="w-6 h-6 text-amber-500" />
          <span>Tenant Communication & Direct Chat</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time messaging between Prem Niwas Management and residents.
        </p>
      </div>

      {/* Main Chat Interface Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl h-[650px] flex flex-col md:flex-row">
        
        {/* Left / Sidebar: Conversations List */}
        <div className={`w-full md:w-80 border-r border-slate-800 flex flex-col bg-slate-950/60 ${
          mobileThreadOpen ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Search bar */}
          <div className="p-3.5 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-chat-renters"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resident or room..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Recipient list */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-850">
            {/* Broadcast Option */}
            <button
              id="select-chat-broadcast"
              onClick={() => {
                setSelectedRecipientId('all');
                setMobileThreadOpen(true);
              }}
              className={`w-full p-3.5 text-left flex items-center space-x-3 transition-colors cursor-pointer ${
                selectedRecipientId === 'all' 
                  ? 'bg-amber-500/15 border-l-4 border-amber-500' 
                  : 'hover:bg-slate-900/60'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white truncate">All Tenants Broadcast</h4>
                  <span className="text-[10px] text-amber-400 font-semibold">Channel</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  Send announcement to everyone
                </p>
              </div>
            </button>

            {/* Individual Renters */}
            {filteredRenters.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No tenants found
              </div>
            ) : (
              filteredRenters.map((renter) => {
                const isSelected = selectedRecipientId === renter.id;
                const renterMsgs = messages.filter(m => m.senderId === renter.id && !m.read);
                const unreadCount = renterMsgs.length;

                return (
                  <button
                    key={renter.id}
                    id={`select-chat-renter-${renter.id}`}
                    onClick={() => {
                      setSelectedRecipientId(renter.id);
                      setMobileThreadOpen(true);
                    }}
                    className={`w-full p-3.5 text-left flex items-center space-x-3 transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-amber-500/15 border-l-4 border-amber-500' 
                        : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center flex-shrink-0 font-bold text-xs border border-slate-750">
                      {renter.roomNumber ? `R${renter.roomNumber}` : 'TEN'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white truncate">{renter.fullName}</h4>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {renter.roomNumber ? `Room ${renter.roomNumber}` : 'Applicant'} • {renter.phone}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Thread */}
        <div className={`flex-1 flex flex-col bg-slate-900 ${
          !mobileThreadOpen ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Thread Header */}
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center space-x-3">
              <button
                id="back-to-renters-list-btn"
                onClick={() => setMobileThreadOpen(false)}
                className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>{currentRecipient?.fullName || 'Chat Thread'}</span>
                  {currentRecipient?.roomNumber && (
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-md border border-amber-500/20">
                      Room {currentRecipient.roomNumber}
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {selectedRecipientId === 'all' 
                    ? 'Broadcast message will be seen by all building residents' 
                    : (currentRecipient?.phone ? `Direct Line: ${currentRecipient.phone}` : 'Direct resident messaging')}
                </p>
              </div>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {currentThreadMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <MessageSquare className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-xs font-semibold text-slate-400">No messages in this conversation yet</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  Type a message below or pick a quick reminder preset to reach this resident.
                </p>
              </div>
            ) : (
              currentThreadMessages.map((msg) => {
                const isMe = msg.senderRole === 'owner';

                return (
                  <div 
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1 px-1">
                      <span className="text-[10px] font-bold text-slate-400">
                        {isMe ? 'Management' : msg.senderName}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className={`max-w-md px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isMe 
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none' 
                        : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Presets Bar */}
          <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/30 overflow-x-auto flex items-center space-x-2 no-scrollbar">
            <span className="text-[10px] text-slate-500 whitespace-nowrap flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Quick:</span>
            </span>
            {quickPresets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(preset)}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-[11px] whitespace-nowrap transition-colors border border-slate-750 cursor-pointer"
              >
                {preset.split(':')[0]}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center space-x-2">
            <input
              id="chat-message-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${currentRecipient?.fullName || 'Resident'}...`}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              id="send-chat-btn"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || sending}
              className="p-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
