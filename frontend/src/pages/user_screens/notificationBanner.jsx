import { useState } from "react";
import "./notificationBanner.css";

function NotificationBanner({ message }) {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return null;
  }

  return (
    <div className="notification-banner" role="alert">
      <span className="notification-icon">🔔</span>

      <p>{message}</p>

      <button
        type="button"
        className="notification-close"
        onClick={() => setVisible(false)}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

export default NotificationBanner;