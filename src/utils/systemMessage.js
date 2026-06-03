let messageHandler = null;

export function registerSystemMessage(handler) {
  messageHandler = handler;
}

export function showSystemMessage(options) {
  if (messageHandler) {
    messageHandler(options);
  }
}

export const SYSTEM_MESSAGE_TITLES = {
  success: "Success",
  error: "Error",
  warning: "Please note",
  info: "Information",
};

export function normalizeSystemMessageOptions(options) {
  if (typeof options === "string") {
    return {
      title: SYSTEM_MESSAGE_TITLES.info,
      message: options,
      type: "info",
      actionLabel: "OK",
      hideAction: false,
    };
  }

  const type = options.type || options.severity || "info";
  const mappedType = ["success", "error", "warning", "info"].includes(type)
    ? type
    : "info";

  return {
    title: options.title || SYSTEM_MESSAGE_TITLES[mappedType],
    message: options.message,
    type: mappedType,
    actionLabel: options.actionLabel ?? "OK",
    onAction: options.onAction,
    actionTo: options.actionTo,
    hideAction: options.hideAction ?? false,
  };
}
