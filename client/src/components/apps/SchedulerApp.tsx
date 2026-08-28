// SchedulerApp — desktop wrapper around SchedulerContent.
import SchedulerContent from '../SchedulerContent';

export default function SchedulerApp() {
  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0a0a' }}>
      <SchedulerContent />
    </div>
  );
}
