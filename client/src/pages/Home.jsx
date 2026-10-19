import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";

export default function Home() {
  const navigate = useNavigate();
  const { createRoom, joinRoom, error, connected } = useGame();
  const [name, setName] = useState("Pilot");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const onCreate = async () => {
    setBusy(true);
    try {
      const res = await createRoom(name);
      navigate(`/lobby/${res.code}`, { state: { name, host: true } });
    } catch {
      setBusy(false);
    }
  };

  const onJoin = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await joinRoom(code, name);
      navigate(`/lobby/${res.code}`, { state: { name, host: false } });
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col justify-center gap-10 px-6 py-12">
      <div>
        <p className="text-xs uppercase tracking-[0.5em] text-neon-cyan">MERN · Socket.io</p>
        <h1 className="mt-3 font-arcade text-5xl text-white">Neon Arena</h1>
        <p className="mt-4 max-w-xl text-slate-400">
          2-player top-down shooter. First to 20 kills wins the round. Best of 4 rounds takes the match.
        </p>
        <p className={`mt-2 text-sm ${connected ? "text-neon-green" : "text-amber-400"}`}>
          {connected ? "Server online" : "Connecting to server…"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="neon-panel rounded-2xl bg-slate-950/70 p-6">
          <h2 className="font-arcade text-xl text-neon-magenta">Create room</h2>
          <label className="mt-4 block text-xs uppercase tracking-widest text-slate-400">Callsign</label>
          <input
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-cyan-400"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
          />
          <button
            type="button"
            disabled={busy || !connected}
            onClick={onCreate}
            className="mt-6 w-full rounded-lg bg-neon-magenta py-2.5 font-arcade text-sm text-white disabled:opacity-40"
          >
            Generate invite
          </button>
        </div>

        <form onSubmit={onJoin} className="neon-panel rounded-2xl bg-slate-950/70 p-6">
          <h2 className="font-arcade text-xl text-neon-green">Join room</h2>
          <label className="mt-4 block text-xs uppercase tracking-widest text-slate-400">Invite code</label>
          <input
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 uppercase outline-none focus:border-cyan-400"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="AB12CD"
            maxLength={6}
          />
          <button
            type="submit"
            disabled={busy || !connected || code.length < 6}
            className="mt-6 w-full rounded-lg bg-neon-green py-2.5 font-arcade text-sm text-slate-950 disabled:opacity-40"
          >
            Drop in
          </button>
        </form>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
