import React, { useState, useRef } from 'react';
import { Send, Paperclip, Smile, Camera, X, Mic, Square } from 'lucide-react';
import { Message } from '../types';

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'video' | 'pdf' | 'document' | 'audio', fileData?: { fileUrl: string; fileName: string; fileSize: number }) => void;
  onTyping: (isTyping: boolean) => void;
  replyingTo: Message | null;
  onCancelReply: () => void;
  darkMode: boolean;
  ghostMode?: boolean;
}

const POPULAR_EMOJIS = ['😊', '❤️', '🔥', '👍', '😂', '😍', '🎉', '✨', '🙏', '💯', '🚀', '⭐'];

export function MessageInput({
  onSendMessage,
  onTyping,
  replyingTo,
  onCancelReply,
  darkMode,
  ghostMode
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    onTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSendMessage(content.trim());
    setContent('');
    onTyping(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        let type: 'text' | 'image' | 'video' | 'pdf' | 'document' | 'audio' = 'document';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'audio';
        else if (file.type === 'application/pdf') type = 'pdf';

        onSendMessage(file.name, type, {
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize
        });
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`p-4 border-t relative ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'} backdrop-blur-md`}>
      {/* Replying banner */}
      {replyingTo && (
        <div className={`flex items-center justify-between px-3 py-1.5 mb-2 rounded-xl text-xs border ${
          darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-rose-500">Replying to message:</span>
            <span className="truncate">{replyingTo.content}</span>
          </div>
          <button onClick={onCancelReply} className="p-1 hover:text-rose-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className={`absolute bottom-20 left-4 p-3 rounded-2xl shadow-2xl border z-30 grid grid-cols-6 gap-2 w-72 ${
          darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {POPULAR_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                setContent(prev => prev + emoji);
                setShowEmojiPicker(false);
              }}
              className="text-2xl p-2 rounded-xl hover:bg-rose-500/15 transition-colors flex items-center justify-center"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title="Attach photo, video, PDF or document"
          className={`p-3 rounded-xl transition-colors ${
            darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
          }`}
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Paperclip className="w-5 h-5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="Emoji picker"
          className={`p-3 rounded-xl transition-colors ${
            darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
          }`}
        >
          <Smile className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={content}
          onChange={handleInputChange}
          placeholder={ghostMode ? "👻 Type a ghost message (auto-deletes on exit)..." : "Type a secure message..."}
          className={`flex-1 px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
            ghostMode
              ? darkMode
                ? 'bg-purple-950/40 border-purple-500/50 text-white placeholder:text-purple-400/70 focus:border-purple-400'
                : 'bg-purple-50 border-purple-300 text-purple-950 placeholder:text-purple-400 focus:border-purple-500'
              : darkMode
                ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-rose-500'
                : 'bg-slate-100 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-rose-500'
          }`}
        />

        <button
          type="submit"
          disabled={!content.trim()}
          className="p-3 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-rose-500/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
