import { useState } from "react";
import { api } from "../../lib/api";

type UserDetails = {
  user: {
    USER_ID: number;
    STUDENT_ID?: string;
    EMP_ID?: string;
    EMAIL?: string;
    ROLE_NAME: string;
  };
  studentProfile?: {
    FULL_NAME?: string;
    PHONE?: string;
    GUARDIAN_NAME?: string;
    GUARDIAN_PHONE?: string;
    ADDRESS?: string;
    ROOM_NO?: string;
  } | null;
};

export function UserDetailsPage() {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<UserDetails | null>(null);

  const handleFetch = async () => {
    if (!userId.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await api.get(`/technical-staff/users/${userId.trim()}`);
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch user details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">User Details</h3>
        <div className="flex gap-3">
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user ID"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
          />
          <button onClick={handleFetch} disabled={loading} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
            {loading ? "Loading..." : "Fetch"}
          </button>
        </div>
      </div>

      {data && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <p><span className="font-semibold">User ID:</span> {data.user.USER_ID}</p>
            <p><span className="font-semibold">Identifier:</span> {data.user.STUDENT_ID || data.user.EMP_ID || "-"}</p>
            <p><span className="font-semibold">Email:</span> {data.user.EMAIL || "-"}</p>
            <p><span className="font-semibold">Role:</span> {data.user.ROLE_NAME}</p>
            <p><span className="font-semibold">Full Name:</span> {data.studentProfile?.FULL_NAME || "-"}</p>
            <p><span className="font-semibold">Phone:</span> {data.studentProfile?.PHONE || "-"}</p>
            <p><span className="font-semibold">Guardian:</span> {data.studentProfile?.GUARDIAN_NAME || "-"}</p>
            <p><span className="font-semibold">Guardian Phone:</span> {data.studentProfile?.GUARDIAN_PHONE || "-"}</p>
            <p className="md:col-span-2"><span className="font-semibold">Address:</span> {data.studentProfile?.ADDRESS || "-"}</p>
            <p><span className="font-semibold">Room No:</span> {data.studentProfile?.ROOM_NO || "-"}</p>
          </div>
        </div>
      )}
    </div>
  );
}
