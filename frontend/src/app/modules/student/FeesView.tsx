import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

type FeeRow = {
  FEE_ID: number;
  TERM_NAME: string;
  AMOUNT_TOTAL: number;
  AMOUNT_PAID: number;
  AMOUNT_DUE: number;
  DUE_DATE: string;
  STATUS: string;
};

export function FeesView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<FeeRow[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/student/fees");
        setRows(res.data.fees || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load fee details");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totals = useMemo(() => {
    const totalFees = rows.reduce((s, r) => s + Number(r.AMOUNT_TOTAL || 0), 0);
    const paidFees = rows.reduce((s, r) => s + Number(r.AMOUNT_PAID || 0), 0);
    const pendingFees = Math.max(totalFees - paidFees, 0);
    return { totalFees, paidFees, pendingFees };
  }, [rows]);

  if (loading) return <div className="flex items-center justify-center h-64">Loading fees...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Fee Details</h2>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <p className="text-slate-500">Pending Balance</p>
        <p className="text-4xl font-bold text-red-600 mt-2">Rs {totals.pendingFees.toLocaleString()}</p>
        <p className="text-sm text-slate-500 mt-1">Paid: Rs {totals.paidFees.toLocaleString()} / Total: Rs {totals.totalFees.toLocaleString()}</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100"><h3 className="text-lg font-bold text-slate-800">Fee History</h3></div>
        <div className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <div className="p-6 text-slate-500">No fee records found.</div>
          ) : (
            rows.map((r) => (
              <div key={r.FEE_ID} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{r.TERM_NAME}</p>
                  <p className="text-sm text-slate-500">Due: {r.DUE_DATE || "-"}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">Rs {Number(r.AMOUNT_TOTAL).toLocaleString()}</p>
                  <p className="text-sm text-slate-500">{r.STATUS}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

