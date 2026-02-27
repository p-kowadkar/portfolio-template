// MobileResume — iOS-style resume viewer with download
import { ChevronLeft, Download, ExternalLink } from 'lucide-react';

const CV_URL = '/data/NzyVcASHnQQqVKaE.pdf';

export default function MobileResume({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0a0a', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-white/10 flex-shrink-0" style={{ background: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(20px)' }}>
        <button onClick={onClose} className="flex items-center gap-1 text-[#e53e3e]">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-white font-semibold text-base flex-1 truncate">PranavKowadkar-Resume.pdf</h1>
        <div className="flex items-center gap-2">
          <a
            href={CV_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <ExternalLink size={15} color="rgba(255,255,255,0.6)" />
          </a>
          <a
            href={CV_URL}
            download="PranavKowadkar-Resume.pdf"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: '#e53e3e', color: 'white', textDecoration: 'none' }}
          >
            <Download size={12} /> Download
          </a>
        </div>
      </div>

      {/* PDF embed */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src={`${CV_URL}#toolbar=0&navpanes=0&scrollbar=1`}
          title="Pranav Kowadkar Resume"
          style={{ width: '100%', height: '100%', border: 'none', background: '#1a1a1c' }}
        />
      </div>
    </div>
  );
}
