// MobileScheduler — mobile wrapper around SchedulerContent, full-screen with
// the standard back-button header (mirrors MobileResume.tsx / MobileMyStory.tsx).
import { ChevronLeft } from 'lucide-react';
import SchedulerContent from '../../SchedulerContent';

export default function MobileScheduler({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0a0a', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-white/10 flex-shrink-0" style={{ background: 'rgba(15,15,15,0.95)', backdropFilter: 'blur(20px)' }}>
        <button onClick={onClose} className="flex items-center gap-1 text-[#e53e3e]">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-white font-semibold text-lg flex-1">Schedule a Call</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <SchedulerContent />
      </div>
    </div>
  );
}
