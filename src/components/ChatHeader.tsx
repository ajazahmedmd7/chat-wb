import React, { useState } from 'react';
import { Phone, Video, Moon, Sun, FolderOpen, Search, Shield, Clock, Pin, Trash2, ChevronDown, Ghost, LogOut } from 'lucide-react';
import { User, UserStatus } from '../types';

interface ChatHeaderProps {
  currentUser: User;
  otherUser: User;
  otherStatus?: UserStatus;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onStartCall: (type: 'voice' | 'video') => void;
  onOpenGallery: () => void;
  onOpenPinned: () => void;
  pinnedCount: number;
  onToggleSearch: () => void;
  searchOpen: boolean;
  onClearChatTimed: (hours: number | 'all') => void;
  ghostMode: boolean;
  onToggleGhostMode: () => void;
  onLogout: () => void;
}

export function ChatHeader({
  currentUser,
  otherUser,
  otherStatus,
  darkMode,
  onToggleDarkMode,
  onStartCall,
  onOpenGallery,
  onOpenPinned,
  pinnedCount,
  onToggleSearch,
  searchOpen,
  onClearChatTimed,
  ghostMode,
  onToggleGhostMode,
  onLogout
}: ChatHeaderProps) {
  const [deleteMenuOpen, setDeleteMenuOpen] = useState(false);
  // Sahiti logs in -> "Chatting with Ajazzz"
  // Ajazzz logs in -> "Chatting with Sahiti"
  const chattingHeading = otherUser.name;

  const formatLastSeen = (isoString?: string) => {
    if (!isoString) return 'Offline';
    const date = new Date(isoString);
    return `Last seen ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <header className={`h-18 px-3 sm:px-6 border-b flex items-center justify-between shrink-0 transition-colors ${
      darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white/90 border-slate-200 text-slate-900'
    } backdrop-blur-md sticky top-0 z-20`}>
      <div className="flex items-center gap-3 sm:gap-4 truncate">
        <div className="relative shrink-0">
          <img
            src={otherUser.avatar}
            alt={otherUser.name}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover ring-2 ring-rose-500/30"
          />
          {otherStatus?.online ? (
            <span className="absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          ) : (
            <span className="absolute bottom-0 right-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-slate-500 border-2 border-slate-900 rounded-full" />
          )}
        </div>

        <div className="truncate">
          <h2 className="font-semibold text-sm sm:text-base tracking-tight flex items-center gap-2 truncate">
            <span className="truncate">{chattingHeading}</span>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <Shield className="w-3 h-3 mr-1" /> End-to-End Encrypted
            </span>
          </h2>
          <p className={`text-[11px] sm:text-xs flex items-center gap-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {otherStatus?.online ? (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 truncate">
                <Clock className="w-3 h-3 shrink-0" /> {formatLastSeen(otherStatus?.lastSeen)}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <button
          onClick={onToggleSearch}
          title="Search messages"
          className={`p-2 sm:p-2.5 rounded-xl transition-colors ${
            searchOpen
              ? 'bg-rose-500 text-white'
              : darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          onClick={onOpenGallery}
          title="Media & Files Gallery"
          className={`p-2 sm:p-2.5 rounded-xl transition-colors hidden xs:block ${
            darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          onClick={onOpenPinned}
          title="Pinned Messages"
          className={`p-2 sm:p-2.5 rounded-xl relative transition-colors ${
            darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Pin className="w-4 h-4 sm:w-5 sm:h-5" />
          {pinnedCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-rose-500 text-white rounded-full text-[9px] sm:text-[10px] font-bold flex items-center justify-center">
              {pinnedCount}
            </span>
          )}
        </button>

        <button
          onClick={onToggleGhostMode}
          title={ghostMode ? "Ghost Mode Active (Click to exit & auto-delete ghost messages)" : "Toggle Ghost Mode"}
          className={`p-2 sm:p-2.5 rounded-xl flex items-center gap-1 transition-all ${
            ghostMode
              ? 'bg-purple-600 text-white animate-pulse shadow-lg shadow-purple-500/30 ring-2 ring-purple-400'
              : darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <Ghost className="w-4 h-4 sm:w-5 sm:h-5" />
          {ghostMode && <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">Ghost</span>}
        </button>

        <div className="h-5 sm:h-6 w-[1px] bg-slate-700/30 mx-0.5 sm:mx-1" />

        <div className="relative">
          <button
            onClick={() => setDeleteMenuOpen(!deleteMenuOpen)}
            title="Delete chat history by timing"
            className={`p-2 sm:p-2.5 rounded-xl flex items-center gap-0.5 transition-colors ${
              deleteMenuOpen ? 'bg-rose-500 text-white' : darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <ChevronDown className="w-3 h-3" />
          </button>

          {deleteMenuOpen && (
            <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-2xl border py-1.5 z-50 animate-scale-in ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-700/50">
                Delete Chat History
              </div>
              <button
                onClick={() => { setDeleteMenuOpen(false); onClearChatTimed(1); }}
                className="w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
              >
                <Clock className="w-4 h-4 text-rose-500" /> Delete last 1 hour
              </button>
              <button
                onClick={() => { setDeleteMenuOpen(false); onClearChatTimed(2); }}
                className="w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
              >
                <Clock className="w-4 h-4 text-rose-500" /> Delete last 2 hours
              </button>
              <button
                onClick={() => { setDeleteMenuOpen(false); onClearChatTimed(24); }}
                className="w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
              >
                <Clock className="w-4 h-4 text-rose-500" /> Delete last 24 hours
              </button>
              <div className="h-[1px] bg-slate-700/40 my-1" />
              <button
                onClick={() => { setDeleteMenuOpen(false); onClearChatTimed('all'); }}
                className="w-full text-left px-4 py-2.5 text-xs flex items-center gap-2 text-rose-500 hover:bg-rose-500/15 font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Clear all chat
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => onStartCall('voice')}
          title="Voice Call"
          className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 transition-colors"
        >
          <Phone className="w-5 h-5" />
        </button>

        <button
          onClick={() => onStartCall('video')}
          title="Video Call"
          className="p-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 transition-colors"
        >
          <Video className="w-5 h-5" />
        </button>

        <div className="h-6 w-[1px] bg-slate-700/30 mx-1" />

        <button
          onClick={onToggleDarkMode}
          title="Toggle Theme"
          className={`p-2.5 rounded-xl transition-colors ${
            darkMode ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button
          onClick={onLogout}
          title="Log out (Virat & Hardhik)"
          className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
