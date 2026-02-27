// MobileContact — iOS Contacts-style card for Pranav
import { motion } from 'framer-motion';
import { ChevronLeft, Mail, Linkedin, Github, MessageCircle } from 'lucide-react';

const PROFILE_PHOTO = 'https://files.manuscdn.com/user_upload_by_module/session_file/115134064/UqpYnDLTsOlaAVmS.png';

const CONTACTS = [
  { icon: <Mail size={18} />, label: 'Email', value: 'pk.kowadkar@gmail.com', href: 'mailto:pk.kowadkar@gmail.com', color: '#e53e3e' },
  { icon: <Linkedin size={18} />, label: 'LinkedIn', value: 'linkedin.com/in/pkowadkar', href: 'https://linkedin.com/in/pkowadkar', color: '#0077b5' },
  { icon: <Github size={18} />, label: 'GitHub', value: 'github.com/p-kowadkar', href: 'https://github.com/p-kowadkar', color: '#e6edf3' },
  { icon: <MessageCircle size={18} />, label: 'Telegram', value: '@pk_kowadkar', href: 'https://t.me/pk_kowadkar', color: '#229ED9' },
];

export default function MobileContact({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0a0a', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-white/10 flex-shrink-0" style={{ background: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(20px)' }}>
        <button onClick={onClose} className="flex items-center gap-1 text-[#e53e3e]">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-white font-semibold text-lg flex-1">Contact</h1>
      </div>

      {/* Profile card */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {/* Avatar + name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl mb-4">
            <img src={PROFILE_PHOTO} alt="Pranav Kowadkar" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-white font-bold text-2xl">Pranav Kowadkar</h2>
          <p className="text-white/50 text-sm mt-1">AI Engineer · Builder · Hackathon Winner</p>
          <p className="text-white/30 text-xs mt-0.5">New Jersey, USA</p>
        </motion.div>

        {/* Contact methods */}
        <div className="space-y-3">
          {CONTACTS.map((c, i) => (
            <motion.a
              key={c.label}
              href={c.href}
              target={c.href.startsWith('mailto') ? undefined : '_blank'}
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-4 p-4 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${c.color}20`, color: c.color }}>
                {c.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/50 text-xs">{c.label}</p>
                <p className="text-white text-sm font-medium truncate">{c.value}</p>
              </div>
              <ChevronLeft size={16} className="text-white/20 rotate-180 flex-shrink-0" />
            </motion.a>
          ))}
        </div>

        {/* Speaking note */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 rounded-2xl"
          style={{ background: 'rgba(229,9,20,0.08)', border: '1px solid rgba(229,9,20,0.2)' }}
        >
          <p className="text-[#e53e3e] text-xs font-semibold mb-1">Speaking at LLM Day NYC</p>
          <p className="text-white/60 text-xs leading-relaxed">March 6, 2026 — "Multi-Agent Architectures: Solving Production LLM Reliability at Scale"</p>
        </motion.div>
      </div>
    </div>
  );
}
