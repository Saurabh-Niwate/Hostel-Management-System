import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { api } from "../../lib/api";

type RoomRow = {
  ROOM_NO: string;
  BLOCK_NAME?: string;
  FLOOR_NO?: number;
  CAPACITY: number;
  ROOM_TYPE?: string;
  IS_ACTIVE: number;
  CREATED_AT?: string;
};

type RoomForm = {
  roomNo: string;
  blockName: string;
  floorNo: string;
  capacity: string;
  roomType: string;
  isActive: string;
};

const defaultForm: RoomForm = {
  roomNo: "",
  blockName: "",
  floorNo: "",
  capacity: "1",
  roomType: "Regular",
  isActive: "1",
};

export function RoomManagement() {
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<RoomForm>(defaultForm);
  const [editingRoomNo, setEditingRoomNo] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RoomForm>(defaultForm);

  const loadRooms = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/technical-staff/rooms");
      setRooms(res.data?.rooms || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    const openCreateModal = () => {
      setCreateForm(defaultForm);
      setIsCreateModalOpen(true);
      setError("");
      setSuccess("");
    };

    window.addEventListener("technical-staff:create-room", openCreateModal);
    return () => window.removeEventListener("technical-staff:create-room", openCreateModal);
  }, []);

  const filteredRooms = rooms.filter((room) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      String(room.ROOM_NO || "").toLowerCase().includes(q) ||
      String(room.BLOCK_NAME || "").toLowerCase().includes(q) ||
      String(room.ROOM_TYPE || "").toLowerCase().includes(q)
    );
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await api.post("/technical-staff/rooms", {
        roomNo: createForm.roomNo.trim(),
        blockName: createForm.blockName.trim() || null,
        floorNo: createForm.floorNo ? Number(createForm.floorNo) : null,
        capacity: Number(createForm.capacity),
        roomType: createForm.roomType.trim() || "Regular",
        isActive: Number(createForm.isActive),
      });
      setSuccess("Room created successfully");
      setCreateForm(defaultForm);
      setIsCreateModalOpen(false);
      await loadRooms();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create room");
    }
  };

  const startEdit = (room: RoomRow) => {
    setEditingRoomNo(room.ROOM_NO);
    setEditForm({
      roomNo: room.ROOM_NO,
      blockName: room.BLOCK_NAME || "",
      floorNo: room.FLOOR_NO === undefined || room.FLOOR_NO === null ? "" : String(room.FLOOR_NO),
      capacity: String(room.CAPACITY ?? 1),
      roomType: room.ROOM_TYPE || "Regular",
      isActive: String(room.IS_ACTIVE ?? 1),
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoomNo) return;
    setError("");
    setSuccess("");
    try {
      await api.put(`/technical-staff/rooms/${encodeURIComponent(editingRoomNo)}`, {
        blockName: editForm.blockName.trim() || null,
        floorNo: editForm.floorNo ? Number(editForm.floorNo) : null,
        capacity: Number(editForm.capacity),
        roomType: editForm.roomType.trim() || "Regular",
        isActive: Number(editForm.isActive),
      });
      setSuccess("Room updated successfully");
      setEditingRoomNo(null);
      await loadRooms();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update room");
    }
  };

  const handleDelete = async (roomNo: string, force = false) => {
    setError("");
    setSuccess("");
    try {
      await api.delete(`/technical-staff/rooms/${encodeURIComponent(roomNo)}`, {
        params: { force },
      });
      setSuccess(force ? "Room force deleted successfully" : "Room deleted successfully");
      await loadRooms();
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to delete room";
      if (!force && String(message).includes("Use ?force=true")) {
        const shouldForce = confirm(`${message}\n\nDo you want to force delete this room and unassign students?`);
        if (shouldForce) {
          await handleDelete(roomNo, true);
          return;
        }
      }
      setError(message);
    }
  };

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Total Rooms</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{rooms.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Active Rooms</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{rooms.filter((room) => Number(room.IS_ACTIVE) === 1).length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Inactive Rooms</p>
            <p className="mt-2 text-2xl font-bold text-amber-600">{rooms.filter((room) => Number(room.IS_ACTIVE) === 0).length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Total Capacity</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {rooms.reduce((sum, room) => sum + Number(room.CAPACITY || 0), 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="relative">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by room no, block, or room type..."
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Room No</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Block</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Floor</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Capacity</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Type</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">Loading rooms...</td></tr>
              ) : filteredRooms.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No rooms found</td></tr>
              ) : (
                filteredRooms.map((room) => (
                  <tr key={room.ROOM_NO} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">{room.ROOM_NO}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{room.BLOCK_NAME || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{room.FLOOR_NO ?? "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{room.CAPACITY}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{room.ROOM_TYPE || "-"}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        Number(room.IS_ACTIVE) === 1 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                      }`}>
                        {Number(room.IS_ACTIVE) === 1 ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => startEdit(room)}
                          className="px-3 py-1.5 text-sm bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(room.ROOM_NO)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete room"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateModalOpen && (
        <ModalShell title="Create Room" onClose={() => setIsCreateModalOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-3">
            <input value={createForm.roomNo} onChange={(e) => setCreateForm({ ...createForm, roomNo: e.target.value })} placeholder="Room No" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
            <input value={createForm.blockName} onChange={(e) => setCreateForm({ ...createForm, blockName: e.target.value })} placeholder="Block Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            <input type="number" value={createForm.floorNo} onChange={(e) => setCreateForm({ ...createForm, floorNo: e.target.value })} placeholder="Floor No" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            <input type="number" min="1" value={createForm.capacity} onChange={(e) => setCreateForm({ ...createForm, capacity: e.target.value })} placeholder="Capacity" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
            <input value={createForm.roomType} onChange={(e) => setCreateForm({ ...createForm, roomType: e.target.value })} placeholder="Room Type" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            <select value={createForm.isActive} onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
            <button type="submit" className="w-full px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">Create Room</button>
          </form>
        </ModalShell>
      )}

      {editingRoomNo && (
        <ModalShell title="Edit Room" onClose={() => setEditingRoomNo(null)}>
          <form onSubmit={handleUpdate} className="space-y-3">
            <input value={editForm.roomNo} readOnly className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50" />
            <input value={editForm.blockName} onChange={(e) => setEditForm({ ...editForm, blockName: e.target.value })} placeholder="Block Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            <input type="number" value={editForm.floorNo} onChange={(e) => setEditForm({ ...editForm, floorNo: e.target.value })} placeholder="Floor No" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            <input type="number" min="1" value={editForm.capacity} onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })} placeholder="Capacity" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
            <input value={editForm.roomType} onChange={(e) => setEditForm({ ...editForm, roomType: e.target.value })} placeholder="Room Type" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            <select value={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Update Room</button>
              <button type="button" onClick={() => setEditingRoomNo(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Cancel</button>
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
