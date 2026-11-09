/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => onClose(), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!message) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          background: "#ef4444",
          color: "#ffffff",
          padding: "12px 20px",
          borderRadius: "8px",
          zIndex: "9999",
          fontSize: "14px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          minWidth: "200px",
          fontWeight: "bold",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#ffffff",
            fontSize: "14px",
          }}
        >
          {message}
        </p>
      </div>
    </>
  );
};

export default Toast;
