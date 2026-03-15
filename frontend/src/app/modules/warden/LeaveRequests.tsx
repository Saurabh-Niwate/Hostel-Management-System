import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { api } from "../../lib/api";
import { WardenLeaveRow, WardenRoom } from "./wardenTypes";

export function LeaveRequests() {
  const [leaveRequests, setLeaveRequests] = useState<WardenLeaveRow[]>([]);
  const [rooms, setRooms] = useState<WardenRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "Pending" | "Approved" | "Rejected">("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<WardenLeaveRow | null>(null);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const roomRes = await api.get("/warden/rooms");
        setRooms(roomRes.data?.rooms || []);
      } catch {
        setRooms([]);
      }
    };
    loadMeta();
  }, []);

  useEffect(() => {
    const loadLeaves = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/warden/leave-status", {
          params: {
            status: filter === "all" ? undefined : filter,
            roomNo: roomFilter === "all" ? undefined : roomFilter
          }
        });
        setLeaveRequests(res.data?.leaves || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load leave requests");
      } finally {
        setLoading(false);
      }
    };
    loadLeaves();
  }, [filter, roomFilter]);

  const pendingCount = leaveRequests.filter((req) => req.STATUS === "Pending").length;
  const approvedCount = leaveRequests.filter((req) => req.STATUS === "Approved").length;
  const rejectedCount = leaveRequests.filter((req) => req.STATUS === "Rejected").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 mr-1 inline" />Pending</Badge>;
      case "Approved":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1 inline" />Approved</Badge>;
      case "Rejected":
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1 inline" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Leave Requests</h2>
        <p className="text-gray-500 mt-1">View student leave applications</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Requests</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{leaveRequests.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-amber-600">{pendingCount}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Approved</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{approvedCount}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Rejected</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{rejectedCount}</div></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {["all", "Pending", "Approved", "Rejected"].map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status as typeof filter)}
              className={filter === status ? "bg-teal-600 hover:bg-teal-700" : ""}
            >
              {status}
            </Button>
          ))}
        </div>
        <select value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
          <option value="all">All Rooms</option>
          {rooms.map((room) => (
            <option key={room.ROOM_NO} value={room.ROOM_NO}>{room.ROOM_NO}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Leave Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-gray-500">Loading leave requests...</p>
              ) : (
                <div className="space-y-3">
                  {leaveRequests.map((request) => (
                    <div
                      key={request.LEAVE_ID}
                      onClick={() => setSelectedRequest(request)}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedRequest?.LEAVE_ID === request.LEAVE_ID ? "border-teal-500 bg-teal-50" : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">{request.FULL_NAME || "Student"}</h3>
                          <p className="text-sm text-gray-500">{request.STUDENT_ID} • Room {request.ROOM_NO || "-"}</p>
                        </div>
                        {getStatusBadge(request.STATUS)}
                      </div>
                      <p className="text-sm text-gray-700">{request.LEAVE_TYPE}</p>
                      <p className="text-sm text-gray-500 mt-1">{request.FROM_DATE} to {request.TO_DATE}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {selectedRequest ? (
            <Card>
              <CardHeader>
                <CardTitle>Leave Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div><label className="text-sm font-medium text-gray-500">Student</label><p className="text-gray-900 mt-1">{selectedRequest.FULL_NAME || "-"} ({selectedRequest.STUDENT_ID})</p></div>
                <div><label className="text-sm font-medium text-gray-500">Room</label><p className="text-gray-900 mt-1">{selectedRequest.ROOM_NO || "-"}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Type</label><p className="text-gray-900 mt-1">{selectedRequest.LEAVE_TYPE}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Duration</label><p className="text-gray-900 mt-1">{selectedRequest.FROM_DATE} to {selectedRequest.TO_DATE}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Applied On</label><p className="text-gray-900 mt-1">{selectedRequest.CREATED_AT}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Reason</label><p className="text-gray-900 mt-1">{selectedRequest.REASON}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Status</label><div className="mt-1">{getStatusBadge(selectedRequest.STATUS)}</div></div>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="py-12 text-center text-gray-500">Select a leave request to view details</CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
