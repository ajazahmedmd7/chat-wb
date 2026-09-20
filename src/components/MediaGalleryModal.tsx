import React, { useState } from 'react';
import { X, Image, Video, FileText, Download, Music } from 'lucide-react';
import { Message } from '../types';

interface MediaGalleryModalProps {
  messages: Message[];
  onClose: () => void;
  darkMode: boolean;
}

export function MediaGalleryModal({ messages, onClose, darkMode }: MediaGalleryModalProps) {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos' | 'documents' | 'audio'>('photos');

  const mediaMessages = messages.filter(m => m.fileUrl && !m.deletedAt);

  const photos = mediaMessages.filter(m => m.type === 'image');
  const videos = mediaMessages.filter(m => m.type === 'video');
  const documents = mediaMessages.filter(m => m.type === 'pdf' || m.type === 'document');
  const audios = mediaMessages.filter(m => m.type === 'audio');

  const getCurrentList = () => {
    switch (activeTab) {
      case 'photos': return photos;
      case 'videos': return videos;
      case 'documents': return documents;
      case 'audio': return audios;
      default: return [];
    }
  };

  const list = getCurrentList();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`w-full max-w-3xl h-[80vh] rounded-2xl flex flex-col border shadow-2xl overflow-hidden ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <h2 className="text-lg font-semibold tracking-tight">Shared Media & Files Gallery</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b px-6 gap-6 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            onClick={() => setActiveTab('photos')}
            className={`py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'photos' ? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Image className="w-4 h-4" /> Photos ({photos.length})
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'videos' ? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-4 h-4" /> Videos ({videos.length})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'documents' ? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Documents & PDFs ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'audio' ? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-4 h-4" /> Audio ({audios.length})
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6">
          {list.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
              <p>No {activeTab} shared yet.</p>
            </div>
          ) : activeTab === 'photos' ? (
            <div className="grid grid-cols-3 gap-4">
              {photos.map(m => (
                <a key={m.id} href={m.fileUrl} target="_blank" rel="noreferrer" className="aspect-square rounded-xl overflow-hidden border border-slate-700/50 hover:opacity-90 transition-opacity">
                  <img src={m.fileUrl} alt="gallery" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          ) : activeTab === 'videos' ? (
            <div className="grid grid-cols-2 gap-4">
              {videos.map(m => (
                <div key={m.id} className="rounded-xl overflow-hidden border border-slate-700/50 bg-black">
                  <video src={m.fileUrl} controls className="w-full h-48 object-cover" />
                </div>
              ))}
            </div>
          ) : activeTab === 'audio' ? (
            <div className="space-y-3">
              {audios.map(m => (
                <div key={m.id} className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-sm font-medium">{m.fileName || 'Audio message'}</span>
                  <audio src={m.fileUrl} controls className="h-10" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map(m => (
                <div key={m.id} className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-rose-500" />
                    <div>
                      <p className="font-medium text-sm">{m.fileName || 'Document'}</p>
                      <p className="text-xs text-slate-400">{new Date(m.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <a href={m.fileUrl} download={m.fileName} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors">
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
