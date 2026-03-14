import { useState } from "react";
import { Plus } from "lucide-react";

type FeeRow = {
  FEE_ID: number;
  USER_ID: number;
  STUDENT_ID: string;
  TERM_NAME: string;
  AMOUNT_TOTAL: number;
  AMOUNT_PAID: number;
  AMOUNT_DUE: number;
  DUE_DATE?: string;
  STATUS: string;
};

type FeeForm = {
  studentId: string;
  termName: string;
  amountTotal: string;
  amountPaid: string;
  dueDate: string;
  status: string;
};

const defaultForm: FeeForm = {
  studentId: "",
  termName: "",
  amountTotal: "",
  amountPaid: "0",
  dueDate: "",
  status: "Pending",
};

const DUMMY_FEES: FeeRow[] = [
  { FEE_ID: 1, USER_ID: 1, STUDENT_ID: "STU001", TERM_NAME: "Semester 1 (2025)", AMOUNT_TOTAL: 50000, AMOUNT_PAID: 50000, AMOUNT_DUE: 0, STATUS: "Paid" },
  { FEE_ID: 2, USER_ID: 3, STUDENT_ID: "STU002", TERM_NAME: "Semester 1 (2025)", AMOUNT_TOTAL: 50000, AMOUNT_PAID: 20000, AMOUNT_DUE: 30000, STATUS: "Partially Paid" },
  { FEE_ID: 3, USER_ID: 5, STUDENT_ID: "STU003", TERM_NAME: "Semester 1 (2025)", AMOUNT_TOTAL: 55000, AMOUNT_PAID: 0, AMOUNT_DUE: 55000, STATUS: "Pending" },
];

