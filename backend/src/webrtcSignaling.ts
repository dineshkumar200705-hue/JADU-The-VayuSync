import { Server, Socket } from 'socket.io';

// Minimal shapes (browser types not available in Node.js context)
interface SessionDesc { type: string; sdp?: string; }
interface IceCandidate { candidate?: string; sdpMid?: string | null; sdpMLineIndex?: number | null; }

interface PeerInfo {
  socketId: string;
  role: 'host' | 'mobile';
}

const peers = new Map<string, PeerInfo>();

export function setupWebRTCSignaling(io: Server) {
  io.on('connection', (socket: Socket) => {

    // Mobile joins a signaling room
    socket.on('join-room', ({ room, role }: { room: string; role: 'host' | 'mobile' }) => {
      socket.join(room);
      peers.set(socket.id, { socketId: socket.id, role });
      console.log(`[WebRTC] ${socket.id} joined room "${room}" as ${role}`);

      // Notify host that a mobile peer connected
      if (role === 'mobile') {
        socket.to(room).emit('peer-joined', { peerId: socket.id });
      }
    });

    // Relay WebRTC offer (mobile → host)
    socket.on('webrtc-offer', ({ room, offer, peerId }: { room: string; offer: SessionDesc; peerId: string }) => {
      console.log(`[WebRTC] Relaying offer from ${socket.id}`);
      socket.to(room).emit('webrtc-offer', { offer, peerId: socket.id });
    });

    // Relay WebRTC answer (host → mobile)
    socket.on('webrtc-answer', ({ room, answer, peerId }: { room: string; answer: SessionDesc; peerId: string }) => {
      console.log(`[WebRTC] Relaying answer to ${peerId}`);
      io.to(peerId).emit('webrtc-answer', { answer });
    });

    // Relay ICE candidates
    socket.on('ice-candidate', ({ room, candidate, peerId }: { room: string; candidate: IceCandidate; peerId: string }) => {
      if (peerId) {
        io.to(peerId).emit('ice-candidate', { candidate, from: socket.id });
      } else {
        socket.to(room).emit('ice-candidate', { candidate, from: socket.id });
      }
    });

    socket.on('disconnect', () => {
      const peer = peers.get(socket.id);
      if (peer) {
        peers.delete(socket.id);
        // Notify rooms
        socket.rooms.forEach(room => {
          socket.to(room).emit('peer-left', { peerId: socket.id });
        });
      }
    });
  });
}
