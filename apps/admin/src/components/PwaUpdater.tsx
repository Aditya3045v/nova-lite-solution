import { useRegisterSW } from 'virtual:pwa-register/react';
import { UpdatePrompt } from '@novalite/ui';

export function PwaUpdater() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => registration.update().catch(() => undefined), 60 * 60 * 1000);
    },
  });
  return <UpdatePrompt show={needRefresh} onUpdate={() => updateServiceWorker(true)} onDismiss={() => setNeedRefresh(false)} />;
}
