import { useMemo, useState } from "react";

type FeeRow = {
  FEE_ID: number;
  TERM_NAME: string;
  AMOUNT_TOTAL: number;
  AMOUNT_PAID: number;
  AMOUNT_DUE: number;
  DUE_DATE: string;
  STATUS: string;
};

const DUMMY_FEES: FeeRow[] = [
  { FEE_ID: 1, TERM_NAME: "Fall 2025", AMOUNT_TOTAL: 50000, AMOUNT_PAID: 50000, AMOUNT_DUE: 0, DUE_DATE: "2025-08-01", STATUS: "Paid" },
  { FEE_ID: 2, TERM_NAME: "Spring 2026", AMOUNT_TOTAL: 50000, AMOUNT_PAID: 25000, AMOUNT_DUE: 25000, DUE_DATE: "2026-01-15", STATUS: "Partial" },
];

export function FeesView() {
  const [rows] = useState<FeeRow[]>(DUMMY_FEES);

  const totals = useMemo(() => {
    const totalFees = rows.reduce((s, r) => s + Number(r.AMOUNT_TOTAL || 0), 0);
    const paidFees = rows.reduce((s, r) => s + Number(r.AMOUNT_PAID || 0), 0);
    const pendingFees = Math.max(totalFees - paidFees, 0);
    return { totalFees, paidFees, pendingFees };
  }, [rows]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Fee Details</h2>
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

