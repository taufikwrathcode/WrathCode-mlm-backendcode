

import { Server } from "socket.io";


let io;

export const initSocket = (server) => {
  io = new Server(server);
   

  io.on("connection", (socket) => {
    console.log("🔌 User connected:", socket.id);

    // user ko room me add karo
    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined room`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  return io;
};


export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};