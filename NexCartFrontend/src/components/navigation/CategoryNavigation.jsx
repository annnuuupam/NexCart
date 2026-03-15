import React, { useState } from "react";

export function CategoryNavigation({ onCategoryClick }) {
  const categories = ["All", "Shirts", "Pants", "Accessories", "Mobiles", "Mobile Accessories"];
  const [activeCategory, setActiveCategory] = useState("All");

  const handleClick = (category) => {
    setActiveCategory(category);
    onCategoryClick(category === "All" ? "" : category);
  };

  return (
    <nav className="category-navigation" aria-label="Product categories">
      <ul className="category-list">
        {categories.map((category) => (
          <li
            key={category}
            className={`category-item ${activeCategory === category ? "active" : ""}`}
            onClick={() => handleClick(category)}
          >
            {category}
          </li>
        ))}
      </ul>
    </nav>
  );
}
