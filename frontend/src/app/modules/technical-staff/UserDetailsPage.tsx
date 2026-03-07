import { useState } from "react";

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

const getDummyUserDetails = (userId: string): UserDetails => {
  const idStr = userId.trim();
  if (idStr === "1" || idStr.toUpperCase() === "STU001") {
    return {
      user: { USER_ID: 1, STUDENT_ID: "STU001", EMAIL: "saurabh@example.com", ROLE_NAME: "Student" },
      studentProfile: {
        FULL_NAME: "Saurabh Niwate",
        PHONE: "9876543210",
        GUARDIAN_NAME: "Sunil Niwate",
        GUARDIAN_PHONE: "9123456789",
        ADDRESS: "123, Hostel Block A",
        ROOM_NO: "A-101",
      }
    };
  }
  if (idStr === "2" || idStr.toUpperCase() === "EMP001") {
    return {
      user: { USER_ID: 2, EMP_ID: "EMP001", EMAIL: "warden@example.com", ROLE_NAME: "Warden" },
      studentProfile: null
    };
  }
  return {
    user: { USER_ID: 999, STUDENT_ID: idStr, EMAIL: "unknown@example.com", ROLE_NAME: "Student" },
    studentProfile: {
      FULL_NAME: "Unknown User",
      PHONE: "0000000000",
      GUARDIAN_NAME: "Unknown Guardian",
      GUARDIAN_PHONE: "0000000000",
      ADDRESS: "None",
      ROOM_NO: "N/A",
    }
  };
};

export function UserDetailsPage() {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UserDetails | null>(null);

  const handleFetch = () => {
    if (!userId.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setData(getDummyUserDetails(userId));
      setLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">User Details (Demo Mode)</h3>
        <p className="text-xs text-slate-500 mb-2">Try "STU001", "EMP001" or any other ID.</p>
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
            {data.studentProfile && (
              <>
                <p><span className="font-semibold">Full Name:</span> {data.studentProfile.FULL_NAME || "-"}</p>
                <p><span className="font-semibold">Phone:</span> {data.studentProfile.PHONE || "-"}</p>
                <p><span className="font-semibold">Guardian:</span> {data.studentProfile.GUARDIAN_NAME || "-"}</p>
                <p><span className="font-semibold">Guardian Phone:</span> {data.studentProfile.GUARDIAN_PHONE || "-"}</p>
                <p className="md:col-span-2"><span className="font-semibold">Address:</span> {data.studentProfile.ADDRESS || "-"}</p>
                <p><span className="font-semibold">Room No:</span> {data.studentProfile.ROOM_NO || "-"}</p>
              </>
            )}
            {!data.studentProfile && data.user.ROLE_NAME !== "Student" && (
              <p className="md:col-span-2 text-slate-500 italic">No additional profile details for staff members available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

