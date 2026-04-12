import React, { useEffect, useMemo, useState } from "react";
import { UtensilsCrossed, Vote, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { api } from "../../lib/api";

type MenuRow = {
  MENU_ID: number;
  MEAL_TYPE: string;
  ITEM_NAME: string;
  IS_AVAILABLE: number;
};

type PollRow = {
  POLL_ID: number;
  TITLE: string;
  DINNER_DATE: string;
  CLOSES_AT: string;
  POLL_STATUS: string;
  TOTAL_VOTES: number;
  OPTIONS?: Array<{
    OPTION_ID: number;
    OPTION_NAME: string;
    DESCRIPTION?: string;
    VOTE_COUNT: number;
  }>;
};

type CanteenOverviewProps = {
  onNavigate: (tab: "overview" | "menu" | "dinnerPolls" | "profile") => void;
};

export function CanteenOverview({ onNavigate }: CanteenOverviewProps) {
  const [menu, setMenu] = useState<MenuRow[]>([]);
  const [polls, setPolls] = useState<PollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [menuRes, pollsRes] = await Promise.all([
          api.get("/canteen-owner/menu", { params: { _t: Date.now() } }),
          api.get("/canteen-owner/dinner-polls", { params: { _t: Date.now() } }),
        ]);
        setMenu(menuRes.data?.menu || []);
        setPolls(pollsRes.data?.polls || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load canteen overview");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const availableItems = menu.filter((item) => Number(item.IS_AVAILABLE) === 1).length;
    const activePolls = polls.filter((poll) => poll.POLL_STATUS === "Active").length;
    const scheduledPolls = polls.filter((poll) => poll.POLL_STATUS === "Scheduled").length;
    return {
      totalMenuItems: menu.length,
      availableItems,
      totalPolls: polls.length,
      activePolls,
      scheduledPolls,
    };
  }, [menu, polls]);

  const activePoll = useMemo(() => polls.find((poll) => poll.POLL_STATUS === "Active") || null, [polls]);

  const todaysMenu = useMemo(() => menu.filter((item) => Number(item.IS_AVAILABLE) === 1), [menu]);

  const winningOption = useMemo(() => {
    if (!activePoll?.OPTIONS?.length) return null;
    return [...activePoll.OPTIONS].sort((a, b) => Number(b.VOTE_COUNT || 0) - Number(a.VOTE_COUNT || 0))[0];
  }, [activePoll]);

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Menu Items</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalMenuItems}</p>
              </div>
              <div className="bg-teal-100 p-3 rounded-lg">
                <UtensilsCrossed className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Available Today</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.availableItems}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Dinner Polls</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPolls}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Vote className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Polls</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activePolls}</p>
                <p className="text-sm text-amber-600 mt-1">Scheduled: {stats.scheduledPolls}</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={() => onNavigate("menu")} className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left">
            <div className="p-2 bg-amber-100 rounded-lg">
              <UtensilsCrossed className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Manage Menu</p>
              <p className="text-sm text-slate-600">Add, edit, and review daily menu items</p>
            </div>
          </button>

          <button onClick={() => onNavigate("dinnerPolls")} className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Vote className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Dinner Polls</p>
              <p className="text-sm text-slate-600">Create and close student dinner voting polls</p>
            </div>
          </button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Menu</CardTitle>
          <CardDescription>Current menu items from backend</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-gray-500">Loading menu...</p>
          ) : todaysMenu.length === 0 ? (
            <p className="text-sm text-gray-500">No items are marked available for today.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {todaysMenu.slice(0, 6).map((item) => (
                <div key={item.MENU_ID} className="border border-gray-200 rounded-lg p-3 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900">{item.ITEM_NAME}</p>
                      <p className="text-sm text-gray-500 mt-1">{item.MEAL_TYPE}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${Number(item.IS_AVAILABLE) === 1 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {Number(item.IS_AVAILABLE) === 1 ? "Available" : "Unavailable"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Dinner Poll</CardTitle>
          <CardDescription>Live voting summary for the current poll</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-gray-500">Loading polls...</p>
          ) : !activePoll ? (
            <p className="text-sm text-gray-500">No active dinner poll right now.</p>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                <div>
                  <p className="font-medium text-slate-900">{activePoll.TITLE}</p>
                  <p className="text-sm text-slate-500 mt-1">Dinner Date: {activePoll.DINNER_DATE} | Total Votes: {activePoll.TOTAL_VOTES || 0}</p>
                  <p className="text-sm text-amber-700 mt-2">Leading Option: {winningOption ? `${winningOption.OPTION_NAME} (${winningOption.VOTE_COUNT} votes)` : "No votes yet"}</p>
                </div>
              </div>

              <div className="space-y-3">
                {(activePoll.OPTIONS || []).length === 0 ? (
                  <p className="text-sm text-gray-500">No poll options found.</p>
                ) : (
                  (activePoll.OPTIONS || []).map((option) => {
                    const isWinning = winningOption && option.OPTION_ID === winningOption.OPTION_ID && Number(option.VOTE_COUNT || 0) > 0;
                    return (
                      <div key={option.OPTION_ID} className={`flex items-center justify-between border rounded-lg p-3 ${isWinning ? "border-amber-200 bg-amber-50" : "border-gray-200"}`}>
                        <div>
                          <p className="font-medium text-gray-900">{option.OPTION_NAME}</p>
                          <p className="text-sm text-gray-500">{option.DESCRIPTION || "No description"}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${isWinning ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700"}`}>{option.VOTE_COUNT || 0} vote(s)</span>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}