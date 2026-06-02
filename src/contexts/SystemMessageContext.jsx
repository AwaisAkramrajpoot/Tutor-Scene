import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import SystemMessageDialog from "../components/SystemMessageDialog";
import {
  normalizeSystemMessageOptions,
  registerSystemMessage,
} from "../utils/systemMessage";

const SystemMessageContext = createContext(null);

export function SystemMessageProvider({ children }) {
  const location = useLocation();
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);

  const showMessage = useCallback((options) => {
    const normalized = normalizeSystemMessageOptions(options);
    setQueue((prev) => [...prev, normalized]);
  }, []);

  const closeMessage = useCallback(() => {
    setCurrent(null);
  }, []);

  useEffect(() => {
    registerSystemMessage(showMessage);
    return () => registerSystemMessage(null);
  }, [showMessage]);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((prev) => prev.slice(1));
    }
  }, [current, queue]);

  useEffect(() => {
    setCurrent(null);
    setQueue([]);
  }, [location.pathname]);

  const handleAction = useCallback(() => {
    if (current?.onAction) {
      current.onAction();
    }
    closeMessage();
  }, [current, closeMessage]);

  return (
    <SystemMessageContext.Provider value={{ showMessage, closeMessage }}>
      {children}
      <SystemMessageDialog
        open={Boolean(current)}
        onClose={closeMessage}
        title={current?.title}
        message={current?.message}
        type={current?.type}
        actionLabel={current?.actionLabel}
        onAction={handleAction}
        actionTo={current?.actionTo}
        hideAction={current?.hideAction}
      />
    </SystemMessageContext.Provider>
  );
}

export function useSystemMessage() {
  const context = useContext(SystemMessageContext);
  if (!context) {
    throw new Error("useSystemMessage must be used within SystemMessageProvider");
  }
  return context;
}

export { SystemMessageContext };
