/**
 * dispatchToolCall — turns a tool_call from /api/chat's response (see
 * backend/main.py's TOOLS list) into a window-open action, shared between
 * every chat surface (ChatPKApp/MobileAIssistant, VideoCallApp/MobileDigitalTwin) so
 * the three-way switch on tool name isn't duplicated per surface. Each
 * platform supplies its own `actions` — how "open a window" actually happens
 * differs (WindowManager.openWindow on desktop via WindowActionsContext, an
 * overlay-screen callback on mobile), including how an open_app id maps onto
 * that platform's own app ids.
 */
export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolDispatchActions {
  openCanvas: (project: string) => void;
  openScheduler: () => void;
  openApp: (appId: string) => void;
}

export function dispatchToolCall(toolCall: ToolCall, actions: ToolDispatchActions): void {
  switch (toolCall.name) {
    case 'open_canvas': {
      const project = toolCall.arguments?.project;
      if (typeof project === 'string') actions.openCanvas(project);
      return;
    }
    case 'open_scheduler':
      actions.openScheduler();
      return;
    case 'open_app': {
      const appId = toolCall.arguments?.app_id;
      if (typeof appId === 'string') actions.openApp(appId);
      return;
    }
    default:
      return; // unknown tool name — ignore rather than throw, backend may add tools later
  }
}
