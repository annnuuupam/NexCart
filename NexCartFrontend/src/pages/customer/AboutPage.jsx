import React, { useMemo, useEffect, useState } from "react";
import { ShieldCheck, Truck, RefreshCcw, BadgeCheck, Package, Headphones } from "lucide-react";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import "../../styles/styles.css";
import API_BASE_URL from '../../config/api';

const formatCompact = (value) => {
  const num = Number(value || 0);
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(num);
};

export default function AboutPage() {
  const [username, setUsername] = useState("Guest");
  const [cartCount, setCartCount] = useState(0);
  const [aboutData, setAboutData] = useState({
    activeShoppers: 0,
    citiesServed: 350,
    productSkus: 0,
    avgDelivery: "2-4 days",
    ordersServed: 0,
    itemsSold: 0,
    totalRevenue: 0,
    fulfillmentSla: "Orders processed within 24-48 hours",
    orderSuccessRate: 0,
  });

  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        const profileRes = await fetch(`${API_BASE_URL}/api/users/profile`, {
          credentials: "include",
          cache: "no-store",
        });

        if (profileRes.ok) {
          const profile = await profileRes.json();
          const name = profile?.username || profile?.name || "Guest";
          setUsername(name);
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
        console.error("Unable to fetch header data on About page", error);
      }
    };

    const fetchAboutStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/store/about`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) return;

        const data = await response.json();
        setAboutData((prev) => ({ ...prev, ...data }));
      } catch (error) {
        console.error("Unable to fetch about stats", error);
      }
    };

    fetchHeaderData();
    fetchAboutStats();
  }, []);

  const stats = useMemo(
    () => [
      { label: "Active Shoppers", value: formatCompact(aboutData.activeShoppers) },
      { label: "Cities Served", value: `${formatCompact(aboutData.citiesServed)}+` },
      { label: "Product SKUs", value: formatCompact(aboutData.productSkus) },
      { label: "Avg. Delivery", value: aboutData.avgDelivery },
    ],
    [aboutData]
  );

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

      <main className="main-content about-main">
        <section className="about-hero">
          <p className="about-kicker">About NexCart</p>
          <h1>Built like a modern marketplace, focused on trust, speed, and value.</h1>
          <p>
            NexCart combines curated selection, transparent pricing, and dependable fulfillment to deliver
            an ecommerce experience inspired by industry leaders.
          </p>
        </section>

        <section className="about-stats-grid">
          {stats.map((item) => (
            <article key={item.label} className="about-stat-card">
              <p className="about-stat-value">{item.value}</p>
              <p className="about-stat-label">{item.label}</p>
            </article>
          ))}
        </section>

        <section className="about-grid">
          <article className="about-card">
            <h2>Why customers choose NexCart</h2>
            <div className="about-feature-list">
              <p><Truck size={16} /> {aboutData.fulfillmentSla}</p>
              <p><ShieldCheck size={16} /> Secure checkout and protected transactions</p>
              <p><RefreshCcw size={16} /> Hassle-free returns on eligible products</p>
              <p><BadgeCheck size={16} /> {aboutData.orderSuccessRate}% successful order completion</p>
            </div>
          </article>

          <article className="about-card">
            <h2>Business at a glance</h2>
            <div className="about-feature-list">
              <p><Package size={16} /> Orders served: {formatCompact(aboutData.ordersServed)}</p>
              <p><Package size={16} /> Items sold: {formatCompact(aboutData.itemsSold)}</p>
              <p><Package size={16} /> Revenue: Rs. {formatCompact(aboutData.totalRevenue)}</p>
              <p><Package size={16} /> Active catalog across major shopping categories</p>
            </div>
          </article>
        </section>

        <section className="about-support-card">
          <h2>Customer support that stays with you</h2>
          <p>
            From order updates to returns, our support team helps at every step so customers shop with confidence.
          </p>
          <div className="about-support-points">
            <p><Headphones size={16} /> Assisted support for order and payment issues</p>
            <p><Headphones size={16} /> Quick escalation for priority concerns</p>
            <p><Headphones size={16} /> Resolution-focused service experience</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
