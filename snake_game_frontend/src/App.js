import React, { useEffect, useRef, useState } from "react";
import "./App.css";

/**
 * SNAKE GAME CONSTANTS & HELPERS
 */
const BOARD_SIZE = 20; // 20x20 grid
const INIT_SNAKE = [
  { x: 8, y: 10 },
  { x: 7, y: 10 },
];
const INIT_DIRECTION = "RIGHT";
const SPEEDS = [
  { label: "Slow", ms: 200 },
  { label: "Normal", ms: 100 },
  { label: "Fast", ms: 60 },
];
const COLOR_PRIMARY = "#228B22";
const COLOR_ACCENT = "#FFD700";
const COLOR_SNAKE = "#228B22";
const COLOR_BG = "#fff";
const COLOR_SECONDARY = "#000";
const COLOR_FOOD = "#FFD700";

// Direction helpers
const DIR = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};
const OPPOSITE = {
  UP: "DOWN",
  DOWN: "UP",
  LEFT: "RIGHT",
  RIGHT: "LEFT",
};

function getRandomCell(excludeCells = []) {
  let cell;
  do {
    cell = {
      x: Math.floor(Math.random() * BOARD_SIZE),
      y: Math.floor(Math.random() * BOARD_SIZE),
    };
  } while (excludeCells.some((c) => c.x === cell.x && c.y === cell.y));
  return cell;
}

/**
 * MAIN APP COMPONENT - SNAKE GAME
 *
 * UI: Modern, center-focused, light, minimal;
 * Features: Responsive board, keyboard steering, score & highscore, restart/game-over, speed selection.
 */
