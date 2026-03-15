import React, { useEffect, useState } from "react";
import SupportLayout from "./SupportLayout";
import { useToast } from "../../../components/ui/ToastContext";
import API_BASE_URL from '../../../config/api';

export default function ContactUsPage() {
  const [contact, setContact] = useState({
    email: "support@nexcart.com",
    phone: "+91 9988776655",
    hours: "Mon-Sun, 8:00 AM - 10:00 PM IST",
    channels: [],
  });
  const [form, setForm] = useState({ subject: "", message: "", phone: "", priority: "MEDIUM" });
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/support/contact`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = await response.json();
        setContact((prev) => ({ ...prev, ...data }));
      } catch (error) {
        console.error("Unable to load contact data", error);
      }
    };

    fetchContact();
  }, []);

  const submitTicket = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/support/tickets`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CONTACT",
          subject: form.subject,
          message: form.message,
          phone: form.phone,
          priority: form.priority,
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(body?.error || "Unable to submit request. Please try again.");
        return;
      }

      toast.success(`Support request submitted successfully. Ticket: ${body.ticketNumber}.`);
      setForm({ subject: "", message: "", phone: "", priority: "MEDIUM" });
    } catch {
      toast.error("Network error while submitting support request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SupportLayout
      title="Contact Us"
      subtitle="Connect with support using your preferred channel and create a tracked support ticket."
    >
      <section className="support-contact-grid">
        <article className="support-card">
          <h3>Email</h3>
          <p>{contact.email}</p>
        </article>
        <article className="support-card">
          <h3>Phone</h3>
          <p>{contact.phone}</p>
        </article>
        <article className="support-card">
          <h3>Working Hours</h3>
          <p>{contact.hours}</p>
        </article>
      </section>

      <section className="support-card">
        <h3>Raise Contact Request</h3>
        <form className="support-ticket-form" onSubmit={submitTicket}>
          <input
            type="text"
            placeholder="Subject"
            value={form.subject}
            onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
            required
          />
          <div className="support-ticket-grid2">
            <input
              type="text"
              placeholder="Phone (optional)"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
            <select value={form.priority} onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <textarea
            rows={4}
            placeholder="Describe your issue"
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            required
          />
          <button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit Request"}</button>
        </form>
      </section>

      <section className="support-card">
        <h3>Support channels</h3>
        <ul>
          {(contact.channels || []).map((channel) => (
            <li key={channel}>{channel}</li>
          ))}
        </ul>
      </section>
    </SupportLayout>
  );
}




