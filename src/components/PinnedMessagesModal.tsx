import React from 'react';
import { X, Pin, FileText, ExternalLink, Trash2 } from 'lucide-react';
import { Message, User } from '../types';

interface PinnedMessagesModalProps {
  messages: Message[];
  currentUser: User;
  otherUser: User;
  onClose: () => void;
  onUnpin: (messageId: string) => void;
  darkMode: boolean;
}

export function PinnedMessagesModal({
  messages,
  currentUser,
  otherUser,
  onClose,
  onUnpin,
  darkMode
}: PinnedMessagesModalProps) {
  const pinnedMessages = messages.filter(m => m.pinned && !m.deletedAt);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`w-full max-w-2xl h-[75vh] rounded-2xl flex flex-col border shadow-2xl overflow-hidden ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Pin className="w-5 h-5 fill-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Pinned Messages</h2>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Important shared notes and bookmarks
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {pinnedMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
              <Pin className="w-12 h-12 stroke-1 mb-3 opacity-40" />
              <h3 className="font-medium text-base">No pinned messages yet</h3>
              <p className="text-xs max-w-xs mt-1">
                Hover over any message in the chat and click the Pin icon to save it here for quick access.
              </p>
            </div>
          ) : (
            pinnedMessages.map((msg) => {
              const isMe = msg.sender === currentUser.id;
              const senderName = isMe ? 'You' : otherUser.name;

              return (
                <div
                  key={msg.id}
                  className={`p-4 rounded-xl border relative flex flex-col gap-2 ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-rose-500">{senderName}</span>
                    <span className="opacity-60">{new Date(msg.timestamp).toLocaleString()}</span>
                  </div>

                  {msg.type === 'image' && msg.fileUrl && (
                    <div className="rounded-lg overflow-hidden max-h-40 my-1">
                      <img src={msg.fileUrl} alt="pinned attachment" className="w-full object-cover" />
                    </div>
                  )}

                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/40 mt-1">
                    <button
                      onClick={() => onUnpin(msg.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-medium transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Unpin Message
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
