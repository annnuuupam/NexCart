import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SupportLayout from "./SupportLayout";

const toLabel = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export default function CustomerServicePage() {
  const [tickets, setTickets] = useState([]);

  const links = [
    { title: "Track Order", path: "/support/track-order", desc: "Check latest shipment and status timeline." },
    { title: "Returns & Refunds", path: "/support/returns-refunds", desc: "Know return steps and refund timelines." },
    { title: "Help Center", path: "/support/help-center", desc: "Browse FAQs across orders, payments, and account." },
    { title: "Contact Us", path: "/support/contact-us", desc: "Reach support via chat, phone, and email." },
  ];

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch("http://localhost:9090/api/support/tickets/my", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = await response.json();
        setTickets(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Unable to load support tickets", error);
      }
    };

    fetchTickets();
  }, []);

  return (
    <SupportLayout
      title="Customer Service"
      subtitle="Choose the support option that best matches your issue and track your live tickets."
    >
      <section className="support-links-grid">
        {links.map((item) => (
          <Link key={item.path} to={item.path} className="support-link-card">
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
            <span>Open</span>
          </Link>
        ))}
      </section>

      <section className="support-card">
        <h3>Your Recent Support Tickets</h3>
        {tickets.length === 0 ? (
          <p>No support tickets raised yet. Create one from Contact, Track Order, or Returns pages.</p>
        ) : (
          <div className="support-ticket-list">
            {tickets.slice(0, 8).map((ticket) => (
              <article key={ticket.ticketNumber} className="support-ticket-row">
                <div>
                  <p className="support-ticket-id">{ticket.ticketNumber}</p>
                  <p><b>{ticket.subject}</b></p>
                  <p className="support-ticket-meta">{toLabel(ticket.type)} • {new Date(ticket.createdAt).toLocaleString()}</p>
                </div>
                <span className={`support-ticket-status support-status-${String(ticket.status || "").toLowerCase()}`}>
                  {toLabel(ticket.status)}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </SupportLayout>
  );
}
