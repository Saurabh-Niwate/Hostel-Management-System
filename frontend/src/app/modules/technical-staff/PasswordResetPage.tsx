import { useState } from "react";

export function PasswordResetPage() {
  const [userId, setUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !newPassword.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setSuccess(`Password reset successfully for ${userId} (Demo Mode)`);
      setNewPassword("");
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Reset User Password (Demo Mode)</h3>
        <form onSubmit={handleSubmit} className="space-y-3 max-w-xl">
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="User ID (e.g. STU001)"
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

