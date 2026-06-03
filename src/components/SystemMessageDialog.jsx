import { Link } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Fade,
} from "@mui/material";
import { SYSTEM_MESSAGE_TITLES } from "../utils/systemMessage";

const CloseIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const TYPE_STYLES = {
  success: "border-brand-gold bg-green-50/50",
  error: "border-brand-gold bg-amber-50/50",
  warning: "border-brand-gold bg-amber-50/50",
  info: "border-brand-gold bg-amber-50/40",
};

const SystemMessageDialog = ({
  open,
  onClose,
  title,
  message,
  type = "info",
  actionLabel = "OK",
  actionTo,
  onAction,
  hideAction = false,
}) => {
  const resolvedType = TYPE_STYLES[type] ? type : "info";
  const resolvedTitle = title || SYSTEM_MESSAGE_TITLES[resolvedType];

  const handleAction = () => {
    if (onAction) onAction();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Fade}
      transitionDuration={250}
      aria-labelledby="system-message-dialog-title"
      PaperProps={{
        sx: {
          borderRadius: 2,
          mx: 2,
          width: "calc(100% - 32px)",
          maxWidth: "520px",
        },
      }}
    >
      <DialogTitle id="system-message-dialog-title" component="div" sx={{ pr: 6 }}>
        <div className="text-lg sm:text-xl font-bold text-gray-900">{resolvedTitle}</div>
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12, color: "grey.700" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <div
          className={`rounded-lg border-2 p-4 text-sm sm:text-base text-gray-700 leading-relaxed ${TYPE_STYLES[resolvedType]}`}
        >
          {message}
        </div>
      </DialogContent>
      {!hideAction ? (
        <DialogActions className="px-6 pb-4">
          {actionTo ? (
            <Link
              to={actionTo}
              onClick={handleAction}
              className="text-sm font-semibold uppercase tracking-wide text-brand-medium-blue hover:text-brand-dark-blue"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAction}
              className="text-sm font-semibold uppercase tracking-wide text-brand-medium-blue hover:text-brand-dark-blue"
            >
              {actionLabel}
            </button>
          )}
        </DialogActions>
      ) : null}
    </Dialog>
  );
};

export default SystemMessageDialog;
