import React, { useEffect, useState } from "react";
import SupportLayout from "./SupportLayout";
import { useToast } from "../../../components/ui/ToastContext";
import API_BASE_URL from '../../../config/api';

export default function ReturnsRefundsPage() {
  const [policy, setPolicy] = useState({ window: "", steps: [], notes: [] });
  const [form, setForm] = useState({ orderId: "", subject: "Return/Refund request", message: "", priority: "MEDIUM" });
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/support/returns-policy`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = await response.json();
        setPolicy(data);
      } catch (error) {
        console.error("Unable to load returns policy", error);
      }
    };

    fetchPolicy();
  }, []);

  const submitReturnTicket = async (event) => {
    event.preventDefault();
    setSubmitting(true);    try {
      const response = await fetch(`${API_BASE_URL}/api/support/tickets`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "RETURN_REFUND",
          subject: form.subject,
          message: form.message,
          orderId: form.orderId,
          priority: form.priority,
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(body?.error || "Unable to submit return/refund request. Please try again.");
        return;
      }

      toast.success(`Return/refund request submitted successfully. Ticket: ${body.ticketNumber}.`);
      setForm({ orderId: "", subject: "Return/Refund request", message: "", priority: "MEDIUM" });
    } catch {
      toast.error("Network error while submitting request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SupportLayout
      title="Returns & Refunds"
      subtitle="Understand return eligibility, pickup process, and refund timelines."
    >
      <section className="support-card">
        <h3>{policy.window || "7-day easy returns"}</h3>
        <ol>
          {(policy.steps || []).map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="support-card">
        <h3>Raise Return / Refund Ticket</h3>
        <form className="support-ticket-form" onSubmit={submitReturnTicket}>
          <div className="support-ticket-grid2">
            <input
              type="text"
              placeholder="Order ID"
              value={form.orderId}
              onChange={(event) => setForm((prev) => ({ ...prev, orderId: event.target.value }))}
              required
            />
            <select value={form.priority} onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Subject"
            value={form.subject}
            onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
            required
          />
          <textarea
            rows={4}
            placeholder="Describe your return/refund issue"
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            required
          />
          <button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit Ticket"}</button>
        </form>
      </section>

      <section className="support-card">
        <h3>Important notes</h3>
        <ul>
          {(policy.notes || []).map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
    </SupportLayout>
  );
}




