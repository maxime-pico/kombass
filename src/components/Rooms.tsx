import React, { useState, useContext } from "react";
import gameContext from "../gameContext";
import socketService from "../services/socketService";
import gameService from "../services/gameService";

interface RoomsProps {}

function Rooms(props: RoomsProps) {
  const [roomName, setRoomName] = useState("");
  const [isJoining, setJoining] = useState(false);

  const { _setInRoom, isInRoom, step, _changeStep } = useContext(gameContext);

  const handleRoomNameChange = (e: React.ChangeEvent<any>) => {
    const value = e.target.value;
    setRoomName(value);
  };

  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const socket = socketService.socket;
    if (!roomName || roomName.trim() === "" || !socket) return;

    setJoining(true);

    const joined = await gameService
      .joinGameRoom(socket, roomName)
      .catch((err: string) => {
        alert(err);
      });

    if (joined) {
      _setInRoom(true);
      _changeStep(step, 1);
    }

    setJoining(false);
  };

  return (
    <div id="settings" className="settings-container">
      <form onSubmit={joinRoom}>
        <div className="title">
          {"//"} Enter an ID to join a room {"//"}
        </div>
        <br />
        <div>
          <input
            placeholder="Room ID"
            name="roomId"
            value={roomName}
            onChange={handleRoomNameChange}
          />
          <button type="submit" disabled={isJoining}>
            {" "}
            {isJoining ? "Joining..." : "Join"}{" "}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Rooms;
