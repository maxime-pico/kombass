import React, { useState, useRef, useEffect, useContext } from "react";
import socketService from "../services/socketService";
import chatService from "../services/chatService";
import gameContext from "../gameContext";
import { defaultUnitConfig } from "../utilities/dict";
import type { UnitConfig } from "../utilities/dict";

function buildSettingsMessages(
  boardWidth: number,
  boardLength: number,
  placementZone: number,
  unitsCount: number,
  terrain: Array<{ x: number; y: number }>,
  flagStayInPlace: boolean,
  unitConfig: UnitConfig
): Array<{ who: string; content: string }> {
  const messages: Array<{ who: string; content: string }> = [];
  const admin = (content: string) => messages.push({ who: "admin", content });

  admin("---- MISSION BRIEFING ----");
  admin(`Board: ${boardWidth}x${boardLength}`);
  admin(`Placement zone: ${placementZone} rows`);
  admin(`Units per player: ${unitsCount}`);
  admin(`Terrain: ${terrain.length > 0 ? `${terrain.length} tiles destroyed` : "clear"}`);
  if (flagStayInPlace) {
    admin("Flag: stays in place on carrier death");
  }

  const defaults = defaultUnitConfig();
  const isCustom =
    (["light", "medium", "heavy"] as const).some((t) => {
      const d = defaults[t];
      const c = unitConfig[t];
      return d.strength !== c.strength || d.range !== c.range || d.speed !== c.speed || d.life !== c.life;
    });

  if (isCustom) {
    admin("Unit stats: CUSTOM");
    for (const t of ["light", "medium", "heavy"] as const) {
      const u = unitConfig[t];
      admin(`  ${t.charAt(0).toUpperCase() + t.slice(1)}: STR ${u.strength} / RNG ${u.range} / SPD ${u.speed} / HP ${u.life}`);
    }
  } else {
    admin("Unit stats: default");
  }

  admin("-------------------------");
  return messages;
}

function Chat() {
  const {
    isPlayer,
    gameStarted,
    step,
    boardWidth,
    boardLength,
    placementZone,
    unitsCount,
    terrain,
    flagStayInPlace,
    unitConfig,
  } = useContext(gameContext);
  const chatInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const settingsInjectedRef = useRef(false);
  const [history, updateHistory] = useState<any>([
    { who: "admin", content: "KRAU COM SYSTEM" },
    { who: "admin", content: "MILITARY GRADE ENCRYPTION" },
    { who: "admin", content: "----" },
  ]);

  const _focusChat = () => {
    if (chatInput.current) chatInput.current.focus();
  };

  const _handleKeypress = (keyCode: number) => {
    //it triggers by pressing the enter key
    if (keyCode === 13) {
      _sendMessage();
    }
  };

  const _sendMessage = () => {
    if (socketService.socket) {
      let newMessage = { who: `${isPlayer + 1}`, content: message };
      chatService.sendMessage(socketService.socket, newMessage).then(() => {
        // Use functional update to avoid stale closure over history
        updateHistory((prevHistory: any) => [...prevHistory, newMessage]);
        setMessage("");
      });
    }
  };

  useEffect(() => {
    // Register message listener with proper cleanup to prevent duplicates in React 18 Strict Mode
    let unsubscribe: (() => void) | null = null;

    if (socketService.socket) {
      unsubscribe = chatService.onMessageReceived(
        socketService.socket,
        (newMessage: { who: string; content: string }) => {
          // Use functional update to avoid stale closure over history
          updateHistory((prevHistory: any) => [...prevHistory, newMessage]);
        }
      );
    }

    // Cleanup function to unregister listener when component unmounts
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inject settings message and auto-open chat when entering compose step
  useEffect(() => {
    if (step === -2 && !settingsInjectedRef.current) {
      settingsInjectedRef.current = true;
      const settingsMessages = buildSettingsMessages(
        boardWidth, boardLength, placementZone, unitsCount, terrain, flagStayInPlace, unitConfig
      );
      updateHistory((prev: any) => [...prev, ...settingsMessages]);
      setCollapsed(false);
    }
  }, [step, boardWidth, boardLength, placementZone, unitsCount, terrain, flagStayInPlace, unitConfig]);

  return (
    <div id="chat">
      <div
        className="chat-header"
        onClick={() => {
          setCollapsed(!collapsed);
          if (collapsed && gameStarted) {
            _focusChat();
            setInputFocused(true);
          }
        }}
      >
        <div className={`bubble ${gameStarted ? "connected" : "disconnected"}`}>
          {"•"}
        </div>
        <div className="chat-title">{"Communication system"}</div>
        <div className="chat-title">{"-"}</div>
      </div>
      <div
        className={`collapsible ${collapsed ? "collapsed" : ""} ${
          !gameStarted ? "waiting" : ""
        }`}
        onClick={() => _focusChat()}
      >
        <div className="chat-content">
          <div>
            {history.map(
              (message: { who: string; content: string }, index: number) => (
                <div key={index} className={message.who === "admin" ? "chat-intro" : ""}>{`${
                  message.who !== "admin" ? "P" + message.who + ">" : ""
                } ${message.content}`}</div>
              )
            )}
          </div>
        </div>
        <div className="chat-footer">
          <div className="input-container">
            <input
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              ref={chatInput}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => inputFocused && _handleKeypress(e.charCode)}
              style={{ width: `${message.length + 1}ch` }}
            />
            <div className={`caret ${inputFocused && "focused"}`}> </div>
          </div>
          <button onClick={() => _sendMessage()}>{">>"}</button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
