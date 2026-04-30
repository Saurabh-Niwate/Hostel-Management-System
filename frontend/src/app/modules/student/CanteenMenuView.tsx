import { useEffect, useMemo, useState } from "react";
import { Coffee, Utensils, UtensilsCrossed, Apple, Clock } from "lucide-react";
import { api } from "../../lib/api";
import { motion } from "motion/react";

type MenuRow = {
  MENU_ID: number;
  MEAL_TYPE: "Breakfast" | "Lunch" | "Snacks" | "Dinner" | string;
  ITEM_NAME: string;
  IS_AVAILABLE: string | number | boolean | null;
};

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
  MY_OPTION_ID?: number | null;
  TOTAL_VOTES: number;
  OPTIONS: PollOption[];
};

const iconByMeal: Record<string, JSX.Element> = {
  Breakfast: <Coffee size={24} className="text-amber-600" />,
  Lunch: <Utensils size={24} className="text-emerald-600" />,
  Snacks: <Apple size={24} className="text-orange-600" />,
  Dinner: <UtensilsCrossed size={24} className="text-indigo-600" />,
};

const colorByMeal: Record<string, { bg: string; border: string }> = {
  Breakfast: { bg: "bg-amber-50", border: "border-amber-100" },
  Lunch: { bg: "bg-emerald-50", border: "border-emerald-100" },
  Snacks: { bg: "bg-orange-50", border: "border-orange-100" },
  Dinner: { bg: "bg-indigo-50", border: "border-indigo-100" },
};

export function CanteenMenuView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuRows, setMenuRows] = useState<MenuRow[]>([]);
  const [polls, setPolls] = useState<DinnerPoll[]>([]);
  const [votingPollId, setVotingPollId] = useState<number | null>(null);

  const loadMenu = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const [menuRes, pollRes] = await Promise.all([
        api.get("/student/canteen-menu"),
        api.get("/student/dinner-polls"),
      ]);
      setMenuRows(menuRes.data?.menu || []);
      setPolls(pollRes.data?.polls || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load canteen menu");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, MenuRow[]>();
    for (const row of menuRows) {
      const key = row.MEAL_TYPE || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return Array.from(map.entries()).map(([mealType, items]) => ({ mealType, items }));
  }, [menuRows]);

  const isAvailable = (value: MenuRow["IS_AVAILABLE"]) => {
    if (typeof value === "number") return value === 1;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toUpperCase();
      return normalized === "1" || normalized === "Y" || normalized === "YES" || normalized === "TRUE";
    }
    return false;
  };

  const activePoll = polls.find((poll) => poll.POLL_STATUS === "Active") || null;

  const handleVote = async (pollId: number, optionId: number) => {
    setVotingPollId(pollId);
    setError("");
    try {
      await api.post(`/student/dinner-polls/${pollId}/vote`, { optionId });
      await loadMenu(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit vote");
    } finally {
      setVotingPollId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

      {activePoll && (
        <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Dinner Poll</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">{activePoll.TITLE}</h3>
              <p className="text-sm text-slate-500 mt-2">Dinner date: {activePoll.DINNER_DATE} | Closes: {activePoll.CLOSES_AT}</p>
            </div>
            <span className="text-sm px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 h-fit">
              {activePoll.TOTAL_VOTES} vote(s)
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePoll.OPTIONS.map((option) => {
              const isSelected = activePoll.MY_OPTION_ID === option.OPTION_ID;
              return (
                <motion.button
                  layout
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={option.OPTION_ID}
                  onClick={() => handleVote(activePoll.POLL_ID, option.OPTION_ID)}
                  disabled={votingPollId === activePoll.POLL_ID}
                  className={`text-left rounded-xl border p-4 transition-colors ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 bg-white hover:border-indigo-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{option.OPTION_NAME}</p>
                      <p className="text-sm text-slate-500 mt-1">{option.DESCRIPTION || "No description"}</p>
                    </div>
                    <motion.span layout className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                      {option.VOTE_COUNT}
                    </motion.span>
                  </div>
                  <motion.p layout className="text-xs mt-3 text-indigo-700">
                    {isSelected ? "Your current choice" : "Tap to vote"}
                  </motion.p>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-slate-500 flex items-center mt-1">
        <Clock size={16} className="mr-1" /> {today}
      </p>

      {grouped.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 text-slate-500">No items are marked available for today.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {grouped.map(({ mealType, items }) => {
            const color = colorByMeal[mealType] || { bg: "bg-slate-50", border: "border-slate-100" };
            return (
              <div
                key={mealType}
                className={`p-6 rounded-2xl border ${color.border} bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden`}
              >
                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${color.bg} opacity-50`}></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-xl ${color.bg}`}>{iconByMeal[mealType] || <Utensils size={24} />}</div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">{mealType}</h3>
                        <p className="text-xs text-slate-500 font-medium">Menu items</p>
                      </div>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li key={item.MENU_ID} className="flex items-center justify-between text-slate-600">
                        <span className="font-medium">{item.ITEM_NAME}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${isAvailable(item.IS_AVAILABLE) ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {isAvailable(item.IS_AVAILABLE) ? "Available" : "Not Available"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
