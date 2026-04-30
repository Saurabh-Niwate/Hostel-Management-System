import { useEffect, useMemo, useState } from "react";
import { Mail, Phone, Search, TriangleAlert } from "lucide-react";
import { api } from "../../lib/api";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { useListFetch } from "../../hooks/useListFetch";
import { motion, AnimatePresence } from "motion/react";

type Profile = {
  USER_ID: number;
  STUDENT_ID: string;
  EMAIL?: string;
  FULL_NAME?: string;
  PHONE?: string;
  AADHAR_NO?: string;
  GUARDIAN_NAME?: string;
  GUARDIAN_EMAIL?: string;
  GUARDIAN_PHONE?: string;
  ADDRESS?: string;
  ROOM_NO?: string;
  PROFILE_IMAGE_URL?: string;
};

type AttendanceRow = {
  ATTENDANCE_ID: number;
  ATTENDANCE_DATE: string;
  STATUS: string;
  REMARKS?: string;
};

type FeeRow = {
  FEE_ID: number;
  TERM_NAME: string;
  AMOUNT_TOTAL: number;
  AMOUNT_PAID: number;
  AMOUNT_DUE: number;
  DUE_DATE?: string;
  STATUS: string;
};

type StudentDetails = {
  profile: Profile;
  attendance: AttendanceRow[];
  fees: FeeRow[];
  attendanceSummary: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
  feeSummary: {
    paidCount: number;
    pendingCount: number;
    totalDue: number;
  };
};

type StudentListRow = {
  USER_ID: number;
  STUDENT_ID: string;
  EMAIL?: string;
  FULL_NAME?: string;
  PHONE?: string;
  ROOM_NO?: string;
  PROFILE_IMAGE_URL?: string;
};

