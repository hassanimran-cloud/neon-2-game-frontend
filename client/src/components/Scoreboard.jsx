export default function Scoreboard({ score }) {
  const round = score?.round ?? 1;
  const total = score?.totalRounds ?? 4;
  const p1 = score?.p1;
  const p2 = score?.p2;
  const cap = score?.killsToWin ?? 20;

  return (
    <header className="neon-panel grid grid-cols-3 items-center rounded-xl bg-slate-950/80 px-5 py-3">
      <div className="text-left">
        <p className="text-[11px] uppercase tracking-[0.25em] text-neon-magenta">Player 1</p>
        <p className="font-arcade text-lg text-neon-magenta">{p1?.name || "Waiting"}</p>
        <p className="text-sm text-slate-300">
          Kills <span className="font-semibold text-white">{p1?.kills ?? 0}</span> / {cap}
          <span className="ml-3 text-xs text-slate-400">Rounds {p1?.roundWins ?? 0}</span>
        </p>
      </div>
      <div className="text-center">
        <p className="text-[11px] uppercase tracking-[0.35em] text-neon-cyan">Current Round</p>
        <p className="font-arcade text-3xl text-white">
          {round} <span className="text-base text-slate-400">/ {total}</span>
        </p>
      </div>
      <div className="text-right">
        <p className="text-[11px] uppercase tracking-[0.25em] text-neon-green">Player 2</p>
        <p className="font-arcade text-lg text-neon-green">{p2?.name || "Waiting"}</p>
        <p className="text-sm text-slate-300">
          Kills <span className="font-semibold text-white">{p2?.kills ?? 0}</span> / {cap}
          <span className="ml-3 text-xs text-slate-400">Rounds {p2?.roundWins ?? 0}</span>
        </p>
      </div>
    </header>
  );
}
