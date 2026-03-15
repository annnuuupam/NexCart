import React, { useEffect, useState } from "react";
import SupportLayout from "./SupportLayout";
import { useToast } from "../../../components/ui/ToastContext";
import API_BASE_URL from '../../../config/api';

export default function HelpCenterPage() {
  const [topics, setTopics] = useState([]);
  const [form, setForm] = useState({ subject: "Need help", message: "", priority: "MEDIUM" });
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetchHelp = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/support/help-center`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = await response.json();
        setTopics(data?.topics || []);
      } catch (error) {
        console.error("Unable to load help center", error);
      }
    };

    fetchHelp();
  }, []);

  const submitGeneralTicket = async (event) => {
    event.preventDefault();
    setSubmitting(true);    try {
      const response = await fetch(`${API_BASE_URL}/api/support/tickets`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "OTHER",
          subject: form.subject,
          message: form.message,
          priority: form.priority,
        }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(body?.error || "Unable to submit support ticket. Please try again.");
        return;
      }

      toast.success(`Support ticket created successfully. Ticket: ${body.ticketNumber}.`);
      setForm({ subject: "Need help", message: "", priority: "MEDIUM" });
    } catch {
      toast.error("Network error while submitting support ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SupportLayout
      title="Help Center"
      subtitle="Answers for your most common questions across orders, payments, and account."
    >
      <section className="support-help-grid">
        {topics.map((topic) => (
          <article key={topic.title} className="support-card">
            <h3>{topic.title}</h3>
            <ul>
              {(topic.items || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="support-card">
        <h3>Still need help? Raise a ticket</h3>
        <form className="support-ticket-form" onSubmit={submitGeneralTicket}>
          <div className="support-ticket-grid2">
            <input
              type="text"
              placeholder="Subject"
              value={form.subject}
              onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
              required
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
          <button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Create Ticket"}</button>
        </form>
      </section>
    </SupportLayout>
  );
}




