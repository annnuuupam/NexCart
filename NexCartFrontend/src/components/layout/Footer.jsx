import React from "react";
import { Link } from "react-router-dom";
import { useStoreName } from "../../hooks/useStoreName";

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);
const TruckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
);
const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
);
const HeadsetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
);

export function Footer() {
  const currentYear = new Date().getFullYear();
  const storeName = useStoreName();

  return (
    <footer className="ft">
      {/* ── Ticker strip ── */}
      <div className="ft-ticker">
        <div className="ft-ticker-track">
          {["Smart Fashion", "Mobile Accessories", "Everyday Essentials", "Electronics", "Home & Living", "Sports & Outdoors", "Beauty & Wellness"].map((item, i) => (
            <React.Fragment key={i}>
              <span>{item}</span>
              <span className="ft-ticker-dot" aria-hidden="true">✦</span>
            </React.Fragment>
          ))}
          {/* duplicate for seamless loop */}
          {["Smart Fashion", "Mobile Accessories", "Everyday Essentials", "Electronics", "Home & Living", "Sports & Outdoors", "Beauty & Wellness"].map((item, i) => (
            <React.Fragment key={`b${i}`}>
              <span>{item}</span>
              <span className="ft-ticker-dot" aria-hidden="true">✦</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="ft-body">

        {/* Brand column */}
        <div className="ft-brand">
          <div className="ft-logo-wrap">
            <img src="/logo.png" alt={storeName} className="ft-logo-img" />
            <span className="ft-logo-name">{storeName}</span>
          </div>
          <p className="ft-tagline">
            Premium shopping experience built for the modern world. Quality products, seamless checkout, lightning-fast delivery.
          </p>

          {/* Trust badges */}
          <div className="ft-badges">
            <div className="ft-badge"><ShieldIcon /><span>Secure Payments</span></div>
            <div className="ft-badge"><TruckIcon /><span>Fast Delivery</span></div>
            <div className="ft-badge"><RefreshIcon /><span>Easy Returns</span></div>
            <div className="ft-badge"><HeadsetIcon /><span>24/7 Support</span></div>
          </div>

          {/* Social icons */}
          <div className="ft-socials">
            <a href="#" className="ft-social" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="#" className="ft-social" aria-label="Twitter / X">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.263 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" className="ft-social" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" className="ft-social" aria-label="YouTube">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>
            </a>
          </div>
        </div>

        {/* Links grid */}
        <div className="ft-links">
          <div className="ft-col">
            <h4 className="ft-col-title">Shop</h4>
            <Link to="/customerhome" className="ft-link">Today's Deals</Link>
            <Link to="/customerhome" className="ft-link">Best Sellers</Link>
            <Link to="/customerhome" className="ft-link">New Arrivals</Link>
            <Link to="/wishlist" className="ft-link">Wishlist</Link>
            <Link to="/orders" className="ft-link">Your Orders</Link>
          </div>

          <div className="ft-col">
            <h4 className="ft-col-title">Company</h4>
            <Link to="/about" className="ft-link">About {storeName}</Link>
            <Link to="/profile" className="ft-link">Your Account</Link>
            <Link to="/admin" className="ft-link">Admin Portal</Link>
            <Link to="/support/customer-service" className="ft-link">Customer Service</Link>
            <Link to="/support/contact-us" className="ft-link">Contact Us</Link>
          </div>

          <div className="ft-col">
            <h4 className="ft-col-title">Support</h4>
            <Link to="/support/track-order" className="ft-link">Track Order</Link>
            <Link to="/support/returns-refunds" className="ft-link">Returns &amp; Refunds</Link>
            <Link to="/support/help-center" className="ft-link">Help Center</Link>
          </div>

          <div className="ft-col">
            <h4 className="ft-col-title">We Accept</h4>
            <div className="ft-payments">
              <span className="ft-pay-badge">Razorpay</span>
              <span className="ft-pay-badge">UPI</span>
              <span className="ft-pay-badge">Cards</span>
              <span className="ft-pay-badge">COD</span>
              <span className="ft-pay-badge">Net Banking</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="ft-bottom">
        <p className="ft-copy">© {currentYear} {storeName}. All rights reserved.</p>
        <div className="ft-bottom-links">
          <a href="#" className="ft-bottom-link">Privacy Policy</a>
          <span className="ft-sep">·</span>
          <a href="#" className="ft-bottom-link">Terms of Service</a>
          <span className="ft-sep">·</span>
          <a href="#" className="ft-bottom-link">Sitemap</a>
        </div>
        <p className="ft-made">Made with ♥ for modern commerce</p>
      </div>
    </footer>
  );
}
