import React, { useState } from "react";
import { getVolume, setVolume, isMuted, toggleMute } from "../utilities/volume";

const SpeakerIcon: React.FC<{ muted: boolean }> = ({ muted }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: "block" }}
  >
    {/* Speaker body - pixel art style */}
    <rect x="1" y="5" width="4" height="6" fill="currentColor" />
    <rect x="5" y="3" width="2" height="10" fill="currentColor" />
    <rect x="7" y="1" width="2" height="14" fill="currentColor" />
    {muted ? (
      <>
        {/* X mark */}
        <rect x="11" y="4" width="2" height="2" fill="currentColor" />
        <rect x="13" y="6" width="2" height="2" fill="currentColor" />
        <rect x="11" y="8" width="2" height="2" fill="currentColor" />
        <rect x="13" y="4" width="2" height="2" fill="currentColor" />
        <rect x="11" y="6" width="2" height="2" fill="currentColor" />
        <rect x="13" y="8" width="2" height="2" fill="currentColor" />
      </>
    ) : (
      <>
        {/* Sound waves */}
        <rect x="11" y="6" width="2" height="4" fill="currentColor" />
        <rect x="13" y="4" width="2" height="8" fill="currentColor" opacity="0.6" />
      </>
    )}
  </svg>
);

const VolumeControl: React.FC = () => {
  const [vol, setVol] = useState(getVolume());
  const [muted, setMuted] = useState(isMuted());

  const handleMinus = () => {
    setVolume(vol - 1);
    setVol(getVolume());
    setMuted(isMuted());
  };

  const handlePlus = () => {
    setVolume(vol + 1);
    setVol(getVolume());
    setMuted(isMuted());
  };

  const handleToggle = () => {
    toggleMute();
    setVol(getVolume());
    setMuted(isMuted());
  };

  return (
    <div className="volume-control">
      <button className="volume-btn" onClick={handleMinus}>-</button>
      <button
        className={`volume-speaker${muted ? " muted" : ""}`}
        onClick={handleToggle}
        title={muted ? "Unmute" : "Mute"}
      >
        <SpeakerIcon muted={muted} />
      </button>
      <span className="volume-level">{muted ? 0 : vol}</span>
      <button className="volume-btn" onClick={handlePlus}>+</button>
    </div>
  );
};

export default VolumeControl;
