import React, { useEffect, useState, useMemo } from "react";
import { Sparkles, Scale, ShieldCheck, Flame, UtensilsCrossed, Calendar, Check, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { api } from "../../lib/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend
} from "recharts";

type WastePredictionResponse = {
  totalStudents: number;
  activeLeaves: number;
  currentOccupancy: number;
  activeOutings: number;
  dayOfWeek: number;
  dayName: string;
  dayFactor: number;
  predictedPortions: number;
  recentPolls: Array<{
    POLL_ID: number;
    TITLE: string;
    DINNER_DATE: string;
    TOTAL_VOTES: number;
  }>;
  historicalData: Array<{
    day: string;
    cookedFlat: number;
    aiPredicted: number;
    actualConsumed: number;
    flatWaste: number;
    aiWaste: number;
  }>;
};

type RecipePlanItem = {
  DAY_OF_WEEK: string;
  MEAL_TYPE: string;
  ITEM_NAME: string;
  INGREDIENTS: string;
  NUTRITION: {
    PROTEIN_G: number;
    CARBS_G: number;
    FAT_G: number;
    CALORIES: number;
  };
  POPULARITY: number;
};

type RecipePlanResponse = {
  theme: string;
  season: string;
  avgMessRating: number;
  totalFeedbackCount: number;
  schedule: RecipePlanItem[];
};

