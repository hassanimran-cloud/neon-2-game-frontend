export function createInputState() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    aim: 0,
    fire: false,
  };
}

export function attachInput(canvas, input, onChange) {
  const keys = new Set();

  const syncMove = () => {
    input.up = keys.has("KeyW") || keys.has("ArrowUp");
    input.down = keys.has("KeyS") || keys.has("ArrowDown");
    input.left = keys.has("KeyA") || keys.has("ArrowLeft");
    input.right = keys.has("KeyD") || keys.has("ArrowRight");
    input.fire = keys.has("Space") || input.mouseDown;
    onChange(input);
  };

  const onKeyDown = (e) => {
    keys.add(e.code);
    if (e.code === "Space") e.preventDefault();
    syncMove();
  };
  const onKeyUp = (e) => {
    keys.delete(e.code);
    syncMove();
  };
  const onMouseMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    input.mouseX = mx;
    input.mouseY = my;
    onChange(input);
  };
  const onMouseDown = (e) => {
    if (e.button === 0) {
      input.mouseDown = true;
      input.fire = true;
      onChange(input);
    }
  };
  const onMouseUp = (e) => {
    if (e.button === 0) {
      input.mouseDown = false;
      input.fire = keys.has("Space");
      onChange(input);
    }
  };
  const onBlur = () => {
    keys.clear();
    input.mouseDown = false;
    input.fire = false;
    input.up = input.down = input.left = input.right = false;
    onChange(input);
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("blur", onBlur);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    canvas.removeEventListener("mousemove", onMouseMove);
    canvas.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("blur", onBlur);
  };
}

export function aimFromPlayer(input, player) {
  if (!player || input.mouseX == null) return input.aim;
  return Math.atan2(input.mouseY - player.y, input.mouseX - player.x);
}
