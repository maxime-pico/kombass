import React from "react";

export interface IGameContextProps {
  isInRoom: boolean;
  _setInRoom: (inRoom: boolean) => void;
  step: number;
  _changeStep: (step: number, direction: -1 | 1) => void;
}

const defaultState: IGameContextProps = {
  isInRoom: false,
  _setInRoom: () => {},
  step: -5,
  _changeStep: () => {},
};

export default React.createContext(defaultState);