// PUBLIC_INTERFACE
function App() {
  // Game state
  const [snake, setSnake] = useState([...INIT_SNAKE]);
  const [direction, setDirection] = useState(INIT_DIRECTION);
  const [food, setFood] = useState(getRandomCell([...INIT_SNAKE]));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [tickSpeedIdx, setTickSpeedIdx] = useState(1); // default: Normal speed
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem("highscore")) || 0);

  // To prevent reversing direction in a single tick
  const lastDirection = useRef(direction);

  // Responsive cell size based on viewport
  const [cellPx, setCellPx] = useState(24);
  useEffect(() => {
    function handleResize() {
      // Board size caps at 90vw or 80vh
      const minViewport = Math.min(window.innerWidth * 0.95, window.innerHeight * 0.8);
      setCellPx(Math.floor(minViewport / BOARD_SIZE));
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keyboard controls
  useEffect(() => {
    function handleKey(e) {
      if (gameOver && (e.key === "r" || e.key === "R")) {
        restartGame();
        return;
      }
      let newDir = null;
      if (["ArrowUp", "w", "W"].includes(e.key)) newDir = "UP";
      else if (["ArrowDown", "s", "S"].includes(e.key)) newDir = "DOWN";
      else if (["ArrowLeft", "a", "A"].includes(e.key)) newDir = "LEFT";
      else if (["ArrowRight", "d", "D"].includes(e.key)) newDir = "RIGHT";
      if (newDir && OPPOSITE[newDir] !== lastDirection.current) setDirection(newDir);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line
  }, [gameOver]); // reset listeners on new game

  // Game tick effect
  useEffect(() => {
    if (gameOver) return; // Pause on game over
    const interval = setInterval(() => {
      moveSnake();
    }, SPEEDS[tickSpeedIdx].ms);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [snake, direction, gameOver, tickSpeedIdx]);

  // Save highscore when changed
  useEffect(() => {
    localStorage.setItem("highscore", highScore);
  }, [highScore]);

  // Move Snake logic
  function moveSnake() {
    const newHead = {
      x: snake[0].x + DIR[direction].x,
      y: snake[0].y + DIR[direction].y,
    };
    lastDirection.current = direction;

    // Collision checks
    // Wall
    if (
      newHead.x < 0 ||
      newHead.x >= BOARD_SIZE ||
      newHead.y < 0 ||
      newHead.y >= BOARD_SIZE
    ) {
      setGameOver(true);
      return;
    }
    // Self
    if (snake.some((cell) => cell.x === newHead.x && cell.y === newHead.y)) {
      setGameOver(true);
      return;
    }

    // Food
    let nextSnake;
    let gotFood = false;
    if (food.x === newHead.x && food.y === newHead.y) {
      gotFood = true;
      nextSnake = [newHead, ...snake];
      setFood(getRandomCell([newHead, ...snake]));
      setScore((s) => s + 1);
      if (score + 1 > highScore) setHighScore(score + 1);
    } else {
      nextSnake = [newHead, ...snake.slice(0, -1)];
    }

    setSnake(nextSnake);
  }

  // PUBLIC_INTERFACE
  function restartGame() {
    setSnake([...INIT_SNAKE]);
    setDirection(INIT_DIRECTION);
    setFood(getRandomCell([...INIT_SNAKE]));
    setScore(0);
    setGameOver(false);
    lastDirection.current = INIT_DIRECTION;
  }

  // PUBLIC_INTERFACE
  function handleSpeedChange(idx) {
    setTickSpeedIdx(idx);
  }

  // Drawing helpers
  function renderBoard() {
    const cells = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        let cellType = '';
        if (food.x === x && food.y === y) cellType = 'food';
        else if (snake[0].x === x && snake[0].y === y) cellType = 'snake-head';
        else if (snake.some((c, idx) => idx !== 0 && c.x === x && c.y === y))
          cellType = 'snake-body';

        cells.push(
          <div
            key={`cell-${x}-${y}`}
            className={`cell ${cellType}`}
            style={{
              width: `${cellPx}px`,
              height: `${cellPx}px`,
              background:
                cellType === 'food'
                  ? COLOR_FOOD
                  : cellType === 'snake-head'
                  ? `linear-gradient(135deg, ${COLOR_ACCENT}, ${COLOR_PRIMARY})`
                  : cellType === 'snake-body'
                  ? COLOR_SNAKE
                  : COLOR_BG,
              border: `1px solid #f0f0f0`,
              boxSizing: "border-box",
              borderRadius: cellType === "food" ? "50%" : "6px",
              transition: "background 0.15s",
            }}
          />
        );
      }
    }
    return cells;
  }

  // PUBLIC_INTERFACE
  return (
    <div className="snake-app-outer" style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "#fff",
    }}>
      <div className="score-speed-panel" style={{
        marginBottom: 18,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
      }}>
        <div style={{
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 7,
          color: COLOR_SECONDARY
        }}>
          Score: <span style={{ color: COLOR_PRIMARY }}>{score}</span>
          <span style={{ marginLeft: 16, fontWeight: 400, fontSize: 18, color: "#444" }}>
            High Score: <span style={{ color: COLOR_ACCENT }}>{highScore}</span>
          </span>
        </div>
        <div className="speed-selector" style={{ marginBottom: 2 }}>
          {SPEEDS.map((s, i) => (
            <button
              key={s.label}
              onClick={() => handleSpeedChange(i)}
              disabled={tickSpeedIdx === i}
              style={{
                background: tickSpeedIdx === i ? COLOR_ACCENT : "#efefef",
                color: tickSpeedIdx === i ? COLOR_SECONDARY : COLOR_PRIMARY,
                fontWeight: tickSpeedIdx === i ? 700 : 400,
                border: "none",
                padding: "7px 16px",
                margin: "0 5px",
                borderRadius: 8,
                cursor: tickSpeedIdx === i ? "default" : "pointer",
                fontSize: 15,
                outline: "none",
                boxShadow: tickSpeedIdx === i ? "0 2px 12px rgba(255,215,0,0.15)" : "none",
                transition: "all 0.1s"
              }}
              aria-label={`Set speed to ${s.label}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="game-board"
        tabIndex={0}
        style={{
          display: "grid",
          gridTemplateRows: `repeat(${BOARD_SIZE}, ${cellPx}px)`,
          gridTemplateColumns: `repeat(${BOARD_SIZE}, ${cellPx}px)`,
          border: `2.5px solid ${COLOR_PRIMARY}`,
          background: "#fafafa",
          boxShadow: "0 4px 24px rgba(0,0,0,0.10), 0 1.5px 0 rgba(34,139,34,0.18)",
          borderRadius: 20,
          position: "relative",
        }}
      >
        {renderBoard()}
        {gameOver && (
          <div className="game-over-overlay" style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            background: "rgba(255,255,255,0.85)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 18,
            zIndex: 10,
          }}>
            <div style={{ fontSize: 38, fontWeight: 800, color: COLOR_PRIMARY, marginBottom: 5 }}>Game Over</div>
            <div style={{ fontSize: 18, color: "#444", marginBottom: 16 }}>
              Final Score: <b style={{ color: COLOR_ACCENT }}>{score}</b>
            </div>
            <button
              style={{
                background: COLOR_ACCENT,
                color: COLOR_SECONDARY,
                border: "none",
                borderRadius: 8,
                fontSize: 18,
                padding: "8px 26px",
                fontWeight: 700,
                marginTop: 8,
                cursor: "pointer",
                transition: "opacity 0.2s"
              }}
              onClick={restartGame}
              aria-label="Restart Game"
            >
              Restart
            </button>
            <div style={{ marginTop: 11, fontSize: 13, color: "#bbb" }}>
              Press <b>R</b> to restart <span aria-label="keyboard">⌨️</span>
            </div>
          </div>
        )}
      </div>
      <div style={{
        marginTop: 28,
        color: "#888",
        fontSize: 14,
        maxWidth: 400,
        textAlign: "center"
      }}>
        <span style={{ color: COLOR_PRIMARY, fontWeight: 700 }}>Controls:</span>{" "}
        Use <kbd>W/A/S/D</kbd> or Arrow keys to move.
        <br />
        <span style={{ color: COLOR_ACCENT }}>Tip:</span> Try to beat your high score!<br />
        <span style={{ color: "#bbb" }}>Theme is always light, per project guidelines.</span>
      </div>
    </div>
  );
}

export default App;
