import { useEffect, useState } from "react";
import { MessageSquare, Send, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { api } from "../../lib/api";

type FeedbackRow = {
  FEEDBACK_ID: number;
  FACILITY_AREA: string;
  MESSAGE: string;
  RATING?: number;
  STATUS: string;
  CREATED_AT: string;
};

export function FeedbackView() {
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [facilityArea, setFacilityArea] = useState("Maintenance");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<string>("5");
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([]);

  const loadFeedback = async () => {
    try {
      const res = await api.get("/student/feedback");
      setFeedbacks(res.data?.feedback || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      await api.post("/student/feedback", {
        facilityArea: facilityArea.trim(),
        message: message.trim(),
        rating: Number(rating),
      });
      setSuccess("Feedback submitted successfully");
      setMessage("");
      setRating("5");
      await loadFeedback();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
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
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-800">Feedback & Complaints</h2>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <MessageSquare className="mr-2 text-blue-600" size={20} /> New Feedback
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Facility Area</label>
              <select
                value={facilityArea}
                onChange={(e) => setFacilityArea(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Maintenance">Maintenance</option>
                <option value="Food / Canteen">Food / Canteen</option>
                <option value="Internet / Wi-Fi">Internet / Wi-Fi</option>
                <option value="Cleanliness">Cleanliness</option>
                <option value="Security">Security</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Provide detailed information..."
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg resize-none"
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rating (1-5)</label>
              <select value={rating} onChange={(e) => setRating(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="5">5</option>
                <option value="4">4</option>
                <option value="3">3</option>
                <option value="2">2</option>
                <option value="1">1</option>
              </select>
            </div>
            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Send size={18} className="mr-2" />
              )}
              Submit Feedback
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Previous Feedbacks</h3>
          {feedbacks.map((item) => (
            <div
              key={item.FEEDBACK_ID}
              className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4 mb-3 md:mb-0">
                <div className={`p-2 rounded-lg mt-1 ${item.STATUS === "Resolved" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                  {item.STATUS === "Resolved" ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-full">{item.FACILITY_AREA}</span>
                    <span className="text-sm text-slate-400">{item.CREATED_AT}</span>
                  </div>
                  <h4 className="font-semibold text-slate-800 mt-1">{item.MESSAGE}</h4>
                  <p className="text-xs text-slate-500 mt-1">Rating: {item.RATING ?? "-"}</p>
                </div>
              </div>
              <div className="ml-14 md:ml-0 flex items-center">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${
                    item.STATUS === "Resolved" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {item.STATUS}
                </span>
              </div>
            </div>
          ))}

          {feedbacks.length === 0 && (
            <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 border-dashed">
              <AlertCircle className="mx-auto text-slate-300 mb-3" size={40} />
              <p className="text-slate-500 font-medium">No feedback submitted yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
