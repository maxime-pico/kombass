import React, { useEffect, useState } from "react";

interface AnimatedLightUnitProps {
  playerIndex: number;
  animationState: "galloping" | "rearing" | null;
}

function AnimatedLightUnit({ playerIndex, animationState }: AnimatedLightUnitProps) {
  const [svgContent, setSvgContent] = useState<string>("");

  const spriteFile = playerIndex === 0
    ? "/sprites/light-p1-animated.svg"
    : "/sprites/light-p2-animated.svg";

  const unitClass = playerIndex === 0 ? "bike" : "horse";

  useEffect(() => {
    fetch(spriteFile)
      .then((r) => r.text())
      .then((text) => setSvgContent(text));
  }, [spriteFile]);

  if (!svgContent) return null;

  return (
    <div
      className={`animated-light-unit ${unitClass}${animationState ? ` ${animationState}` : ""}`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

export default AnimatedLightUnit;
