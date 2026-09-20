import React, { useState, useRef, useEffect } from 'react';
import {
  Check, CheckCheck, Smile, Reply, Edit2, Trash2, FileText, Download, Play, Pause, ExternalLink, Image as ImageIcon, Video as VideoIcon, Pin
} from 'lucide-react';
import { motion } from 'motion/react';
import { Message, User } from '../types';

interface MessageListProps {
  messages: Message[];
  currentUser: User;
  otherUser: User;
  darkMode: boolean;
  onReply: (msg: Message) => void;
  onEdit: (messageId: string, currentContent: string) => void;
  onDelete: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onPin: (messageId: string) => void;
  searchQuery: string;
  ghostMode?: boolean;
}

const REACTIONS_LIST = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

function highlightMatch(text: string, query: string) {
  if (!query || !query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-amber-400 text-slate-950 font-bold px-1 rounded mx-0.5 shadow-sm">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function MessageList({
  messages,
  currentUser,
  otherUser,
  darkMode,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onPin,
  searchQuery,
  ghostMode
}: MessageListProps) {
  const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredMessages = searchQuery.trim()
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()) || m.fileName?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className={`flex-1 overflow-y-auto p-6 space-y-4 relative ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {ghostMode && (
        <div className="bg-purple-600/20 border border-purple-500/40 text-purple-300 px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 mb-4 animate-pulse">
          <span>👻</span>
          <span className="font-semibold">Ghost Mode Active:</span> Messages sent now will automatically delete when you exit Ghost Mode.
        </div>
      )}

      {filteredMessages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4">
            <Smile className="w-8 h-8" />
          </div>
          <h3 className="font-semibold text-lg">No messages yet</h3>
          <p className={`text-sm max-w-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Start your private secure conversation with {otherUser.name}. All messages, photos, and calls are strictly confidential.
          </p>
        </div>
      ) : (
        filteredMessages.map((msg) => {
          const isMe = msg.sender === currentUser.id;
          const isRead = msg.readBy && (msg.readBy.includes(otherUser.id) || msg.readBy.length > 1);
          const isSearchMatch = searchQuery.trim() && (
            msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
          );

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
              className={`flex flex-col group relative ${isMe ? 'items-end' : 'items-start'}`}
            >
              {/* Reply Reference Box */}
              {msg.replyTo && (
                <div className={`text-xs mb-1 px-3 py-1.5 rounded-lg border max-w-md truncate ${
                  darkMode ? 'bg-slate-900/80 border-slate-800 text-slate-400' : 'bg-slate-200/70 border-slate-300 text-slate-600'
                }`}>
                  <span className="font-semibold text-rose-500 mr-1.5">
                    {msg.replyTo.sender === currentUser.id ? 'You' : otherUser.name}:
                  </span>
                  <span>{msg.replyTo.content}</span>
                </div>
              )}

              <div className="flex items-end gap-2 max-w-[75%] relative">
                {!isMe && (
                  <img
                    src={otherUser.avatar}
                    alt={otherUser.name}
                    className="w-7 h-7 rounded-full object-cover shrink-0 mb-1"
                  />
                )}

                <div
                  className={`rounded-2xl px-4 py-3 shadow-sm relative group/bubble transition-all duration-300 ${
                    isSearchMatch
                      ? 'ring-4 ring-amber-400 bg-amber-500/20 dark:bg-amber-500/25 shadow-amber-500/30 shadow-xl scale-[1.02]'
                      : isMe
                        ? darkMode
                          ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white rounded-br-xs'
                          : 'bg-rose-600 text-white rounded-br-xs'
                        : darkMode
                          ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {/* Message Actions Hover Toolbar */}
                  <div className={`absolute top-2 right-2 hidden group-hover/bubble:flex items-center gap-1 bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-700 shadow-lg z-10 text-white`}>
                    <button
                      onClick={() => onPin(msg.id)}
                      title={msg.pinned ? "Unpin message" : "Pin message"}
                      className={`p-1 transition-colors ${msg.pinned ? 'text-amber-400' : 'hover:text-amber-400'}`}
                    >
                      <Pin className={`w-3.5 h-3.5 ${msg.pinned ? 'fill-amber-400' : ''}`} />
                    </button>
                    <button
                      onClick={() => setActiveReactionMenu(activeReactionMenu === msg.id ? null : msg.id)}
                      title="React"
                      className="p-1 hover:text-rose-400 transition-colors"
                    >
                      <Smile className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onReply(msg)}
                      title="Reply"
                      className="p-1 hover:text-indigo-400 transition-colors"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                    {isMe && !msg.deletedAt && (
                      <>
                        <button
                          onClick={() => onEdit(msg.id, msg.content)}
                          title="Edit"
                          className="p-1 hover:text-amber-400 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(msg.id)}
                          title="Delete"
                          className="p-1 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Reaction Selector Popover */}
                  {activeReactionMenu === msg.id && (
                    <div className="absolute -top-12 left-0 bg-slate-900 border border-slate-700 shadow-xl rounded-full px-3 py-1.5 flex items-center gap-2 z-30 animate-scale-in">
                      {REACTIONS_LIST.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            onReact(msg.id, emoji);
                            setActiveReactionMenu(null);
                          }}
                          className="hover:scale-125 transition-transform text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.isGhost && (
                    <div className="flex items-center gap-1 text-[10px] text-purple-300 mb-1.5 font-medium bg-purple-950/60 px-2 py-0.5 rounded-full w-fit border border-purple-500/30">
                      <span>👻</span> Ghost Message
                    </div>
                  )}

                  {/* Content Types */}
                  {msg.type === 'image' && msg.fileUrl && (
                    <div className="mb-2 overflow-hidden rounded-xl cursor-pointer" onClick={() => setPreviewMedia({ url: msg.fileUrl!, type: 'image' })}>
                      <img src={msg.fileUrl} alt="attachment" className="max-h-64 w-full object-cover rounded-xl hover:opacity-95 transition-opacity" />
                    </div>
                  )}

                  {msg.type === 'video' && msg.fileUrl && (
                    <div className="mb-2 overflow-hidden rounded-xl">
                      <video src={msg.fileUrl} controls className="max-h-64 w-full rounded-xl" />
                    </div>
                  )}

                  {(msg.type === 'pdf' || msg.type === 'document') && (
                    <div className={`flex items-center gap-3 p-3 rounded-xl mb-2 border ${
                      isMe ? 'bg-black/10 border-white/20 text-white' : darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                    }`}>
                      <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-500">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{highlightMatch(msg.fileName || 'Document', searchQuery)}</p>
                        <p className="text-[10px] opacity-70 uppercase">{msg.type}</p>
                      </div>
                      {msg.fileUrl && (
                        <a
                          href={msg.fileUrl}
                          download={msg.fileName}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}

                  {msg.type === 'audio' && msg.fileUrl && (
                    <div className="mb-2">
                      <audio src={msg.fileUrl} controls className="w-full h-10" />
                    </div>
                  )}

                  <p className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${msg.deletedAt ? 'italic opacity-60' : ''}`}>
                    {msg.type === 'image' ? `[Photo: ${msg.fileName || 'image'}]` :
                     msg.type === 'pdf' ? `[PDF Document: ${msg.fileName || 'document.pdf'}]` :
                     msg.type === 'document' ? `[Document: ${msg.fileName || 'file'}]` :
                     msg.type === 'video' ? `[Video: ${msg.fileName || 'video'}]` :
                     msg.type === 'audio' ? `[Voice Note]` :
                     msg.content.startsWith('http') || msg.content.startsWith('/uploads') ? `[Shared File: ${msg.fileName || 'attachment'}]` :
                     highlightMatch(msg.content, searchQuery)}
                  </p>

                  {/* Metadata: timestamp, edited, read receipt */}
                  <div className={`flex items-center justify-between gap-3 mt-1 text-[10px] ${isMe ? 'text-rose-100/80' : darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <div className="flex items-center gap-1">
                      {msg.pinned && (
                        <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                          <Pin className="w-3 h-3 fill-amber-400 inline" /> Pinned
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {msg.editedAt && <span>(edited)</span>}
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMe && (
                        <span title={isRead ? `Read by ${otherUser.name}` : 'Sent'}>
                          <CheckCheck className={`w-4 h-4 transition-all duration-300 inline ${
                            isRead ? 'text-sky-400 scale-110 drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]' : 'text-rose-100/70'
                          }`} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reactions Badges Display */}
              {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {Object.entries(msg.reactions).map(([emoji, users]) => (
                    <button
                      key={emoji}
                      onClick={() => onReact(msg.id, emoji)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                        users.includes(currentUser.id)
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-500 font-medium'
                          : darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{emoji}</span>
                      <span>{users.length}</span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })
      )}
      <div ref={messagesEndRef} />

      {/* Media Preview Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
            <button
              onClick={() => setPreviewMedia(null)}
              className="absolute top-4 right-4 z-10 bg-slate-800/80 hover:bg-slate-700 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
            >
              ✕
            </button>
            {previewMedia.type === 'image' ? (
              <img src={previewMedia.url} alt="Fullscreen preview" className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" />
            ) : (
              <video src={previewMedia.url} controls autoPlay className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
