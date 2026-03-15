import { useEffect, useMemo, useState } from "react";
import { UtensilsCrossed, Package, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { api } from "../../lib/api";

type MenuRow = {
  MENU_ID: number;
  MENU_DATE: string;
  MEAL_TYPE: string;
  ITEM_NAME: string;
  IS_AVAILABLE: number;
};

type OrderRow = {
  ORDER_ID: number;
  STUDENT_ID: string;
  FULL_NAME?: string;
  ORDER_DATE: string;
  ITEM_NAME: string;
  QUANTITY: number;
  NOTES?: string;
  STATUS: string;
  UPDATED_AT: string;
};

export function CanteenDashboard() {
  const [menu, setMenu] = useState<MenuRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [menuRes, ordersRes] = await Promise.all([
          api.get("/canteen-owner/menu"),
          api.get("/canteen-owner/night-orders")
        ]);
        setMenu(menuRes.data?.menu || []);
        setOrders(ordersRes.data?.orders || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load canteen dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const availableItems = menu.filter((item) => Number(item.IS_AVAILABLE) === 1).length;
    const pendingOrders = orders.filter((order) => order.STATUS === "Pending").length;
    const readyOrders = orders.filter((order) => order.STATUS === "Ready").length;
    return {
      totalMenuItems: menu.length,
      availableItems,
      totalOrders: orders.length,
      pendingOrders,
      readyOrders
    };
  }, [menu, orders]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Canteen Dashboard</h2>
        <p className="text-gray-500 mt-1">Manage daily menu and night food orders</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Menu Items</p><p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalMenuItems}</p></div><div className="bg-teal-100 p-3 rounded-lg"><UtensilsCrossed className="h-6 w-6 text-teal-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Available Today</p><p className="text-2xl font-bold text-gray-900 mt-1">{stats.availableItems}</p></div><div className="bg-green-100 p-3 rounded-lg"><CheckCircle className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Night Orders</p><p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p></div><div className="bg-blue-100 p-3 rounded-lg"><Package className="h-6 w-6 text-blue-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Pending Orders</p><p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingOrders}</p><p className="text-sm text-amber-600 mt-1">Ready: {stats.readyOrders}</p></div><div className="bg-amber-100 p-3 rounded-lg"><Clock className="h-6 w-6 text-amber-600" /></div></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Menu</CardTitle>
            <CardDescription>Current menu items from backend</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-gray-500">Loading menu...</p>
            ) : menu.length === 0 ? (
              <p className="text-sm text-gray-500">No menu items found.</p>
            ) : (
              menu.slice(0, 6).map((item) => (
                <div key={item.MENU_ID} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                  <div>
                    <p className="font-medium text-gray-900">{item.ITEM_NAME}</p>
                    <p className="text-sm text-gray-500">{item.MEAL_TYPE}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${Number(item.IS_AVAILABLE) === 1 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {Number(item.IS_AVAILABLE) === 1 ? "Available" : "Unavailable"}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Night Orders</CardTitle>
            <CardDescription>Latest order updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-gray-500">Loading orders...</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-gray-500">No night orders found.</p>
            ) : (
              orders.slice(0, 6).map((order) => (
                <div key={order.ORDER_ID} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
                  <div>
                    <p className="font-medium text-gray-900">{order.ITEM_NAME} x {order.QUANTITY}</p>
                    <p className="text-sm text-gray-500">{order.FULL_NAME || order.STUDENT_ID}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{order.STATUS}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
