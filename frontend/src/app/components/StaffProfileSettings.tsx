import { useEffect, useState } from "react";
import { Mail, Phone, User, IdCard } from "lucide-react";
import { api } from "../lib/api";
import { ChangePasswordSection } from "./ChangePasswordSection";
import { ImageWithFallback } from "./figma/ImageWithFallback";

type StaffProfile = {
  USER_ID: number;
  EMP_ID?: string;
  EMAIL?: string;
  ROLE_NAME?: string;
  FULL_NAME?: string;
  PHONE?: string;
  PROFILE_IMAGE_URL?: string;
};

const emptyProfile: StaffProfile = {
  USER_ID: 0,
  EMP_ID: "",
  EMAIL: "",
  ROLE_NAME: "",
  FULL_NAME: "",
  PHONE: "",
  PROFILE_IMAGE_URL: "",
};

export function StaffProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [removingImage, setRemovingImage] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState<StaffProfile>(emptyProfile);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
  });

  const loadProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/auth/profile");
      const raw = res.data?.profile || {};
      setProfile(raw);
      setForm({
        fullName: raw.FULL_NAME || "",
        phone: raw.PHONE || "",
        email: raw.EMAIL || "",
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.put("/auth/profile", {
        fullName: form.fullName.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
      });
      setSuccess("Profile updated successfully");
      await loadProfile();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      await api.post("/auth/profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await loadProfile();
      setSuccess("Profile picture updated successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to upload profile image");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleRemoveImage = async () => {
    setRemovingImage(true);
    setError("");
    setSuccess("");
    try {
      await api.delete("/auth/profile-image");
      await loadProfile();
      setSuccess("Profile picture removed successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to remove profile image");
    } finally {
      setRemovingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center text-slate-300 border border-slate-200 mb-4">
            {profile.PROFILE_IMAGE_URL ? (
              <ImageWithFallback src={profile.PROFILE_IMAGE_URL} alt="Staff profile" className="w-full h-full object-cover" />
            ) : (
              <User size={48} />
            )}
          </div>
          
          <div className="flex flex-col gap-2 mb-4">
            <label className="inline-block">
              <span className="px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors">
                {uploadingImage ? "Uploading..." : "Upload Photo"}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImage}
              />
            </label>
            {profile.PROFILE_IMAGE_URL && (
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={removingImage}
                className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                {removingImage ? "Removing..." : "Remove Photo"}
              </button>
            )}
          </div>

          <h3 className="text-xl font-bold text-slate-800 mt-2">{profile.FULL_NAME || "Staff User"}</h3>
          <p className="text-slate-500 mt-1">{profile.ROLE_NAME || "-"}</p>
          <div className="mt-4 space-y-2 text-sm text-slate-600 w-full text-left border-t border-slate-100 pt-4">
            <p className="flex items-center gap-2"><IdCard size={16} /> {profile.EMP_ID || "-"}</p>
            <p className="flex items-center gap-2"><Mail size={16} /> {profile.EMAIL || "-"}</p>
            <p className="flex items-center gap-2"><Phone size={16} /> {profile.PHONE || "-"}</p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Profile Information</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Employee ID</label>
              <input value={profile.EMP_ID || ""} readOnly className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Role Name</label>
              <input value={profile.ROLE_NAME || ""} readOnly className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Full Name" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone Number" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400" />
            </div>
            <div className="md:col-span-2 mt-2">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors">
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ChangePasswordSection />
    </div>
  );
}