export function FeeManagement() {
  const [fees, setFees] = useState<FeeRow[]>(DUMMY_FEES);
  const [loading, setLoading] = useState(false);
  const [hasAppliedFilters, setHasAppliedFilters] = useState(true);
  const [success, setSuccess] = useState("");
  const [studentIdFilter, setStudentIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createForm, setCreateForm] = useState<FeeForm>(defaultForm);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFeeId, setEditingFeeId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FeeForm>(defaultForm);

  const loadFees = () => {
    setLoading(true);
    setTimeout(() => {
      let filtered = DUMMY_FEES;
      if (studentIdFilter.trim()) {
        filtered = filtered.filter(f => f.STUDENT_ID.toLowerCase().includes(studentIdFilter.toLowerCase()));
      }
      if (statusFilter) {
        filtered = filtered.filter(f => f.STATUS === statusFilter);
      }
      setFees(filtered);
      setHasAppliedFilters(true);
      setLoading(false);
    }, 500);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const newFee: FeeRow = {
        FEE_ID: Math.random(),
        USER_ID: 999,
        STUDENT_ID: createForm.studentId,
        TERM_NAME: createForm.termName,
        AMOUNT_TOTAL: Number(createForm.amountTotal),
        AMOUNT_PAID: Number(createForm.amountPaid),
        AMOUNT_DUE: Number(createForm.amountTotal) - Number(createForm.amountPaid),
        STATUS: createForm.status,
      };
      setFees(prev => [newFee, ...prev]);
      setSuccess("Fee record created successfully (Demo Mode)");
      setCreateForm(defaultForm);
      setIsCreateModalOpen(false);
      setLoading(false);
    }, 1000);
  };

  const startEdit = (row: FeeRow) => {
    setEditingFeeId(row.FEE_ID);
    setEditForm({
      studentId: row.STUDENT_ID || "",
      termName: row.TERM_NAME || "",
      amountTotal: String(row.AMOUNT_TOTAL ?? ""),
      amountPaid: String(row.AMOUNT_PAID ?? ""),
      dueDate: row.DUE_DATE || "",
      status: row.STATUS || "Pending",
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeeId) return;
    setLoading(true);
    setTimeout(() => {
      setFees(prev => prev.map(f => f.FEE_ID === editingFeeId ? {
        ...f,
        TERM_NAME: editForm.termName,
        AMOUNT_TOTAL: Number(editForm.amountTotal),
        AMOUNT_PAID: Number(editForm.amountPaid),
        AMOUNT_DUE: Number(editForm.amountTotal) - Number(editForm.amountPaid),
        STATUS: editForm.status
      } : f));
      setSuccess("Fee record updated successfully (Demo Mode)");
      setEditingFeeId(null);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Fee Management</h2>
          <p className="text-sm text-slate-600">Filter records and manage fee entries</p>
        </div>
        <button
          onClick={() => {
            setCreateForm(defaultForm);
            setIsCreateModalOpen(true);
            setSuccess("");
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium"
        >
          <Plus size={18} className="mr-2" />
          Create New Fee Record
        </button>
      </div>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={studentIdFilter}
            onChange={(e) => setStudentIdFilter(e.target.value)}
            placeholder="Student ID"
            className="px-3 py-2 border border-slate-300 rounded-lg"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
          <button onClick={loadFees} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
            Apply Filters
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Filtered Results</h3>
          {!loading && hasAppliedFilters && <p className="text-sm text-slate-500">{fees.length} record(s)</p>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Student</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Term</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Total</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Paid</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Due</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading fee records...</td></tr>
              ) : !hasAppliedFilters ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Apply filters to load results.</td></tr>
              ) : fees.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No fee records found</td></tr>
              ) : (
                fees.map((row) => (
                  <tr key={row.FEE_ID} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-sm text-slate-900">{row.STUDENT_ID}</td>
                    <td className="px-6 py-3 text-sm text-slate-700">{row.TERM_NAME}</td>
                    <td className="px-6 py-3 text-sm text-slate-700">{row.AMOUNT_TOTAL}</td>
                    <td className="px-6 py-3 text-sm text-slate-700">{row.AMOUNT_PAID}</td>
                    <td className="px-6 py-3 text-sm text-slate-700">{row.AMOUNT_DUE}</td>
                    <td className="px-6 py-3 text-sm text-slate-700">{row.STATUS}</td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => startEdit(row)} className="px-3 py-1.5 text-sm bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateModalOpen && (
        <ModalShell title="Create Fee Record" onClose={() => setIsCreateModalOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-3">
            <input value={createForm.studentId} onChange={(e) => setCreateForm({ ...createForm, studentId: e.target.value })} placeholder="Student ID" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
            <input value={createForm.termName} onChange={(e) => setCreateForm({ ...createForm, termName: e.target.value })} placeholder="Term Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
            <input type="number" value={createForm.amountTotal} onChange={(e) => setCreateForm({ ...createForm, amountTotal: e.target.value })} placeholder="Amount Total" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
            <input type="number" value={createForm.amountPaid} onChange={(e) => setCreateForm({ ...createForm, amountPaid: e.target.value })} placeholder="Amount Paid" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            <input type="date" value={createForm.dueDate} onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            <select value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
              <option value="Pending">Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
            <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
          </form>
        </ModalShell>
      )}

      {editingFeeId && (
        <ModalShell title="Edit Fee Record" onClose={() => setEditingFeeId(null)}>
          <form onSubmit={handleUpdate} className="space-y-3">
            <input value={editForm.studentId} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50" readOnly />
            <input value={editForm.termName} onChange={(e) => setEditForm({ ...editForm, termName: e.target.value })} placeholder="Term Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
            <input type="number" value={editForm.amountTotal} onChange={(e) => setEditForm({ ...editForm, amountTotal: e.target.value })} placeholder="Amount Total" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
            <input type="number" value={editForm.amountPaid} onChange={(e) => setEditForm({ ...editForm, amountPaid: e.target.value })} placeholder="Amount Paid" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            <input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
              <option value="Pending">Pending</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Update</button>
              <button type="button" onClick={() => setEditingFeeId(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Cancel</button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-lg shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="px-3 py-1 text-sm bg-slate-100 rounded-lg hover:bg-slate-200">Close</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

