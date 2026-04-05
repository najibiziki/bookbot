import React from "react";

const BookBotIcon = ({ size = 64, color = "#4F46E5" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="8" y="12" width="48" height="40" rx="6" fill={color} />

      <rect x="14" y="18" width="36" height="28" rx="3" fill="#ffffff" />

      <circle cx="26" cy="30" r="3" fill={color} />
      <circle cx="38" cy="30" r="3" fill={color} />

      <rect x="26" y="36" width="12" height="3" rx="1.5" fill={color} />

      <circle cx="46" cy="18" r="6" fill="#10B981" />
      <line x1="46" y1="18" x2="46" y2="14" stroke="white" strokeWidth="2" />
      <line x1="46" y1="18" x2="49" y2="20" stroke="white" strokeWidth="2" />
    </svg>
  );
};

export default BookBotIcon;
