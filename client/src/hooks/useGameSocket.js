import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";

export function useGameSocket() {
  const [connected, setConnected] = useState(socket.connected);
  const [lobby, setLobby] = useState(null);
  const [score, setScore] = useState(null);
  const [roundEnd, setRoundEnd] = useState(null);
  const [matchEnd, setMatchEnd] = useState(null);
  const [error, setError] = useState("");
  const snapshotRef = useRef({ prev: null, next: null });
  const [localId, setLocalId] = useState(socket.id);

  useEffect(() => {
    const onConnect = () => {
      setConnected(true);
      setLocalId(socket.id);
    };
    const onDisconnect = () => setConnected(false);
    const onLobby = (payload) => setLobby(payload);
    const onCreated = (payload) => setLobby(payload);
    const onScore = (payload) => setScore(payload);
    const onState = (snapshot) => {
      snapshotRef.current.prev = snapshotRef.current.next;
      snapshotRef.current.next = snapshot;
    };
    const onGameStart = (payload) => {
      setScore(payload);
      setRoundEnd(null);
      setMatchEnd(null);
      if (payload.snapshot) {
        snapshotRef.current.prev = payload.snapshot;
        snapshotRef.current.next = payload.snapshot;
      }
    };
    const onRoundEnd = (payload) => setRoundEnd(payload);
    const onRoundStart = (payload) => {
      setRoundEnd(null);
      setScore(payload);
    };
    const onMatchEnd = (payload) => {
      setMatchEnd(payload);
      setRoundEnd(null);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("lobbyUpdate", onLobby);
    socket.on("roomCreated", onCreated);
    socket.on("scoreUpdate", onScore);
    socket.on("state", onState);
    socket.on("gameStart", onGameStart);
    socket.on("roundEnd", onRoundEnd);
    socket.on("roundStart", onRoundStart);
    socket.on("matchEnd", onMatchEnd);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("lobbyUpdate", onLobby);
      socket.off("roomCreated", onCreated);
      socket.off("scoreUpdate", onScore);
      socket.off("state", onState);
      socket.off("gameStart", onGameStart);
      socket.off("roundEnd", onRoundEnd);
      socket.off("roundStart", onRoundStart);
      socket.off("matchEnd", onMatchEnd);
    };
  }, []);

  const createRoom = (name) =>
    new Promise((resolve, reject) => {
      setError("");
      socket.emit("createRoom", { name }, (res) => {
        if (!res?.ok) {
          setError(res?.error || "Could not create room");
          reject(new Error(res?.error));
          return;
        }
        setLobby(res);
        resolve(res);
      });
    });

  const joinRoom = (code, name) =>
    new Promise((resolve, reject) => {
      setError("");
      socket.emit("joinRoom", { code: String(code).toUpperCase(), name }, (res) => {
        if (!res?.ok) {
          setError(res?.error || "Could not join room");
          reject(new Error(res?.error));
          return;
        }
        setLobby(res);
        resolve(res);
      });
    });

  const setReady = (ready = true) => socket.emit("playerReady", { ready });
  const sendInput = (input) => socket.emit("playerInput", input);

  return {
    connected,
    localId,
    lobby,
    score,
    roundEnd,
    matchEnd,
    error,
    snapshotRef,
    createRoom,
    joinRoom,
    setReady,
    sendInput,
  };
}
