import { useEffect, useMemo, useState } from "react";
import { Edit2, Search, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { api } from "../../lib/api";

type MenuRow = {
  MENU_ID: number;
  MEAL_TYPE: string;
  ITEM_NAME: string;
  IS_AVAILABLE: number;
  UPDATED_AT?: string;
};

type MenuForm = {
  mealType: string;
  itemName: string;
  isAvailable: boolean;
};

const emptyForm: MenuForm = {
  mealType: "Breakfast",
  itemName: "",
  isAvailable: false,
};

export function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<MenuRow | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [busyItemId, setBusyItemId] = useState<number | null>(null);
  const [form, setForm] = useState<MenuForm>(emptyForm);

  const loadMenu = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/canteen-owner/menu");
      setMenuItems(res.data?.menu || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  useEffect(() => {
    window.addEventListener("canteen:create-menu-item", openCreateModal);
    return () => window.removeEventListener("canteen:create-menu-item", openCreateModal);
  }, []);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return menuItems;
    return menuItems.filter((item) => {
      return (
        String(item.ITEM_NAME || "").toLowerCase().includes(query) ||
        String(item.MEAL_TYPE || "").toLowerCase().includes(query)
      );
    });
  }, [menuItems, searchQuery]);

  const openCreateModal = () => {
    setError("");
    setSuccess("");
    setEditingItem(null);
    setForm(emptyForm);
    setShowAddForm(true);
  };

  const openEditModal = (item: MenuRow) => {
    setError("");
    setSuccess("");
    setEditingItem(item);
    setForm({
      mealType: item.MEAL_TYPE,
      itemName: item.ITEM_NAME,
      isAvailable: Number(item.IS_AVAILABLE) === 1,
    });
    setShowAddForm(false);
  };

  const closeModal = () => {
    setShowAddForm(false);
    setEditingItem(null);
    setForm(emptyForm);
  };

  const handleCreate = async () => {
    setError("");
    setSuccess("");
    try {
      await api.post("/canteen-owner/menu", {
        mealType: form.mealType,
        itemName: form.itemName.trim(),
        isAvailable: form.isAvailable ? 1 : 0,
      });
      setSuccess("Menu item created successfully");
      closeModal();
      await loadMenu();
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
        mealType: form.mealType,
        itemName: form.itemName.trim(),
        isAvailable: form.isAvailable ? 1 : 0,
      });
      setSuccess("Menu item updated successfully");
      closeModal();
      await loadMenu();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update menu item");
    }
  };

  const handleDelete = async (item: MenuRow) => {
    const confirmed = window.confirm(`Delete "${item.ITEM_NAME}" from the menu list?`);
    if (!confirmed) return;

    setBusyItemId(item.MENU_ID);
    setError("");
    setSuccess("");
    try {
      await api.delete(`/canteen-owner/menu/${item.MENU_ID}`);
      setSuccess("Menu item deleted successfully");
      await loadMenu();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete menu item");
    } finally {
      setBusyItemId(null);
    }
  };

  const handleAvailabilityToggle = async (item: MenuRow, checked: boolean) => {
    setBusyItemId(item.MENU_ID);
    setError("");
    setSuccess("");
    try {
      await api.put(`/canteen-owner/menu/${item.MENU_ID}`, {
        isAvailable: checked ? 1 : 0,
      });
      setSuccess(
        checked
          ? `"${item.ITEM_NAME}" is now part of today's menu`
          : `"${item.ITEM_NAME}" removed from today's menu`
      );
      await loadMenu();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update availability");
    } finally {
      setBusyItemId(null);
    }
  };

  return (
      <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by food item or meal type..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading menu...</p>
        ) : filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-gray-500">
              No menu items found.
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item) => {
            const isAvailable = Number(item.IS_AVAILABLE) === 1;
            const isBusy = busyItemId === item.MENU_ID;

            return (
              <Card key={item.MENU_ID} className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg text-slate-900">{item.ITEM_NAME}</CardTitle>
                      <p className="text-sm text-slate-500 mt-1">{item.MEAL_TYPE}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(item)}
                        className="h-9 w-9 p-0 text-slate-600 hover:text-slate-900"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item)}
                        disabled={isBusy}
                        className="h-9 w-9 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Available Today</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isAvailable}
                      disabled={isBusy}
                      onClick={() => handleAvailabilityToggle(item, !isAvailable)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                        isAvailable ? "bg-emerald-600" : "bg-slate-300"
                      } ${isBusy ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          isAvailable ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {(showAddForm || editingItem) && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={closeModal}
        >
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                value={form.mealType}
                onChange={(e) => setForm((prev) => ({ ...prev, mealType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Snacks">Snacks</option>
                <option value="Dinner">Dinner</option>
              </select>

              <input
                type="text"
                value={form.itemName}
                onChange={(e) => setForm((prev) => ({ ...prev, itemName: e.target.value }))}
                placeholder="Item name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />

              <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">Available Today</p>
                  <p className="text-xs text-slate-500">
                    New items stay unavailable by default until you turn this on
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(e) => setForm((prev) => ({ ...prev, isAvailable: e.target.checked }))}
                  className="h-4 w-4 accent-amber-700"
                />
              </label>

              <div className="flex gap-3">
                <Button className="flex-1 bg-amber-700 hover:bg-amber-800" onClick={editingItem ? handleUpdate : handleCreate}>
                  {editingItem ? "Update" : "Create"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={closeModal}>
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
