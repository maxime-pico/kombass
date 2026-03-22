import React, { useEffect, useState } from "react";

interface AnimatedMediumUnitProps {
  playerIndex: number;
  animationState: "marching" | "raising" | null;
}

function AnimatedMediumUnit({ playerIndex, animationState }: AnimatedMediumUnitProps) {
  const [svgContent, setSvgContent] = useState<string>("");

  const spriteFile = playerIndex === 0
    ? "/sprites/medium-p1-animated.svg"
    : "/sprites/medium-p2-animated.svg";

  const unitClass = playerIndex === 0 ? "infantry-p1" : "infantry-p2";

  useEffect(() => {
    fetch(spriteFile)
      .then((r) => r.text())
      .then((text) => setSvgContent(text));
  }, [spriteFile]);

  if (!svgContent) return null;

  return (
    <div
      className={`animated-medium-unit ${unitClass}${animationState ? ` ${animationState}` : ""}`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

export default AnimatedMediumUnit;
