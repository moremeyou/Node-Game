function getSocketReadyStateName(socket) {
  if (!socket) return 'disconnected';

  switch (socket.readyState) {
    case WebSocket.CONNECTING:
      return 'connecting';
    case WebSocket.OPEN:
      return 'connected';
    case WebSocket.CLOSING:
      return 'closing';
    case WebSocket.CLOSED:
    default:
      return 'disconnected';
  }
}

export function createNetworkController({
  getUrl,
  getNow,
  getReconnectDelayMs,
  getSendIntervalMs,
  onSnapshot,
  onMessage,
  onRemoteStateReset,
  onServerReset,
}) {
  const state = {
    socket: null,
    status: 'disconnected',
    roomId: null,
    serverPlayerId: null,
    playerCount: 1,
    shareUrl: '-',
    shouldReconnect: true,
    reconnectTimer: null,
    lastPlayerStateSentAt: 0,
  };

  function buildSnapshot() {
    return {
      status: state.status,
      roomId: state.roomId,
      serverPlayerId: state.serverPlayerId,
      playerCount: state.playerCount,
      shareUrl: state.shareUrl,
    };
  }

  function emitSnapshot() {
    if (typeof onSnapshot === 'function') {
      onSnapshot(buildSnapshot());
    }
  }

  function setStatus(status) {
    state.status = status;
    emitSnapshot();
  }

  function clearRoomSession() {
    state.roomId = null;
    state.serverPlayerId = null;
    state.playerCount = 1;
    emitSnapshot();
  }

  function scheduleReconnect() {
    if (!state.shouldReconnect) {
      return;
    }

    if (state.reconnectTimer) {
      return;
    }

    const socket = state.socket;
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    state.reconnectTimer = window.setTimeout(() => {
      state.reconnectTimer = null;
      connect();
    }, Math.max(250, Number(getReconnectDelayMs()) || 0));
  }

  function disconnect({ manual = false } = {}) {
    state.shouldReconnect = !manual;

    if (state.reconnectTimer) {
      window.clearTimeout(state.reconnectTimer);
      state.reconnectTimer = null;
    }

    const socket = state.socket;
    state.socket = null;

    if (socket && (
      socket.readyState === WebSocket.OPEN
      || socket.readyState === WebSocket.CONNECTING
    )) {
      socket.close(1000, manual ? 'manual-disconnect' : 'reconnect');
    }

    setStatus('disconnected');
    clearRoomSession();

    if (typeof onRemoteStateReset === 'function') {
      onRemoteStateReset();
    }
  }

  function connect({ force = false } = {}) {
    if (force) {
      disconnect({ manual: false });
    }

    const existing = state.socket;
    if (existing && (
      existing.readyState === WebSocket.OPEN
      || existing.readyState === WebSocket.CONNECTING
    )) {
      setStatus(getSocketReadyStateName(existing));
      return;
    }

    const url = String(getUrl() || '').trim();
    if (!url) {
      setStatus('no-url');
      return;
    }

    state.shouldReconnect = true;
    setStatus('connecting');

    const socket = new WebSocket(url);
    state.socket = socket;

    socket.addEventListener('open', () => {
      if (state.socket !== socket) {
        return;
      }

      state.lastPlayerStateSentAt = 0;
      setStatus('connected');
    });

    socket.addEventListener('message', (event) => {
      let message = null;

      try {
        message = JSON.parse(event.data);
      } catch (error) {
        console.warn('Invalid network message:', error);
        return;
      }

      switch (message.type) {
        case 'welcome':
          state.serverPlayerId = message.playerId || null;
          state.roomId = message.roomId || null;
          state.playerCount = 1;
          if (message.shareUrl) {
            state.shareUrl = message.shareUrl;
          }
          state.status = 'connected';
          emitSnapshot();
          break;

        case 'room_info':
          if (message.roomId) {
            state.roomId = message.roomId;
          }
          if (Number.isFinite(message.playerCount)) {
            state.playerCount = message.playerCount;
          }
          emitSnapshot();
          break;

        case 'room_state':
          if (message.roomId) {
            state.roomId = message.roomId;
          }
          if (Number.isFinite(message.playerCount)) {
            state.playerCount = message.playerCount;
          }
          emitSnapshot();
          break;

        case 'server_reset':
          state.shouldReconnect = false;
          state.status = 'resetting';
          emitSnapshot();
          if (typeof onServerReset === 'function') {
            onServerReset();
          }
          return;

        default:
          break;
      }

      if (typeof onMessage === 'function') {
        onMessage(message, buildSnapshot());
      }
    });

    socket.addEventListener('close', () => {
      if (state.socket === socket) {
        state.socket = null;
      }

      setStatus('disconnected');
      clearRoomSession();

      if (typeof onRemoteStateReset === 'function') {
        onRemoteStateReset();
      }

      scheduleReconnect();
    });

    socket.addEventListener('error', () => {
      setStatus('error');
    });
  }

  function sendMessage(message) {
    const socket = state.socket;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    socket.send(JSON.stringify(message));
    return true;
  }

  function sendPlayerState(player, { force = false } = {}) {
    const socket = state.socket;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    const now = Number(getNow()) || 0;
    if (!force && now - state.lastPlayerStateSentAt < (Number(getSendIntervalMs()) || 0)) {
      return false;
    }

    state.lastPlayerStateSentAt = now;
    return sendMessage({
      type: 'player_state',
      player,
    });
  }

  function requestServerReset() {
    return sendMessage({ type: 'reset_server' });
  }

  function destroy() {
    disconnect({ manual: true });
  }

  emitSnapshot();

  return {
    connect,
    destroy,
    disconnect,
    getSnapshot: buildSnapshot,
    requestServerReset,
    sendPlayerState,
  };
}
