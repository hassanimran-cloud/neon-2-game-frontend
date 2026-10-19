import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ArenaCanvas from "../components/ArenaCanvas";
import MatchWinner from "../components/MatchWinner";
import RoundModal from "../components/RoundModal";
import Scoreboard from "../components/Scoreboard";
import { useGame } from "../context/GameContext";

export default function Game() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { score, roundEnd, matchEnd, snapshotRef, localId, sendInput, lobby } = useGame();

  useEffect(() => {
    if (!lobby && !score) {
      navigate(`/lobby/${code}`, { replace: true });
    }
  }, [code, lobby, navigate, score]);

  const frozen = Boolean(roundEnd || matchEnd || score?.status !== "playing");

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Scoreboard score={score} />
      <div className="relative min-h-0 flex-1">
        <ArenaCanvas
          snapshotRef={snapshotRef}
          localId={localId}
          sendInput={sendInput}
          frozen={frozen}
        />
        <RoundModal roundEnd={matchEnd ? null : roundEnd} />
        <MatchWinner matchEnd={matchEnd} />
      </div>
      <p className="text-center text-xs uppercase tracking-[0.25em] text-slate-500">
        WASD move · mouse aim · click or space fire · room {code}
      </p>
    </div>
  );
}
