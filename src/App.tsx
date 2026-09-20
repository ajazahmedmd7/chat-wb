import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, Message, UserStatus } from './types';
import { LoginScreen } from './components/LoginScreen';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { MediaGalleryModal } from './components/MediaGalleryModal';
import { PinnedMessagesModal } from './components/PinnedMessagesModal';
import { CallModal } from './components/CallModal';

const USERS_MAP: Record<string, User> = {
  sahiti: {
    id: 'sahiti',
    name: 'Sahiti',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  ajazzz: {
    id: 'ajazzz',
    name: 'Ajazzz',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  }
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sahiti_ajazzz_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [statuses, setStatuses] = useState<Record<string, UserStatus>>({
    sahiti: { online: false, lastSeen: new Date().toISOString() },
    ajazzz: { online: false, lastSeen: new Date().toISOString() }
  });

  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<{ type: 'voice' | 'video'; isIncoming: boolean; signal?: any } | null>(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);

  const otherUser = currentUser?.id === 'sahiti' ? USERS_MAP['ajazzz'] : USERS_MAP['sahiti'];

  const handleToggleGhostMode = () => {
    if (ghostMode) {
      if (socket && currentUser) {
        socket.emit('exit_ghost_mode', { userId: currentUser.id });
      }
      setGhostMode(false);
    } else {
      setGhostMode(true);
    }
  };

  // Initial fetch of messages and statuses
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        if (data.messages) setMessages(data.messages);
        if (data.status) setStatuses(data.status);
      })
      .catch(err => console.error("Error fetching data:", err));
  }, []);

  // Socket.io connection setup upon login
  useEffect(() => {
    if (!currentUser) return;

    localStorage.setItem('sahiti_ajazzz_user', JSON.stringify(currentUser));

    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join', currentUser.id);
      newSocket.emit('mark_read', { userId: currentUser.id });
    });

    newSocket.on('status_update', (newStatus: Record<string, UserStatus>) => {
      setStatuses(newStatus);
    });

    newSocket.on('new_message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
      if (msg.recipient === currentUser.id) {
        newSocket.emit('mark_read', { userId: currentUser.id });
      }
    });

    newSocket.on('message_edited', ({ messageId, newContent, editedAt }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: newContent, editedAt } : m));
    });

    newSocket.on('message_deleted', ({ messageId, deletedAt }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: 'This message was deleted', deletedAt, fileUrl: undefined } : m));
    });

    newSocket.on('reaction_updated', ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
    });

    newSocket.on('message_pinned', ({ messageId, pinned }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, pinned } : m));
    });

    newSocket.on('chat_cleared', ({ messages }: { messages: Message[] }) => {
      setMessages(messages);
    });

    newSocket.on('user_typing', ({ userId, isTyping }) => {
      if (userId !== currentUser.id) {
        setOtherUserTyping(isTyping);
      }
    });

    newSocket.on('messages_read', ({ userId }) => {
      if (userId !== currentUser.id) {
        setMessages(prev => prev.map(m => ({
          ...m,
          readBy: Array.from(new Set([...m.readBy, userId]))
        })));
      }
    });

    // WebRTC incoming calls
    newSocket.on('incoming_call', ({ caller, callType, signal }) => {
      if (caller !== currentUser.id) {
        setActiveCall({ type: callType, isIncoming: true, signal });
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleSendMessage = (
    content: string,
    type: 'text' | 'image' | 'video' | 'pdf' | 'document' | 'audio' = 'text',
    fileData?: { fileUrl: string; fileName: string; fileSize: number }
  ) => {
    if (!socket || !currentUser) return;
    socket.emit('send_message', {
      sender: currentUser.id,
      recipient: otherUser.id,
      content,
      type,
      fileUrl: fileData?.fileUrl,
      fileName: fileData?.fileName,
      fileSize: fileData?.fileSize,
      replyTo: replyingTo ? { id: replyingTo.id, content: replyingTo.content, sender: replyingTo.sender } : undefined,
      isGhost: ghostMode
    });
    setReplyingTo(null);
  };

  const handleEditMessage = (messageId: string, currentContent: string) => {
    const newContent = prompt('Edit your message:', currentContent);
    if (newContent !== null && newContent.trim() !== '' && socket && currentUser) {
      socket.emit('edit_message', { messageId, newContent: newContent.trim(), userId: currentUser.id });
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (confirm('Are you sure you want to delete this message?') && socket && currentUser) {
      socket.emit('delete_message', { messageId, userId: currentUser.id });
    }
  };

  const handleReactMessage = (messageId: string, emoji: string) => {
    if (socket && currentUser) {
      socket.emit('toggle_reaction', { messageId, emoji, userId: currentUser.id });
    }
  };

  const handlePinMessage = (messageId: string) => {
    if (socket) {
      socket.emit('toggle_pin', { messageId });
    }
  };

  const handleClearChatTimed = (hours: number | 'all') => {
    if (socket && currentUser) {
      socket.emit('clear_chat_timed', { hours, userId: currentUser.id });
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (socket && currentUser) {
      socket.emit('typing', { userId: currentUser.id, isTyping });
    }
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const pinnedCount = messages.filter(m => m.pinned && !m.deletedAt).length;

  return (
    <div className={`fixed inset-0 flex flex-col overflow-hidden font-sans ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      <ChatHeader
        currentUser={currentUser}
        otherUser={otherUser}
        otherStatus={statuses[otherUser.id]}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onStartCall={(type) => setActiveCall({ type, isIncoming: false })}
        onOpenGallery={() => setGalleryOpen(true)}
        onOpenPinned={() => setPinnedOpen(true)}
        pinnedCount={pinnedCount}
        onToggleSearch={() => setSearchOpen(!searchOpen)}
        searchOpen={searchOpen}
        onClearChatTimed={handleClearChatTimed}
        ghostMode={ghostMode}
        onToggleGhostMode={handleToggleGhostMode}
      />

      {searchOpen && (
        <div className={`px-6 py-3 border-b flex items-center gap-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="relative flex-1 flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className={`w-full px-4 py-2 pr-10 rounded-xl text-sm border focus:outline-none ${
                darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
              }`}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                title="Clear search"
                className="absolute right-3 text-slate-400 hover:text-slate-200 text-xs bg-slate-800/60 hover:bg-slate-700 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              Clear
            </button>
          )}
          <button
            onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {otherUserTyping && (
        <div className={`px-6 py-1.5 text-xs italic ${darkMode ? 'bg-slate-900/50 text-rose-400' : 'bg-slate-200/50 text-rose-600'}`}>
          {otherUser.name} is typing...
        </div>
      )}

      <MessageList
        messages={messages}
        currentUser={currentUser}
        otherUser={otherUser}
        darkMode={darkMode}
        onReply={(msg) => setReplyingTo(msg)}
        onEdit={handleEditMessage}
        onDelete={handleDeleteMessage}
        onReact={handleReactMessage}
        onPin={handlePinMessage}
        searchQuery={searchQuery}
        ghostMode={ghostMode}
      />

      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        darkMode={darkMode}
        ghostMode={ghostMode}
      />

      {galleryOpen && (
        <MediaGalleryModal
          messages={messages}
          onClose={() => setGalleryOpen(false)}
          darkMode={darkMode}
        />
      )}

      {pinnedOpen && (
        <PinnedMessagesModal
          messages={messages}
          currentUser={currentUser}
          otherUser={otherUser}
          onClose={() => setPinnedOpen(false)}
          onUnpin={handlePinMessage}
          darkMode={darkMode}
        />
      )}

      {activeCall && (
        <CallModal
          socket={socket}
          currentUser={currentUser}
          otherUser={otherUser}
          callType={activeCall.type}
          isIncoming={activeCall.isIncoming}
          incomingSignal={activeCall.signal}
          onClose={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}
