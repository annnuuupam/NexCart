import React, { useEffect, useMemo, useState } from "react";
import DataTable from "../components/DataTable";
import AdminSelect from "../components/AdminSelect";
import { adminApi } from "../services/adminApi";
import { formatDate } from "../utils/format";
import { useToast } from "../../components/ui/ToastContext";
import { Download } from "lucide-react";
import EmailTemplateEditor from "../components/EmailTemplateEditor";

const statusOptions = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const toLabel = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const badgeClass = (status) => {
  const key = String(status || "").toUpperCase();
  if (key === "OPEN") return "bg-rose-100 text-rose-700";
  if (key === "IN_PROGRESS") return "bg-amber-100 text-amber-700";
  if (key === "RESOLVED") return "bg-emerald-100 text-emerald-700";
  return "bg-slate-200 text-slate-700";
};

const SupportPage = () => {
  const [tickets, setTickets] = useState([]);
  const [overview, setOverview] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [resetLogs, setResetLogs] = useState([]);
  const [resetQuery, setResetQuery] = useState("");
  const [resetAction, setResetAction] = useState("");
  const [resetFrom, setResetFrom] = useState("");
  const [resetTo, setResetTo] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetTemplate, setResetTemplate] = useState("");
  const toast = useToast();

  const loadData = async () => {
    try {
      const [rows, stats] = await Promise.all([
        adminApi.getSupportTickets({ status: statusFilter, q: search }),
        adminApi.getSupportOverview(),
      ]);
      setTickets(rows || []);
      setOverview(stats || { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });
    } catch (error) {
      toast.error(error.message || "Unable to load support tickets. Please try again.");
    }
  };

  const loadResetLogs = async () => {
    setResetLoading(true);
    try {
      const rows = await adminApi.getResetLogs({ q: resetQuery, action: resetAction, from: resetFrom, to: resetTo });
      setResetLogs(rows || []);
    } catch (error) {
      toast.error(error.message || "Unable to load reset logs.");
    } finally {
      setResetLoading(false);
    }
  };

  const loadTemplate = async () => {
    try {
      const data = await adminApi.getResetEmailTemplate();
      setResetTemplate(data?.template || "");
    } catch (error) {
      toast.error(error.message || "Unable to load email template.");
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  useEffect(() => {
    loadResetLogs();
    loadTemplate();
  }, []);

  const searchedRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tickets;

    return tickets.filter((ticket) =>
      String(ticket.ticketNumber || "").toLowerCase().includes(query) ||
      String(ticket.username || "").toLowerCase().includes(query) ||
      String(ticket.email || "").toLowerCase().includes(query) ||
      String(ticket.phone || "").toLowerCase().includes(query) ||
      String(ticket.subject || "").toLowerCase().includes(query) ||
      String(ticket.orderId || "").toLowerCase().includes(query)
    );
  }, [tickets, search]);

  const updateTicket = async () => {
    if (!selected?.ticketNumber) return;
    setSaving(true);
    try {
      await adminApi.updateSupportTicket(selected.ticketNumber, {
        status: selected.status,
        adminNote: selected.adminNote || "",
      });
      toast.success(`Ticket ${selected.ticketNumber} updated successfully.`);
      await loadData();
      setSelected(null);
    } catch (error) {
      toast.error(error.message || "Unable to update support ticket. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "ticketNumber", label: "Ticket" },
    { key: "username", label: "Customer" },
    { key: "email", label: "Email" },
    { key: "type", label: "Type", render: (row) => toLabel(row.type) },
    { key: "priority", label: "Priority", render: (row) => toLabel(row.priority) },
    {
      key: "status",
      label: "Status",
      render: (row) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(row.status)}`}>{toLabel(row.status)}</span>,
    },
    { key: "createdAt", label: "Created", render: (row) => formatDate(row.createdAt) },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <button
          onClick={() => setSelected(row)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
        >
          Manage
        </button>
      ),
    },
  ];

  const resetColumns = [
    { key: "createdAt", label: "When", render: (row) => formatDate(row.createdAt) },
    { key: "action", label: "Action" },
    { key: "userId", label: "User ID" },
    { key: "identifier", label: "Identifier" },
    { key: "ipAddress", label: "IP" },
    { key: "userAgent", label: "Agent", render: (row) => (
      <span title={row.userAgent} className="line-clamp-1 max-w-[240px] inline-block">{row.userAgent || "-"}</span>
    ) },
  ];

  const exportLogs = async () => {
    try {
      const url = adminApi.exportResetLogs({ q: resetQuery, action: resetAction, from: resetFrom, to: resetTo });
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "reset-logs.csv";
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      toast.error(error.message || "Unable to export logs");
    }
  };

  return (
    <section className="space-y-5">

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">Total</p><h3 className="text-2xl font-bold">{overview.total}</h3></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">Open</p><h3 className="text-2xl font-bold text-rose-600">{overview.open}</h3></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">In Progress</p><h3 className="text-2xl font-bold text-amber-600">{overview.inProgress}</h3></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">Resolved</p><h3 className="text-2xl font-bold text-emerald-600">{overview.resolved}</h3></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">Closed</p><h3 className="text-2xl font-bold text-slate-700">{overview.closed}</h3></article>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search ticket, customer, email, order"
          className="md:col-span-2 w-full rounded-lg border border-slate-200 px-3 py-2"
        />
        <AdminSelect
          value={statusFilter}
          onChange={(next) => setStatusFilter(next)}
          options={[
            { value: "ALL", label: "All Status" },
            ...statusOptions.map((status) => ({ value: status, label: toLabel(status) })),
          ]}
        />
        <button onClick={loadData} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Refresh</button>
      </div>

      <DataTable columns={columns} data={searchedRows} emptyText="No support tickets yet" />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Password Reset Logs</h3>
            <p className="text-sm text-slate-500">Audit trail for reset requests and outcomes.</p>
          </div>
          <button
            onClick={exportLogs}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-6">
          <input
            value={resetQuery}
            onChange={(event) => setResetQuery(event.target.value)}
            placeholder="Search identifier, IP, agent"
            className="md:col-span-2 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
          <input
            value={resetAction}
            onChange={(event) => setResetAction(event.target.value)}
            placeholder="Filter action (optional)"
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
          <input
            type="date"
            value={resetFrom}
            onChange={(event) => setResetFrom(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
          <input
            type="date"
            value={resetTo}
            onChange={(event) => setResetTo(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
          <button onClick={loadResetLogs} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50">
            {resetLoading ? "Loading..." : "Refresh Logs"}
          </button>
        </div>

        <DataTable columns={resetColumns} data={resetLogs} emptyText="No reset activity yet" />
      </section>

      <EmailTemplateEditor
        initialValue={resetTemplate}
        onSave={async (value) => {
          try {
            const data = await adminApi.updateResetEmailTemplate(value);
            setResetTemplate(data?.template || value);
            toast.success("Template saved.");
          } catch (error) {
            toast.error(error.message || "Unable to save template.");
          }
        }}
      />

      {selected ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900">Ticket {selected.ticketNumber}</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p><b>Customer:</b> {selected.username} ({selected.email})</p>
              <p><b>Order ID:</b> {selected.orderId || "-"}</p>
              <p><b>Type:</b> {toLabel(selected.type)} | <b>Priority:</b> {toLabel(selected.priority)}</p>
              <p><b>Subject:</b> {selected.subject}</p>
              <p><b>Message:</b> {selected.message}</p>
            </div>

            <div className="mt-4 grid gap-3">
              <AdminSelect
                value={selected.status}
                onChange={(next) => setSelected((prev) => ({ ...prev, status: next }))}
                options={statusOptions.map((status) => ({ value: status, label: toLabel(status) }))}
              />
              <textarea
                rows={4}
                value={selected.adminNote || ""}
                onChange={(event) => setSelected((prev) => ({ ...prev, adminNote: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Add admin note / resolution summary"
              />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setSelected(null)} className="rounded-xl border border-slate-200 px-4 py-2 font-semibold">Close</button>
              <button onClick={updateTicket} disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default SupportPage;







