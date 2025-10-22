import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface MultiplayerGameProps {
  roomId: string;
  userId: string;
}

type GameRoom = {
  id: string;
  name: string;
  hostId: string;
  guestId: string | null;
  status: "waiting" | "playing" | "finished";
  currentTurn: "X" | "O" | null;
  boardState: string;
  winnerId: string | null;
};

export default function MultiplayerGame({ roomId, userId }: MultiplayerGameProps) {
  const [, setLocation] = useLocation();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [board, setBoard] = useState<string[]>(Array(9).fill(""));

  const { data: roomData } = trpc.room.getById.useQuery({ roomId });

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io(window.location.origin, {
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("Connected to server");
      newSocket.emit("joinRoom", { roomId, userId });
    });

    newSocket.on("roomJoined", () => {
      console.log("Successfully joined room");
      toast.success("Joined game room!");
    });

    newSocket.on("roomUpdate", (updatedRoom: GameRoom) => {
      console.log("Room updated:", updatedRoom);
      setRoom(updatedRoom);
      setBoard(JSON.parse(updatedRoom.boardState));
    });

    newSocket.on("gameOver", (data: { winner: "X" | "O" | "draw"; winnerId?: string }) => {
      if (data.winner === "draw") {
        toast.info("Game ended in a draw!");
      } else {
        const isWinner = data.winnerId === userId;
        toast.success(isWinner ? "You won!" : `Player ${data.winner} wins!`);
      }
    });

    newSocket.on("error", (data: { message: string }) => {
      toast.error(data.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit("leaveRoom", { roomId });
      newSocket.disconnect();
    };
  }, [roomId, userId]);

  useEffect(() => {
    if (roomData) {
      setRoom(roomData);
      setBoard(JSON.parse(roomData.boardState));
    }
  }, [roomData]);

  const handleCellClick = (index: number) => {
    if (!socket || !room) return;

    if (room.status !== "playing") {
      toast.error("Game is not in progress");
      return;
    }

    if (board[index] !== "") {
      toast.error("Cell is already occupied");
      return;
    }

    const isPlayerX = room.hostId === userId;
    const isPlayerO = room.guestId === userId;
    const currentPlayer = isPlayerX ? "X" : "O";

    if (room.currentTurn !== currentPlayer) {
      toast.error("It's not your turn");
      return;
    }

    socket.emit("makeMove", { roomId, userId, index });
  };

  const handleBackToLobby = () => {
    setLocation("/lobby");
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8">
            <p className="text-lg">Loading game room...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPlayerX = room.hostId === userId;
  const isPlayerO = room.guestId === userId;
  const playerSymbol = isPlayerX ? "X" : isPlayerO ? "O" : "Spectator";
  const isMyTurn = (isPlayerX && room.currentTurn === "X") || (isPlayerO && room.currentTurn === "O");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">{room.name}</h1>
          <Button variant="outline" onClick={handleBackToLobby}>
            Back to Lobby
          </Button>
        </div>

        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              {room.status === "waiting" && "Waiting for opponent..."}
              {room.status === "playing" && (
                <span>
                  {isMyTurn ? "Your Turn" : `Player ${room.currentTurn}'s Turn`}
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    (You are {playerSymbol})
                  </span>
                </span>
              )}
              {room.status === "finished" && (
                <span>
                  {room.winnerId === userId
                    ? "You Won!"
                    : room.winnerId
                    ? "You Lost"
                    : "Draw!"}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            {/* Game Board */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-md">
              {board.map((cell, index) => (
                <button
                  key={index}
                  onClick={() => handleCellClick(index)}
                  disabled={room.status !== "playing" || !isMyTurn || cell !== ""}
                  className="aspect-square bg-white border-4 border-gray-300 rounded-lg text-5xl font-bold hover:bg-blue-50 disabled:hover:bg-white transition-colors flex items-center justify-center disabled:cursor-not-allowed"
                >
                  {cell}
                </button>
              ))}
            </div>

            {/* Game Info */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                Host (X): {room.hostId === userId ? "You" : "Opponent"}
              </p>
              <p className="text-sm text-gray-600">
                Guest (O): {room.guestId ? (room.guestId === userId ? "You" : "Opponent") : "Waiting..."}
              </p>
            </div>

            {room.status === "finished" && (
              <Button onClick={handleBackToLobby} className="w-full max-w-md">
                Back to Lobby
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

