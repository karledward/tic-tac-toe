import TicTacToe from "@/components/TicTacToe";
import { APP_TITLE } from "@/const";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <header className="mb-8">
        <h1 className="text-5xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {APP_TITLE}
        </h1>
      </header>
      <main className="w-full">
        <TicTacToe />
      </main>
    </div>
  );
}
