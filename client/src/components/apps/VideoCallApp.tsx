import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';

export default function VideoCallApp() {
  const [toast, setToast] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(false);

  const handleEndCall = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  };

  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-8 relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% 30%, rgba(229,9,20,0.06) 0%, transparent 60%),
          linear-gradient(160deg, #0d0d0f 0%, #12121a 50%, #0d0d0f 100%)
        `,
      }}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Avatar with pulsing rings */}
      <div className="relative flex items-center justify-center">
        {/* Outer pulse rings */}
        <div
          className="pulse-ring absolute"
          style={{
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            border: '1.5px solid rgba(229,9,20,0.3)',
          }}
        />
        <div
          className="pulse-ring-delay absolute"
          style={{
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            border: '1.5px solid rgba(229,9,20,0.2)',
          }}
        />

        {/* Avatar */}
        <motion.div
          className="relative flex items-center justify-center"
          style={{
            width: '112px',
            height: '112px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #E50914 0%, #b00710 100%)',
            boxShadow: '0 0 40px rgba(229,9,20,0.3), 0 0 80px rgba(229,9,20,0.1)',
          }}
          animate={{ boxShadow: ['0 0 40px rgba(229,9,20,0.3)', '0 0 60px rgba(229,9,20,0.5)', '0 0 40px rgba(229,9,20,0.3)'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '36px',
              fontStyle: 'italic',
              color: 'white',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            pk
          </span>
        </motion.div>
      </div>

      {/* Status text */}
      <div className="text-center z-10">
        <motion.p
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '22px',
            color: '#f0f0f2',
            marginBottom: '8px',
          }}
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          Digital Twin
        </motion.p>
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '12px',
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.05em',
            marginBottom: '6px',
          }}
        >
          COMING SOON
        </p>
        <p
          style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.4)',
            maxWidth: '280px',
            lineHeight: 1.6,
            margin: '0 auto',
          }}
        >
          An AI version of Pranav with real-time voice and vision. Check back soon.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 z-10">
        <button
          onClick={() => setMicOn(!micOn)}
          className="flex items-center justify-center transition-all hover:brightness-110"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: micOn ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {micOn ? <Mic size={18} color="white" /> : <MicOff size={18} color="rgba(255,255,255,0.4)" />}
        </button>

        <button
          onClick={handleEndCall}
          className="flex items-center justify-center gap-2 transition-all hover:brightness-110"
          style={{
            padding: '12px 24px',
            borderRadius: '28px',
            background: '#ff3b30',
            border: 'none',
            color: 'white',
            fontSize: '14px',
            fontWeight: 500,
            fontFamily: "'Outfit', sans-serif",
            boxShadow: '0 4px 20px rgba(255,59,48,0.4)',
          }}
        >
          <PhoneOff size={16} />
          End Call
        </button>

        <button
          onClick={() => setVideoOn(!videoOn)}
          className="flex items-center justify-center transition-all hover:brightness-110"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: videoOn ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {videoOn ? <Video size={18} color="white" /> : <VideoOff size={18} color="rgba(255,255,255,0.4)" />}
        </button>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="absolute bottom-6"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(36,36,38,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              fontFamily: "'DM Mono', monospace",
              fontSize: '12px',
              color: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(20px)',
            }}
          >
            Not live yet — check back soon!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
