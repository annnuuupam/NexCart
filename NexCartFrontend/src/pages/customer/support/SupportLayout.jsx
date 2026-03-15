import React, { useEffect, useState } from "react";
import { Header } from "../../../components/layout/Header";
import { Footer } from "../../../components/layout/Footer";
import API_BASE_URL from '../../../config/api';

export default function SupportLayout({ title, subtitle, children }) {
  const [username, setUsername] = useState("Guest");
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        const profileRes = await fetch(`${API_BASE_URL}/api/users/profile`, {
          credentials: "include",
          cache: "no-store",
        });

        if (profileRes.ok) {
          const profile = await profileRes.json();
          setUsername(profile?.username || profile?.name || "Guest");
        }

        const cartRes = await fetch(`${API_BASE_URL}/api/cart/items`, {
          credentials: "include",
          cache: "no-store",
        });

        if (cartRes.ok) {
          const cartData = await cartRes.json();
          const total = (cartData?.cart?.products || []).reduce(
            (sum, item) => sum + Number(item.quantity || 0),
            0
          );
          setCartCount(total);
        }
      } catch (error) {
        console.error("Support layout header fetch failed", error);
      }
    };

    fetchHeaderData();
  }, []);

  return (
    <div className="customer-homepage">
      <Header
        cartCount={cartCount}
        username={username}
        searchQuery=""
        searchScope="all"
        onSearchChange={() => {}}
        onSearchScopeChange={() => {}}
        onClearSearch={() => {}}
        onSearchSubmit={(event) => event.preventDefault()}
      />

      <main className="main-content support-main">
        <section className="support-hero">
          <p className="support-kicker">Support Center</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </section>
        {children}
      </main>

      <Footer />
    </div>
  );
}
