import React, { useEffect, useMemo, useState } from "react";
import { Building2, CreditCard, Truck, ShieldCheck, Save, RefreshCw, CheckCircle2, AlertCircle, Percent } from "lucide-react";
import { adminApi } from "../services/adminApi";
import { useToast } from "../../components/ui/ToastContext";

const defaultStore = {
  storeName: "",
  email: "",
  phone: "",
  logo: "",
};

const defaultPayment = {
  stripe: true,
  razorpay: true,
  paypal: false,
  cod: true,
};

const defaultShipping = {
  freeShippingMin: 999,
  domesticCharge: 79,
  internationalCharge: 499,
  dispatchSlaHours: 24,
};

const defaultTax = {
  gstPercentage: 18,
  taxEnabled: true,
};

const defaultSecurity = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  sessionTimeoutMin: 60,
  enable2FA: false,
};

const SettingsPage = () => {
  const [storeSettings, setStoreSettings] = useState(defaultStore);
  const [paymentSettings, setPaymentSettings] = useState(defaultPayment);
  const [shippingSettings, setShippingSettings] = useState(defaultShipping);
  const [taxSettings, setTaxSettings] = useState(defaultTax);
  const [securitySettings, setSecuritySettings] = useState(defaultSecurity);

  const [initialSnapshot, setInitialSnapshot] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const toast = useToast();

  const payloadForCompare = useMemo(
    () => ({
      store: storeSettings,
      payment: paymentSettings,
      shipping: shippingSettings,
      tax: {
        gstPercentage: Number(taxSettings.gstPercentage || 0),
        taxEnabled: Boolean(taxSettings.taxEnabled),
      },
      security: {
        sessionTimeoutMin: Number(securitySettings.sessionTimeoutMin || 0),
        enable2FA: Boolean(securitySettings.enable2FA),
      },
    }),
    [storeSettings, paymentSettings, shippingSettings, taxSettings, securitySettings]
  );

  const hasChanges = useMemo(() => {
    if (!initialSnapshot) return false;
    return JSON.stringify(payloadForCompare) !== initialSnapshot;
  }, [payloadForCompare, initialSnapshot]);

  const enabledPayments = useMemo(
    () => Object.values(paymentSettings).filter(Boolean).length,
    [paymentSettings]
  );

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settings = await adminApi.getSettings();

      const nextStore = { ...defaultStore, ...(settings?.store || {}) };
      const nextPayment = { ...defaultPayment, ...(settings?.payment || {}) };
      const nextShipping = { ...defaultShipping, ...(settings?.shipping || {}) };
      const nextTax = { ...defaultTax, ...(settings?.tax || {}) };
      const nextSecurity = {
        ...defaultSecurity,
        sessionTimeoutMin: Number(settings?.security?.sessionTimeoutMin ?? defaultSecurity.sessionTimeoutMin),
        enable2FA: Boolean(settings?.security?.enable2FA),
      };

      setStoreSettings(nextStore);
      setPaymentSettings(nextPayment);
      setShippingSettings(nextShipping);
      setTaxSettings((prev) => ({ ...prev, ...nextTax }));
      setSecuritySettings((prev) => ({
        ...prev,
        ...nextSecurity,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      setInitialSnapshot(
        JSON.stringify({
          store: nextStore,
          payment: nextPayment,
          shipping: nextShipping,
          tax: {
            gstPercentage: Number(nextTax.gstPercentage || 0),
            taxEnabled: Boolean(nextTax.taxEnabled),
          },
          security: {
            sessionTimeoutMin: nextSecurity.sessionTimeoutMin,
            enable2FA: nextSecurity.enable2FA,
          },
        })
      );
    } catch (error) {
      console.error("Unable to load settings.", error);
      toast.error(error.message || "Unable to load settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const validateBeforeSave = () => {
    if (!storeSettings.storeName?.trim()) return "Store name is required.";
    if (!storeSettings.email?.trim()) return "Store email is required.";

    const gstValue = Number(taxSettings.gstPercentage || 0);
    if (Number.isNaN(gstValue) || gstValue < 0 || gstValue > 28) {
      return "GST percentage must be between 0 and 28.";
    }

    if (
      securitySettings.newPassword ||
      securitySettings.confirmPassword ||
      securitySettings.currentPassword
    ) {
      if (!securitySettings.currentPassword) return "Please enter current password to change password.";
      if (securitySettings.newPassword.length < 6) return "New password must be at least 6 characters.";
      if (securitySettings.newPassword !== securitySettings.confirmPassword) return "Password confirmation does not match.";
    }

    return "";
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const validationError = validateBeforeSave();
    if (validationError) {
      toast.warning(validationError);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        store: storeSettings,
        payment: paymentSettings,
        shipping: {
          ...shippingSettings,
          freeShippingMin: Number(shippingSettings.freeShippingMin || 0),
          domesticCharge: Number(shippingSettings.domesticCharge || 0),
          internationalCharge: Number(shippingSettings.internationalCharge || 0),
          dispatchSlaHours: Number(shippingSettings.dispatchSlaHours || 0),
        },
        tax: {
          gstPercentage: Number(taxSettings.gstPercentage || 0),
          taxEnabled: Boolean(taxSettings.taxEnabled),
        },
        security: {
          sessionTimeoutMin: Number(securitySettings.sessionTimeoutMin || 0),
          enable2FA: Boolean(securitySettings.enable2FA),
          passwordChangeRequested: Boolean(securitySettings.newPassword),
        },
      };

      await adminApi.updateSettings(payload);

      setInitialSnapshot(JSON.stringify(payload));
      setSecuritySettings((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setLastSavedAt(new Date());
      toast.success("Settings saved successfully.");
    } catch (error) {
      toast.error(error.message || "Unable to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const togglePayment = (key) => {
    setPaymentSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSecurity = (key) => {
    setSecuritySettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const cardClass = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
  const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2";

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Settings Control Center</h2>
            <p className="text-sm text-slate-600">Manage store profile, payments, shipping, taxes, and security with live status visibility.</p>
            <p className="mt-1 text-xs text-slate-500">
              {lastSavedAt ? `Last saved: ${lastSavedAt.toLocaleString()}` : "No recent save in this session."}
            </p>
          </div>
          <button
            type="button"
            onClick={loadSettings}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Reload
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Unsaved Changes</p>
          <p className={`mt-1 text-2xl font-bold ${hasChanges ? "text-amber-700" : "text-emerald-700"}`}>{hasChanges ? "Yes" : "No"}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Payment Methods Enabled</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{enabledPayments}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Free Shipping Threshold</p>
          <p className="mt-1 text-2xl font-bold text-blue-700">INR {Number(shippingSettings.freeShippingMin || 0).toLocaleString("en-IN")}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">GST Percentage</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{Number(taxSettings.gstPercentage || 0)}%</p>
        </article>
      </div>

      <form onSubmit={handleSave} className="grid gap-5 xl:grid-cols-2">
        <article className={cardClass}>
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">Store Profile</h3>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-600">Store Name</label>
            <input className={inputClass} value={storeSettings.storeName || ""} onChange={(e) => setStoreSettings((p) => ({ ...p, storeName: e.target.value }))} placeholder="NexCart" />

            <label className="block text-sm font-semibold text-slate-600">Store Email</label>
            <input className={inputClass} value={storeSettings.email || ""} onChange={(e) => setStoreSettings((p) => ({ ...p, email: e.target.value }))} placeholder="support@yourstore.com" />

            <label className="block text-sm font-semibold text-slate-600">Support Phone</label>
            <input className={inputClass} value={storeSettings.phone || ""} onChange={(e) => setStoreSettings((p) => ({ ...p, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" />

            <label className="block text-sm font-semibold text-slate-600">Logo URL</label>
            <input className={inputClass} value={storeSettings.logo || ""} onChange={(e) => setStoreSettings((p) => ({ ...p, logo: e.target.value }))} placeholder="https://..." />
          </div>
        </article>

        <article className={cardClass}>
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-900">Payment Methods</h3>
          </div>
          <div className="space-y-3 text-sm">
            {Object.entries(paymentSettings).map(([key, enabled]) => (
              <label key={key} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <span className="font-semibold capitalize">{key}</span>
                <button
                  type="button"
                  onClick={() => togglePayment(key)}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                >
                  {enabled ? "Enabled" : "Disabled"}
                </button>
              </label>
            ))}
          </div>
        </article>

        <article className={cardClass}>
          <div className="mb-4 flex items-center gap-2">
            <Truck className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-bold text-slate-900">Shipping Rules</h3>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-600">Free Shipping Threshold (INR)</label>
            <input type="number" className={inputClass} value={shippingSettings.freeShippingMin || 0} onChange={(e) => setShippingSettings((p) => ({ ...p, freeShippingMin: Number(e.target.value) }))} />

            <label className="block text-sm font-semibold text-slate-600">Domestic Charge (INR)</label>
            <input type="number" className={inputClass} value={shippingSettings.domesticCharge || 0} onChange={(e) => setShippingSettings((p) => ({ ...p, domesticCharge: Number(e.target.value) }))} />

            <label className="block text-sm font-semibold text-slate-600">International Charge (INR)</label>
            <input type="number" className={inputClass} value={shippingSettings.internationalCharge || 0} onChange={(e) => setShippingSettings((p) => ({ ...p, internationalCharge: Number(e.target.value) }))} />

            <label className="block text-sm font-semibold text-slate-600">Dispatch SLA (hours)</label>
            <input type="number" className={inputClass} value={shippingSettings.dispatchSlaHours || 0} onChange={(e) => setShippingSettings((p) => ({ ...p, dispatchSlaHours: Number(e.target.value) }))} />
          </div>
        </article>

        <article className={cardClass}>
          <div className="mb-4 flex items-center gap-2">
            <Percent className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">Tax Rules</h3>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-600">GST Percentage</label>
            <input type="number" className={inputClass} value={taxSettings.gstPercentage || 0} onChange={(e) => setTaxSettings((p) => ({ ...p, gstPercentage: Number(e.target.value) }))} />

            <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span className="text-sm font-semibold text-slate-700">Tax Enabled</span>
              <button
                type="button"
                onClick={() => setTaxSettings((p) => ({ ...p, taxEnabled: !p.taxEnabled }))}
                className={`rounded-full px-3 py-1 text-xs font-bold ${taxSettings.taxEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
              >
                {taxSettings.taxEnabled ? "Enabled" : "Disabled"}
              </button>
            </label>
          </div>
        </article>

        <article className={cardClass}>
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">Security & Access</h3>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-600">Current Password</label>
            <input type="password" className={inputClass} value={securitySettings.currentPassword} onChange={(e) => setSecuritySettings((p) => ({ ...p, currentPassword: e.target.value }))} placeholder="Required for password change" />

            <label className="block text-sm font-semibold text-slate-600">New Password</label>
            <input type="password" className={inputClass} value={securitySettings.newPassword} onChange={(e) => setSecuritySettings((p) => ({ ...p, newPassword: e.target.value }))} placeholder="At least 6 characters" />

            <label className="block text-sm font-semibold text-slate-600">Confirm New Password</label>
            <input type="password" className={inputClass} value={securitySettings.confirmPassword} onChange={(e) => setSecuritySettings((p) => ({ ...p, confirmPassword: e.target.value }))} placeholder="Confirm password" />

            <label className="block text-sm font-semibold text-slate-600">Session Timeout (minutes)</label>
            <input type="number" className={inputClass} value={securitySettings.sessionTimeoutMin || 0} onChange={(e) => setSecuritySettings((p) => ({ ...p, sessionTimeoutMin: Number(e.target.value) }))} />

            <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span className="text-sm font-semibold text-slate-700">Enable 2FA for Admin</span>
              <button
                type="button"
                onClick={() => toggleSecurity("enable2FA")}
                className={`rounded-full px-3 py-1 text-xs font-bold ${securitySettings.enable2FA ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
              >
                {securitySettings.enable2FA ? "Enabled" : "Disabled"}
              </button>
            </label>
          </div>
        </article>

        <div className="xl:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm">
            {hasChanges ? (
              <>
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <p className="text-amber-700">You have unsaved changes.</p>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <p className="text-emerald-700">All changes are saved.</p>
              </>
            )}
          </div>

          <button
            disabled={!hasChanges || saving || loading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save All Settings"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default SettingsPage;


