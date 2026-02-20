"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Users } from "lucide-react";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

interface Props {
  sessionId: string;
  userId: string;
  userName: string;
  isTeacher: boolean;
}

interface RemoteStream {
  stream: MediaStream;
  name: string;
  isTeacher: boolean;
  camOn: boolean;
  micOn: boolean;
}

export default function ClassroomVideo({ sessionId, userId, userName, isTeacher, }: Props) {
  const [joined, setJoined] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, RemoteStream>>(new Map());
  const [participants, setParticipants] = useState<any[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConns = useRef<Map<string, RTCPeerConnection>>(new Map());
  const processedSigs = useRef<Set<string>>(new Set());
  const joinedRef = useRef(false);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // === POST helper ===
  const postSignal = useCallback(async (action: string, data: any) => {
    try {
      await fetch(`/api/classroom/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...data }),
      });
    } catch {}
  }, [sessionId]);

  // === Create peer connection to remote user ===
  const createPC = useCallback((remoteId: string, remoteName: string, remoteIsTeacher: boolean): RTCPeerConnection => {
    // Close existing if any
    if (peerConns.current.has(remoteId)) {
      peerConns.current.get(remoteId)!.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // On remote track received
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (!stream) return;
      setRemoteStreams(prev => {
        const next = new Map(prev);
        next.set(remoteId, { stream, name: remoteName, isTeacher: remoteIsTeacher, camOn: true, micOn: true });
        return next;
      });
      // Attach to video element after render
      setTimeout(() => {
        const el = remoteVideoRefs.current.get(remoteId);
        if (el && el.srcObject !== stream) {
          el.srcObject = stream;
          el.play().catch(() => {});
        }
      }, 100);
    };

    // Send ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        postSignal("rtc_signal", {
          from: userId, to: remoteId, type: "ice",
          data: event.candidate.toJSON(),
          fromName: userName, fromIsTeacher: isTeacher,
        });
      }
    };

    // Handle disconnect
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
        setRemoteStreams(prev => {
          const next = new Map(prev);
          next.delete(remoteId);
          return next;
        });
        peerConns.current.delete(remoteId);
      }
    };

    peerConns.current.set(remoteId, pc);
    return pc;
  }, [userId, userName, isTeacher, postSignal]);

  // === Process signals from server poll ===
  const processSignals = useCallback(async (signals: any[], parts: any[]) => {
    if (!joinedRef.current || !localStreamRef.current) return;
    setParticipants(parts);

    const consumeIds: string[] = [];

    // For each participant we don't have a connection to, initiate one
    // Only the "lower" userId initiates to prevent double-offers
    for (const p of parts) {
      if (p.odid === userId) continue;
      if (!peerConns.current.has(p.odid) || peerConns.current.get(p.odid)!.connectionState === "failed") {
        if (userId < p.odid) {
          // I initiate
          const pc = createPC(p.odid, p.name, p.isTeacher);
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await postSignal("rtc_signal", {
              from: userId, to: p.odid, type: "offer",
              data: { sdp: offer.sdp, type: offer.type },
              fromName: userName, fromIsTeacher: isTeacher,
            });
          } catch (e) { console.error("Offer err:", e); }
        }
      }
    }

    // Process incoming signals addressed to me
    for (const sig of signals) {
      if (sig.to !== userId) continue;
      if (processedSigs.current.has(sig.id)) continue;
      processedSigs.current.add(sig.id);
      consumeIds.push(sig.id);

      if (sig.type === "offer") {
        const pc = createPC(sig.from, sig.fromName || "User", sig.fromIsTeacher || false);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sig.data));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await postSignal("rtc_signal", {
            from: userId, to: sig.from, type: "answer",
            data: { sdp: answer.sdp, type: answer.type },
            fromName: userName, fromIsTeacher: isTeacher,
          });
        } catch (e) { console.error("Answer err:", e); }
      }

      if (sig.type === "answer") {
        const pc = peerConns.current.get(sig.from);
        if (pc && pc.signalingState === "have-local-offer") {
          try { await pc.setRemoteDescription(new RTCSessionDescription(sig.data)); }
          catch (e) { console.error("Remote desc err:", e); }
        }
      }

      if (sig.type === "ice") {
        const pc = peerConns.current.get(sig.from);
        if (pc && pc.remoteDescription) {
          try { await pc.addIceCandidate(new RTCIceCandidate(sig.data)); }
          catch (e) { /* ignore */ }
        }
      }
    }

    // Consume processed signals
    if (consumeIds.length > 0) {
      postSignal("rtc_consume", { signalIds: consumeIds });
    }

    // Remove remote streams for participants that left
    const activeIds = new Set(parts.map((p: any) => p.odid));
    setRemoteStreams(prev => {
      const next = new Map(prev);
      for (const key of next.keys()) {
        if (!activeIds.has(key)) {
          next.delete(key);
          peerConns.current.get(key)?.close();
          peerConns.current.delete(key);
        }
      }
      return next;
    });
  }, [userId, userName, isTeacher, createPC, postSignal]);

  // === Poll for signals (fast during connection, slower after) ===
  useEffect(() => {
    if (!joined) return;
    let active = true;
    const poll = async () => {
      if (!active || !joinedRef.current) return;
      try {
        const r = await fetch(`/api/classroom/${sessionId}`);
        if (!r.ok) return;
        const d = await r.json();
        const sigs = Array.isArray(d.rtcSignals) ? d.rtcSignals : [];
        const parts = Array.isArray(d.videoFeeds) ? d.videoFeeds : [];
        await processSignals(sigs, parts);
      } catch {}
    };
    // Poll quickly for first 30s (signaling phase), then slower
    let count = 0;
    const run = () => {
      poll();
      count++;
      const interval = count < 15 ? 1000 : 3000; // 1s for first 15 polls, then 3s
      if (active) pollRef.current = setTimeout(run, interval);
    };
    run();
    return () => { active = false; if (pollRef.current) clearTimeout(pollRef.current); };
  }, [joined, sessionId, processSignals]);

  // === Join with camera + mic ===
  const joinCall = async (withVideo: boolean) => {
    setConnecting(true);
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: withVideo ? { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15 } } : false,
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setCamOn(withVideo);
      setMicOn(true);
      joinedRef.current = true;
      setJoined(true);

      // Register as participant
      await postSignal("rtc_join", {
        userId, userName, isTeacher,
        camOn: withVideo, micOn: true,
      });
    } catch (err: any) {
      setError(err.message || "Could not access camera/microphone. Please allow permissions.");
    }
    setConnecting(false);
  };

  // === Leave call ===
  const leaveCall = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    peerConns.current.forEach(pc => pc.close());
    peerConns.current.clear();
    setRemoteStreams(new Map());
    processedSigs.current.clear();
    setCamOn(false); setMicOn(false); setJoined(false);
    joinedRef.current = false;
    postSignal("rtc_leave", { userId });
  };

  // === Toggle camera ===
  const toggleCam = () => {
    if (!localStreamRef.current) return;
    const tracks = localStreamRef.current.getVideoTracks();
    tracks.forEach(t => { t.enabled = !t.enabled; });
    const newState = !camOn;
    setCamOn(newState);
    postSignal("rtc_status", { userId, camOn: newState, micOn });
  };

  // === Toggle mic ===
  const toggleMic = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    const newState = !micOn;
    setMicOn(newState);
    postSignal("rtc_status", { userId, camOn, micOn: newState });
  };

  // === Cleanup on unmount ===
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      peerConns.current.forEach(pc => pc.close());
      if (joinedRef.current) {
        fetch(`/api/classroom/${sessionId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "rtc_leave", userId }),
        }).catch(() => {});
      }
    };
  }, [sessionId, userId]);

  // Attach remote streams to video elements when they change
  useEffect(() => {
    remoteStreams.forEach((rs, id) => {
      const el = remoteVideoRefs.current.get(id);
      if (el && el.srcObject !== rs.stream) {
        el.srcObject = rs.stream;
        el.play().catch(() => {});
      }
    });
  }, [remoteStreams]);

  const remoteArr = Array.from(remoteStreams.entries());

  // ========== NOT JOINED — SHOW JOIN BUTTONS ==========
  if (!joined) {
    return (
      <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-brand-500/20 flex items-center justify-center">
          <Video className="w-6 h-6 text-brand-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Join Live Call</h4>
          <p className="text-[10px] text-gray-400 mt-0.5">Video & voice chat with {isTeacher ? "your students" : "your teacher"}</p>
        </div>
        {error && <p className="text-[10px] text-red-400 bg-red-900/30 p-2 rounded-lg">{error}</p>}
        <div className="flex gap-2 justify-center">
          <button onClick={() => joinCall(true)} disabled={connecting}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-medium hover:bg-brand-700 flex items-center gap-1.5 disabled:opacity-50">
            {connecting ? "Connecting..." : <><Video className="w-3.5 h-3.5" /> Join with Video</>}
          </button>
          <button onClick={() => joinCall(false)} disabled={connecting}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-500 flex items-center gap-1.5 disabled:opacity-50">
            <Mic className="w-3.5 h-3.5" /> Voice Only
          </button>
        </div>
      </div>
    );
  }

  // ========== JOINED — SHOW VIDEO GRID ==========
  return (
    <div className="space-y-2">
      {/* Control bar */}
      <div className="flex items-center gap-2 p-2 bg-gray-800 rounded-xl">
        <button onClick={toggleCam}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${camOn ? "bg-gray-600 text-white" : "bg-red-500/80 text-white"}`}>
          {camOn ? <><Video className="w-3.5 h-3.5" /> Cam On</> : <><VideoOff className="w-3.5 h-3.5" /> Cam Off</>}
        </button>
        <button onClick={toggleMic}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${micOn ? "bg-gray-600 text-white" : "bg-red-500/80 text-white"}`}>
          {micOn ? <><Mic className="w-3.5 h-3.5" /> Mic On</> : <><MicOff className="w-3.5 h-3.5" /> Mic Muted</>}
        </button>
        <button onClick={leaveCall}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 ml-auto">
          <PhoneOff className="w-3.5 h-3.5" /> Leave
        </button>
        <span className="text-[9px] text-gray-400 flex items-center gap-1">
          <Users className="w-3 h-3" /> {participants.length}
        </span>
      </div>

      {/* Video grid */}
      <div className={`grid gap-1.5 ${remoteArr.length === 0 ? "grid-cols-1" : remoteArr.length <= 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {/* My video */}
        <div className={`relative rounded-xl overflow-hidden bg-gray-900 aspect-video ${remoteArr.length === 0 ? "max-w-sm mx-auto w-full" : ""}`}>
          {camOn ? (
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-brand-500 flex items-center justify-center text-white text-lg font-bold">
                {userName?.[0] || "?"}
              </div>
            </div>
          )}
          <div className="absolute bottom-1 left-1 flex items-center gap-1">
            <span className="text-[8px] bg-black/70 text-white px-1.5 py-0.5 rounded font-medium">
              You{isTeacher ? " (Teacher)" : ""}
            </span>
            {!camOn && <span className="text-[7px] bg-red-500/80 text-white px-1 py-0.5 rounded">📷</span>}
            {!micOn && <span className="text-[7px] bg-red-500/80 text-white px-1 py-0.5 rounded">🔇</span>}
            {micOn && <span className="text-[7px] bg-emerald-500/80 text-white px-1 py-0.5 rounded animate-pulse">🎤</span>}
          </div>
        </div>

        {/* Remote videos */}
        {remoteArr.map(([id, rs]) => (
          <div key={id} className={`relative rounded-xl overflow-hidden bg-gray-900 aspect-video ${rs.isTeacher && !isTeacher ? "col-span-2 row-span-2" : ""}`}>
            <video
              ref={el => { if (el) remoteVideoRefs.current.set(id, el); }}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Overlay if cam is off but audio still playing */}
            {!rs.camOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="w-12 h-12 rounded-full bg-brand-400 flex items-center justify-center text-white text-lg font-bold">
                  {rs.name?.[0] || "?"}
                </div>
              </div>
            )}
            <div className="absolute bottom-1 left-1 flex items-center gap-1">
              <span className="text-[8px] bg-black/70 text-white px-1.5 py-0.5 rounded font-medium">
                {rs.name}{rs.isTeacher ? " 👨‍🏫" : ""}
              </span>
              {rs.micOn && <span className="text-[7px] bg-emerald-500/80 text-white px-1 py-0.5 rounded animate-pulse">🎤</span>}
              {!rs.micOn && <span className="text-[7px] bg-red-500/80 text-white px-1 py-0.5 rounded">🔇</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Participants who haven't joined call */}
      {participants.length > 0 && (
        <div className="flex flex-wrap gap-1 px-1">
          {participants.filter(p => p.odid !== userId && !remoteStreams.has(p.odid)).map(p => (
            <span key={p.odid} className="text-[8px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded-full">
              {p.name} (connecting...)
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
