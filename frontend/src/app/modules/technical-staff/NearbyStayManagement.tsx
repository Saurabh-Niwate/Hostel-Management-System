import { useEffect, useMemo, useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { api } from "../../lib/api";

type StayRow = {
  ACCOMMODATION_ID: number;
  NAME: string;
  ACCOMMODATION_TYPE: "PG" | "Dormitory" | "Apartment";
  ADDRESS: string;
  DISTANCE_KM?: number | null;
  CONTACT_PHONE?: string | null;
  CONTACT_EMAIL?: string | null;
  RENT_MIN?: number | null;
  RENT_MAX?: number | null;
  GENDER_ALLOWED: "Male" | "Female" | "Any";
  AVAILABILITY_STATUS: "Available" | "Limited" | "Full";
  NOTES?: string | null;
};

type StayForm = {
  name: string;
  accommodationType: "PG" | "Dormitory" | "Apartment";
  address: string;
  distanceKm: string;
  contactPhone: string;
  contactEmail: string;
  rentMin: string;
  rentMax: string;
  genderAllowed: "Male" | "Female" | "Any";
  availabilityStatus: "Available" | "Limited" | "Full";
  notes: string;
};

const emptyForm: StayForm = {
  name: "",
  accommodationType: "PG",
  address: "",
  distanceKm: "",
  contactPhone: "",
  contactEmail: "",
  rentMin: "",
  rentMax: "",
  genderAllowed: "Any",
  availabilityStatus: "Available",
  notes: "",
};

export function NearbyStayManagement() {
  const [rows, setRows] = useState<StayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRow, setEditingRow] = useState<StayRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<StayForm>(emptyForm);

  const loadRows = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/technical-staff/external-accommodations");
      setRows(res.data?.accommodations || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load nearby stay suggestions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  useEffect(() => {
    const openCreate = () => {
      setForm(emptyForm);
      setEditingRow(null);
      setError("");
      setSuccess("");
      setIsModalOpen(true);
    };

    window.addEventListener("technical-staff:create-nearby-stay", openCreate);
    return () => window.removeEventListener("technical-staff:create-nearby-stay", openCreate);
  }, []);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      [row.NAME, row.ACCOMMODATION_TYPE, row.ADDRESS, row.AVAILABILITY_STATUS, row.GENDER_ALLOWED]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [rows, searchQuery]);

  const openEdit = (row: StayRow) => {
    setEditingRow(row);
    setForm({
      name: row.NAME || "",
      accommodationType: row.ACCOMMODATION_TYPE || "PG",
      address: row.ADDRESS || "",
      distanceKm: row.DISTANCE_KM === null || row.DISTANCE_KM === undefined ? "" : String(row.DISTANCE_KM),
      contactPhone: row.CONTACT_PHONE || "",
      contactEmail: row.CONTACT_EMAIL || "",
      rentMin: row.RENT_MIN === null || row.RENT_MIN === undefined ? "" : String(row.RENT_MIN),
      rentMax: row.RENT_MAX === null || row.RENT_MAX === undefined ? "" : String(row.RENT_MAX),
      genderAllowed: row.GENDER_ALLOWED || "Any",
      availabilityStatus: row.AVAILABILITY_STATUS || "Available",
      notes: row.NOTES || "",
    });
    setIsModalOpen(true);
    setError("");
    setSuccess("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRow(null);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    try {
      const payload = {
        name: form.name.trim(),
        accommodationType: form.accommodationType,
        address: form.address.trim(),
        distanceKm: form.distanceKm.trim() ? Number(form.distanceKm) : null,
        contactPhone: form.contactPhone.trim() || null,
        contactEmail: form.contactEmail.trim() || null,
        rentMin: form.rentMin.trim() ? Number(form.rentMin) : null,
        rentMax: form.rentMax.trim() ? Number(form.rentMax) : null,
        genderAllowed: form.genderAllowed,
        availabilityStatus: form.availabilityStatus,
        notes: form.notes.trim() || null,
      };

      if (editingRow) {
        await api.put(`/technical-staff/external-accommodations/${editingRow.ACCOMMODATION_ID}`, payload);
        setSuccess("Nearby stay suggestion updated successfully");
      } else {
        await api.post("/technical-staff/external-accommodations", payload);
        setSuccess("Nearby stay suggestion created successfully");
      }

      closeModal();
      await loadRows();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save nearby stay suggestion");
    }
  };

  const handleDelete = async (row: StayRow) => {
    if (!window.confirm(`Delete "${row.NAME}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await api.delete(`/technical-staff/external-accommodations/${row.ACCOMMODATION_ID}`);
      setSuccess("Nearby stay suggestion deleted successfully");
      await loadRows();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete nearby stay suggestion");
    }
  };

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, type, address, gender, or status..."
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total Suggestions</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{rows.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Available</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{rows.filter((row) => row.AVAILABILITY_STATUS === "Available").length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Limited / Full</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{rows.filter((row) => row.AVAILABILITY_STATUS !== "Available").length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {loading ? (
          <div className="text-sm text-slate-500">Loading nearby stay suggestions...</div>
        ) : filteredRows.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500">No nearby stay suggestions found.</div>
        ) : (
          filteredRows.map((row) => (
            <div key={row.ACCOMMODATION_ID} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{row.NAME}</h3>
                  <p className="text-sm text-slate-500 mt-1">{row.ACCOMMODATION_TYPE} | {row.GENDER_ALLOWED} | {row.AVAILABILITY_STATUS}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => openEdit(row)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => handleDelete(row)} className="rounded-lg p-2 text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-700">
                <p><span className="font-semibold">Address:</span> {row.ADDRESS}</p>
                <p><span className="font-semibold">Distance:</span> {row.DISTANCE_KM ?? "-"} km</p>
                <p><span className="font-semibold">Contact Phone:</span> {row.CONTACT_PHONE || "-"}</p>
                <p><span className="font-semibold">Contact Email:</span> {row.CONTACT_EMAIL || "-"}</p>
                <p><span className="font-semibold">Rent Range:</span> {row.RENT_MIN ?? "-"} - {row.RENT_MAX ?? "-"}</p>
                <p><span className="font-semibold">Notes:</span> {row.NOTES || "-"}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={closeModal}>
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">{editingRow ? "Edit Nearby Stay" : "Add Nearby Stay"}</h3>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-72px)]">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              <select value={form.accommodationType} onChange={(e) => setForm({ ...form, accommodationType: e.target.value as StayForm["accommodationType"] })} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                <option value="PG">PG</option>
                <option value="Dormitory">Dormitory</option>
                <option value="Apartment">Apartment</option>
              </select>
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows={3} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} placeholder="Distance (km)" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="Contact Phone" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                <input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="Contact Email" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                <select value={form.genderAllowed} onChange={(e) => setForm({ ...form, genderAllowed: e.target.value as StayForm["genderAllowed"] })} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                  <option value="Any">Any</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <input value={form.rentMin} onChange={(e) => setForm({ ...form, rentMin: e.target.value })} placeholder="Rent Min" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                <input value={form.rentMax} onChange={(e) => setForm({ ...form, rentMax: e.target.value })} placeholder="Rent Max" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <select value={form.availabilityStatus} onChange={(e) => setForm({ ...form, availabilityStatus: e.target.value as StayForm["availabilityStatus"] })} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                <option value="Available">Available</option>
                <option value="Limited">Limited</option>
                <option value="Full">Full</option>
              </select>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows={3} />
              <div className="flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="button" onClick={handleSubmit} className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
                  {editingRow ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
