export default function DeleteButton({ onClick }) {
  return (
    <button
      type="button"
      className="icon-btn icon-delete"
      title="Delete"
      onClick={(e) => {
        e.stopPropagation(); // Prevents the tooltip from closing when you click it
        if (onClick) onClick();
      }}
    >
      {/* Standard trash can icon */}
      <svg
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
    </button>
  );
}
