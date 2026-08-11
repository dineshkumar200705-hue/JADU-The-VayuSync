import { socketService } from './socketService';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export class WebRTCService {
  private pc: RTCPeerConnection | null = null;
  private room: string;
  private role: 'host' | 'mobile';
  onRemoteStream?: (stream: MediaStream) => void;

  constructor(room = 'airmouse-room', role: 'host' | 'mobile' = 'host') {
    this.room = room;
    this.role = role;
  }

  async init() {
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketService.sendIceCandidate(this.room, e.candidate.toJSON());
      }
    };

    this.pc.ontrack = (e) => {
      if (this.onRemoteStream && e.streams[0]) {
        this.onRemoteStream(e.streams[0]);
      }
    };

    this.pc.onconnectionstatechange = () => {
      console.log('[WebRTC] State:', this.pc?.connectionState);
    };

    // Listen for signaling events
    socketService.on<{ offer: RTCSessionDescriptionInit; peerId: string }>('webrtc-offer', async ({ offer, peerId }) => {
      if (this.role !== 'host' || !this.pc) return;
      await this.pc.setRemoteDescription(offer);
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      socketService.sendAnswer(this.room, answer, peerId);
    });

    socketService.on<{ answer: RTCSessionDescriptionInit }>('webrtc-answer', async ({ answer }) => {
      if (this.role !== 'mobile' || !this.pc) return;
      await this.pc.setRemoteDescription(answer);
    });

    socketService.on<{ candidate: RTCIceCandidateInit }>('ice-candidate', async ({ candidate }) => {
      try {
        await this.pc?.addIceCandidate(candidate);
      } catch (_e) { /* ignore */ }
    });

    socketService.joinRoom(this.room, this.role);
  }

  // Mobile: add local stream and create offer
  async startStreaming(stream: MediaStream) {
    if (!this.pc) return;
    stream.getTracks().forEach(track => this.pc!.addTrack(track, stream));

    socketService.on('peer-joined', async () => {
      const offer = await this.pc!.createOffer({ offerToReceiveVideo: false });
      await this.pc!.setLocalDescription(offer);
      socketService.sendOffer(this.room, offer, '');
    });
  }

  destroy() {
    this.pc?.close();
    this.pc = null;
    socketService.off('webrtc-offer');
    socketService.off('webrtc-answer');
    socketService.off('ice-candidate');
  }
}
