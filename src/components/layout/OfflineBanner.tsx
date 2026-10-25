import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/usePWAInstall.ts';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white shadow-lg border border-zinc-700">
      <WifiOff className="w-4 h-4 text-[#E11D48]" />
      <span>Offline Mode — Your edits are safely cached locally and will sync.</span>
    </div>
  );
};
