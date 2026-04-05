import { useEffect, useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { api } from "../../lib/api";

type FeedbackRow = {
  FEEDBACK_ID: number;
  STUDENT_ID: string;
  FULL_NAME?: string;
  ROOM_NO?: string;
  FACILITY_AREA: string;
  MESSAGE: string;
  RATING?: number;
  STATUS: "Open" | "In Review" | "Closed" | string;
  CREATED_AT: string;
};

export function FeedbackManagement() {
  const [feedbackList, setFeedbackList] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Open" | "In Review" | "Closed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackRow | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadFeedback = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/warden/feedback", {
        params: {
          status: statusFilter === "all" ? undefined : statusFilter,
          q: searchQuery.trim() || undefined
        }
      });
      const rows = res.data?.feedback || [];
      setFeedbackList(rows);
      if (rows.length > 0 && selectedFeedback) {
        const updated = rows.find((row: FeedbackRow) => row.FEEDBACK_ID === selectedFeedback.FEEDBACK_ID);
        setSelectedFeedback(updated || rows[0]);
      } else if (rows.length > 0 && !selectedFeedback) {
        setSelectedFeedback(rows[0]);
      } else if (rows.length === 0) {
        setSelectedFeedback(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = setTimeout(() => {
      loadFeedback();
    }, 300);
    return () => clearTimeout(id);
  }, [statusFilter, searchQuery]);

  const counts = useMemo(() => ({
    total: feedbackList.length,
    open: feedbackList.filter((row) => row.STATUS === "Open").length,
    inReview: feedbackList.filter((row) => row.STATUS === "In Review").length,
    closed: feedbackList.filter((row) => row.STATUS === "Closed").length
  }), [feedbackList]);

  const handleStatusChange = async (feedbackId: number, status: "Open" | "In Review" | "Closed") => {
    setUpdatingId(feedbackId);
    setError("");
    setSuccess("");
    try {
      await api.put(`/warden/feedback/${feedbackId}/status`, { status });
      setSuccess("Feedback status updated successfully");
      await loadFeedback();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update feedback status");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "Open") return <Badge className="bg-amber-100 text-amber-700">Open</Badge>;
    if (status === "In Review") return <Badge className="bg-blue-100 text-blue-700">In Review</Badge>;
    if (status === "Closed") return <Badge className="bg-violet-100 text-violet-700">Closed</Badge>;
    return <Badge>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="gap-0"><CardHeader className="pb-1"><CardTitle className="text-sm font-medium text-gray-500">Total</CardTitle></CardHeader><CardContent className="pt-0"><div className="text-2xl font-bold">{counts.total}</div></CardContent></Card>
        <Card className="gap-0"><CardHeader className="pb-1"><CardTitle className="text-sm font-medium text-gray-500">Open</CardTitle></CardHeader><CardContent className="pt-0"><div className="text-2xl font-bold text-amber-600">{counts.open}</div></CardContent></Card>
        <Card className="gap-0"><CardHeader className="pb-1"><CardTitle className="text-sm font-medium text-gray-500">In Review</CardTitle></CardHeader><CardContent className="pt-0"><div className="text-2xl font-bold text-blue-600">{counts.inReview}</div></CardContent></Card>
        <Card className="gap-0"><CardHeader className="pb-1"><CardTitle className="text-sm font-medium text-gray-500">Closed</CardTitle></CardHeader><CardContent className="pt-0"><div className="text-2xl font-bold text-violet-600">{counts.closed}</div></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by student, room, area, or message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
        />
        <div className="flex gap-2 flex-wrap">
          {["all", "Open", "In Review", "Closed"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status as typeof statusFilter)}
              className={statusFilter === status ? "bg-violet-600 hover:bg-violet-700" : ""}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Student Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-gray-500">Loading feedback...</p>
              ) : feedbackList.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <MessageSquare className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                  No feedback found
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbackList.map((item) => (
                    <div
                      key={item.FEEDBACK_ID}
                      onClick={() => setSelectedFeedback(item)}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedFeedback?.FEEDBACK_ID === item.FEEDBACK_ID ? "border-violet-500 bg-violet-50" : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{item.FULL_NAME || item.STUDENT_ID}</h3>
                          <p className="text-sm text-gray-500">{item.STUDENT_ID} | Room {item.ROOM_NO || "-"}</p>
                          <p className="text-sm text-gray-700 mt-2">{item.FACILITY_AREA}</p>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.MESSAGE}</p>
                        </div>
                        {getStatusBadge(item.STATUS)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {selectedFeedback ? (
            <Card>
              <CardHeader>
                <CardTitle>Feedback Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div><label className="text-sm font-medium text-gray-500">Student</label><p className="text-gray-900 mt-1">{selectedFeedback.FULL_NAME || "-"} ({selectedFeedback.STUDENT_ID})</p></div>
                <div><label className="text-sm font-medium text-gray-500">Room</label><p className="text-gray-900 mt-1">{selectedFeedback.ROOM_NO || "-"}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Facility Area</label><p className="text-gray-900 mt-1">{selectedFeedback.FACILITY_AREA}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Rating</label><p className="text-gray-900 mt-1">{selectedFeedback.RATING ?? "-"}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Submitted On</label><p className="text-gray-900 mt-1">{selectedFeedback.CREATED_AT}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Message</label><p className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedFeedback.MESSAGE}</p></div>
                <div><label className="text-sm font-medium text-gray-500">Current Status</label><div className="mt-1">{getStatusBadge(selectedFeedback.STATUS)}</div></div>
                <div className="grid grid-cols-1 gap-2">
                  <Button disabled={updatingId === selectedFeedback.FEEDBACK_ID} onClick={() => handleStatusChange(selectedFeedback.FEEDBACK_ID, "Open")} variant="outline">Mark Open</Button>
                  <Button disabled={updatingId === selectedFeedback.FEEDBACK_ID} onClick={() => handleStatusChange(selectedFeedback.FEEDBACK_ID, "In Review")} className="bg-blue-600 hover:bg-blue-700">Mark In Review</Button>
                  <Button disabled={updatingId === selectedFeedback.FEEDBACK_ID} onClick={() => handleStatusChange(selectedFeedback.FEEDBACK_ID, "Closed")} className="bg-violet-600 hover:bg-violet-700">Mark Closed</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="py-12 text-center text-gray-500">Select feedback to view details</CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
