import { useRouter } from 'next/router';
import { isRegistered } from './guest';

export function useRequireAccess() {
  const router = useRouter();

  function requireAccess(action) {
    if (isRegistered()) {
      action();
      return;
    }
    router.push(`/kirish?redirect=${encodeURIComponent(router.asPath)}`);
  }

  return { requireAccess };
}
