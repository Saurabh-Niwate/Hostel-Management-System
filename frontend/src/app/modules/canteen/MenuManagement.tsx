import { useEffect, useMemo, useState } from "react";
import { Plus, Edit2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { api } from "../../lib/api";

type MenuRow = {
  MENU_ID: number;
  MENU_DATE: string;
  MEAL_TYPE: string;
  ITEM_NAME: string;
  IS_AVAILABLE: number;
};

type MenuForm = {
  menuDate: string;
  mealType: string;
  itemName: string;
  isAvailable: string;
};

const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [editingItem, setEditingItem] = useState<MenuRow | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<MenuForm>({
    menuDate: today,
    mealType: "Breakfast",
    itemName: "",
    isAvailable: "1"
  });

  const loadMenu = async (dateValue?: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/canteen-owner/menu", {
        params: { date: dateValue || selectedDate }
      });
      setMenuItems(res.data?.menu || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu(selectedDate);
  }, [selectedDate]);

  const groupedItems = useMemo(() => menuItems, [menuItems]);

  const handleCreate = async () => {
    setError("");
    setSuccess("");
    try {
      await api.post("/canteen-owner/menu", {
        menuDate: form.menuDate,
        mealType: form.mealType,
        itemName: form.itemName,
        isAvailable: Number(form.isAvailable)
      });
      setSuccess("Menu item created successfully");
      setShowAddForm(false);
      setForm({ menuDate: selectedDate, mealType: "Breakfast", itemName: "", isAvailable: "1" });
      await loadMenu(form.menuDate);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create menu item");
    }
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    setError("");
    setSuccess("");
    try {
      await api.put(`/canteen-owner/menu/${editingItem.MENU_ID}`, {
        menuDate: form.menuDate,
        mealType: form.mealType,
        itemName: form.itemName,
        isAvailable: Number(form.isAvailable)
      });
      setSuccess("Menu item updated successfully");
      setEditingItem(null);
      await loadMenu(form.menuDate);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update menu item");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
          <p className="text-gray-500 mt-1">Create and update daily menu items</p>
        </div>
        <Button
          onClick={() => {
            setForm({ menuDate: selectedDate, mealType: "Breakfast", itemName: "", isAvailable: "1" });
            setShowAddForm(true);
            setEditingItem(null);
          }}
          className="bg-teal-600 hover:bg-teal-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </Button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      <Card>
        <CardContent className="p-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading menu...</p>
        ) : groupedItems.length === 0 ? (
          <Card><CardContent className="p-6 text-sm text-gray-500">No menu items found for selected date.</CardContent></Card>
        ) : (
          groupedItems.map((item) => (
            <Card key={item.MENU_ID} className={Number(item.IS_AVAILABLE) === 0 ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{item.ITEM_NAME}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{item.MEAL_TYPE} • {item.MENU_DATE}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingItem(item);
                      setForm({
                        menuDate: item.MENU_DATE,
                        mealType: item.MEAL_TYPE,
                        itemName: item.ITEM_NAME,
                        isAvailable: String(item.IS_AVAILABLE)
                      });
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <span className={`text-xs px-2 py-1 rounded-full ${Number(item.IS_AVAILABLE) === 1 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {Number(item.IS_AVAILABLE) === 1 ? "Available" : "Unavailable"}
                </span>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {(showAddForm || editingItem) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => { setShowAddForm(false); setEditingItem(null); }}>
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input type="date" value={form.menuDate} onChange={(e) => setForm((prev) => ({ ...prev, menuDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <select value={form.mealType} onChange={(e) => setForm((prev) => ({ ...prev, mealType: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Snacks">Snacks</option>
                <option value="Dinner">Dinner</option>
              </select>
              <input type="text" value={form.itemName} onChange={(e) => setForm((prev) => ({ ...prev, itemName: e.target.value }))} placeholder="Item name" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <select value={form.isAvailable} onChange={(e) => setForm((prev) => ({ ...prev, isAvailable: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white">
                <option value="1">Available</option>
                <option value="0">Unavailable</option>
              </select>
              <div className="flex gap-3">
                <Button className="flex-1 bg-teal-600 hover:bg-teal-700" onClick={editingItem ? handleUpdate : handleCreate}>
                  {editingItem ? "Update" : "Create"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => { setShowAddForm(false); setEditingItem(null); }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