export function AdminStudentView() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: students = [], loading, error, setParams } = useListFetch<StudentListRow>("/admin/students", { q: undefined }, 500);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [localError, setLocalError] = useState("");

  const [modalLoading, setModalLoading] = useState(false);
  const [modalData, setModalData] = useState<StudentDetails | null>(null);
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [complaintData, setComplaintData] = useState<StudentDetails | null>(null);
  const [complaintSubject, setComplaintSubject] = useState("Hostel disciplinary complaint");
  const [complaintMessage, setComplaintMessage] = useState("");

  useEffect(() => {
    // initial load completed mapping
    if (!loading) setInitialLoading(false);
  }, [loading]);

  useEffect(() => {
    setIsFetching(loading);
  }, [loading]);

  useEffect(() => {
    setParams({ q: searchQuery.trim() || undefined });
  }, [searchQuery, setParams]);

  const openStudentModal = async (studentId: string) => {
    setModalLoading(true);
    setLocalError("");
    try {
      const res = await api.get(`/admin/students/${studentId}/details`);
      setModalData(res.data);
    } catch (err: any) {
      setLocalError(err.response?.data?.message || "Failed to fetch student details");
    } finally {
      setModalLoading(false);
    }
  };

  const openComplaintModal = async (studentId: string) => {
    setComplaintLoading(true);
    setLocalError("");
    setComplaintSubject("Hostel disciplinary complaint");
    setComplaintMessage("");
    try {
      const res = await api.get(`/admin/students/${studentId}/details`);
      setComplaintData(res.data);
      const profile = res.data?.profile || {};
      setComplaintMessage(
        `Dear ${profile.GUARDIAN_NAME || "Parent"},\n\nThis is to inform you about a hostel decorum complaint involving ${profile.FULL_NAME || "the student"} (${profile.STUDENT_ID || ""}). Please contact the hostel administration at the earliest for further discussion.\n\nRegards,\nHostel Admin`
      );
    } catch (err: any) {
      setLocalError(err.response?.data?.message || "Failed to fetch student details");
    } finally {
      setComplaintLoading(false);
    }
  };

  const complaintMailtoHref = useMemo(() => {
    if (!complaintData?.profile.GUARDIAN_EMAIL) return null;
    const subject = encodeURIComponent(complaintSubject.trim() || "Hostel disciplinary complaint");
    const body = encodeURIComponent(complaintMessage.trim());
    return `mailto:${complaintData.profile.GUARDIAN_EMAIL}?subject=${subject}&body=${body}`;
  }, [complaintMessage, complaintSubject, complaintData]);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Student Profile, Attendance & Fees</h2>
        {isFetching && <p className="text-sm text-slate-500">Searching...</p>}
      </div>

      {(localError || error) && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{localError || error}</div>}

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search by student ID, name, email, or room..."
            aria-label="Search by student ID, name, email, or room"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg w-full"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">All Students</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Student ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Room</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {students.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No students found.</td></tr>
              ) : (
                students.map((s) => (
                  <tr key={s.USER_ID} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">{s.STUDENT_ID}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{s.FULL_NAME || "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{s.EMAIL || "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{s.ROOM_NO || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openStudentModal(s.STUDENT_ID)}
                          className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openComplaintModal(s.STUDENT_ID)}
                          className="px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
                        >
                          Raise Complaint
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {(modalLoading || modalData) && (
          <ModalShell title="Student Details" onClose={() => setModalData(null)}>
            {modalLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : modalData ? (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                    {modalData.profile.PROFILE_IMAGE_URL ? (
                      <ImageWithFallback
                        src={modalData.profile.PROFILE_IMAGE_URL}
                        alt="Student profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs">No Photo</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{modalData.profile.FULL_NAME || "-"}</p>
                    <p className="text-sm text-slate-500">{modalData.profile.STUDENT_ID || "-"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <p><span className="font-semibold">Student ID:</span> {modalData.profile.STUDENT_ID || "-"}</p>
                  <p><span className="font-semibold">Full Name:</span> {modalData.profile.FULL_NAME || "-"}</p>
                  <p><span className="font-semibold">Email:</span> {modalData.profile.EMAIL || "-"}</p>
                  <p><span className="font-semibold">Phone:</span> {modalData.profile.PHONE || "-"}</p>
                  <p><span className="font-semibold">Aadhar Number:</span> {modalData.profile.AADHAR_NO || "-"}</p>
                  <p><span className="font-semibold">Guardian Name:</span> {modalData.profile.GUARDIAN_NAME || "-"}</p>
                  <p><span className="font-semibold">Guardian Email:</span> {modalData.profile.GUARDIAN_EMAIL || "-"}</p>
                  <p><span className="font-semibold">Guardian Phone:</span> {modalData.profile.GUARDIAN_PHONE || "-"}</p>
                  <p><span className="font-semibold">Room No:</span> {modalData.profile.ROOM_NO || "-"}</p>
                  <p className="md:col-span-2"><span className="font-semibold">Address:</span> {modalData.profile.ADDRESS || "-"}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Attendance Present</p>
                    <p className="text-xl font-bold text-emerald-600">{modalData.attendanceSummary.present}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Attendance Absent</p>
                    <p className="text-xl font-bold text-red-600">{modalData.attendanceSummary.absent}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Total Fee Due</p>
                    <p className="text-xl font-bold text-amber-600">Rs {Number(modalData.feeSummary.totalDue || 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-500">Pending: {modalData.feeSummary.pendingCount} | Paid: {modalData.feeSummary.paidCount}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Attendance Records</h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {modalData.attendance.length === 0 ? (
                          <tr><td colSpan={3} className="px-3 py-4 text-center text-sm text-slate-500">No attendance records found.</td></tr>
                        ) : (
                          modalData.attendance.map((a) => (
                            <tr key={a.ATTENDANCE_ID}>
                              <td className="px-3 py-2 text-sm text-slate-700">{a.ATTENDANCE_DATE}</td>
                              <td className="px-3 py-2 text-sm text-slate-700">{a.STATUS}</td>
                              <td className="px-3 py-2 text-sm text-slate-700">{a.REMARKS || "-"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Fee Records (Pending/Paid)</h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Term</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Total</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Paid</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Due</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {modalData.fees.length === 0 ? (
                          <tr><td colSpan={5} className="px-3 py-4 text-center text-sm text-slate-500">No fee records found.</td></tr>
                        ) : (
                          modalData.fees.map((f) => (
                            <tr key={f.FEE_ID}>
                              <td className="px-3 py-2 text-sm text-slate-700">{f.TERM_NAME}</td>
                              <td className="px-3 py-2 text-sm text-slate-700">{f.AMOUNT_TOTAL}</td>
                              <td className="px-3 py-2 text-sm text-slate-700">{f.AMOUNT_PAID}</td>
                              <td className="px-3 py-2 text-sm font-semibold text-red-700">{f.AMOUNT_DUE}</td>
                              <td className="px-3 py-2 text-sm text-slate-700">{f.STATUS}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </ModalShell>
        )}

        {(complaintLoading || complaintData) && (
          <ModalShell title="Raise Complaint" onClose={() => setComplaintData(null)}>
            {complaintLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              </div>
            ) : complaintData ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-amber-100 p-2 text-amber-700">
                      <TriangleAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Complaint to Parent / Guardian</h4>
                      <p className="text-sm text-slate-600">
                        {complaintData.profile.FULL_NAME || "-"} ({complaintData.profile.STUDENT_ID || "-"})
                      </p>
                      <p className="text-sm text-slate-600">
                        Guardian: {complaintData.profile.GUARDIAN_NAME || "-"}
                      </p>
                    </div>
                  </div>

                  <input
                    type="text"
                    aria-label="Complaint subject"
                    value={complaintSubject}
                    onChange={(e) => setComplaintSubject(e.target.value)}
                    placeholder="Complaint subject"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <textarea
                    aria-label="Complaint details"
                    value={complaintMessage}
                    onChange={(e) => setComplaintMessage(e.target.value)}
                    placeholder="Write the complaint details for the parent or guardian"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-32"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <p><span className="font-semibold">Guardian Email:</span> {complaintData.profile.GUARDIAN_EMAIL || "-"}</p>
                    <p><span className="font-semibold">Guardian Phone:</span> {complaintData.profile.GUARDIAN_PHONE || "-"}</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {complaintMailtoHref ? (
                      <a
                        href={complaintMailtoHref}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        <Mail className="w-4 h-4" />
                        Email Guardian
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm text-slate-500">
                        <Mail className="w-4 h-4" />
                        No guardian email available
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: any;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-5xl bg-white rounded-lg shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="px-3 py-1 text-sm bg-slate-100 rounded-lg hover:bg-slate-200">Close</button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </motion.div>
  );
}
