"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Users, RefreshCw } from "lucide-react";

const ICE_CFG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

interface Props {
  sessionId: string;
  userId: string;
  userName: string;
  isTeacher: boolean;
}

export default function ClassroomVideo({ sessionId, userId, userName, isTeacher }: Props) {
  const [joined, setJoined] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [remotes, setRemotes] = useState<Map<string, { stream: MediaStream; name: string; isTeacher: boolean }>>(new Map());
  const [participants, setParticipants] = useState<any[]>([]);

  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const pcMap = useRef<Map<string, RTCPeerConnection>>(new Map());
  const offered = useRef<Set<string>>(new Set());
  const answered = useRef<Set<string>>(new Set());
  const remoteVidRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const joinedRef = useRef(false);

  const api = useCallback(async (action: string, data: any = {}) => {
    if (!sessionId) return;
    try {
      await fetch(`/api/classroom/${sessionId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...data }),
      });
    } catch (_e) {}
  }, [sessionId]);

  const fetchData = useCallback(async () => {
    if (!sessionId) return null;
    try {
      const r = await fetch(`/api/classroom/${sessionId}`);
      return r.ok ? await r.json() : null;
    } catch (_e) { return null; }
  }, [sessionId]);

  // Wait for ALL ICE candidates before returning SDP
  const gatherComplete = (pc: RTCPeerConnection): Promise<RTCSessionDescription | null> => {
    return new Promise((resolve) => {
      if (pc.iceGatheringState === "complete") { resolve(pc.localDescription); return; }
      const t = setTimeout(() => resolve(pc.localDescription), 8000);
      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === "complete") { clearTimeout(t); resolve(pc.localDescription); }
      };
    });
  };

  const attachRemote = useCallback((peerId: string, stream: MediaStream, name: string, peerIsTeacher: boolean) => {
    setRemotes(prev => { const n = new Map(prev); n.set(peerId, { stream, name, isTeacher: peerIsTeacher }); return n; });
    setStatus("connected");
    requestAnimationFrame(() => {
      const el = remoteVidRefs.current.get(peerId);
      if (el && el.srcObject !== stream) { el.srcObject = stream; el.play().catch(() => {}); }
    });
  }, []);

  const removePeer = useCallback((peerId: string) => {
    pcMap.current.get(peerId)?.close();
    pcMap.current.delete(peerId);
    offered.current.delete(peerId);
    answered.current.delete(peerId);
    setRemotes(prev => { const n = new Map(prev); n.delete(peerId); return n; });
  }, []);

  // Create offer → gather full SDP → send
  const sendOffer = useCallback(async (rid: string, rname: string, rIsTeacher: boolean) => {
    if (offered.current.has(rid) || !localStreamRef.current) return;
    offered.current.add(rid);
    setStatus("connecting");
    const pc = new RTCPeerConnection(ICE_CFG);
    pcMap.current.set(rid, pc);
    localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));
    pc.ontrack = (e) => { if (e.streams[0]) attachRemote(rid, e.streams[0], rname, rIsTeacher); };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") removePeer(rid);
    };
    try {
      await pc.setLocalDescription(await pc.createOffer());
      const sdp = await gatherComplete(pc);
      if (sdp) await api("rtc_signal", { from: userId, to: rid, type: "offer", data: { sdp: sdp.sdp, type: sdp.type }, fromName: userName, fromIsTeacher: isTeacher });
      else offered.current.delete(rid);
    } catch (_e) { offered.current.delete(rid); }
  }, [userId, userName, isTeacher, api, attachRemote, removePeer]);

  // Handle incoming offer
  const onOffer = useCallback(async (sig: any) => {
    if (answered.current.has(sig.from) || !localStreamRef.current) return;
    answered.current.add(sig.from);
    pcMap.current.get(sig.from)?.close();
    const pc = new RTCPeerConnection(ICE_CFG);
    pcMap.current.set(sig.from, pc);
    localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));
    pc.ontrack = (e) => { if (e.streams[0]) attachRemote(sig.from, e.streams[0], sig.fromName || "User", sig.fromIsTeacher || false); };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") removePeer(sig.from);
    };
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sig.data));
      await pc.setLocalDescription(await pc.createAnswer());
      const sdp = await gatherComplete(pc);
      if (sdp) await api("rtc_signal", { from: userId, to: sig.from, type: "answer", data: { sdp: sdp.sdp, type: sdp.type }, fromName: userName, fromIsTeacher: isTeacher });
      else answered.current.delete(sig.from);
    } catch (_e) { answered.current.delete(sig.from); }
  }, [userId, userName, isTeacher, api, attachRemote, removePeer]);

  // Handle incoming answer
  const onAnswer = useCallback(async (sig: any) => {
    const pc = pcMap.current.get(sig.from);
    if (!pc || pc.signalingState !== "have-local-offer") return;
    try { await pc.setRemoteDescription(new RTCSessionDescription(sig.data)); } catch (_e) {}
  }, []);

  // === Poll loop ===
  useEffect(() => {
    if (!joined) return;
    let active = true;
    const poll = async () => {
      if (!active || !joinedRef.current) return;
      const d = await fetchData();
      if (!d) return;
      const parts: any[] = Array.isArray(d.videoFeeds) ? d.videoFeeds : [];
      const sigs: any[] = Array.isArray(d.rtcSignals) ? d.rtcSignals : [];
      setParticipants(parts);
      const consume: string[] = [];
      for (const s of sigs) {
        if (s.to !== userId) continue;
        consume.push(s.id);
        if (s.type === "offer") await onOffer(s);
        if (s.type === "answer") await onAnswer(s);
      }
      if (consume.length > 0) api("rtc_consume", { signalIds: consume });
      // Initiate to new peers (lower id starts)
      for (const p of parts) {
        if (p.odid === userId || pcMap.current.has(p.odid)) continue;
        if (userId < p.odid) await sendOffer(p.odid, p.name, p.isTeacher);
        else if (status !== "connected") setStatus("waiting");
      }
      // Cleanup gone peers
      const live = new Set(parts.map((p: any) => p.odid));
      for (const id of pcMap.current.keys()) { if (!live.has(id)) removePeer(id); }
    };
    const run = async () => {
      if (!active) return;
      await poll();
      const connected = Array.from(pcMap.current.values()).some(pc => pc.connectionState === "connected");
      if (active) setTimeout(run, connected ? 5000 : 1500);
    };
    run();
    return () => { active = false; };
  }, [joined, userId, fetchData, api, sendOffer, onOffer, onAnswer, removePeer, status]);

  const joinCall = async (withVideo: boolean) => {
    setStatus("joining"); setError("");
    try {
      const c: MediaStreamConstraints = { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } };
      if (withVideo) c.video = { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 15 } };
      const stream = await navigator.mediaDevices.getUserMedia(c);
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setCamOn(withVideo); setMicOn(true);
      await api("rtc_join", { userId, userName, isTeacher, camOn: withVideo, micOn: true });
      joinedRef.current = true; setJoined(true); setStatus("waiting");
    } catch (err: any) {
      setError(err.message?.includes("Permission") ? "Permission denied. Allow camera/mic in browser settings."
        : err.message?.includes("NotFound") ? "No camera/microphone found." : `Error: ${err.message}`);
      setStatus("failed");
    }
  };

  const leaveCall = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    pcMap.current.forEach(pc => pc.close()); pcMap.current.clear();
    offered.current.clear(); answered.current.clear();
    setRemotes(new Map()); setCamOn(false); setMicOn(false);
    setJoined(false); joinedRef.current = false; setStatus("idle");
    api("rtc_leave", { userId });
  };

  const toggleCam = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setCamOn(c => { api("rtc_status", { userId, camOn: !c, micOn }); return !c; });
  };
  const toggleMic = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMicOn(m => { api("rtc_status", { userId, camOn, micOn: !m }); return !m; });
  };
  const retry = () => {
    pcMap.current.forEach(pc => pc.close()); pcMap.current.clear();
    offered.current.clear(); answered.current.clear();
    setRemotes(new Map()); setStatus("waiting");
  };

  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pcMap.current.forEach(pc => pc.close());
      if (joinedRef.current) {
        fetch(`/api/classroom/${sessionId}`, { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "rtc_leave", userId }) }).catch(() => {});
      }
    };
  }, [sessionId, userId]);

  // Attach local stream to video element after render
  useEffect(() => {
    if (joined && localStreamRef.current && localVideoRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
        localVideoRef.current.play().catch(() => {});
      }
    }
  }, [joined, camOn]);

  useEffect(() => {
    remotes.forEach((rs, id) => {
      const el = remoteVidRefs.current.get(id);
      if (el && el.srcObject !== rs.stream) { el.srcObject = rs.stream; el.play().catch(() => {}); }
    });
  }, [remotes]);

  const remoteArr = Array.from(remotes.entries());
  const others = participants.filter(p => p.odid !== userId);

  // Separate teacher and students for layout
  const teacherRemote = remoteArr.find(([, rs]) => rs.isTeacher);
  const studentRemotes = remoteArr.filter(([, rs]) => !rs.isTeacher);

  if (!joined) {
    return (
      <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-brand-500/20 flex items-center justify-center">
          <Video className="w-6 h-6 text-brand-400" />
        </div>
        <h4 className="text-sm font-bold text-white">Join Live Call</h4>
        <p className="text-[10px] text-gray-400">{isTeacher ? "Start video/voice with students" : "Connect with your teacher"}</p>
        {others.length > 0 && <p className="text-[10px] text-emerald-400">{others.length} in call: {others.map(p=>p.name).join(", ")}</p>}
        {error && <p className="text-[10px] text-red-400 bg-red-900/30 p-2 rounded-lg">{error}</p>}
        <div className="flex gap-2 justify-center">
          <button onClick={() => joinCall(true)} disabled={status==="joining"}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-medium hover:bg-brand-700 flex items-center gap-1.5 disabled:opacity-50">
            {status==="joining"?"Starting...":<><Video className="w-3.5 h-3.5" /> Join with Video</>}
          </button>
          <button onClick={() => joinCall(false)} disabled={status==="joining"}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg text-xs font-medium hover:bg-gray-500 flex items-center gap-1.5 disabled:opacity-50">
            <Mic className="w-3.5 h-3.5" /> Voice Only
          </button>
        </div>
      </div>
    );
  }

  const stLabel: Record<string, string> = {
    waiting: "⏳ Waiting for others...", connecting: "🔗 Connecting...",
    connected: `✅ Connected (${remoteArr.length})`, failed: "❌ Failed",
  };

  return (
    <div className="space-y-2">
      {/* Controls bar */}
      <div className="flex items-center gap-1.5 p-2 bg-gray-800 rounded-xl flex-wrap">
        <button onClick={toggleCam} className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium ${camOn?"bg-gray-600 text-white":"bg-red-500/80 text-white"}`}>
          {camOn?<><Video className="w-3 h-3" /> Cam</>:<><VideoOff className="w-3 h-3" /> Off</>}
        </button>
        <button onClick={toggleMic} className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium ${micOn?"bg-gray-600 text-white":"bg-red-500/80 text-white"}`}>
          {micOn?<><Mic className="w-3 h-3" /> Mic</>:<><MicOff className="w-3 h-3" /> Muted</>}
        </button>
        <button onClick={leaveCall} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium bg-red-600 text-white">
          <PhoneOff className="w-3 h-3" /> Leave
        </button>
        {status !== "connected" && (
          <button onClick={retry} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[9px] bg-amber-600 text-white">
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        )}
        <span className="text-[9px] text-gray-400 ml-auto"><Users className="w-3 h-3 inline" /> {participants.length} · {stLabel[status] || ""}</span>
      </div>

      {/* === VIDEO LAYOUT: Teacher on top, students below === */}
      <div className="space-y-2">
        {/* TEACHER ROW — large prominent view */}
        {isTeacher ? (
          <div className="max-w-sm mx-auto">
            <p className="text-[8px] text-gray-400 text-center mb-0.5 font-bold uppercase tracking-wider">👨‍🏫 Teacher (You)</p>
            <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video">
              <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${camOn?"":"hidden"}`} style={{transform:"scaleX(-1)"}} />
              {!camOn&&<div className="w-full h-full flex items-center justify-center bg-gray-800"><div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">{userName?.[0]||"?"}</div></div>}
              <div className="absolute bottom-1 left-1 flex items-center gap-1">
                <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-medium">👨‍🏫 {userName} (You)</span>
                {micOn&&<span className="text-[7px] bg-emerald-500/80 text-white px-1 py-0.5 rounded animate-pulse">🎤</span>}
              </div>
              <div className="absolute top-1 right-1"><span className="text-[7px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold">TEACHER</span></div>
            </div>
          </div>
        ) : teacherRemote ? (
          <div className="max-w-md mx-auto">
            <p className="text-[8px] text-gray-400 text-center mb-0.5 font-bold uppercase tracking-wider">👨‍🏫 Teacher</p>
            <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video ring-2 ring-blue-500">
              <video ref={el => { if(el) remoteVidRefs.current.set(teacherRemote[0], el); }} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-1 left-1"><span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-medium">👨‍🏫 {teacherRemote[1].name}</span></div>
              <div className="absolute top-1 right-1"><span className="text-[7px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold">TEACHER</span></div>
            </div>
          </div>
        ) : null}

        {/* STUDENTS ROW — grid of smaller tiles */}
        {((isTeacher ? remoteArr : studentRemotes).length > 0 || !isTeacher) && (
          <div>
            <p className="text-[8px] text-gray-400 mb-0.5 font-bold uppercase tracking-wider">🎓 Students {isTeacher ? `(${remoteArr.length})` : ""}</p>
            <div className={`grid gap-1.5 ${
              (isTeacher ? remoteArr.length : studentRemotes.length + 1) <= 2 ? "grid-cols-2" :
              (isTeacher ? remoteArr.length : studentRemotes.length + 1) <= 4 ? "grid-cols-3" : "grid-cols-4"
            }`}>
              {/* Student self-view (only for students) */}
              {!isTeacher && (
                <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video ring-1 ring-emerald-500/50">
                  <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${camOn?"":"hidden"}`} style={{transform:"scaleX(-1)"}} />
                  {!camOn&&<div className="w-full h-full flex items-center justify-center bg-gray-800"><div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-sm">{userName?.[0]||"?"}</div></div>}
                  <div className="absolute bottom-1 left-1 flex items-center gap-1">
                    <span className="text-[8px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-medium">{userName} (You)</span>
                    {micOn&&<span className="text-[7px] bg-emerald-500/80 text-white px-1 py-0.5 rounded animate-pulse">🎤</span>}
                  </div>
                </div>
              )}
              {/* Other students (for teacher: all remotes; for student: student remotes only) */}
              {(isTeacher ? remoteArr : studentRemotes).map(([id, rs]) => (
                <div key={id} className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video">
                  <video ref={el => { if(el) remoteVidRefs.current.set(id, el); }} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute bottom-1 left-1">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-medium ${rs.isTeacher ? "bg-blue-600 text-white" : "bg-black/70 text-white"}`}>
                      {rs.isTeacher ? "👨‍🏫 " : "🎓 "}{rs.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Peers connecting */}
      {others.length > 0 && remoteArr.length < others.length && (
        <div className="flex flex-wrap gap-1">
          {others.filter(p => !remotes.has(p.odid)).map(p => (
            <span key={p.odid} className="text-[8px] bg-gray-700 text-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />{p.name} connecting...
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
