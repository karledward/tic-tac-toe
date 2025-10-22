import MultiplayerGame from "@/components/MultiplayerGame";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";

export default function GameRoom() {
  const params = useParams<{ roomId: string }>();
  const [, setLocation] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();

  if (!user) {
    setLocation("/auth");
    return null;
  }

  if (!params.roomId) {
    setLocation("/lobby");
    return null;
  }

  return <MultiplayerGame roomId={params.roomId} userId={user.id} />;
}

