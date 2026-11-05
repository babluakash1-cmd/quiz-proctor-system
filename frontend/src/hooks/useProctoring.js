import { useEffect, useRef } from 'react';
import { getApiUrl } from '../config/api';

export default function useProctoring({ sessionToken, currentQuestionIndex, onViolationTriggered }) {
  const isTriggered = useRef(false);

  const triggerViolation = async (reason) => {
    if (isTriggered.current) return;
    isTriggered.current = true;

    try {
      const res = await fetch(getApiUrl('/api/violation'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          type: reason,
          questionIndex: currentQuestionIndex
        })
      });
      const data = await res.json();
      if (onViolationTriggered) {
        onViolationTriggered(reason, data.candidateId);
      }
    } catch (err) {
      console.error('Violation reporting failed:', err);
    }
  };

  useEffect(() => {
    // 1. Tab switch (Visibility state)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerViolation('Tab switched / window hidden');
      }
    };

    // 2. Window Blur (Opening another application / loss of window focus)
    const handleBlur = () => {
      triggerViolation('Window lost focus / application changed');
    };

    // 3. Fullscreen Exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        triggerViolation('Exited fullscreen mode');
      }
    };

    // 4. Keyboard Shortcuts: DevTools, PrintScreen, Source Inspection
    const handleKeyDown = (e) => {
      if (
        e.key === 'PrintScreen' ||
        e.keyCode === 44 ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U'))
      ) {
        e.preventDefault();
        triggerViolation(`Forbidden key shortcut: ${e.key}`);
      }
    };

    // 5. Block Context Menu (Right Click)
    const handleContextMenu = (e) => {
      e.preventDefault();
      triggerViolation('Right-click / Context menu accessed');
    };

    // 6. Block Copy, Cut, Paste
    const handleCopy = (e) => {
      e.preventDefault();
      triggerViolation('Copy operation attempted');
    };

    const handleCut = (e) => {
      e.preventDefault();
      triggerViolation('Cut operation attempted');
    };

    const handlePaste = (e) => {
      e.preventDefault();
      triggerViolation('Paste operation attempted');
    };

    // 7. Navigation blocking (popstate & beforeunload)
    const handlePopState = (e) => {
      e.preventDefault();
      triggerViolation('Back / Forward navigation detected');
    };

    const handleBeforeUnload = (e) => {
      triggerViolation('Page refreshed or navigation attempted');
      e.preventDefault();
      e.returnValue = '';
    };

    // 8. Mobile AI / Circle to Search detection: Long-press check
    let touchTimer = null;
    const handleTouchStart = () => {
      touchTimer = setTimeout(() => {
        triggerViolation('Long press detected (Potential circle-to-search / AI overlay)');
      }, 450);
    };

    const handleTouchEnd = () => {
      if (touchTimer) clearTimeout(touchTimer);
    };

    // Attach Listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    // Heartbeat Interval to keep server updated every 5s
    const pingInterval = setInterval(() => {
      fetch(getApiUrl('/api/heartbeat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken })
      }).catch(() => {});
    }, 5000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      clearInterval(pingInterval);
    };
  }, [sessionToken, currentQuestionIndex]);
}
