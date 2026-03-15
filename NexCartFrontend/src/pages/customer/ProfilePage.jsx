import React, { useEffect, useMemo, useState } from "react";
import { Header } from "../../components/layout/Header";
import { Footer } from "../../components/layout/Footer";
import { useToast } from "../../components/ui/ToastContext";
import "../../styles/styles.css";
import API_BASE_URL from '../../config/api';

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
    <div className="customer-homepage">
      <Header cartCount={cartCount} username={username} />

      <main className="main-content profile-main">
        <section className="profile-hero profile-hero-upgraded">
          <div className="profile-card-main">
            <div className="profile-avatar-wrap">
              {formData.avatarUrl ? <img src={formData.avatarUrl} alt="Profile" className="profile-avatar-image" /> : <div className="profile-avatar">{initials}</div>}
            </div>
            <div>
              <p className="profile-kicker">Account Center</p>
              <h1 className="profile-title">My Profile</h1>
              <p className="profile-subtitle">Manage photo, personal details, password, and address for checkout.</p>
            </div>
          </div>

          <div className="profile-quick-stats">
            <p>Cart Items: {cartCount}</p>
            <p>Role: {valueOrFallback(profile?.role, "CUSTOMER")}</p>
            <p>Status: {valueOrFallback(profile?.status, "ACTIVE")}</p>
          </div>
        </section>

        {loading ? (
          <section className="profile-grid-upgraded" aria-label="Loading profile">
            <article className="profile-info-card profile-skeleton-card"><p className="skeleton-box skeleton-line-lg" /><p className="skeleton-box skeleton-line-md" /><p className="skeleton-box skeleton-line-md" /><p className="skeleton-box skeleton-line-sm" /></article>
            <article className="profile-info-card profile-skeleton-card"><p className="skeleton-box skeleton-line-lg" /><p className="skeleton-box skeleton-line-md" /><p className="skeleton-box skeleton-line-md" /><p className="skeleton-box skeleton-line-sm" /></article>
          </section>
        ) : (
          <section className="profile-grid-upgraded profile-grid-2col">
            <article className="profile-info-card profile-edit-card">
              <div className="profile-card-header-row">
                <h3>Personal Information</h3>
                {!editMode ? (
                  <button type="button" className="profile-edit-btn" onClick={handleEditToggle}>Edit Profile</button>
                ) : (
                  <div className="profile-edit-actions">
                    <button type="button" className="profile-cancel-btn" onClick={handleCancel} disabled={saving}>Cancel</button>
                    <button type="button" className="profile-save-btn" onClick={handleSave} disabled={saving || !isDirty}>{saving ? "Saving..." : "Save Changes"}</button>
                  </div>
                )}
              </div>

              <div className="profile-avatar-editor">
                <div className="profile-avatar-preview">{formData.avatarUrl ? <img src={formData.avatarUrl} alt="Profile preview" className="profile-avatar-image" /> : <div className="profile-avatar">{initials}</div>}</div>
                <div className="profile-avatar-controls">
                  <label className="profile-upload-btn">Upload Photo<input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={!editMode || saving} /></label>
                  {formData.avatarUrl ? <button type="button" className="profile-cancel-btn" disabled={!editMode || saving} onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: "" }))}>Remove Photo</button> : null}
                </div>
              </div>

              <div className="profile-form-grid">
                <label>Username<input type="text" value={formData.username} disabled={!editMode || saving} onChange={(e) => setFormData((p) => ({ ...p, username: e.target.value }))} /></label>
                <label>Email<input type="email" value={formData.email} disabled={!editMode || saving} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} /></label>
                <label>Phone<input type="text" value={formData.phone} disabled={!editMode || saving} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value.replace(/[^\d]/g, "") }))} placeholder="Enter mobile number" /></label>
                <label>Address Line 1<input type="text" value={formData.addressLine1} disabled={!editMode || saving} onChange={(e) => setFormData((p) => ({ ...p, addressLine1: e.target.value }))} /></label>
                <label>Address Line 2<input type="text" value={formData.addressLine2} disabled={!editMode || saving} onChange={(e) => setFormData((p) => ({ ...p, addressLine2: e.target.value }))} /></label>
                <label>City<input type="text" value={formData.city} disabled={!editMode || saving} onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))} /></label>
                <label>State<input type="text" value={formData.state} disabled={!editMode || saving} onChange={(e) => setFormData((p) => ({ ...p, state: e.target.value }))} /></label>
                <label>Postal Code<input type="text" value={formData.postalCode} disabled={!editMode || saving} onChange={(e) => setFormData((p) => ({ ...p, postalCode: e.target.value }))} /></label>
                <label>Country<input type="text" value={formData.country} disabled={!editMode || saving} onChange={(e) => setFormData((p) => ({ ...p, country: e.target.value }))} /></label>
              </div>
            </article>

            <article className="profile-info-card">
              <h3>Account Overview</h3>
              <p><strong>User ID:</strong> {valueOrFallback(profile?.userId)}</p>
              <p><strong>Member Since:</strong> {formatDateTime(profile?.createdAt)}</p>
              <p><strong>Last Updated:</strong> {formatDateTime(profile?.updatedAt)}</p>
              <p><strong>Last Login:</strong> {formatDateTime(profile?.lastLoginAt)}</p>
              <p><strong>Blocked:</strong> {profile?.blocked ? "Yes" : "No"}</p>
              <p><strong>Default Address:</strong> {valueOrFallback(fullAddress)}</p>
            </article>

            <article className="profile-info-card profile-password-card">
              <h3>Change Password</h3>
              <div className="profile-form-grid">
                <label>Current Password<input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))} disabled={passwordSaving} /></label>
                <label>New Password<input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData((p) => ({ ...p, newPassword: e.target.value }))} disabled={passwordSaving} /></label>
                <label>Confirm Password<input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))} disabled={passwordSaving} /></label>
              </div>
              <button type="button" className="profile-save-btn profile-password-save" onClick={handleChangePassword} disabled={passwordSaving}>{passwordSaving ? "Updating..." : "Update Password"}</button>
            </article>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}



