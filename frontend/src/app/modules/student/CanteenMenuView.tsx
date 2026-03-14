import { useMemo, useState } from "react";
import { Coffee, Utensils, UtensilsCrossed, Apple, Clock } from "lucide-react";

type MenuRow = {
  MENU_ID: number;
  MENU_DATE: string;
  MEAL_TYPE: "Breakfast" | "Lunch" | "Snacks" | "Dinner" | string;
  ITEM_NAME: string;
  IS_AVAILABLE: string | number | boolean | null;
};

const DUMMY_MENU: MenuRow[] = [
  { MENU_ID: 1, MENU_DATE: "2026-03-06", MEAL_TYPE: "Breakfast", ITEM_NAME: "Idli Sambar", IS_AVAILABLE: 1 },
  { MENU_ID: 2, MENU_DATE: "2026-03-06", MEAL_TYPE: "Breakfast", ITEM_NAME: "Tea/Coffee", IS_AVAILABLE: 1 },
  { MENU_ID: 3, MENU_DATE: "2026-03-06", MEAL_TYPE: "Lunch", ITEM_NAME: "Chana Masala & Rice", IS_AVAILABLE: 1 },
  { MENU_ID: 4, MENU_DATE: "2026-03-06", MEAL_TYPE: "Snacks", ITEM_NAME: "Samosa", IS_AVAILABLE: 0 },
  { MENU_ID: 5, MENU_DATE: "2026-03-06", MEAL_TYPE: "Dinner", ITEM_NAME: "Dal Makhani & Roti", IS_AVAILABLE: 1 },
];

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
  const [menuRows, setMenuRows] = useState<MenuRow[]>(DUMMY_MENU);
  const [menuDate, setMenuDate] = useState("");

  const loadMenu = (selectedDate?: string) => {
    // In a real app we'd fetch by date. For static, just reset or keep same dummy data.
    setMenuRows(DUMMY_MENU);
  };

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

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Canteen Menu</h2>
          <p className="text-slate-500 flex items-center mt-1">
            <Clock size={16} className="mr-1" /> {today}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={menuDate}
            onChange={(e) => setMenuDate(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg"
          />
          <button
            onClick={() => loadMenu(menuDate || undefined)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Load
          </button>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 text-slate-500">No menu available for selected date.</div>
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

