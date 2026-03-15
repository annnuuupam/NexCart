import React from "react";
import "../../styles/styles.css";

export function ProductCardSkeleton() {
  return (
    <div className="product-card skeleton-card">
      <div className="skeleton skeleton-image" />
      <div className="product-info">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-price" />
        <div className="skeleton skeleton-button" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="skeleton skeleton-table-row" />
  );
}

export function CardSkeleton() {
  return (
    <div className="skeleton skeleton-stat-card" />
  );
}
