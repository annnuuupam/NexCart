import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import SupportLayout from "./SupportLayout";
import { useToast } from "../../../components/ui/ToastContext";
import API_BASE_URL from '../../../config/api';

export default function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState("");
  const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: "Order tracking issue", message: "", priority: "MEDIUM" });
    const [ticketLoading, setTicketLoading] = useState(false);
  const toast = useToast();

  const fetchTrack = async (targetOrderId) => {
    if (!targetOrderId.trim()) {
      toast.warning("Please enter an order ID.");
      return;
    }

    setLoading(true);
    setData(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/support/track-order/${encodeURIComponent(targetOrderId.trim())}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        toast.error(body?.error || "Order not found. Please verify the order ID.");
        return;
      }

      const result = await response.json();
      setData(result);
    } catch {
      toast.error("Unable to track order right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const qOrderId = searchParams.get("orderId") || "";
    if (qOrderId) {
      setOrderId(qOrderId);
      fetchTrack(qOrderId);
    }
  }, [searchParams]);

  const handleTrack = async (event) => {
    event.preventDefault();
    fetchTrack(orderId);
  };

  const createTrackingTicket = async (event) => {
    event.preventDefault();
    if (!orderId.trim()) {
      toast.warning("Please enter the order ID first.");
      return;
    }

    setTicketLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/support/tickets`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "TRACK_ORDER",
          orderId: orderId.trim(),
          subject: ticketForm.subject,
          message: ticketForm.message,
          priority: ticketForm.priority,
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(body?.error || "Unable to create support ticket. Please try again.");
        return;
      }

      toast.success(`Tracking support ticket created successfully. Ticket: ${body.ticketNumber}.`);
      setTicketForm({ subject: "Order tracking issue", message: "", priority: "MEDIUM" });
    } catch {
      toast.error("Network error while creating support ticket. Please try again.");
    } finally {
      setTicketLoading(false);
    }
  };

  return (
    <SupportLayout
      title="Track Order"
      subtitle="Enter your order ID to view shipment details and delivery estimate."
    >
      <form className="support-track-form" onSubmit={handleTrack}>
        <input
          type="text"
          value={orderId}
          onChange={(event) => setOrderId(event.target.value)}
          placeholder="Enter order ID"
        />
        <button type="submit" disabled={loading}>{loading ? "Tracking..." : "Track"}</button>
      </form>

      {data ? (
        <section className="support-track-result">
          <h3>Order #{data.orderId}</h3>
          <p>Status: <strong>{data.status}</strong></p>
          <p>Estimated delivery: {data.estimatedDelivery}</p>
          <p>Total: Rs. {Number(data.totalAmount || 0).toLocaleString("en-IN")}</p>

          <div className="support-track-items">
            {(data.products || []).map((item) => (
              <article key={`${item.productId}-${item.name}`} className="support-track-item">
                <img src={item.imageUrl || "https://via.placeholder.com/120x120?text=Product"} alt={item.name} />
                <div>
                  <h4>{item.name}</h4>
                  <p>Qty: {item.quantity}</p>
                  <p>Price: Rs. {Number(item.pricePerUnit || 0).toLocaleString("en-IN")}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="support-card">
        <h3>Need help with this order?</h3>
        <form className="support-ticket-form" onSubmit={createTrackingTicket}>
          <div className="support-ticket-grid2">
            <input
              type="text"
              placeholder="Subject"
              value={ticketForm.subject}
              onChange={(event) => setTicketForm((prev) => ({ ...prev, subject: event.target.value }))}
              required
            />
            <select value={ticketForm.priority} onChange={(event) => setTicketForm((prev) => ({ ...prev, priority: event.target.value }))}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <textarea
            rows={4}
            placeholder="Describe the tracking issue"
            value={ticketForm.message}
            onChange={(event) => setTicketForm((prev) => ({ ...prev, message: event.target.value }))}
            required
          />
          <button type="submit" disabled={ticketLoading}>{ticketLoading ? "Submitting..." : "Raise Support Ticket"}</button>
        </form>
      </section>
    </SupportLayout>
  );
}





