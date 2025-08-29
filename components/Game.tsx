"use client";

import { useEffect, useRef } from "react";

export default function Game({ onGameOver }: { onGameOver: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runningRef = useRef(false);

  // asset refs
  const assetsReadyRef = useRef(false);
  const playerImgRef = useRef<HTMLImageElement | null>(null);
  const obstacleImgsRef = useRef<HTMLImageElement[]>([]);
  const baseScaleRef = useRef(1);


  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    const pickRandom = (len: number) => Math.floor(Math.random() * Math.max(1, len));

    // Canvas & world
    const WIDTH = 960;
    const HEIGHT = 360;
    const GROUND_Y = HEIGHT - 20;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    // Difficulty / pacing
    const INITIAL_SPEED = 10.5;        // start a bit faster
    const CONTINUOUS_ACCEL = 0.003;     // tiny per-frame nudge
    const SPEED_GAIN_PER_OBSTACLE = 0.7; // step up each hurdle
    // const MAX_SPEED = 22;                 // allow a higher ceiling OLD
    const MIN_GAP = 200;                  // slightly tighter spacing
    const MAX_GAP = 360;


    // Late-game softening (kicks in after score >= 35)
    const LATE_SOFTEN_START = 25;
    const LATE_CONT_ACCEL_MULT = 0.5;   // scales the per-frame accel
    const LATE_STEP_MULT = 0.45;        // scales the per-obstacle step



    // Obstacle width
    const OBSTACLE_WIDTH_MULT = 1.15; // try 1.05–1.3


    // Player render size (keep your tuned values)
    const PLAYER_W = 70;
    const PLAYER_H = 84;
    const PLAYER_X = 60;

    // Optional: shrink hitboxes slightly (1 = exact image bounds)
    const HITBOX_SHRINK = 1.0;

    const gravity = 1.5;
    const jump = -26;

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
    let obstacleIdx = 0; // index into obstacleImgsRef.current

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const nextSpawnX = () => WIDTH + Math.round(rand(MIN_GAP, MAX_GAP));

    function reset() {
      y = GROUND_Y;
      vy = 0;
      obstacleX = nextSpawnX();
      speed = INITIAL_SPEED;
      score = 0;
      obstacleIdx = pickRandom(obstacleImgsRef.current.length);
    }

    function draw() {
      // background
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // ground
      ctx.fillStyle = "white";
      ctx.fillRect(0, GROUND_Y, WIDTH, 2);

      // ----- PLAYER -----
      const pImg = playerImgRef.current;
      const playerDrawX = PLAYER_X;
      const playerDrawY = y - PLAYER_H;
      if (assetsReadyRef.current && pImg) {
        ctx.drawImage(pImg, playerDrawX, playerDrawY, PLAYER_W, PLAYER_H);
      } else {
        ctx.fillStyle = "white";
        ctx.fillRect(playerDrawX, playerDrawY, PLAYER_W, PLAYER_H);
      }

      // ----- OBSTACLE (per-image size, scaled) -----
      const obsImgs = obstacleImgsRef.current;
      const img = assetsReadyRef.current && obsImgs.length ? obsImgs[obstacleIdx % obsImgs.length] : null;

      // Compute draw size from the image's intrinsic size
      let obW = 70, obH = 180; // fallback
      if (img) {
        const s = baseScaleRef.current;        // you already compute this after assets load
        obW = Math.round(img.naturalWidth * s * OBSTACLE_WIDTH_MULT); // <-- wider
        obH = Math.round(img.naturalHeight * s);                      // height unchanged
      }


      const obstacleDrawX = obstacleX;
      const obstacleDrawY = GROUND_Y - obH;

      if (img) {
        ctx.drawImage(img, obstacleDrawX, obstacleDrawY, obW, obH);
      } else {
        ctx.fillStyle = "white";
        ctx.fillRect(obstacleDrawX, obstacleDrawY, obW, obH);
      }

      // HUD
      ctx.fillStyle = "white";
      ctx.fillText(`Score: ${score}`, 10, 8);

      // ----- PHYSICS -----
      vy += gravity;
      y += vy;
      if (y > GROUND_Y) { y = GROUND_Y; vy = 0; }

      // movement & difficulty ramp
      // A) per-frame accel OLD
      // speed = Math.min(MAX_SPEED, speed + CONTINUOUS_ACCEL);
      // per-frame accel (flatten after threshold)
      const late = score >= LATE_SOFTEN_START;
      const contMult = late ? LATE_CONT_ACCEL_MULT : 1;
      speed += CONTINUOUS_ACCEL * contMult;
      obstacleX -= speed;

      // respawn at right edge + gap (use current obstacle width)
      if (obstacleX + obW < 0) {
        obstacleX = nextSpawnX();
        // B) extra boost after each obstacle OLD
        // speed = Math.min(MAX_SPEED, speed + SPEED_GAIN_PER_OBSTACLE); 
        // step up after each obstacle (also flattened late)
        const stepMult = late ? LATE_STEP_MULT : 1;
        speed += SPEED_GAIN_PER_OBSTACLE * stepMult;
        score += 1;
        obstacleIdx = pickRandom(obsImgs.length);
      }

      // ----- COLLISION (use scaled sizes; optionally shrink hitbox) -----
      const pHitW = PLAYER_W * HITBOX_SHRINK;
      const pHitH = PLAYER_H * HITBOX_SHRINK;
      const pHitX = playerDrawX + (PLAYER_W - pHitW) / 2;
      const pHitY = playerDrawY + (PLAYER_H - pHitH) / 2;

      const oHitW = obW * HITBOX_SHRINK;
      const oHitH = obH * HITBOX_SHRINK;
      const oHitX = obstacleDrawX + (obW - oHitW) / 2;
      const oHitY = obstacleDrawY + (obH - oHitH) / 2;

      const hit =
        pHitX < oHitX + oHitW &&
        pHitX + pHitW > oHitX &&
        pHitY < oHitY + oHitH &&
        pHitY + pHitH > oHitY;

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
        if (!assetsReadyRef.current) return;
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

    // ---- ASSET LOADING ----
    function loadImage(src: string) {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.src = src; // served from /public
        img.onload = () => resolve(img);
        img.onerror = reject;
      });
    }

    async function loadAssets() {
      const playerPath = "/sprites/h3lobot.png";
      const obstaclePaths = [
        "/sprites/1.png",
        "/sprites/2.png",
        "/sprites/3.png",
        "/sprites/4.png",
        "/sprites/5.png",
      ];

      try {
        const [player, ...obs] = await Promise.all([
          loadImage(playerPath),
          ...obstaclePaths.map(loadImage),
        ]);
        playerImgRef.current = player;
        obstacleImgsRef.current = obs;
        // Cap tallest obstacle to this height (tweak to taste)
        const TARGET_MAX_OBSTACLE_H = 155; // e.g., 120–160

        const maxNaturalH = Math.max(...obs.map(i => i.naturalHeight));
        baseScaleRef.current = TARGET_MAX_OBSTACLE_H / maxNaturalH;

        assetsReadyRef.current = true;

        // idle message after assets load
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = "white";
        ctx.fillText(
          "Press Space or ↑ to start / jump",
          Math.round(WIDTH / 2 - 160),
          Math.round(HEIGHT / 2 - 8)
        );
      } catch {
        assetsReadyRef.current = false; // fall back to rectangles (but we gate start anyway)
      }
    }

    // initial idle message
    ctx.fillStyle = "white";
    ctx.fillText(
      "Loading assets...",
      Math.round(WIDTH / 2 - 70),
      Math.round(HEIGHT / 2 - 8)
    );

    loadAssets();

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
