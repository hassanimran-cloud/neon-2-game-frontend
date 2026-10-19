import { Navigate, Route, Routes } from "react-router-dom";
import Game from "./pages/Game";
import Home from "./pages/Home";
import Join from "./pages/Join";
import Lobby from "./pages/Lobby";

export default function App() {
  return (
    <div className="min-h-full bg-[#05060a] font-arcade">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby/:code" element={<Lobby />} />
        <Route path="/join/:code" element={<Join />} />
        <Route path="/game/:code" element={<Game />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
