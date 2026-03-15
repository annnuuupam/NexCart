import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/styles.css";

export function CartIcon({ count }) {
  const navigate = useNavigate();

  const handleCartClick = () => {
    navigate("/UserCartPage");
  };

  return (
    <button
      type="button"
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      onClick={handleCartClick}
      aria-label="Open cart"
      title="Open cart"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2.2"
        stroke="currentColor"
        className="h-[18px] w-[18px]"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3h18l-2 9H5L3 3zM8.5 18a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm7 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"
        />
      </svg>
      {(count ?? 0) > 0 && (
        <span className="absolute -right-1 -top-1 flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[#00bcd4] px-1.5 text-[12px] font-bold text-slate-900 shadow-sm leading-none border-2 border-white dark:border-slate-900">
          {count}
        </span>
      )}
    </button>
  );
}
