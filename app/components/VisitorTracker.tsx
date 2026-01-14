'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export const VisitorTracker = () => {
  const pathname = usePathname();

  useEffect(() => {
    // 1. Get or create visitor ID
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem('visitor_id', visitorId);
    }

    // 2. Send tracking event
    const trackView = async () => {
        try {
            await fetch('/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: pathname,
                    visitorId
                })
            });
        } catch (err) {
            // fail silently
            console.error(err);
        }
    };

    trackView();
  }, [pathname]);

  return null;
};
