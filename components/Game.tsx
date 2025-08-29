"use client";

import { useEffect, useRef } from "react";

export default function Game({ onGameOver }: { onGameOver: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    // Canvas & world
    const WIDTH = 960;
    const HEIGHT = 360;
    const GROUND_Y = HEIGHT - 20;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    // Tuning knobs (adjust these if you want it harder/easier)
    const INITIAL_SPEED = 9;            // was 6
    const SPEED_GAIN_PER_OBSTACLE = 0.6; // was 0.25
    const CONTINUOUS_ACCEL = 0.002;     // small per-frame acceleration
    const MAX_SPEED = 20;               // was 14
    const MIN_GAP = 220;                // min distance before next obstacle AFTER the right edge
    const MAX_GAP = 420;                // max distance

    const PLAYER_SIZE = 32;
    const PLAYER_X = 60;
    const gravity = 0.9;
    const jump = -18;

    const obstacleW = 32;
    const obstacleH = 48;

    ctx.font = "14px monospace";
    ctx.fillStyle = "white";
    ctx.textBaseline = "top";

    let raf = 0;

    // State kept inside effect
    let y = GROUND_Y;
    let vy = 0;
    let obstacleX = WIDTH + 200;
    let speed = INITIAL_SPEED;
    let score = 0;

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const nextSpawnX = () => WIDTH + Math.round(rand(MIN_GAP, MAX_GAP));

    function reset() {
      y = GROUND_Y;
      vy = 0;
      obstacleX = nextSpawnX();
      speed = INITIAL_SPEED;
      score = 0;
    }

    function draw() {
      // background
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // ground
      ctx.fillStyle = "white";
      ctx.fillRect(0, GROUND_Y, WIDTH, 2);

      // player
      ctx.fillRect(PLAYER_X, y - PLAYER_SIZE, PLAYER_SIZE, PLAYER_SIZE);

      // obstacle
      ctx.fillRect(obstacleX, GROUND_Y - obstacleH, obstacleW, obstacleH);

      // HUD
      ctx.fillText(`Score: ${score}`, 10, 8);

      // physics
      vy += gravity;
      y += vy;
      if (y > GROUND_Y) { y = GROUND_Y; vy = 0; }

      // movement & difficulty ramp
      speed = Math.min(MAX_SPEED, speed + CONTINUOUS_ACCEL);
      obstacleX -= speed;

      // respawn: ALWAYS from (right edge + gap)
      if (obstacleX + obstacleW < 0) {
        obstacleX = nextSpawnX();
        speed = Math.min(MAX_SPEED, speed + SPEED_GAIN_PER_OBSTACLE);
        score += 1;
      }

      // collision
      const px = PLAYER_X, pw = PLAYER_SIZE, ph = PLAYER_SIZE, py = y - PLAYER_SIZE;
      const ox = obstacleX, ow = obstacleW, oh = obstacleH, oy = GROUND_Y - obstacleH;
      const hit = px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy;

      if (hit) {
        runningRef.current = false;
        onGameOver(score);
        return;
      }

      if (runningRef.current) raf = requestAnimationFrame(draw);
    }

    function handleKey(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (!runningRef.current) {
          reset();
          runningRef.current = true;
          if (vy === 0) vy = jump; // jump on first press
          requestAnimationFrame(draw);
        } else {
          if (y >= GROUND_Y - 0.5) vy = jump;
        }
      }
    }

    window.addEventListener("keydown", handleKey);

    // idle screen
    ctx.fillStyle = "white";
    ctx.fillText(
      "Press Space or ↑ to start / jump",
      Math.round(WIDTH / 2 - 160),
      Math.round(HEIGHT / 2 - 8)
    );

    return () => {
      window.removeEventListener("keydown", handleKey);
      cancelAnimationFrame(raf);
      runningRef.current = false;
    };
  }, [onGameOver]);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <canvas
        ref={canvasRef}
        style={{ border: "1px solid #333", width: 960, height: 360 }}
      />
      <p style={{ margin: 0, opacity: 0.7, fontSize: 12 }}>Space or ↑ to start/jump</p>
    </div>
  );
}
