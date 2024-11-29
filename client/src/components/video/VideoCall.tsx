import { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Video, Mic, MicOff, VideoOff, PhoneOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  
  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Request camera and microphone permissions
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const newPeer = new Peer({
          initiator: isInitiator,
          stream,
          trickle: false,
        });

        // Join video consultation room
        socket?.emit("join-room", { appointmentId, userId: "user-" + Math.random().toString(36).substr(2, 9) });

        newPeer.on("signal", (data) => {
          socket?.emit("video-signal", {
            appointmentId,
            signal: data,
            userId: "user-" + Math.random().toString(36).substr(2, 9)
          });
        });

        // Handle incoming signals
        socket?.on("video-signal", ({ signal }) => {
          newPeer.signal(signal);
        });

        newPeer.on("connect", () => {
          setConnected(true);
        });

        newPeer.on("stream", (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        });

        newPeer.on("error", (err) => {
          setError("Connection error: " + err.message);
        });

        setPeer(newPeer);
      })
      .catch((err) => {
        setError("Failed to access camera/microphone: " + err.message);
      });

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
    <div className="relative w-full h-full min-h-[400px] bg-black rounded-lg overflow-hidden">
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className="absolute bottom-4 right-4 w-48 h-36 object-cover rounded-lg border-2 border-white"
      />
      
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
        <Button
          variant={audioEnabled ? "default" : "destructive"}
          size="icon"
          onClick={toggleAudio}
        >
          {audioEnabled ? <Mic /> : <MicOff />}
        </Button>
        <Button
          variant={videoEnabled ? "default" : "destructive"}
          size="icon"
          onClick={toggleVideo}
        >
          {videoEnabled ? <Video /> : <VideoOff />}
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={endCall}
        >
          <PhoneOff />
        </Button>
      </div>
    </div>
  );
}
