import "./notebook-brand.css";

export function NotebookBrand() {
  return (
    <div className="notebook-brand">
      <svg
        className="notebook-brand-mark"
        viewBox="0 0 32 36"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M7 3h21v28H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M8 3v28M13 11h10M13 16h10M13 21h6M7 31h21v2"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
      <div>
        <span className="notebook-brand-name">logboeker</span>
      </div>
    </div>
  );
}
