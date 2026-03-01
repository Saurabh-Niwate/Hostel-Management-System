import React, { useEffect, useState } from "react";
import { User, Mail, Phone, MapPin, Building, Edit2, Check, X } from "lucide-react";
import { api } from "../../lib/api";

type StudentProfileData = {
  userId: number;
  studentId: string;
  email: string;
  fullName: string;
  phone: string;
  guardianName: string;
  guardianPhone: string;
  address: string;
  roomNo: string;
  profileImageUrl: string;
};

type Props = {
  onProfileUpdated?: (profile: StudentProfileData) => void;
};

const emptyProfile: StudentProfileData = {
  userId: 0,
  studentId: "",
  email: "",
  fullName: "",
  phone: "",
  guardianName: "",
  guardianPhone: "",
  address: "",
  roomNo: "",
  profileImageUrl: "",
};

const mapProfile = (raw: any): StudentProfileData => ({
  userId: raw.USER_ID || 0,
  studentId: raw.STUDENT_ID || "",
  email: raw.EMAIL || "",
  fullName: raw.FULL_NAME || "",
  phone: raw.PHONE || "",
  guardianName: raw.GUARDIAN_NAME || "",
  guardianPhone: raw.GUARDIAN_PHONE || "",
  address: raw.ADDRESS || "",
  roomNo: raw.ROOM_NO || "",
  profileImageUrl: raw.PROFILE_IMAGE_URL || "",
});

export function StudentProfile({ onProfileUpdated }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [removingImage, setRemovingImage] = useState(false);
  const [profile, setProfile] = useState<StudentProfileData>(emptyProfile);
  const [editForm, setEditForm] = useState<StudentProfileData>(emptyProfile);

  const loadProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/student/profile");
      const mapped = mapProfile(response.data.profile || {});
      setProfile(mapped);
      setEditForm(mapped);
      onProfileUpdated?.(mapped);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      await api.put("/student/profile", {
        email: editForm.email,
        fullName: editForm.fullName,
        phone: editForm.phone,
        guardianName: editForm.guardianName,
        roomNo: editForm.roomNo,
      });
      await loadProfile();
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      await api.post("/student/profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await loadProfile();
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
    try {
      await api.delete("/student/profile-image");
      await loadProfile();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to remove profile image");
    } finally {
      setRemovingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Edit2 size={16} className="mr-2" />
            Edit Profile
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleCancel}
              className="flex items-center px-4 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={16} className="mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              <Check size={16} className="mr-2" />
              Save Changes
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-32 h-32 bg-slate-100 rounded-full mb-4 flex items-center justify-center text-slate-300 overflow-hidden">
              {profile.profileImageUrl ? (
                <img src={profile.profileImageUrl} alt="Student profile" className="w-full h-full object-cover" />
              ) : (
                <User size={64} />
              )}
            </div>
            <label className="mb-4 inline-block">
              <span className="px-3 py-1.5 text-xs bg-indigo-100 text-indigo-700 rounded-lg cursor-pointer hover:bg-indigo-200">
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
            {profile.profileImageUrl && (
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={removingImage}
                className="mb-4 px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
              >
                {removingImage ? "Removing..." : "Remove Photo"}
              </button>
            )}
            <h3 className="text-xl font-bold text-slate-800">{profile.fullName || "Student"}</h3>
            <p className="text-slate-500">{profile.studentId}</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                Room {profile.roomNo || "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoField
                icon={<Mail size={18} />}
                label="Email Address"
                value={editForm.email}
                isEditing={isEditing}
                onChange={(val) => setEditForm({ ...editForm, email: val })}
              />
              <InfoField
                icon={<Phone size={18} />}
                label="Phone Number"
                value={editForm.phone}
                isEditing={isEditing}
                onChange={(val) => setEditForm({ ...editForm, phone: val })}
              />
              <InfoField
                icon={<Building size={18} />}
                label="Guardian Name"
                value={editForm.guardianName}
                isEditing={isEditing}
                onChange={(val) => setEditForm({ ...editForm, guardianName: val })}
              />
              <InfoField
                icon={<Phone size={18} />}
                label="Guardian Phone"
                value={editForm.guardianPhone}
                isEditing={isEditing}
                onChange={(val) => setEditForm({ ...editForm, guardianPhone: val })}
                readOnly
              />
              <InfoField
                icon={<User size={18} />}
                label="Room Number"
                value={editForm.roomNo}
                isEditing={isEditing}
                onChange={(val) => setEditForm({ ...editForm, roomNo: val })}
              />
              <div className="md:col-span-2">
                <InfoField
                  icon={<MapPin size={18} />}
                  label="Address"
                  value={editForm.address}
                  isEditing={isEditing}
                  onChange={(val) => setEditForm({ ...editForm, address: val })}
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface InfoFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isEditing?: boolean;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

function InfoField({ icon, label, value, isEditing, onChange, readOnly }: InfoFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center">
        {icon} <span className="ml-2">{label}</span>
      </label>
      {isEditing && !readOnly && onChange ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
        />
      ) : (
        <p className="text-slate-800 font-medium py-2">{value || "-"}</p>
      )}
    </div>
  );
}
