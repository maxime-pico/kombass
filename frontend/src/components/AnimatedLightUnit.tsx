import React, { useEffect, useState } from "react";
import { getCachedSprite } from "../utilities/spriteCache";

interface AnimatedLightUnitProps {
  playerIndex: number;
  animationState: "galloping" | "rearing" | null;
}

function AnimatedLightUnit({ playerIndex, animationState }: AnimatedLightUnitProps) {
  const spriteFile = playerIndex === 0
    ? "/sprites/light-p1-animated.svg"
    : "/sprites/light-p2-animated.svg";

  const [svgContent, setSvgContent] = useState<string>(() => getCachedSprite(spriteFile) || "");

  const unitClass = playerIndex === 0 ? "bike" : "horse";

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
      className={`animated-light-unit ${unitClass}${animationState ? ` ${animationState}` : ""}`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

export default AnimatedLightUnit;
