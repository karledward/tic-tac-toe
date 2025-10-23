import { useAuth } from "@/_core/hooks/useAuth";
import TicTacToe from "@/components/TicTacToe";
import { APP_TITLE } from "@/const";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/auth");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <header className="mb-8 flex items-center justify-between w-full max-w-md">
        <h1 className="text-5xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex-1">
          {APP_TITLE}
        </h1>
        <Button variant="outline" onClick={() => logout()}>
          Logout
        </Button>
      </header>
      <main className="w-full">
        <TicTacToe />
      </main>
    </div>
  );
}

