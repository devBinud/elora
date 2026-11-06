import NetInfo from '@react-native-community/netinfo';

import { devProxyUrl } from '@/config/dev-proxy';
import { useNetworkStore } from '@/store/network-store';

/**
 * Tracks connectivity in the network store and calls `onReconnect` whenever
 * the device goes from offline to online. Returns an unsubscribe function.
 */
export function startNetworkMonitor(onReconnect: () => void): () => void {
  if (devProxyUrl) {
    // Through the dev proxy, "online" means the proxy on the PC answers.
    NetInfo.configure({
      reachabilityUrl: `${devProxyUrl}/__health`,
      reachabilityTest: (response) => Promise.resolve(response.status === 204),
    });
  }
  return NetInfo.addEventListener((state) => {
    const isOnline = Boolean(state.isConnected) && state.isInternetReachable !== false;
    const wasOnline = useNetworkStore.getState().isOnline;
    useNetworkStore.getState().setOnline(isOnline);
    if (isOnline && wasOnline === false) {
      onReconnect();
    }
  });
}
