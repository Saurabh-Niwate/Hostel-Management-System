import { useEffect, useMemo, useState } from "react";
import { Vote, Calendar, Clock, CheckCircle2, Edit2, Trash2, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { api } from "../../lib/api";
import { motion, AnimatePresence } from "motion/react";

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
  WINNING_OPTIONS?: string[];
  WINNING_VOTE_COUNT?: number;
};

type PollFormOption = {
  optionId?: number;
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
  const [editingPollId, setEditingPollId] = useState<number | null>(null);
  const [editingHasVotes, setEditingHasVotes] = useState(false);
  const [form, setForm] = useState({
    title: "",
    dinnerDate: getTodayDate(),
    closesAt: "",
    options: [
      { optionName: "", description: "" },
      { optionName: "", description: "" },
    ] as PollFormOption[],
  });

  const loadPolls = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const res = await api.get("/canteen-owner/dinner-polls", { params: { _t: Date.now() } });
      setPolls(res.data?.polls || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load dinner polls");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadPolls();
  }, []);

  useEffect(() => {
    const openCreatePoll = () => {
      resetForm();
      setEditingPollId(null);
      setEditingHasVotes(false);
      setShowCreateForm(true);
    };

    window.addEventListener("canteen:create-poll", openCreatePoll);
    return () => window.removeEventListener("canteen:create-poll", openCreatePoll);
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

  const groupedPolls = useMemo(
    () => ({
      active: polls.filter((poll) => poll.POLL_STATUS === "Active"),
      scheduled: polls.filter((poll) => poll.POLL_STATUS === "Scheduled"),
      closed: polls.filter((poll) => poll.POLL_STATUS === "Closed"),
    }),
    [polls]
  );

  const resetForm = () => {
    setForm({
      title: "",
      dinnerDate: getTodayDate(),
      closesAt: "",
      options: [
        { optionId: undefined, optionName: "", description: "" },
        { optionId: undefined, optionName: "", description: "" },
      ],
    });
  };

  const openEditPoll = (poll: DinnerPoll) => {
    const closesValue = poll.CLOSES_AT ? poll.CLOSES_AT.replace(" ", "T").slice(0, 16) : "";
    setEditingPollId(poll.POLL_ID);
    setEditingHasVotes(Number(poll.TOTAL_VOTES || 0) > 0);
    setForm({
      title: poll.TITLE || "",
      dinnerDate: poll.DINNER_DATE || getTodayDate(),
      closesAt: closesValue,
      options: (poll.OPTIONS || []).map((option) => ({
        optionId: option.OPTION_ID,
        optionName: option.OPTION_NAME || "",
        description: option.DESCRIPTION || "",
      })),
    });
    setShowCreateForm(true);
    setError("");
    setSuccess("");
  };

  const handleCreate = async () => {
    setError("");
    setSuccess("");
    try {
      await api.post("/canteen-owner/dinner-polls", {
        title: form.title.trim(),
        dinnerDate: form.dinnerDate,
        closesAt: form.closesAt.replace("T", " "),
        options: form.options.map((option) => ({
          optionName: option.optionName,
          description: option.description,
        })),
      });
      setSuccess("Dinner poll created successfully");
      setShowCreateForm(false);
      resetForm();
      await loadPolls(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create dinner poll");
    }
  };

  const handleUpdate = async () => {
    if (!editingPollId) return;
    setError("");
    setSuccess("");
    try {
      await api.put(`/canteen-owner/dinner-polls/${editingPollId}`, {
        title: form.title.trim(),
        dinnerDate: form.dinnerDate,
        closesAt: form.closesAt.replace("T", " "),
        options: form.options.map((option) => ({
          optionId: option.optionId,
          optionName: option.optionName,
          description: option.description,
        })),
      });
      setSuccess("Dinner poll updated successfully");
      setShowCreateForm(false);
      setEditingPollId(null);
      setEditingHasVotes(false);
      resetForm();
      await loadPolls(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update dinner poll");
    }
  };

  const handleClosePoll = async (pollId: number) => {
    setError("");
    setSuccess("");
    try {
      await api.put(`/canteen-owner/dinner-polls/${pollId}/close`);
      setSuccess("Dinner poll closed successfully");
      await loadPolls(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to close dinner poll");
    }
  };

  const handleDeletePoll = async (pollId: number) => {
    const confirmed = window.confirm("Delete this dinner poll?");
    if (!confirmed) return;

    setError("");
    setSuccess("");
    try {
      await api.delete(`/canteen-owner/dinner-polls/${pollId}`);
      setSuccess("Dinner poll deleted successfully");
      await loadPolls(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete dinner poll");
    }
  };

  const addOption = () => {
    if (form.options.length >= 4) return;
    if (editingHasVotes) return;
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { optionId: undefined, optionName: "", description: "" }],
    }));
  };

  const removeOption = (index: number) => {
    if (form.options.length <= 2) return;
    if (editingHasVotes) return;
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const renderPollSection = (title: string, sectionPolls: DinnerPoll[]) => {
    if (sectionPolls.length === 0) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sectionPolls.map((poll) => (
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
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditPoll(poll)}
                      className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      title={poll.POLL_STATUS === "Closed" ? "Reuse poll" : "Edit poll"}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePoll(poll.POLL_ID)}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                      title="Delete poll"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {poll.POLL_STATUS === "Closed" && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center gap-2 text-amber-800 font-medium">
                      <Trophy className="h-4 w-4" />
                      Winner
                    </div>
                    {poll.WINNING_OPTIONS && poll.WINNING_OPTIONS.length > 0 ? (
                      <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-200 bg-white/70 px-4 py-3">
                        <div>
                          <p className="font-semibold text-amber-900">{poll.WINNING_OPTIONS.join(", ")}</p>
                          <p className="text-xs text-amber-700">Winning option</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-amber-900">{poll.WINNING_VOTE_COUNT || 0}</p>
                          <p className="text-xs text-amber-700">total votes</p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-amber-900">No votes were cast in this poll.</p>
                    )}
                  </div>
                )}

                {poll.POLL_STATUS !== "Closed" && poll.OPTIONS.map((option) => (
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
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Total Polls</p>
            {loading ? <div className="h-8 w-16 bg-slate-200 rounded animate-pulse mt-1" /> : <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Active</p>
            {loading ? <div className="h-8 w-16 bg-emerald-100 rounded animate-pulse mt-1" /> : <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Scheduled</p>
            {loading ? <div className="h-8 w-16 bg-blue-100 rounded animate-pulse mt-1" /> : <p className="text-2xl font-bold text-blue-600 mt-1">{stats.scheduled}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Closed</p>
            {loading ? <div className="h-8 w-16 bg-slate-200 rounded animate-pulse mt-1" /> : <p className="text-2xl font-bold text-slate-700 mt-1">{stats.closed}</p>}
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading dinner polls...</div>
      ) : polls.length === 0 ? (
        <Card><CardContent className="p-6 text-sm text-slate-500">No dinner polls created yet.</CardContent></Card>
      ) : (
        <div className="space-y-8">
          {renderPollSection("Active Polls", groupedPolls.active)}
          {renderPollSection("Scheduled Polls", groupedPolls.scheduled)}
          {renderPollSection("Closed Polls", groupedPolls.closed)}
        </div>
      )}

      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => { setShowCreateForm(false); setEditingPollId(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="max-h-[90vh] overflow-hidden">
                <CardHeader>
                  <CardTitle>{editingPollId ? "Edit Dinner Poll" : "Create Dinner Poll"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 overflow-y-auto max-h-[calc(90vh-88px)] pr-2">
                  {editingHasVotes && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      This poll already has votes. You can still edit all poll details, but option count cannot be changed after voting starts.
                    </div>
                  )}
                  {editingPollId && polls.find((poll) => poll.POLL_ID === editingPollId)?.POLL_STATUS === "Closed" && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                      Reusing a closed poll will reopen it for fresh voting and clear its previous vote results.
                    </div>
                  )}
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
                          {form.options.length > 2 && !editingHasVotes && (
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
                    <Button type="button" variant="outline" onClick={addOption} disabled={form.options.length >= 4 || editingHasVotes}>
                      Add Option
                    </Button>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => { setShowCreateForm(false); setEditingPollId(null); setEditingHasVotes(false); }}>
                        Cancel
                      </Button>
                      <Button type="button" className="bg-amber-600 hover:bg-amber-700" onClick={editingPollId ? handleUpdate : handleCreate}>
                        {editingPollId && polls.find((poll) => poll.POLL_ID === editingPollId)?.POLL_STATUS === "Closed"
                          ? "Reuse Poll"
                          : editingPollId
                            ? "Update Poll"
                            : "Create Poll"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
