import { useEffect, useMemo, useState } from "react";
import { Plus, Vote, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { api } from "../../lib/api";

type PollOption = {
  OPTION_ID: number;
  OPTION_NAME: string;
  DESCRIPTION?: string;
  VOTE_COUNT: number;
};

type DinnerPoll = {
  POLL_ID: number;
  TITLE: string;
  DINNER_DATE: string;
  CLOSES_AT: string;
  POLL_STATUS: "Active" | "Scheduled" | "Closed";
  TOTAL_VOTES: number;
  OPTIONS: PollOption[];
};

type PollFormOption = {
  optionName: string;
  description: string;
};

const getTodayDate = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export function DinnerPollManagement() {
  const [polls, setPolls] = useState<DinnerPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    dinnerDate: getTodayDate(),
    closesAt: "",
    options: [
      { optionName: "", description: "" },
      { optionName: "", description: "" },
    ] as PollFormOption[],
  });

  const loadPolls = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/canteen-owner/dinner-polls");
      setPolls(res.data?.polls || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load dinner polls");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolls();
  }, []);

  const stats = useMemo(
    () => ({
      total: polls.length,
      active: polls.filter((poll) => poll.POLL_STATUS === "Active").length,
      scheduled: polls.filter((poll) => poll.POLL_STATUS === "Scheduled").length,
      closed: polls.filter((poll) => poll.POLL_STATUS === "Closed").length,
    }),
    [polls]
  );

  const resetForm = () => {
    setForm({
      title: "",
      dinnerDate: getTodayDate(),
      closesAt: "",
      options: [
        { optionName: "", description: "" },
        { optionName: "", description: "" },
      ],
    });
  };

  const handleCreate = async () => {
    setError("");
    setSuccess("");
    try {
      await api.post("/canteen-owner/dinner-polls", {
        title: form.title.trim(),
        dinnerDate: form.dinnerDate,
        closesAt: form.closesAt.replace("T", " "),
        options: form.options,
      });
      setSuccess("Dinner poll created successfully");
      setShowCreateForm(false);
      resetForm();
      await loadPolls();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create dinner poll");
    }
  };

  const handleClosePoll = async (pollId: number) => {
    setError("");
    setSuccess("");
    try {
      await api.put(`/canteen-owner/dinner-polls/${pollId}/close`);
      setSuccess("Dinner poll closed successfully");
      await loadPolls();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to close dinner poll");
    }
  };

  const addOption = () => {
    if (form.options.length >= 4) return;
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { optionName: "", description: "" }],
    }));
  };

  const removeOption = (index: number) => {
    if (form.options.length <= 2) return;
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button
          onClick={() => {
            resetForm();
            setShowCreateForm(true);
          }}
          className="bg-teal-600 hover:bg-teal-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Poll
        </Button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Total Polls</p><p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Active</p><p className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Scheduled</p><p className="text-2xl font-bold text-blue-600 mt-1">{stats.scheduled}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Closed</p><p className="text-2xl font-bold text-slate-700 mt-1">{stats.closed}</p></CardContent></Card>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading dinner polls...</div>
      ) : polls.length === 0 ? (
        <Card><CardContent className="p-6 text-sm text-slate-500">No dinner polls created yet.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {polls.map((poll) => (
            <Card key={poll.POLL_ID} className={poll.POLL_STATUS === "Active" ? "border-l-4 border-l-emerald-500" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{poll.TITLE}</CardTitle>
                    <div className="mt-2 space-y-1 text-sm text-slate-500">
                      <p className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {poll.DINNER_DATE}</p>
                      <p className="flex items-center gap-2"><Clock className="h-4 w-4" /> Closes: {poll.CLOSES_AT}</p>
                      <p className="flex items-center gap-2"><Vote className="h-4 w-4" /> Votes: {poll.TOTAL_VOTES}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    poll.POLL_STATUS === "Active"
                      ? "bg-emerald-100 text-emerald-700"
                      : poll.POLL_STATUS === "Scheduled"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-700"
                  }`}>
                    {poll.POLL_STATUS}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {poll.OPTIONS.map((option) => (
                  <div key={option.OPTION_ID} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-900">{option.OPTION_NAME}</p>
                        <p className="text-sm text-slate-500 mt-1">{option.DESCRIPTION || "No description"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">{option.VOTE_COUNT}</p>
                        <p className="text-xs text-slate-500">votes</p>
                      </div>
                    </div>
                  </div>
                ))}

                {poll.POLL_STATUS !== "Closed" && (
                  <Button onClick={() => handleClosePoll(poll.POLL_ID)} className="w-full bg-slate-700 hover:bg-slate-800">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Close Poll
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowCreateForm(false)}>
          <Card className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Create Dinner Poll</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input type="text" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Poll title" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="date" value={form.dinnerDate} onChange={(e) => setForm((prev) => ({ ...prev, dinnerDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                <input type="datetime-local" value={form.closesAt} onChange={(e) => setForm((prev) => ({ ...prev, closesAt: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>

              <div className="space-y-3">
                {form.options.map((option, index) => (
                  <div key={index} className="rounded-xl border border-slate-200 p-4 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-slate-700">Option {index + 1}</p>
                      {form.options.length > 2 && (
                        <button type="button" onClick={() => removeOption(index)} className="text-xs text-red-600">
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={option.optionName}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          options: prev.options.map((current, currentIndex) =>
                            currentIndex === index ? { ...current, optionName: e.target.value } : current
                          ),
                        }))
                      }
                      placeholder="Option name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <textarea
                      value={option.description}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          options: prev.options.map((current, currentIndex) =>
                            currentIndex === index ? { ...current, description: e.target.value } : current
                          ),
                        }))
                      }
                      placeholder="Short description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                      rows={2}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <Button type="button" variant="outline" onClick={addOption} disabled={form.options.length >= 4}>
                  Add Option
                </Button>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                  <Button type="button" className="bg-teal-600 hover:bg-teal-700" onClick={handleCreate}>
                    Create Poll
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
