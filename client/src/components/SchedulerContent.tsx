// SchedulerContent — shared inner component for the Scheduler app. Embeds
// Cal.com's public profile page (so every event type on that page is
// reachable), deliberately not one hardcoded event type. Desktop
// (SchedulerApp.tsx) and mobile (MobileScheduler.tsx) both render this
// directly full-bleed within their own chrome.
//
// Replace CAL_COM_URL with your own Cal.com username (or any other public
// scheduling page — Calendly, etc. — that allows iframe embedding). No API
// key needed either way, this is a plain iframe.
const CAL_COM_URL = 'https://cal.com/pkowadkar';

export default function SchedulerContent() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '600px', background: '#0a0a0a' }}>
      <iframe
        src={CAL_COM_URL}
        title="Schedule a call"
        style={{ width: '100%', height: '100%', minHeight: '600px', border: 'none', display: 'block' }}
      />
    </div>
  );
}
