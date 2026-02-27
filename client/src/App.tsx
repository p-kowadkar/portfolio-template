import { useState, useCallback } from 'react';
import IntroScreen from './components/IntroScreen';
import Desktop from './components/Desktop';
import MobileIntro from './components/mobile/MobileIntro';
import MobileShell from './components/mobile/MobileShell';
import { useWindowManager } from './hooks/useWindowManager';
import { useIsMobile } from './hooks/useMobile';

export default function App() {
  const isMobile = useIsMobile();
  const [introComplete, setIntroComplete] = useState(
    () => sessionStorage.getItem('pk_intro_shown') === 'true'
  );
  const windowManager = useWindowManager();

  const handleIntroComplete = useCallback(() => {
    sessionStorage.setItem('pk_intro_shown', 'true');
    setIntroComplete(true);
  }, []);

  // Mobile: iOS springboard experience
  if (isMobile) {
    return (
      <div style={{ width: '100vw', height: '100dvh', overflow: 'hidden' }}>
        {!introComplete && <MobileIntro onComplete={handleIntroComplete} />}
        {introComplete && <MobileShell />}
      </div>
    );
  }

  // Desktop/tablet: macOS experience (unchanged)
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {!introComplete && <IntroScreen onComplete={handleIntroComplete} />}
      {introComplete && <Desktop windowManager={windowManager} />}
    </div>
  );
}
