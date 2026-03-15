import { useState } from "react";
import { api } from "../../lib/api";

export function PasswordResetPage() {
  const [userId, setUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !newPassword.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.put(`/technical-staff/users/${userId.trim()}/password`, {
        newPassword: newPassword.trim(),
      });
      setSuccess("Password reset successfully");
      setNewPassword("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Reset User Password</h3>
        <form onSubmit={handleSubmit} className="space-y-3 max-w-xl">
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="User ID"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            required
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            required
          />
          <button type="submit" disabled={loading} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50">
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
