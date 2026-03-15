import React, { useEffect, useMemo, useState } from "react";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { useToast } from "../../components/ui/ToastContext";
import { Camera, Edit2, ShieldCheck, User, MapPin, Mail, Phone, Calendar, Clock, AlertTriangle, Key, Check } from "lucide-react";
import useravatar from "../../assets/images/useravatar.png";
import "../../styles/styles.css";
import API_BASE_URL from '../../config/api';

const CUSTOM_AVATARS = [
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23F1F5F9'/><path d='M20 95 C 20 60 80 60 80 95 Z' fill='%235F7B88'/><circle cx='50' cy='40' r='18' fill='%23FDB347'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23F1F5F9'/><path d='M20 95 C 20 60 80 60 80 95 Z' fill='%237C5295'/><circle cx='50' cy='40' r='18' fill='%2352B89A'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23F1F5F9'/><path d='M20 95 C 20 60 80 60 80 95 Z' fill='%233A506B'/><circle cx='50' cy='40' r='18' fill='%23FF9F1C'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23F1F5F9'/><path d='M20 95 C 20 60 80 60 80 95 Z' fill='%23D90429'/><circle cx='50' cy='40' r='18' fill='%238D99AE'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23F1F5F9'/><path d='M20 95 C 20 60 80 60 80 95 Z' fill='%232B2D42'/><circle cx='50' cy='40' r='18' fill='%23EDF2F4'/></svg>"
];

const valueOrFallback = (value, fallback = "Not available") => {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
};

const formatDateTime = (value) => {
  if (!value) return "Not available";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "Not available";
  return parsedDate.toLocaleString();
};

const normalizeProfile = (payload) => {
  const data = payload?.user || payload || {};
  return {
    userId: data.userId || data.id || "",
    username: data.username || data.name || "",
    email: data.email || "",
    phone: data.phone || data.mobile || "",
    avatarUrl: data.avatarUrl || "",
    addressLine1: data.addressLine1 || "",
    addressLine2: data.addressLine2 || "",
    city: data.city || "",
    state: data.state || "",
    postalCode: data.postalCode || "",
    country: data.country || "",
    role: data.role || "CUSTOMER",
    status: data.status || data.accountStatus || "ACTIVE",
    blocked: Boolean(data.blocked),
    createdAt: data.createdAt || data.created_at || "",
    updatedAt: data.updatedAt || data.updated_at || "",
    lastLoginAt: data.lastLoginAt || data.last_login || "",
  };
};

