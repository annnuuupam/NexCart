import React, { useState, useRef, useEffect } from "react";
import { CartIcon } from "../cart/CartIcon";
import { ProfileDropdown } from "../profile/ProfileDropdown";
import { ThemeToggle } from "./ThemeToggle";
import Logo from "./Logo";

export function Header({
  cartCount,
  username,
  searchQuery = "",
  searchScope = "all",
  onSearchChange,
  onSearchScopeChange,
  onSearchSubmit,
  onClearSearch,
}) {
  const [isScopeOpen, setIsScopeOpen] = useState(false);
  const scopeMenuRef = useRef(null);

  const scopeOptions = [
    { value: "all", label: "All" },
    { value: "name", label: "Product Name" },
    { value: "description", label: "Description" },
    { value: "category", label: "Category" },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (scopeMenuRef.current && !scopeMenuRef.current.contains(event.target)) {
        setIsScopeOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <Logo />
          <div className="header-location">
            <span className="location-label">Deliver to</span>
            <span className="location-value">India</span>
          </div>
        </div>

        <form className="header-search" onSubmit={onSearchSubmit}>
          <div className="search-scope-wrapper" ref={scopeMenuRef}>
            <button
              type="button"
              className="search-scope"
              onClick={() => setIsScopeOpen(!isScopeOpen)}
              aria-label="Select search scope"
              aria-expanded={isScopeOpen}
            >
              {scopeOptions.find(opt => opt.value === searchScope)?.label || "All"}
            </button>
            <svg className="search-scope-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isScopeOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            
            {isScopeOpen && (
              <div className="dropdown-menu" style={{ top: 'calc(100% + 14px)', left: 0, zIndex: 1000, width: 'max-content', minWidth: '160px' }}>
                {scopeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      onSearchScopeChange?.(option.value);
                      setIsScopeOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder="Search products, brands and more"
            aria-label="Search products"
          />
          {searchQuery ? (
            <button type="button" className="search-clear" onClick={onClearSearch}>
              Clear
            </button>
          ) : null}
          <button type="submit" className="search-submit">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Search
          </button>
        </form>

        <div className="header-actions">
          <ThemeToggle />
          <CartIcon count={cartCount} />
          <ProfileDropdown username={username} />
        </div>
      </div>
    </header>
  );
}
