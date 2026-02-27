import { Download, ExternalLink } from 'lucide-react';

const CV_URL = '/data/NzyVcASHnQQqVKaE.pdf';

export default function CVApp() {
  return (
    <div className="flex flex-col h-full" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{
          background: 'rgba(20,20,22,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '11px',
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          PranavKowadkar-DS_AI-Resume.pdf
        </span>
        <div className="flex items-center gap-2">
          <a
            href={CV_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-all hover:brightness-110"
            style={{
              padding: '5px 12px',
              borderRadius: '7px',
              fontSize: '12px',
              fontFamily: "'DM Mono', monospace",
              background: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(255,255,255,0.1)',
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={12} />
            Open
          </a>
          <a
            href={CV_URL}
            download="PranavKowadkar-Resume.pdf"
            className="inline-flex items-center gap-1.5 transition-all hover:brightness-110"
            style={{
              padding: '5px 12px',
              borderRadius: '7px',
              fontSize: '12px',
              fontFamily: "'DM Mono', monospace",
              background: '#E50914',
              color: 'white',
              textDecoration: 'none',
            }}
          >
            <Download size={12} />
            Download
          </a>
        </div>
      </div>

      {/* PDF embed */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src={`${CV_URL}#toolbar=0&navpanes=0&scrollbar=1`}
          title="Pranav Kowadkar Resume"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: '#1a1a1c',
          }}
        />
      </div>
    </div>
  );
}
