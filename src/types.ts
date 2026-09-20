export interface User {
  id: 'virat' | 'hardhik';
  name: string;
  avatar: string;
}

export interface Message {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'pdf' | 'document' | 'audio';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyTo?: { id: string; content: string; sender: string };
  editedAt?: string;
  deletedAt?: string;
  reactions: Record<string, string[]>;
  readBy: string[];
  pinned?: boolean;
  isGhost?: boolean;
  timestamp: string;
}

export interface UserStatus {
  online: boolean;
  lastSeen: string;
}
