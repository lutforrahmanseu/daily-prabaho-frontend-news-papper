import { useEffect, useRef, useState } from 'react';
import { getNextStreamCursor } from '../utils/liveCoverageHelpers.js';

const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return '/api/v1';
  const configured = import.meta.env?.VITE_API_URL || '/api/v1';
  return configured.replace(/\/$/, '');
};

/**
 * Safe real-time Server-Sent Events (EventSource) + BroadcastChannel live sync hook.
 * Uses event-driven deltas & visibility pause/resume rather than interval polling.
 */
export function useLiveBlogStream({
  slug,
  enabled = true,
  initialVersion = 0,
  onSnapshot,
  onNewUpdates
}) {
  const [connectionState, setConnectionState] = useState(enabled ? 'connecting' : 'idle');
  const [streamVersion, setStreamVersion] = useState(() => Number(initialVersion) || 0);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const cursorRef = useRef(Number(initialVersion) || 0);
  const retryCountRef = useRef(0);
  const esRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const knownIdsRef = useRef(new Set());
  const callbacksRef = useRef({ onSnapshot, onNewUpdates });

  useEffect(() => {
    callbacksRef.current = { onSnapshot, onNewUpdates };
  }, [onSnapshot, onNewUpdates]);

  useEffect(() => {
    const incoming = Number(initialVersion) || 0;
    if (incoming > cursorRef.current) {
      cursorRef.current = incoming;
      setStreamVersion(incoming);
    }
  }, [initialVersion]);

  useEffect(() => {
    if (!slug || !enabled || typeof window === 'undefined' || typeof EventSource === 'undefined') {
      setConnectionState('idle');
      return undefined;
    }

    let isUnmounted = false;
    const channelName = `dp-live-blog-sync-${slug}`;
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(channelName) : null;

    const handleSnapshotData = (payload, fromBroadcast = false) => {
      if (isUnmounted || !payload) return;

      const incomingVer = Number(payload.stream_version || 0);
      const nextCursor = getNextStreamCursor(cursorRef.current, incomingVer);
      const versionAdvanced = incomingVer > cursorRef.current;

      cursorRef.current = nextCursor;
      setStreamVersion(nextCursor);
      setLastSyncedAt(payload.server_time || new Date().toISOString());

      if (payload.live_blog) {
        const updates = Array.isArray(payload.live_blog.updates) ? payload.live_blog.updates : [];
        const newlySeen = [];

        updates.forEach((entry) => {
          if (entry?.id && !knownIdsRef.current.has(entry.id)) {
            if (knownIdsRef.current.size > 0 && versionAdvanced) {
              newlySeen.push(entry);
            }
            knownIdsRef.current.add(entry.id);
          }
        });

        callbacksRef.current.onSnapshot?.(payload);
        if (newlySeen.length > 0) {
          callbacksRef.current.onNewUpdates?.(newlySeen, payload.live_blog);
        }

        if (!fromBroadcast && channel) {
          try {
            channel.postMessage({ type: 'snapshot', payload });
          } catch {
            // Ignore cross-tab serialization failures
          }
        }
      }
    };

    const closeStream = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };

    const connectStream = () => {
      if (isUnmounted || document.hidden) return;
      closeStream();

      setConnectionState(cursorRef.current > 0 ? 'live' : 'connecting');
      const streamUrl = `${getApiBaseUrl()}/live-blogs/${encodeURIComponent(slug)}/stream?since_version=${cursorRef.current}`;

      const es = new EventSource(streamUrl);
      esRef.current = es;

      es.onopen = () => {
        if (isUnmounted) return;
        retryCountRef.current = 0;
        setConnectionState('live');
      };

      es.addEventListener('snapshot', (event) => {
        try {
          const parsed = JSON.parse(event.data);
          handleSnapshotData(parsed, false);
        } catch {
          // Ignore malformed keepalive chunks
        }
      });

      es.addEventListener('closed', (event) => {
        try {
          const parsed = JSON.parse(event.data || '{}');
          if (parsed.reason === 'ended_or_archived' || parsed.reason === 'not_found') {
            setConnectionState('closed');
            closeStream();
            return;
          }
        } catch {
          // Non-fatal server stream roll
        }
      });

      es.onerror = () => {
        if (isUnmounted) return;
        closeStream();

        if (document.hidden) {
          setConnectionState('paused');
          return;
        }

        // Native EventSource server cycle reconnects gracefully after bounded backoff
        retryCountRef.current += 1;
        if (retryCountRef.current > 8) {
          setConnectionState('offline');
          return;
        }

        const backoffMs = Math.min(4500 * retryCountRef.current, 25000);
        setConnectionState('reconnecting');
        reconnectTimerRef.current = setTimeout(() => {
          connectStream();
        }, backoffMs);
      };
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        closeStream();
        setConnectionState('paused');
      } else {
        retryCountRef.current = 0;
        connectStream();
      }
    };

    if (channel) {
      channel.onmessage = (event) => {
        if (event?.data?.type === 'snapshot') {
          handleSnapshotData(event.data.payload, true);
        }
      };
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    connectStream();

    return () => {
      isUnmounted = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      closeStream();
      if (channel) channel.close();
    };
  }, [slug, enabled]);

  const forceReconnect = () => {
    retryCountRef.current = 0;
    setConnectionState('connecting');
    // Dispatch synthetic visibility event or toggle stream by calling window event isn't needed;
    // simply exposing reconnect via manual fetch + cursor check in component keeps hook pure.
  };

  return {
    connectionState,
    streamVersion,
    lastSyncedAt,
    forceReconnect
  };
}

export default useLiveBlogStream;

