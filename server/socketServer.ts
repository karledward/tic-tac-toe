import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import * as db from "./db";
import { nanoid } from "nanoid";

export function setupSocketIO(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join a game room
    socket.on("joinRoom", async (data: { roomId: string; userId: string }) => {
      const { roomId, userId } = data;
      
      try {
        const room = await db.getGameRoom(roomId);
        
        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // Check if room is full
        if (room.guestId && room.guestId !== userId && room.hostId !== userId) {
          socket.emit("error", { message: "Room is full" });
          return;
        }

        // If user is not the host and room is waiting, add them as guest
        if (room.hostId !== userId && !room.guestId && room.status === "waiting") {
          await db.updateGameRoom(roomId, {
            guestId: userId,
            status: "playing",
          });
        }

        socket.join(roomId);
        socket.emit("roomJoined", { roomId });

        // Broadcast updated room state to all clients in the room
        const updatedRoom = await db.getGameRoom(roomId);
        io.to(roomId).emit("roomUpdate", updatedRoom);
        
        console.log(`[Socket.IO] User ${userId} joined room ${roomId}`);
      } catch (error) {
        console.error("[Socket.IO] Error joining room:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // Make a move in the game
    socket.on("makeMove", async (data: { roomId: string; userId: string; index: number }) => {
      const { roomId, userId, index } = data;

      try {
        const room = await db.getGameRoom(roomId);

        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        if (room.status !== "playing") {
          socket.emit("error", { message: "Game is not in progress" });
          return;
        }

        // Determine which player is making the move
        const isPlayerX = room.hostId === userId;
        const isPlayerO = room.guestId === userId;

        if (!isPlayerX && !isPlayerO) {
          socket.emit("error", { message: "You are not a player in this game" });
          return;
        }

        // Check if it's the player's turn
        const currentPlayer = isPlayerX ? "X" : "O";
        if (room.currentTurn !== currentPlayer) {
          socket.emit("error", { message: "It's not your turn" });
          return;
        }

        // Parse board state
        const board = JSON.parse(room.boardState);

        // Check if cell is empty
        if (board[index] !== "") {
          socket.emit("error", { message: "Cell is already occupied" });
          return;
        }

        // Make the move
        board[index] = currentPlayer;

        // Check for winner
        const winner = checkWinner(board);
        const isDraw = !winner && board.every((cell: string) => cell !== "");

        // Update room state
        const updates: any = {
          boardState: JSON.stringify(board),
          currentTurn: currentPlayer === "X" ? "O" : "X",
        };

        if (winner) {
          updates.status = "finished";
          updates.winnerId = winner === "X" ? room.hostId : room.guestId;
          
          // Save game result
          await db.createGame({
            id: nanoid(),
            playerXId: room.hostId!,
            playerOId: room.guestId!,
            winnerId: updates.winnerId,
            result: winner,
          });
        } else if (isDraw) {
          updates.status = "finished";
          
          // Save draw result
          await db.createGame({
            id: nanoid(),
            playerXId: room.hostId!,
            playerOId: room.guestId!,
            winnerId: null,
            result: "draw",
          });
        }

        await db.updateGameRoom(roomId, updates);

        // Broadcast updated room state to all clients in the room
        const updatedRoom = await db.getGameRoom(roomId);
        io.to(roomId).emit("roomUpdate", updatedRoom);

        if (winner) {
          io.to(roomId).emit("gameOver", { winner, winnerId: updates.winnerId });
        } else if (isDraw) {
          io.to(roomId).emit("gameOver", { winner: "draw" });
        }
      } catch (error) {
        console.error("[Socket.IO] Error making move:", error);
        socket.emit("error", { message: "Failed to make move" });
      }
    });

    // Leave room
    socket.on("leaveRoom", (data: { roomId: string }) => {
      const { roomId } = data;
      socket.leave(roomId);
      console.log(`[Socket.IO] Client ${socket.id} left room ${roomId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Helper function to check for a winner
function checkWinner(board: string[]): "X" | "O" | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as "X" | "O";
    }
  }

  return null;
}

