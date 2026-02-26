
import React, { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Building, Edit2, Check, X } from "lucide-react";
import { motion } from "motion/react";

export function StudentProfile() {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    // Dummy Data
    const [profile, setProfile] = useState({
        name: "John Doe",
        studentId: "STU2024001",
        email: "john.doe@university.edu",
        phone: "+1 234 567 890",
        room: "A-101",
        hostelBlock: "Block A",
        department: "Computer Science",
        year: "3rd Year",
        address: "123 Campus Avenue, University City"
    });

    const [editForm, setEditForm] = useState(profile);

    useEffect(() => {
        // Simulate fetching data
        setTimeout(() => setLoading(false), 800);
    }, []);

    const handleSave = () => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setProfile(editForm);
            setIsEditing(false);
            setLoading(false);
        }, 1000);
    };

    const handleCancel = () => {
        setEditForm(profile);
        setIsEditing(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
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
                            className="flex items-center px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-colors"
                        >
                            <Check size={16} className="mr-2" />
                            Save Changes
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="md:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <div className="w-32 h-32 bg-slate-100 rounded-full mb-4 flex items-center justify-center text-slate-300">
                            <User size={64} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">{profile.name}</h3>
                        <p className="text-slate-500">{profile.studentId}</p>
                        <div className="mt-4 flex flex-wrap gap-2 justify-center">
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                                {profile.department}
                            </span>
                            <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-medium">
                                {profile.year}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Details Form */}
                <div className="md:col-span-2">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Personal Information</h3>
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
                                label="Hostel Block"
                                value={editForm.hostelBlock}
                                readOnly
                            />
                            <InfoField
                                icon={<User size={18} />}
                                label="Room Number"
                                value={editForm.room}
                                readOnly
                            />
                            <div className="md:col-span-2">
                                <InfoField
                                    icon={<MapPin size={18} />}
                                    label="Permanent Address"
                                    value={editForm.address}
                                    isEditing={isEditing}
                                    onChange={(val) => setEditForm({ ...editForm, address: val })}
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
                <p className="text-slate-800 font-medium py-2">{value}</p>
            )}
        </div>
    )
}
