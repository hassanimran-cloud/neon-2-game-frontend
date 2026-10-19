import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGame } from "../context/GameContext";

export default function Join() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { joinRoom, error, connected } = useGame();
  const [name, setName] = useState("Challenger");

  useEffect(() => {
    document.title = `Join ${code} — Neon Arena`;
  }, [code]);

  const onJoin = async (e) => {
    e.preventDefault();
    const res = await joinRoom(code, name);
    navigate(`/lobby/${res.code}`, { state: { name, host: false } });
  };

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6">
      <form onSubmit={onJoin} className="neon-panel rounded-2xl bg-slate-950/80 p-8">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-cyan">Invite</p>
        <h1 className="mt-2 font-arcade text-2xl text-white">Room {String(code).toUpperCase()}</h1>
        <input
          className="mt-6 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={16}
        />
        <button
          disabled={!connected}
          className="mt-6 w-full rounded-lg bg-neon-green py-2.5 font-arcade text-slate-950"
        >
          Join match
        </button>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </form>
    </div>
  );
}