const PROFILE_EMPTY = {
  username: "",
  email: "",
  phone: "",
  avatarUrl: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState("Guest");
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(PROFILE_EMPTY);
  

  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  

  const loadProfile = async () => {
    const endpoints = [`${API_BASE_URL}/api/users/profile`, `${API_BASE_URL}/api/users/me`, `${API_BASE_URL}/api/auth/me`];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, { credentials: "include" });
        if (!response.ok) continue;

        const data = await response.json();
        const normalized = normalizeProfile(data);
        setProfile(normalized);
        setUsername(normalized.username || "Guest");
        setFormData({
          username: normalized.username || "",
          email: normalized.email || "",
          phone: normalized.phone || "",
          avatarUrl: normalized.avatarUrl || "",
          addressLine1: normalized.addressLine1 || "",
          addressLine2: normalized.addressLine2 || "",
          city: normalized.city || "",
          state: normalized.state || "",
          postalCode: normalized.postalCode || "",
          country: normalized.country || "",
        });
        setLoading(false);
        return;
      } catch (error) {
        console.error("Profile fetch failed:", error);
      }
    }

    setProfile(null);
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (!username || username === "Guest") return;

    const fetchCartCount = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/cart/items/count?username=${encodeURIComponent(username)}`, { credentials: "include" });
        const count = await response.json();
        setCartCount(Number(count) || 0);
      } catch (error) {
        console.error("Error fetching cart count:", error);
      }
    };

    fetchCartCount();
  }, [username]);

  const initials = useMemo(() => {
    const name = formData.username || username || "Guest";
    return name.slice(0, 2).toUpperCase();
  }, [formData.username, username]);

  const isDirty = useMemo(() => {
    if (!profile) return false;
    return Object.keys(PROFILE_EMPTY).some((key) => (formData[key] || "") !== (profile[key] || ""));
  }, [formData, profile]);

  const validateForm = () => {
    const trimmedUsername = formData.username.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phone.trim();

    if (trimmedUsername.length < 3) return "Username must be at least 3 characters.";
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) return "Please enter a valid email address.";
    if (trimmedPhone && !/^\d{7,15}$/.test(trimmedPhone)) return "Phone must contain 7 to 15 digits only.";
    return "";
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file.");
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error("Image size must be under 1 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, avatarUrl: String(reader.result || "") }));
      
    };
    reader.readAsDataURL(file);
  };

  const handleEditToggle = () => {
    
    
    setEditMode(true);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({ ...PROFILE_EMPTY, ...profile });
    }
    
    
    setEditMode(false);
  };

  const handleSave = async () => {
    
    

    const validationError = validateForm();
    if (validationError) {
      toast.warning(validationError);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          avatarUrl: formData.avatarUrl || "",
          addressLine1: formData.addressLine1.trim(),
          addressLine2: formData.addressLine2.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          postalCode: formData.postalCode.trim(),
          country: formData.country.trim(),
        }),
      });

      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(responseData?.error || "Unable to update profile right now. Please try again.");

      const normalized = normalizeProfile(responseData);
      setProfile(normalized);
      setUsername(normalized.username || "Guest");
      setFormData({ ...PROFILE_EMPTY, ...normalized });
      toast.success("Profile updated successfully.");
      setEditMode(false);
    } catch (error) {
      toast.error(error.message || "Unable to update profile right now. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.warning("Please fill in all password fields.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.warning("New password and confirm password must match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/password`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      });

      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(responseData?.error || "Unable to change password. Please try again.");

      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed successfully.");
    } catch (error) {
      toast.error(error.message || "Unable to change password. Please try again.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const fullAddress = [formData.addressLine1, formData.addressLine2, formData.city, formData.state, formData.postalCode, formData.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Header cartCount={cartCount} username={username} />

      <main className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Account Settings</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your profile, security preferences, and shipping addresses.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-1 space-y-6">
                <div className="h-64 rounded-2xl bg-white dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"></div>
             </div>
             <div className="lg:col-span-2 space-y-6">
                <div className="h-96 rounded-2xl bg-white dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"></div>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="overflow-hidden rounded-[20px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative">
                <div className="h-[120px] bg-gradient-to-r from-blue-500 to-purple-600"></div>
                
                <div className="px-6 pb-6 relative">
                  <div className="-mt-16 mb-4 relative flex flex-col items-center">
                    <div className="relative h-[120px] w-[120px] rounded-full border-[6px] border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 shadow-sm flex items-center justify-center overflow-hidden">
                      <img src={formData.avatarUrl || useravatar} alt="Profile" className="h-full w-full object-cover" />
                      
                      {editMode && (
                        <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                           <Camera className="text-white h-8 w-8 mb-1" />
                           <span className="text-white text-[10px] font-bold uppercase tracking-wider">Upload</span>
                           <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={saving} />
                        </label>
                      )}
                    </div>
                    
                    {editMode && (
                      <div className="flex justify-center gap-3 mt-4 mb-2">
                        {CUSTOM_AVATARS.map((url, i) => (
                           <button type="button" key={i} onClick={() => setFormData({...formData, avatarUrl: url})} className={`h-10 w-10 rounded-full border-2 overflow-hidden bg-white transition-all ${formData.avatarUrl === url ? 'border-indigo-600 scale-110 shadow-md ring-2 ring-indigo-600/20' : 'border-transparent hover:border-slate-300 hover:scale-105 shadow-sm'}`}>
                              <img src={url} alt="preset" className="h-full w-full object-cover" />
                           </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <h2 className="text-[22px] font-bold text-slate-900 dark:text-white mb-0.5 tracking-tight">{formData.username || "User"}</h2>
                    <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-3">{formData.email || "No email provided"}</p>
                    
                    <div className="flex justify-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/50 dark:border-indigo-500/30 dark:bg-indigo-500/10 px-3.5 py-1 text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                        <ShieldCheck className="h-4 w-4" />
                        {valueOrFallback(profile?.role, "CUSTOMER")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700 px-6 py-2 bg-[#fdfdfd] dark:bg-slate-800/50">
                   <div className="flex items-center justify-between text-[15px] py-3.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors -mx-6 px-6 cursor-default">
                     <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2.5"><Calendar className="h-[18px] w-[18px] text-slate-400" /> Joined</span>
                     <span className="font-semibold text-slate-900 dark:text-white">{formatDateTime(profile?.createdAt).split(",")[0]}</span>
                   </div>
                   <div className="flex items-center justify-between text-[15px] py-3.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors -mx-6 px-6 cursor-default">
                     <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2.5"><Clock className="h-[18px] w-[18px] text-slate-400" /> Last Login</span>
                     <span className="font-semibold text-slate-900 dark:text-white">{formatDateTime(profile?.lastLoginAt).split(",")[0]}{formatDateTime(profile?.lastLoginAt).split(",")[1] ? `, ${formatDateTime(profile?.lastLoginAt).split(",")[1].trim()}` : ''}</span>
                   </div>
                   <div className="flex items-center justify-between text-[15px] py-3.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors -mx-6 px-6 cursor-default">
                     <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2.5"><AlertTriangle className="h-[18px] w-[18px] text-slate-400" /> Status</span>
                     <span className={`font-bold ${profile?.blocked ? 'text-red-600 dark:text-red-400' : 'text-[#059669] dark:text-[#34d399]'}`}>
                        {profile?.blocked ? "BLOCKED" : valueOrFallback(profile?.status, "ACTIVE")}
                     </span>
                   </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400 shadow-inner">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Personal Information</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Update your contact details and shipping address.</p>
                    </div>
                  </div>
                  
                  {!editMode ? (
                    <button type="button" onClick={handleEditToggle} className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-600 hover:scale-[1.02]">
                      <Edit2 className="h-4 w-4" /> Edit
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={handleCancel} disabled={saving} className="inline-flex items-center rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50">
                         Cancel
                      </button>
                      <button type="button" onClick={handleSave} disabled={saving || !isDirty} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                         {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="h-4 w-4" />}
                         Save Profile
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Username</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
                      <input type="text" value={formData.username} disabled={!editMode || saving} onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))} className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800 transition-all font-medium" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
                      <input type="email" value={formData.email} disabled={!editMode || saving} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800 transition-all font-medium" />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-400" />
                      <input type="text" value={formData.phone} disabled={!editMode || saving} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value.replace(/[^\d]/g, "") }))} placeholder="Mobile Number" className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800 transition-all font-medium" />
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2 mt-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2"><MapPin className="h-4 w-4 text-indigo-500" /> Shipping Details</h4>
                  </div>

                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Address Line 1</label>
                    <input type="text" value={formData.addressLine1} disabled={!editMode || saving} onChange={(e) => setFormData((p) => ({ ...p, addressLine1: e.target.value }))} placeholder="Street address, P.O. box, company name, c/o" className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800 transition-all font-medium" />
                  </div>

                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Address Line 2 (Optional)</label>
                    <input type="text" value={formData.addressLine2} disabled={!editMode || saving} onChange={(e) => setFormData((p) => ({ ...p, addressLine2: e.target.value }))} placeholder="Apartment, suite, unit, building, floor, etc." className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800 transition-all font-medium" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">City</label>
                    <input type="text" value={formData.city} disabled={!editMode || saving} onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))} className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800 transition-all font-medium" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">State / Province</label>
                    <input type="text" value={formData.state} disabled={!editMode || saving} onChange={(e) => setFormData((p) => ({ ...p, state: e.target.value }))} className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800 transition-all font-medium" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Postal Code</label>
                    <input type="text" value={formData.postalCode} disabled={!editMode || saving} onChange={(e) => setFormData((p) => ({ ...p, postalCode: e.target.value }))} className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800 transition-all font-medium" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Country</label>
                    <input type="text" value={formData.country} disabled={!editMode || saving} onChange={(e) => setFormData((p) => ({ ...p, country: e.target.value }))} className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800 transition-all font-medium" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mt-6">
                <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-lg text-rose-600 dark:text-rose-400 shadow-inner">
                      <Key className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Security & Password</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Keep your account secure.</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Current Password</label>
                    <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))} disabled={passwordSaving} placeholder="•••••••••" className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800 transition-all font-medium" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">New Password</label>
                    <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData((p) => ({ ...p, newPassword: e.target.value }))} disabled={passwordSaving} placeholder="•••••••••" className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800 transition-all font-medium" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Confirm New Password</label>
                    <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))} disabled={passwordSaving} placeholder="•••••••••" className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 disabled:opacity-60 disabled:bg-slate-50 dark:disabled:bg-slate-800 transition-all font-medium" />
                  </div>

                  <div className="col-span-1 md:col-span-2 pt-4">
                    <button type="button" onClick={handleChangePassword} disabled={passwordSaving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword} className="inline-flex w-full md:w-auto items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-100 px-8 py-3.5 text-[15px] font-bold text-white dark:text-slate-900 shadow-md transition-all hover:bg-slate-800 dark:hover:bg-white hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed">
                       {passwordSaving ? <div className="h-5 w-5 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                       Update Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}



