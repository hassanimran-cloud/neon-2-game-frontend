export default function RoundModal({ roundEnd }) {
  if (!roundEnd) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/55">
      <div className="neon-panel rounded-2xl bg-slate-950/90 px-10 py-8 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-neon-cyan">Round {roundEnd.roundNumber} complete</p>
        <h2 className="mt-3 font-arcade text-3xl text-white">{roundEnd.winnerName} wins the round</h2>
        <p className="mt-4 text-slate-300">
          {roundEnd.p1Kills} – {roundEnd.p2Kills} kills
        </p>
      </div>
    </div>
  );
}
