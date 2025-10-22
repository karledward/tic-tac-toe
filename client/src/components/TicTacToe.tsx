import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Player = "X" | "O" | null;

export default function TicTacToe() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X");
  const [winner, setWinner] = useState<Player | "draw" | null>(null);

  const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  const checkWinner = (currentBoard: Player[]): Player | "draw" | null => {
    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (
        currentBoard[a] &&
        currentBoard[a] === currentBoard[b] &&
        currentBoard[a] === currentBoard[c]
      ) {
        return currentBoard[a];
      }
    }

    if (currentBoard.every((cell) => cell !== null)) {
      return "draw";
    }

    return null;
  };

  const handleClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const gameResult = checkWinner(newBoard);
    if (gameResult) {
      setWinner(gameResult);
    } else {
      setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setWinner(null);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Tic Tac Toe</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center text-lg font-semibold">
          {winner
            ? winner === "draw"
              ? "It's a Draw!"
              : `Player ${winner} Wins!`
            : `Current Player: ${currentPlayer}`}
        </div>

        <div className="grid grid-cols-3 gap-2 aspect-square">
          {board.map((cell, index) => (
            <button
              key={index}
              onClick={() => handleClick(index)}
              className="aspect-square border-2 border-border rounded-lg hover:bg-accent transition-colors flex items-center justify-center text-4xl font-bold disabled:cursor-not-allowed"
              disabled={!!cell || !!winner}
            >
              {cell}
            </button>
          ))}
        </div>

        <Button onClick={resetGame} className="w-full" size="lg">
          New Game
        </Button>
      </CardContent>
    </Card>
  );
}

