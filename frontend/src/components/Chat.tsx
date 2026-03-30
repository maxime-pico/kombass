import React, { useState, useRef, useEffect, useContext } from "react";
import socketService from "../services/socketService";
import chatService from "../services/chatService";
import gameContext from "../gameContext";
import { defaultUnitConfig } from "../utilities/dict";
import type { UnitConfig } from "../utilities/dict";
import { playChatPing } from "../utilities/sound";

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
    playerIndex,
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
  const [hasUnread, setHasUnread] = useState(false);
  const [history, updateHistory] = useState<any>([]);

  const focusChat = () => {
    if (chatInput.current) chatInput.current.focus();
  };

  const handleKeypress = (keyCode: number) => {
    //it triggers by pressing the enter key
    if (keyCode === 13) {
      sendMessage();
    }
  };

  const sendMessage = () => {
    if (socketService.socket) {
      let newMessage = { who: `${playerIndex + 1}`, content: message };
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
          setHasUnread(true);
          playChatPing();
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

  // Typewriter-style intro + mission briefing when entering compose step
  useEffect(() => {
    if (step !== -2) return;

    const introMessages = [
      { who: "admin", content: "KRAU COM SYSTEM" },
      { who: "admin", content: "MILITARY GRADE ENCRYPTION" },
      { who: "admin", content: "----" },
    ];
    const settingsMessages = buildSettingsMessages(
      boardWidth, boardLength, placementZone, unitsCount, terrain, flagStayInPlace, unitConfig
    );
    const allMessages = [...introMessages, ...settingsMessages];

    const CHAR_DELAY = 25;
    const LINE_PAUSE = 80;
    const INTRO_END_PAUSE = 400; // pause after "----" before mission briefing
    const HEADER_PAUSE = 600; // pause after "---- MISSION BRIEFING ----"
    const INITIAL_DELAY = 1000;

    let cancelled = false;
    let t = INITIAL_DELAY;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    // Ping first, then open chat
    timeouts.push(setTimeout(() => {
      if (cancelled) return;
      setHasUnread(true);
      playChatPing();
    }, t));
    t += 150;
    timeouts.push(setTimeout(() => {
      if (cancelled) return;
      setCollapsed(false);
    }, t));

    allMessages.forEach((msg, msgIndex) => {
      const text = msg.content;
      // Add line with empty content first
      t += LINE_PAUSE;
      timeouts.push(setTimeout(() => {
        if (cancelled) return;
        updateHistory((prev: any) => [...prev, { who: "admin", content: "" }]);
      }, t));

      // Type each character
      for (let i = 0; i < text.length; i++) {
        t += CHAR_DELAY;
        const partial = text.slice(0, i + 1);
        timeouts.push(setTimeout(() => {
          if (cancelled) return;
          updateHistory((prev: any) => {
            const updated = [...prev];
            updated[updated.length - 1] = { who: "admin", content: partial };
            return updated;
          });
        }, t));
      }

      // Pause after intro "----" line (index 2) before mission briefing
      if (msgIndex === 2) {
        t += INTRO_END_PAUSE;
      }
      // Pause after "---- MISSION BRIEFING ----" line (index 3)
      if (msgIndex === 3) {
        t += HEADER_PAUSE;
      }
    });

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <div id="chat">
      <div
        className="chat-header"
        onClick={() => {
          setCollapsed(!collapsed);
          if (collapsed && gameStarted) {
            focusChat();
            setInputFocused(true);
            setHasUnread(false);
          }
        }}
      >
        <div className={`bubble ${gameStarted ? (hasUnread ? "notification" : "connected") : "disconnected"}`}>
          {"•"}
        </div>
        <div className="chat-title">{"Communication system"}</div>
        <div className="chat-title">{"-"}</div>
      </div>
      <div
        className={`collapsible ${collapsed ? "collapsed" : ""} ${
          !gameStarted ? "waiting" : ""
        }`}
        onClick={() => { focusChat(); setHasUnread(false); }}
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
              onKeyPress={(e) => inputFocused && handleKeypress(e.charCode)}
              style={{ width: `${message.length + 1}ch` }}
            />
            <div className={`caret ${inputFocused && "focused"}`}> </div>
          </div>
          <button onClick={() => sendMessage()}>{">>"}</button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