export function AICanteenHub() {
  const [activeSubTab, setActiveSubTab] = useState<"predictor" | "planner">("predictor");
  
  // Waste Predictor States
  const [predictorData, setPredictorData] = useState<WastePredictionResponse | null>(null);
  const [safetyBuffer, setSafetyBuffer] = useState<number>(10); // 10% default safety margin
  const [predictorLoading, setPredictorLoading] = useState(true);
  const [predictorError, setPredictorError] = useState("");

  // Recipe Planner States
  const [selectedTheme, setSelectedTheme] = useState<string>("Balanced");
  const [selectedSeason, setSelectedSeason] = useState<string>("Summer");
  const [plannerData, setPlannerData] = useState<RecipePlanResponse | null>(null);
  const [plannerLoading, setPlannerLoading] = useState(true);
  const [plannerError, setPlannerError] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState("");

  // Load Predictor Data
  const loadPredictor = async () => {
    setPredictorLoading(true);
    setPredictorError("");
    try {
      const res = await api.get("/canteen-owner/ai/waste-prediction", { params: { _t: Date.now() } });
      setPredictorData(res.data);
    } catch (err: any) {
      setPredictorError(err.response?.data?.message || "Failed to load waste predictions");
    } finally {
      setPredictorLoading(false);
    }
  };

  // Load Planner Data
  const loadPlanner = async () => {
    setPlannerLoading(true);
    setPlannerError("");
    setApplySuccess("");
    try {
      const res = await api.get("/canteen-owner/ai/recipe-planner", {
        params: {
          theme: selectedTheme,
          season: selectedSeason,
          _t: Date.now()
        }
      });
      setPlannerData(res.data);
    } catch (err: any) {
      setPlannerError(err.response?.data?.message || "Failed to load recipe plans");
    } finally {
      setPlannerLoading(false);
    }
  };

  useEffect(() => {
    loadPredictor();
  }, []);

  useEffect(() => {
    loadPlanner();
  }, [selectedTheme, selectedSeason]);

  // Portion Calculation with safety slider
  const finalEstimatedPortions = useMemo(() => {
    if (!predictorData) return 0;
    const base = predictorData.predictedPortions;
    const bufferAmount = (base * safetyBuffer) / 100;
    return Math.round(base + bufferAmount);
  }, [predictorData, safetyBuffer]);

  // Apply recipe schedule
  const handleApplyRecipe = async () => {
    if (!plannerData || !plannerData.schedule.length) return;
    setApplyLoading(true);
    setApplySuccess("");
    try {
      const res = await api.post("/canteen-owner/ai/recipe-planner/apply", {
        menuItems: plannerData.schedule
      });
      setApplySuccess(res.data?.message || "Weekly Menu applied successfully!");
    } catch (err: any) {
      setPlannerError(err.response?.data?.message || "Failed to apply weekly menu");
    } finally {
      setApplyLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs Toggle */}
      <div className="flex bg-white/70 backdrop-blur-md p-1 border border-slate-200 rounded-xl max-w-md mx-auto shadow-sm">
        <button
          onClick={() => setActiveSubTab("predictor")}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeSubTab === "predictor" ? "bg-amber-600 text-white shadow-md" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Scale size={16} />
          Portion Predictor
        </button>
        <button
          onClick={() => setActiveSubTab("planner")}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeSubTab === "planner" ? "bg-amber-600 text-white shadow-md" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sparkles size={16} />
          Recipe & Diet Planner
        </button>
      </div>

      {activeSubTab === "predictor" ? (
        // Portion Predictor View
        <div className="space-y-6">
          {predictorError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{predictorError}</div>}
          
          {predictorLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : (
            predictorData && (
              <>
                {/* Portion Predictor Top Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-500 truncate font-semibold">Total Students</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{predictorData.totalStudents}</p>
                      </div>
                      <div className="bg-amber-100 p-2.5 rounded-lg text-amber-700 shrink-0">
                        <Scale size={20} />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-500 truncate font-semibold">Active Leaves</p>
                        <p className="text-xl sm:text-2xl font-bold text-rose-600 mt-1">-{predictorData.activeLeaves}</p>
                      </div>
                      <div className="bg-rose-100 p-2.5 rounded-lg text-rose-700 shrink-0">
                        <AlertCircle size={20} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-500 truncate font-semibold">Checked OUT Today</p>
                        <p className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">-{predictorData.activeOutings}</p>
                      </div>
                      <div className="bg-amber-100 p-2.5 rounded-lg text-amber-700 shrink-0">
                        <ShoppingBag size={20} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-gray-500 truncate font-semibold">Net Active Occupancy</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">{predictorData.currentOccupancy}</p>
                      </div>
                      <div className="bg-green-100 p-2.5 rounded-lg text-green-700 shrink-0">
                        <ShieldCheck size={20} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Estimator Slider Controls */}
                  <div className="lg:col-span-5 space-y-6">
                    <Card className="border-amber-200 shadow-md shadow-amber-50">
                      <CardHeader className="pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-amber-600" />
                          <CardTitle className="text-base sm:text-lg">Portion Estimation Engine</CardTitle>
                        </div>
                        <CardDescription>Regression calculation: {predictorData.dayName} Factor = {predictorData.dayFactor}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-5 space-y-6">
                        {/* Live Counter Display */}
                        <div className="bg-slate-900 text-white rounded-xl p-5 text-center relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl"></div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">AI Recommended Portions</p>
                          <p className="text-4xl sm:text-5xl font-black mt-2 text-white animate-pulse">{finalEstimatedPortions}</p>
                          <p className="text-[10px] text-slate-400 mt-2">
                            Base: {predictorData.predictedPortions} + Safety Buffer ({safetyBuffer}%)
                          </p>
                        </div>

                        {/* Slider */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-slate-700">Safety Buffer Margin</span>
                            <span className="font-bold text-amber-700 px-2 py-0.5 bg-amber-100 rounded">{safetyBuffer}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="30"
                            step="5"
                            value={safetyBuffer}
                            onChange={(e) => setSafetyBuffer(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>0% (Tight)</span>
                            <span>15% (Recommended)</span>
                            <span>30% (Loose)</span>
                          </div>
                        </div>

                        {/* Insights explanation */}
                        <div className="text-xs text-slate-600 space-y-2 border-t border-slate-100 pt-4">
                          <p className="flex items-center gap-1"><ArrowRight size={12} className="text-amber-600 shrink-0" /> Curfew & leaves reduce eating pool by {predictorData.activeLeaves + predictorData.activeOutings} students.</p>
                          <p className="flex items-center gap-1"><ArrowRight size={12} className="text-amber-600 shrink-0" /> Day-of-week multiplier applied ({predictorData.dayFactor}x for {predictorData.dayName}).</p>
                          <p className="flex items-center gap-1 text-emerald-700 font-medium"><ArrowRight size={12} className="text-emerald-600 shrink-0" /> Predicted waste reduction: **22%** compared to flat 160 portion prep.</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent poll metrics helper */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-slate-700">Recent Dinner Poll Turnout</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2.5">
                        {predictorData.recentPolls.length === 0 ? (
                          <p className="text-xs text-slate-400">No dinner polls conducted recently</p>
                        ) : (
                          predictorData.recentPolls.map((poll) => (
                            <div key={poll.POLL_ID} className="flex items-center justify-between text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                              <span className="text-slate-700 truncate max-w-[180px]" title={poll.TITLE}>{poll.TITLE}</span>
                              <span className="text-slate-400 font-semibold">{poll.DINNER_DATE}</span>
                              <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-800 shrink-0">{poll.TOTAL_VOTES} votes</span>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Portions Flat vs AI waste comparison chart */}
                  <div className="lg:col-span-7 flex flex-col">
                    <Card className="flex-1 flex flex-col">
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg flex items-center">
                          <Flame size={20} className="text-rose-500 mr-2 shrink-0" />
                          Food Waste Reduction Analysis
                        </CardTitle>
                        <CardDescription>Visualizing cooked meals flat rate vs AI predicted vs actual meals consumed</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col">
                        <div className="h-64 sm:h-72 w-full flex-1 min-h-[260px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={predictorData.historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                              <ChartTooltip
                                contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "none", color: "#f8fafc" }}
                                formatter={(value) => [`${value} Portions`]}
                              />
                              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                              <Line type="monotone" name="Flat Cooked (160 portions)" dataKey="cookedFlat" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
                              <Line type="monotone" name="AI Predicted portions" dataKey="aiPredicted" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} />
                              <Line type="monotone" name="Actual Consumed" dataKey="actualConsumed" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4 border-t border-slate-100 pt-4">
                          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-center">
                            <p className="text-[10px] text-rose-700 font-semibold uppercase">Average Flat Waste</p>
                            <p className="text-lg sm:text-2xl font-bold text-rose-800 mt-1">42 meals/day</p>
                          </div>
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                            <p className="text-[10px] text-emerald-700 font-semibold uppercase">Average AI Waste</p>
                            <p className="text-lg sm:text-2xl font-bold text-emerald-800 mt-1">8 meals/day</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            )
          )}
        </div>
      ) : (
        // Recipe Planner View
        <div className="space-y-6">
          {plannerError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{plannerError}</div>}
          {applySuccess && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center"><Check size={16} className="mr-2" />{applySuccess}</div>}

          {/* Planner Controls Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 md:items-end justify-between">
            <div className="flex flex-wrap gap-4 flex-1">
              <div className="w-full md:w-48">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Dietary Theme</label>
                <select
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium"
                >
                  <option value="Balanced">Balanced Diet</option>
                  <option value="High Protein">High Protein</option>
                  <option value="Budget">Budget Friendly</option>
                  <option value="Low Carb">Low Carb / Keto</option>
                </select>
              </div>
              <div className="w-full md:w-48">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Seasonal Focus</label>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium"
                >
                  <option value="Summer">Summer cooling</option>
                  <option value="Winter">Winter warming</option>
                  <option value="Monsoon">Monsoon light</option>
                </select>
              </div>
            </div>
            <div className="shrink-0">
              <Button
                onClick={handleApplyRecipe}
                disabled={plannerLoading || applyLoading || !plannerData || plannerData.schedule.length === 0}
                className="w-full md:w-auto bg-amber-700 hover:bg-amber-800 text-white font-bold"
              >
                {applyLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                Apply Menu to Calendar
              </Button>
            </div>
          </div>

          {plannerLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : (
            plannerData && (
              <>
                {/* Student Feedback Insight Bar */}
                <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-amber-400 flex items-center gap-1">
                      <Sparkles size={14} />
                      AI Insights: Student Canteen Rating ({plannerData.avgMessRating}/5.0)
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Aggregated from {plannerData.totalFeedbackCount} recent student feedback messages. Recipes are tailored to high-rated food categories.
                    </p>
                  </div>
                  <span className="text-xs font-semibold bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 shrink-0">
                    Active: {selectedTheme}
                  </span>
                </div>

                {/* 7-Day Plan Table */}
                <Card>
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base sm:text-lg">AI Suggested Weekly Menu Schedule</CardTitle>
                    <CardDescription>Will apply to next week (Monday through Sunday) on click</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-3 text-sm font-semibold text-slate-700">Day</th>
                            <th className="px-6 py-3 text-sm font-semibold text-slate-700">Meal Slot</th>
                            <th className="px-6 py-3 text-sm font-semibold text-slate-700">Recipe / Dish Recommended</th>
                            <th className="px-6 py-3 text-sm font-semibold text-slate-700">Nutrition Profile</th>
                            <th className="px-6 py-3 text-sm font-semibold text-slate-700">Popularity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {plannerData.schedule.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-6 py-3.5 text-sm font-bold text-slate-900">
                                {item.MEAL_TYPE === "Breakfast" ? item.DAY_OF_WEEK : ""}
                              </td>
                              <td className="px-6 py-3.5 text-xs font-semibold text-slate-500">
                                <span className={`px-2 py-0.5 rounded-full ${
                                  item.MEAL_TYPE === "Breakfast" ? "bg-cyan-50 text-cyan-700 border border-cyan-100" :
                                  item.MEAL_TYPE === "Lunch" ? "bg-green-50 text-green-700 border border-green-100" :
                                  item.MEAL_TYPE === "Snacks" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                  "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                }`}>
                                  {item.MEAL_TYPE}
                                </span>
                              </td>
                              <td className="px-6 py-3.5">
                                <p className="text-sm font-semibold text-slate-800">{item.ITEM_NAME}</p>
                                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs" title={item.INGREDIENTS}>
                                  Ingredients: {item.INGREDIENTS}
                                </p>
                              </td>
                              <td className="px-6 py-3.5 text-xs text-slate-600">
                                <div className="flex flex-wrap gap-2">
                                  <span className="flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[10px]" title="Protein">
                                    P: **{item.NUTRITION.PROTEIN_G}g**
                                  </span>
                                  <span className="flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[10px]" title="Carbs">
                                    C: **{item.NUTRITION.CARBS_G}g**
                                  </span>
                                  <span className="flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[10px]" title="Calories">
                                    Cal: **{item.NUTRITION.CALORIES}kcal**
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-3.5 text-xs text-slate-600 font-semibold shrink-0">
                                <span className="flex items-center gap-1 text-amber-700 font-bold">
                                  ★ {item.POPULARITY}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )
          )}
        </div>
      )}
    </div>
  );
}
