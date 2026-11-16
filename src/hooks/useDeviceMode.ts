import { useEffect, useState } from 'react';

export type DeviceType = 'mobile' | 'desktop';

function detectDevice(): { deviceType: DeviceType; isTouch: boolean } {
  if (typeof window === 'undefined') {
    return { deviceType: 'desktop', isTouch: false };
  }
  const ua = navigator.userAgent || '';
  const uaMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    ua
  );
  const narrow = window.innerWidth < 768;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return {
    deviceType: narrow || (uaMobile && window.innerWidth < 1024) ? 'mobile' : 'desktop',
    isTouch,
  };
}

export function useDeviceMode() {
  const [info, setInfo] = useState(() => detectDevice());

  useEffect(() => {
    const update = () => setInfo(detectDevice());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return {
    deviceType: info.deviceType,
    isMobile: info.deviceType === 'mobile',
    isDesktop: info.deviceType === 'desktop',
    isTouch: info.isTouch,
  };
}
