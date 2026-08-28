// CanvasApp — desktop wrapper around CanvasContent. Reads its project id
// from the 'canvas' window's params via useWindowParams (Desktop.tsx's
// appComponents map pre-instantiates this element once, so the id can't
// flow through as a prop).
import { useWindowParams } from '../../contexts/WindowParamsContext';
import CanvasContent from '../CanvasContent';

export default function CanvasApp() {
  const params = useWindowParams('canvas');
  const projectId = params?.project as string | undefined;

  return (
    <div className="flex h-full" style={{ fontFamily: "'Outfit', sans-serif", background: '#0a0a0a' }}>
      <CanvasContent projectId={projectId} />
    </div>
  );
}
