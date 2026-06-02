import { useEffect, useState } from "react";

export function useConversationControlsVersion() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handler = () => setVersion((v) => v + 1);
    window.addEventListener("conversation-controls-changed", handler);
    return () => window.removeEventListener("conversation-controls-changed", handler);
  }, []);

  return version;
}
