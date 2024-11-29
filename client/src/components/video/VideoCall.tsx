import { useEffect, useRef, useState } from "react";
import "@/lib/peer-polyfill";
import { CustomEventEmitter } from "@/lib/peer-polyfill";
import Peer from "simple-peer";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Video, Mic, MicOff, VideoOff, PhoneOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface VideoCallProps {
  isInitiator?: boolean;
  onEnd?: () => void;
  appointmentId: string;
}

export function VideoCall({ isInitiator, onEnd, appointmentId }: VideoCallProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [peer, setPeer] = useState<Peer.Instance | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string>("");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  
  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    const handleOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    window.addEventListener('resize', handleOrientation);
    return () => {
      window.removeEventListener('resize', handleOrientation);
      newSocket.close();
    };
  }, []);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        // Request camera and microphone permissions with constraints for mobile
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });

        setStream(mediaStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }

        const newPeer = new Peer({
          initiator: isInitiator,
          stream: mediaStream,
          trickle: false,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        // Use custom event emitter for signaling
        const emitter = new CustomEventEmitter();
        
        socket?.emit("join-room", {
          appointmentId,
          userId: `user-${Math.random().toString(36).substring(2)}`
        });

        newPeer.on("signal", (data) => {
          socket?.emit("video-signal", {
            appointmentId,
            signal: data,
            userId: `user-${Math.random().toString(36).substring(2)}`
          });
        });

        socket?.on("video-signal", ({ signal }: { signal: Peer.SignalData }) => {
          newPeer.signal(signal);
        });

        newPeer.on("connect", () => {
          setConnected(true);
          emitter.emit("peer-connected");
        });

        newPeer.on("stream", (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        });

        newPeer.on("error", (err) => {
          setError(`Connection error: ${err.message}`);
          emitter.emit("peer-error", err);
        });

        setPeer(newPeer);
      } catch (err: any) {
        setError(`Failed to access camera/microphone: ${err.message}`);
      }
    };

    initializeMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (peer) {
        peer.destroy();
      }
    };
  }, [isInitiator, appointmentId]);

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  const endCall = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (peer) {
      peer.destroy();
    }
    onEnd?.();
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn(
      "relative w-full h-full min-h-[400px] bg-black rounded-lg overflow-hidden",
      isPortrait ? "flex flex-col" : "flex flex-row"
    )}>
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={cn(
          "object-cover",
          isPortrait ? "w-full h-[60vh]" : "w-[70vw] h-full"
        )}
      />
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          "border-2 border-white rounded-lg",
          isPortrait
            ? "absolute bottom-20 right-4 w-32 h-24"
            : "absolute bottom-4 right-4 w-48 h-36"
        )}
      />
      
      <div className={cn(
        "flex gap-4 bg-black/50 p-4",
        isPortrait
          ? "absolute bottom-0 left-0 right-0 justify-center"
          : "absolute bottom-4 left-1/2 transform -translate-x-1/2"
      )}>
        <Button
          variant={audioEnabled ? "default" : "destructive"}
          size="icon"
          onClick={toggleAudio}
          className="rounded-full"
        >
          {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
        <Button
          variant={videoEnabled ? "default" : "destructive"}
          size="icon"
          onClick={toggleVideo}
          className="rounded-full"
        >
          {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={endCall}
          className="rounded-full"
        >
          <PhoneOff className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
