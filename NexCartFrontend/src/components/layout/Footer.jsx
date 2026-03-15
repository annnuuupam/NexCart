import React from "react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer footer-market">
      <div className="footer-top-strip">
        <p>Trending now: Smart fashion, mobile accessories, and everyday essentials.</p>
      </div>

      <div className="footer-content footer-content-market">
        <div className="footer-brand-block">
          <h3 className="footer-title">NexCart Marketplace</h3>
          <p className="footer-tagline">Industry-grade shopping experience inspired by leading marketplaces.</p>
          <div className="footer-trust-pills">
            <span>Secure Payments</span>
            <span>Fast Delivery</span>
            <span>Easy Returns</span>
          </div>
        </div>

        <div className="footer-links-grid">
          <div>
            <h4>Shop</h4>
            <a href="/customerhome">Today's Deals</a>
            <a href="/customerhome">Best Sellers</a>
            <a href="/wishlist">Wishlist</a>
            <a href="/orders">Your Orders</a>
          </div>
          <div>
            <h4>Company</h4>
            <a href="/about">About NexCart</a>
            <a href="/profile">Your Account</a>
            <a href="/admin">Admin Portal</a>
            <a href="/support/customer-service">Customer Service</a>
          </div>
          <div>
            <h4>Support</h4>
            <a href="/support/track-order">Track Order</a>
            <a href="/support/returns-refunds">Returns & Refunds</a>
            <a href="/support/help-center">Help Center</a>
            <a href="/support/contact-us">Contact Us</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom footer-bottom-market">
        <p>Copyright {currentYear} NexCart. All rights reserved.</p>
        <p>Made for modern ecommerce experiences.</p>
      </div>
    </footer>
  );
}
