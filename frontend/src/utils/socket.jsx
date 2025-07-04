import { io } from "socket.io-client";

const getSocket = () => {
  const token = localStorage.getItem("whiteboard_user_token");
  
  return io("http://localhost:5000", {
    extraHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    auth: {
      token: token
    }
  });
};

const socket = getSocket();

// Reconnect with new token when token changes
window.addEventListener('storage', (e) => {
  if (e.key === 'whiteboard_user_token') {
    socket.disconnect();
    const newSocket = getSocket();
    Object.assign(socket, newSocket);
  }
});

export default socket;