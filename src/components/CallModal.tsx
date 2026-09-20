import React, { useEffect, useRef, useState } from 'react';
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff, PhoneIncoming } from 'lucide-react';
import { User } from '../types';
import { Socket } from 'socket.io-client';

interface CallModalProps {
  socket: Socket | null;
  currentUser: User;
  otherUser: User;
  callType: 'voice' | 'video';
  isIncoming: boolean;
  incomingSignal?: any;
  onClose: () => void;
}

export function CallModal({
  socket,
  currentUser,
  otherUser,
  callType,
  isIncoming,
  incomingSignal,
  onClose
}: CallModalProps) {
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'rejected'>(isIncoming ? 'ringing' : 'ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const durationTimerRef = useRef<any>(null);

  const ICE_SERVERS = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  useEffect(() => {
    if (!socket) return;

    const setupWebRTC = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video'
        });
        localStreamRef.current = stream;
        if (localVideoRef.current && callType === 'video') {
          localVideoRef.current.srcObject = stream;
        }

        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("webrtc_ice", { to: otherUser.id, candidate: event.candidate });
          }
        };

        if (!isIncoming) {
          // Outgoing call
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("call_user", {
            caller: currentUser.id,
            recipient: otherUser.id,
            callType,
            signal: offer
          });
        } else if (incomingSignal) {
          await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("accept_call", { to: otherUser.id, signal: answer });
          setCallStatus('connected');
          startDurationTimer();
        }
      } catch (err) {
        console.error("WebRTC setup error:", err);
        alert("Could not access microphone or camera. Please check permissions.");
        onClose();
      }
    };

    setupWebRTC();

    socket.on("call_accepted", async ({ signal }) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
        setCallStatus('connected');
        startDurationTimer();
      }
    });

    socket.on("call_rejected", () => {
      setCallStatus('rejected');
      setTimeout(onClose, 2000);
    });

    socket.on("call_ended", () => {
      onClose();
    });

    socket.on("webrtc_ice", async ({ candidate }) => {
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Error adding ice candidate", e);
        }
      }
    });

    return () => {
      cleanupCall();
    };
  }, []);

  const startDurationTimer = () => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    durationTimerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const cleanupCall = () => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  const handleAcceptIncoming = async () => {
    if (!socket || !incomingSignal) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video'
      });
      localStreamRef.current = stream;
      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc_ice", { to: otherUser.id, candidate: event.candidate });
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("accept_call", { to: otherUser.id, signal: answer });
      setCallStatus('connected');
      startDurationTimer();
    } catch (err) {
      console.error("Error accepting call", err);
    }
  };

  const handleRejectIncoming = () => {
    if (socket) {
      socket.emit("reject_call", { to: otherUser.id });
    }
    onClose();
  };

  const handleEndCall = () => {
    if (socket) {
      socket.emit("end_call", { to: otherUser.id });
    }
    cleanupCall();
    onClose();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current && callType === 'video') {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-between p-8 text-white">
      {/* Top Header */}
      <div className="flex flex-col items-center mt-6">
        <img src={otherUser.avatar} alt={otherUser.name} className="w-24 h-24 rounded-full object-cover ring-4 ring-rose-500/30 mb-4 shadow-2xl" />
        <h2 className="text-2xl font-semibold tracking-tight">{otherUser.name}</h2>
        <p className="text-slate-400 text-sm mt-1">
          {callStatus === 'ringing' && (isIncoming ? `Incoming ${callType} call...` : 'Calling...') }
          {callStatus === 'connected' && formatDuration(duration)}
          {callStatus === 'rejected' && 'Call declined'}
        </p>
      </div>

      {/* Video Streams */}
      <div className="w-full max-w-4xl flex-1 my-6 flex items-center justify-center relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        {callType === 'video' && (
          <div className="absolute bottom-4 right-4 w-44 h-32 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-xl bg-black">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 mb-4">
        {isIncoming && callStatus === 'ringing' ? (
          <>
            <button
              onClick={handleRejectIncoming}
              className="p-5 bg-rose-600 hover:bg-rose-700 rounded-full text-white shadow-lg shadow-rose-600/30 transition-transform hover:scale-110"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button
              onClick={handleAcceptIncoming}
              className="p-5 bg-emerald-600 hover:bg-emerald-700 rounded-full text-white shadow-lg shadow-emerald-600/30 transition-transform hover:scale-110 animate-bounce"
            >
              <PhoneIncoming className="w-6 h-6" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-colors ${isVideoOff ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>
            )}

            <button
              onClick={handleEndCall}
              className="p-5 bg-rose-600 hover:bg-rose-700 rounded-full text-white shadow-lg shadow-rose-600/30 transition-transform hover:scale-110"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
