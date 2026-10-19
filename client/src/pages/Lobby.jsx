import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useGame } from "../context/GameContext";

export default function Lobby() {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { lobby, joinRoom, setReady, score, error, localId } = useGame();
  const [copied, setCopied] = useState(false);
  const joiningRef = useRef(false);
  const name = location.state?.name || "Pilot";
  const inviteUrl = useMemo(
    () => `${window.location.origin}/join/${String(code).toUpperCase()}`,
    [code]
  );

  useEffect(() => {
    if (lobby || joiningRef.current || !code) return;
    joiningRef.current = true;
    joinRoom(code, name).catch(() => {
      joiningRef.current = false;
    });
  }, [code, joinRoom, lobby, name]);

  useEffect(() => {
    if (score?.status === "playing") {
      navigate(`/game/${code}`, { replace: true });
    }
  }, [code, navigate, score]);

  const me = lobby?.players?.find((p) => p.id === localId) || lobby?.players?.[0];

  const copy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-6 py-12">
      <div className="neon-panel rounded-2xl bg-slate-950/80 p-8">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-cyan">Room {String(code).toUpperCase()}</p>
        <h1 className="mt-2 font-arcade text-3xl text-white">Waiting for both pilots</h1>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <code className="rounded bg-slate-900 px-3 py-2 text-neon-cyan">{inviteUrl}</code>
          <button
            type="button"
            onClick={copy}
            className="rounded-lg border border-cyan-500/50 px-3 py-2 text-sm text-cyan-300"
          >
            {copied ? "Copied" : "Copy invite"}
          </button>
        </div>
        <ul className="mt-8 space-y-3">
          {(lobby?.players || []).map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-slate-800 px-4 py-3"
            >
              <span style={{ color: p.color }} className="font-arcade">
                P{p.slot} {p.name}
              </span>
              <span className={p.ready ? "text-neon-green" : "text-slate-500"}>
                {p.ready ? "Ready" : "Not ready"}
              </span>
            </li>
          ))}
          {(lobby?.players?.length || 0) < 2 && (
            <li className="rounded-lg border border-dashed border-slate-700 px-4 py-3 text-slate-500">
              Waiting for Player 2…
            </li>
          )}
        </ul>
        <button
          type="button"
          onClick={() => setReady(true)}
          className="mt-8 w-full rounded-lg bg-cyan-500 py-3 font-arcade text-slate-950"
        >
          {me?.ready ? "Ready — waiting for opponent" : "I'm ready"}
        </button>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
