"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  PauseIcon,
  PlayIcon,
  RefreshCcwIcon,
  KeyboardIcon,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

enum GameState {
  START,
  PAUSE,
  RUNNING,
  GAME_OVER,
}

enum Direction {
  UP,
  DOWN,
  LEFT,
  RIGHT,
}

interface Position {
  x: number;
  y: number;
}

const GRID_SIZE = 10;

const initialSnake: Position[] = [{ x: 0, y: 0 }];
const initialFood: Position = { x: 5, y: 5 };

export default function SnakeGame() {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [snake, setSnake] = useState<Position[]>(initialSnake);
  const [food, setFood] = useState<Position>(initialFood);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // FIX 2: Use refs for direction + food + gameState so interval never has stale values
  const directionRef = useRef<Direction>(Direction.RIGHT);
  const foodRef = useRef<Position>(initialFood);
  const gameStateRef = useRef<GameState>(GameState.START);
  const snakeRef = useRef<Position[]>(initialSnake);

  const gameInterval = useRef<NodeJS.Timeout | null>(null);

  // Touch refs for mobile swipe
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const setDirection = (dir: Direction) => {
    directionRef.current = dir;
  };

  // FIX 2: moveSnake reads from refs — zero stale closure, snake grows correctly
  const moveSnake = useCallback(() => {
    const prev = snakeRef.current;
    const head = prev[0];
    let newHead: Position;

    switch (directionRef.current) {
      case Direction.UP:
        newHead = { x: head.x, y: head.y - 1 };
        break;
      case Direction.DOWN:
        newHead = { x: head.x, y: head.y + 1 };
        break;
      case Direction.LEFT:
        newHead = { x: head.x - 1, y: head.y };
        break;
      case Direction.RIGHT:
      default:
        newHead = { x: head.x + 1, y: head.y };
        break;
    }

    // Wall collision
    if (
      newHead.x < 0 ||
      newHead.x >= GRID_SIZE ||
      newHead.y < 0 ||
      newHead.y >= GRID_SIZE
    ) {
      setGameState(GameState.GAME_OVER);
      gameStateRef.current = GameState.GAME_OVER;
      return;
    }

    // Self collision
    if (prev.some((p) => p.x === newHead.x && p.y === newHead.y)) {
      setGameState(GameState.GAME_OVER);
      gameStateRef.current = GameState.GAME_OVER;
      return;
    }

    const ateFood =
      newHead.x === foodRef.current.x && newHead.y === foodRef.current.y;

    // Grow if ate food, else trim tail
    const next = ateFood ? [newHead, ...prev] : [newHead, ...prev.slice(0, -1)];

    if (ateFood) {
      const newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      foodRef.current = newFood;
      setFood(newFood);
      setScore((s) => s + 1);
    }

    snakeRef.current = next;
    setSnake([...next]);
  }, []);

  // Keyboard controls
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (gameStateRef.current !== GameState.RUNNING) return;
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        if (directionRef.current !== Direction.DOWN) setDirection(Direction.UP);
        break;
      case "ArrowDown":
        e.preventDefault();
        if (directionRef.current !== Direction.UP) setDirection(Direction.DOWN);
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (directionRef.current !== Direction.RIGHT) setDirection(Direction.LEFT);
        break;
      case "ArrowRight":
        e.preventDefault();
        if (directionRef.current !== Direction.LEFT) setDirection(Direction.RIGHT);
        break;
    }
  }, []);

  // Mobile: swipe on game area
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (
      touchStartX.current === null ||
      touchStartY.current === null ||
      gameStateRef.current !== GameState.RUNNING
    ) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && directionRef.current !== Direction.LEFT) setDirection(Direction.RIGHT);
      else if (dx < 0 && directionRef.current !== Direction.RIGHT) setDirection(Direction.LEFT);
    } else {
      if (dy > 0 && directionRef.current !== Direction.UP) setDirection(Direction.DOWN);
      else if (dy < 0 && directionRef.current !== Direction.DOWN) setDirection(Direction.UP);
    }
  }, []);

  // Mobile: D-pad buttons
  const handleDpad = (dir: Direction) => {
    if (gameStateRef.current !== GameState.RUNNING) return;
    const cur = directionRef.current;
    if (dir === Direction.UP && cur !== Direction.DOWN) setDirection(Direction.UP);
    if (dir === Direction.DOWN && cur !== Direction.UP) setDirection(Direction.DOWN);
    if (dir === Direction.LEFT && cur !== Direction.RIGHT) setDirection(Direction.LEFT);
    if (dir === Direction.RIGHT && cur !== Direction.LEFT) setDirection(Direction.RIGHT);
  };

  // Game loop
  useEffect(() => {
    if (gameState === GameState.RUNNING) {
      gameInterval.current = setInterval(moveSnake, 180);
      document.addEventListener("keydown", handleKeyPress);
    } else {
      if (gameInterval.current) clearInterval(gameInterval.current);
      document.removeEventListener("keydown", handleKeyPress);
    }
    return () => {
      if (gameInterval.current) clearInterval(gameInterval.current);
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [gameState, moveSnake, handleKeyPress]);

  // ▶ START
  const startGame = () => {
    snakeRef.current = initialSnake;
    foodRef.current = initialFood;
    directionRef.current = Direction.RIGHT;
    setSnake(initialSnake);
    setFood(initialFood);
    setScore(0);
    setGameState(GameState.RUNNING);
    gameStateRef.current = GameState.RUNNING;
  };

  // ⏸ PAUSE / RESUME
  const togglePause = () => {
    if (gameState === GameState.RUNNING) {
      setGameState(GameState.PAUSE);
      gameStateRef.current = GameState.PAUSE;
    } else if (gameState === GameState.PAUSE) {
      setGameState(GameState.RUNNING);
      gameStateRef.current = GameState.RUNNING;
    }
  };

  // 🔄 RESET
  const resetGame = () => {
    snakeRef.current = initialSnake;
    foodRef.current = initialFood;
    directionRef.current = Direction.RIGHT;
    setGameState(GameState.START);
    gameStateRef.current = GameState.START;
    setSnake(initialSnake);
    setFood(initialFood);
    setScore(0);
    setHighScore(0);
  };

  // 🏆 HIGH SCORE
  useEffect(() => {
    if (score > highScore) setHighScore(score);
  }, [score, highScore]);

  // FIX 1: isGameActive used to show correct buttons — no two play buttons
  const isGameActive = gameState === GameState.RUNNING || gameState === GameState.PAUSE;

  return (
    // Original UI — untouched. Only mobile touch handlers added on wrapper.
    <div
      className="min-h-screen bg-gradient-to-br from-black via-[#0F0F0F] to-[#1E1E1E] flex items-center justify-center px-6"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] gap-6">

        {/* LEFT PANEL — original, untouched */}
        <div className="hidden lg:flex flex-col gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <h3 className="text-[#FF00FF] font-bold text-xl">Controls</h3>
          <div className="text-sm text-cyan-300 space-y-2">
            <p className="flex items-center gap-2">
              <KeyboardIcon size={16} /> Arrow Keys
            </p>
            <p>▶ Start</p>
            <p>⏸ Pause / Resume</p>
            <p>⟳ Reset</p>
          </div>
        </div>

        {/* GAME BOARD — original, untouched */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-[0_0_40px_#00ffff20]">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-[#FF00FF]">
              Snake Game
            </h1>
            <span className="px-3 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {GameState[gameState]}
            </span>
          </div>

          {/* GRID — original, untouched */}
          <div className="relative grid grid-cols-10 gap-1 bg-black/40 p-4 rounded-lg justify-center">
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              const x = i % GRID_SIZE;
              const y = Math.floor(i / GRID_SIZE);
              const isHead = snake[0]?.x === x && snake[0]?.y === y;
              const isSnake = snake.some((p) => p.x === x && p.y === y);
              const isFood = food.x === x && food.y === y;
              return (
                <div
                  key={i}
                  className={`rounded-sm transition-all
                    ${isHead && "bg-pink-500 shadow-[0_0_10px_#ff00ff]"}
                    ${!isHead && isSnake && "bg-[#FF00FF]"}
                    ${isFood && "bg-cyan-400 animate-pulse"}
                    ${!isSnake && !isFood && "bg-[#1E1E1E]"}
                    w-6 h-6 lg:w-8 lg:h-8
                  `}
                />
              );
            })}

            {/* GAME OVER OVERLAY — original, untouched */}
            {gameState === GameState.GAME_OVER && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10">
                <h2 className="text-4xl font-extrabold text-red-500 mb-4">
                  GAME OVER
                </h2>
                <p className="text-cyan-300 mb-2">
                  Score: <span className="font-bold">{score}</span>
                </p>
                <p className="text-cyan-300 mb-6">
                  High Score: <span className="font-bold">{highScore}</span>
                </p>
                <Button onClick={startGame} className="px-6 py-2 text-lg">
                  Restart Game
                </Button>
              </div>
            )}
          </div>

          {/* FIX 1: BUTTONS — same position, same size, same style as original
              Only logic changed: Start shows when no active game, Pause/Resume when active.
              Reset always visible. No two play icons at same time. */}
          <div className="flex justify-center gap-4 mt-6">
            {/* Start button — only when game not active */}
            {!isGameActive && (
              <Button size="icon" onClick={startGame} title="Start">
                <PlayIcon />
              </Button>
            )}
            {/* Pause/Resume — only when game is active */}
            {isGameActive && (
              <Button size="icon" onClick={togglePause} title={gameState === GameState.RUNNING ? "Pause" : "Resume"}>
                {gameState === GameState.RUNNING ? <PauseIcon /> : <PlayIcon />}
              </Button>
            )}
            {/* Reset — always visible */}
            <Button size="icon" onClick={resetGame} title="Reset">
              <RefreshCcwIcon />
            </Button>
          </div>

          {/* MOBILE D-PAD — only visible on mobile (lg:hidden), desktop me nahi dikhega */}
          <div className="mt-5 flex flex-col items-center gap-2 lg:hidden select-none">
            <p className="text-xs text-cyan-300/50 mb-1">D-pad / Swipe to control</p>
            <button
              onTouchStart={(e) => { e.stopPropagation(); handleDpad(Direction.UP); }}
              onClick={() => handleDpad(Direction.UP)}
              className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center active:bg-white/30 text-white touch-manipulation"
              aria-label="Up"
            >
              <ChevronUp size={24} />
            </button>
            <div className="flex gap-2">
              <button
                onTouchStart={(e) => { e.stopPropagation(); handleDpad(Direction.LEFT); }}
                onClick={() => handleDpad(Direction.LEFT)}
                className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center active:bg-white/30 text-white touch-manipulation"
                aria-label="Left"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onTouchStart={(e) => { e.stopPropagation(); handleDpad(Direction.DOWN); }}
                onClick={() => handleDpad(Direction.DOWN)}
                className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center active:bg-white/30 text-white touch-manipulation"
                aria-label="Down"
              >
                <ChevronDown size={24} />
              </button>
              <button
                onTouchStart={(e) => { e.stopPropagation(); handleDpad(Direction.RIGHT); }}
                onClick={() => handleDpad(Direction.RIGHT)}
                className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center active:bg-white/30 text-white touch-manipulation"
                aria-label="Right"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — original, untouched */}
        <div className="hidden lg:flex flex-col gap-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div>
            <p className="text-cyan-300 text-sm">Score</p>
            <p className="text-3xl font-bold text-white">{score}</p>
          </div>
          <div>
            <p className="text-cyan-300 text-sm">High Score</p>
            <p className="text-3xl font-bold text-white">{highScore}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
