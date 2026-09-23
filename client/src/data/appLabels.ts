/** What each window is called in the Dock's tooltips and the menu bar's Window menu. One list, so the
 *  two cannot disagree. (The menu bar's BOLD app name at the top is macOS-flavoured and separate: it
 *  says "Safari" for the Browser.) */
export const APP_LABELS: Record<string, string> = {
  projects: 'Projects',
  chat: 'AIssistant',
  mystory: 'My Story',
  videocall: 'Video Call',
  messages: 'Messages',
  browser: 'Browser',
  cv: 'Resume',
  terminal: 'Terminal',
  canvas: 'Canvas',
  scheduler: 'Schedule a Call',
};
