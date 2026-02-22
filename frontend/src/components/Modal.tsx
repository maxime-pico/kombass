import React from "react";

interface ModalProps {
  title: string;
  subtitle: string;
  content: string;
  action: () => void;
  buttonText?: string;
}

function Modal(props: ModalProps) {
  return (
    <div className="modal-container">
      <div className="modalComponent">
        {props.title && <div className="title">{props.title}</div>}
        {props.subtitle && <div className="subtitle">{props.subtitle}</div>}
        {props.content && (
          <div className="content-container">
            <div className="content">{props.content}</div>
            <button
              className="button active align-center"
              onClick={() => {
                props.action();
              }}
            >
              {props.buttonText || "PLAY AGAIN"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
