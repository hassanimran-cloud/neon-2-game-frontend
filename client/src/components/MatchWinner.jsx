export default function MatchWinner({ matchEnd }) {
  if (!matchEnd) return null;
  const draw = matchEnd.winnerName === "draw";
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70">
      <div className="neon-panel max-w-lg rounded-2xl bg-slate-950 px-10 py-10 text-center">
        <p className="text-xs uppercase tracking-[0.45em] text-neon-cyan">Match over</p>
        <h2 className="mt-4 font-arcade text-4xl text-white">
          {draw ? "Draw" : `${matchEnd.winnerName} wins`}
        </h2>
        <p className="mt-3 text-slate-400">
          {draw ? "Both pilots took 2 rounds." : "Most rounds won after 4."}
        </p>
        {matchEnd.reason === "forfeit" && (
          <p className="mt-2 text-sm text-amber-300">Ended by disconnect / forfeit.</p>
        )}
        <a
          href="/"
          className="mt-8 inline-block rounded-lg bg-cyan-500 px-6 py-2 font-arcade text-sm text-slate-950 hover:bg-cyan-400"
        >
          Back to lobby
        </a>
      </div>
    </div>
  );
}
