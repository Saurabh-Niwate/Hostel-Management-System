import { useEffect, useMemo, useState } from "react";
import { Calendar, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { api } from "../../lib/api";
import { WardenAttendanceRow, WardenRoom, WardenStudent } from "./wardenTypes";

type AttendanceDraft = {
  studentId: string;
  studentName: string;
  roomNo: string;
  status: "Present" | "Absent";
  remarks: string;
};

const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export function AttendanceManagement() {
  const [rooms, setRooms] = useState<WardenRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [rows, setRows] = useState<AttendanceDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const res = await api.get("/warden/rooms");
        const roomRows = res.data?.rooms || [];
        setRooms(roomRows);
        if (roomRows.length > 0) setSelectedRoom(roomRows[0].ROOM_NO);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load rooms");
      } finally {
        setLoading(false);
      }
    };
    loadRooms();
  }, []);

  useEffect(() => {
    const loadAttendanceData = async () => {
      if (!selectedRoom || !selectedDate) return;
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        const [roomRes, attendanceRes] = await Promise.all([
          api.get(`/warden/room-students/${encodeURIComponent(selectedRoom)}`),
          api.get(`/warden/attendance/date/${selectedDate}`, { params: { roomNo: selectedRoom } })
        ]);

        const students: WardenStudent[] = roomRes.data?.students || [];
        const attendance: WardenAttendanceRow[] = attendanceRes.data?.attendance || [];
        const attendanceMap = new Map(attendance.map((row) => [row.STUDENT_ID, row]));

        setRows(
          students.map((student) => ({
            studentId: student.STUDENT_ID,
            studentName: student.FULL_NAME || "Student",
            roomNo: student.ROOM_NO || selectedRoom,
            status: (attendanceMap.get(student.STUDENT_ID)?.STATUS as "Present" | "Absent") || "Absent",
            remarks: attendanceMap.get(student.STUDENT_ID)?.REMARKS || ""
          }))
        );
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load attendance data");
      } finally {
        setLoading(false);
      }
    };
    loadAttendanceData();
  }, [selectedRoom, selectedDate]);

  const presentCount = useMemo(() => rows.filter((r) => r.status === "Present").length, [rows]);
  const absentCount = Math.max(rows.length - presentCount, 0);

  const updateStatus = (studentId: string, status: "Present" | "Absent") => {
    setRows((prev) => prev.map((row) => (row.studentId === studentId ? { ...row, status } : row)));
  };

  const handleSave = async () => {
    if (!selectedRoom || !selectedDate || rows.length === 0) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/warden/mark-attendance", {
        roomNo: selectedRoom,
        attendanceDate: selectedDate,
        records: rows.map((row) => ({
          studentId: row.studentId,
          status: row.status,
          remarks: row.remarks || null
        }))
      });
      setSuccess("Attendance saved successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
          <p className="text-gray-500 mt-1">Track and manage room-wise student attendance</p>
        </div>
        <Button onClick={handleSave} disabled={saving || rows.length === 0} className="bg-teal-600 hover:bg-teal-700">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Attendance"}
        </Button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Room</CardTitle>
          </CardHeader>
          <CardContent>
            <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {rooms.map((room) => (
                <option key={room.ROOM_NO} value={room.ROOM_NO}>{room.ROOM_NO}</option>
              ))}
            </select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-700">Present: {presentCount}</Badge>
              <Badge className="bg-red-100 text-red-700">Absent: {absentCount}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Loading attendance...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Student ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Student Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Room No.</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.studentId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{row.studentId}</td>
                      <td className="py-3 px-4">{row.studentName}</td>
                      <td className="py-3 px-4">{row.roomNo}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant={row.status === "Present" ? "default" : "outline"} className={row.status === "Present" ? "bg-green-600 hover:bg-green-700" : ""} onClick={() => updateStatus(row.studentId, "Present")}>Present</Button>
                          <Button size="sm" variant={row.status === "Absent" ? "default" : "outline"} className={row.status === "Absent" ? "bg-red-600 hover:bg-red-700" : ""} onClick={() => updateStatus(row.studentId, "Absent")}>Absent</Button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          value={row.remarks}
                          onChange={(e) => setRows((prev) => prev.map((item) => item.studentId === row.studentId ? { ...item, remarks: e.target.value } : item))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Optional remarks"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
