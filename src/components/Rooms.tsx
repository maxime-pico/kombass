import React, { useState } from "react";

interface RoomsProps {
  step: number;
  _changeStep: (step: number, direction: -1 | 1) => void;
}

function Rooms(props: RoomsProps) {
  const [roomName, setRoomName] = useState("");

  const handleRoomNameChange = (e: React.ChangeEvent<any>) => {
    const value = e.target.value;
    setRoomName(value);
  };

  return (
    <div id="settings" className="settings-container">
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
      </div>
    </div>
  );
}

export default Rooms;
