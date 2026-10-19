import { useEffect, useRef } from "react";
import { attachInput, aimFromPlayer, createInputState } from "../game/input";
import { drawArena, interpolateSnapshots } from "../game/renderer";

export default function ArenaCanvas({ snapshotRef, localId, sendInput, frozen }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const input = createInputState();
    input.mouseDown = false;

    const resize = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const emit = () => {
      if (frozen) return;
      const next = snapshotRef.current.next;
      const me = next?.players?.find((p) => p.id === localId);
      const payload = {
        up: input.up,
        down: input.down,
        left: input.left,
        right: input.right,
        aim: aimFromPlayer(input, me),
        fire: input.fire,
      };
      sendInput(payload);
    };

    const detach = attachInput(canvas, input, emit);
    const inputTimer = setInterval(emit, 33);

    let raf = 0;
    const loop = () => {
      const { prev, next } = snapshotRef.current;
      const interpolated = interpolateSnapshots(prev, next, Date.now());
      drawArena(ctx, interpolated, localId);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(inputTimer);
      detach();
      window.removeEventListener("resize", resize);
    };
  }, [frozen, localId, sendInput, snapshotRef]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full cursor-crosshair rounded-xl bg-[#070914]"
    />
  );
}
