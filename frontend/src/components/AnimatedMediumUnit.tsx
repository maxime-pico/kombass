import React, { useEffect, useState } from "react";
import { getCachedSprite } from "../utilities/spriteCache";

interface AnimatedMediumUnitProps {
  playerIndex: number;
  animationState: "marching" | "raising" | null;
}

function AnimatedMediumUnit({ playerIndex, animationState }: AnimatedMediumUnitProps) {
  const spriteFile = playerIndex === 0
    ? "/sprites/medium-p1-animated.svg"
    : "/sprites/medium-p2-animated.svg";

  const [svgContent, setSvgContent] = useState<string>(() => getCachedSprite(spriteFile) || "");

  const unitClass = playerIndex === 0 ? "infantry-p1" : "infantry-p2";

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
      className={`animated-medium-unit ${unitClass}${animationState ? ` ${animationState}` : ""}`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

export default AnimatedMediumUnit;
