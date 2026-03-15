import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { api } from "../../lib/api";

type NightOrder = {
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

const statuses = ["Pending", "Preparing", "Ready", "Delivered", "Cancelled"];

export function FoodAvailability() {
  const [orders, setOrders] = useState<NightOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/canteen-owner/night-orders", {
        params: {
          date: selectedDate || undefined,
          status: statusFilter || undefined
        }
      });
      setOrders(res.data?.orders || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load night orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [selectedDate, statusFilter]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => o.STATUS === "Pending").length,
    ready: orders.filter((o) => o.STATUS === "Ready").length
  }), [orders]);

  const updateStatus = async (orderId: number, status: string) => {
    setError("");
    setSuccess("");
    try {
      await api.put(`/canteen-owner/night-orders/${orderId}/status`, { status });
      setSuccess("Order status updated successfully");
      await loadOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update order status");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Night Food Orders</h2>
        <p className="text-gray-500 mt-1">Manage student night food orders</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Total Orders</p><p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Pending</p><p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-sm text-gray-500">Ready</p><p className="text-2xl font-bold text-green-600 mt-1">{stats.ready}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg bg-white">
              <option value="">All Statuses</option>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-500">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Student</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Item</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Quantity</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Notes</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.ORDER_ID} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{order.FULL_NAME || order.STUDENT_ID}</p>
                        <p className="text-sm text-gray-500">{order.STUDENT_ID}</p>
                      </td>
                      <td className="py-3 px-4">{order.ITEM_NAME}</td>
                      <td className="py-3 px-4">{order.QUANTITY}</td>
                      <td className="py-3 px-4">{order.NOTES || "-"}</td>
                      <td className="py-3 px-4"><span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{order.STATUS}</span></td>
                      <td className="py-3 px-4">
                        <select value={order.STATUS} onChange={(e) => updateStatus(order.ORDER_ID, e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg bg-white">
                          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
