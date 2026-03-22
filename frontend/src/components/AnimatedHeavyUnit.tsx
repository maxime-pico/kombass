import React, { useEffect, useState } from "react";
import { getCachedSprite } from "../utilities/spriteCache";

interface AnimatedHeavyUnitProps {
  playerIndex: number;
  animationState: "marching" | "raising" | null;
}

function AnimatedHeavyUnit({ playerIndex, animationState }: AnimatedHeavyUnitProps) {
  const spriteFile = playerIndex === 0
    ? "/sprites/heavy-p1-animated.svg"
    : "/sprites/heavy-p2-animated.svg";

  const [svgContent, setSvgContent] = useState<string>(() => getCachedSprite(spriteFile) || "");

  const unitClass = playerIndex === 0 ? "heavy-p1" : "heavy-p2";

  useEffect(() => {
    if (!svgContent) {
      fetch(spriteFile)
        .then((r) => r.text())
        .then((text) => setSvgContent(text));
    }
  }, [spriteFile, svgContent]);

  if (!svgContent) return null;

  return (
    <div
      className={`animated-heavy-unit ${unitClass}${animationState ? ` ${animationState}` : ""}`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

export default AnimatedHeavyUnit;
