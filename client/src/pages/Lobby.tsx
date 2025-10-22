import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Lobby() {
  const [, setLocation] = useLocation();
  const [roomName, setRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { data: availableRooms, refetch } = trpc.room.getAvailable.useQuery(undefined, {
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  const createRoomMutation = trpc.room.create.useMutation({
    onSuccess: (room) => {
      toast.success("Room created successfully!");
      setLocation(`/game/${room?.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create room: ${error.message}`);
    },
  });

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }

    createRoomMutation.mutate({ name: roomName });
  };

  const handleJoinRoom = (roomId: string) => {
    setLocation(`/game/${roomId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="p-6 flex justify-between items-center">
        <h1 className="text-4xl font-bold text-blue-600">Tic Tac Toe - Multiplayer Lobby</h1>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setLocation("/")}>
            Back to Single Player
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Room Section */}
          <Card>
            <CardHeader>
              <CardTitle>Create a New Room</CardTitle>
              <CardDescription>Start a new game and wait for an opponent to join</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomName">Room Name</Label>
                <Input
                  id="roomName"
                  placeholder="Enter room name..."
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateRoom();
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleCreateRoom}
                disabled={createRoomMutation.isPending || !roomName.trim()}
                className="w-full"
              >
                {createRoomMutation.isPending ? "Creating..." : "Create Room"}
              </Button>
            </CardContent>
          </Card>

          {/* Available Rooms Section */}
          <Card>
            <CardHeader>
              <CardTitle>Available Rooms</CardTitle>
              <CardDescription>Join an existing game room</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {!availableRooms || availableRooms.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No rooms available. Create one to get started!
                  </p>
                ) : (
                  availableRooms.map((room) => (
                    <Card key={room.id} className="border-2 hover:border-blue-400 transition-colors">
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-lg">{room.name}</h3>
                          <p className="text-sm text-gray-600">
                            Waiting for opponent...
                          </p>
                        </div>
                        <Button onClick={() => handleJoinRoom(room.id)}>Join</Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

