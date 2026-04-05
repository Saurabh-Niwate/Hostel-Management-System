import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { api } from "../../lib/api";
import { WardenRoom } from "./wardenTypes";

export function RoomsManagement() {
  const [rooms, setRooms] = useState<WardenRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBlock, setFilterBlock] = useState("all");

  useEffect(() => {
    const loadRooms = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/warden/rooms");
        setRooms(res.data?.rooms || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load rooms");
      } finally {
        setLoading(false);
      }
    };
    loadRooms();
  }, []);

  const blocks = useMemo(
    () => ["all", ...Array.from(new Set(rooms.map((room) => room.BLOCK_NAME).filter(Boolean)))],
    [rooms]
  );

  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) => {
        const matchesSearch = (room.ROOM_NO || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBlock = filterBlock === "all" || room.BLOCK_NAME === filterBlock;
        return matchesSearch && matchesBlock;
      }),
    [rooms, searchTerm, filterBlock]
  );

  const totalCapacity = rooms.reduce((sum, room) => sum + Number(room.CAPACITY || 0), 0);
  const totalOccupied = rooms.reduce((sum, room) => sum + Number(room.OCCUPIED || 0), 0);

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-6">
            <CardDescription>Total Rooms</CardDescription>
            <CardTitle className="text-2xl">{rooms.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-6">
            <CardDescription>Total Capacity</CardDescription>
            <CardTitle className="text-2xl">{totalCapacity}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-6">
            <CardDescription>Vacancies Available</CardDescription>
            <CardTitle className="text-2xl">{Math.max(totalCapacity - totalOccupied, 0)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {blocks.map((block) => (
                <Button
                  key={block}
                  variant={filterBlock === block ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterBlock(block)}
                  className={filterBlock === block ? "bg-violet-600 hover:bg-violet-700" : ""}
                >
                  {block === "all" ? "All Blocks" : block}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Loading rooms...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Room No.</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Block</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Floor</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Capacity</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Occupied</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.map((room) => {
                    const vacancies = Number(room.CAPACITY || 0) - Number(room.OCCUPIED || 0);
                    return (
                      <tr key={room.ROOM_NO} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{room.ROOM_NO}</td>
                        <td className="py-3 px-4">{room.BLOCK_NAME || "-"}</td>
                        <td className="py-3 px-4">{room.FLOOR_NO ?? "-"}</td>
                        <td className="py-3 px-4">{room.CAPACITY}</td>
                        <td className="py-3 px-4">{room.OCCUPIED}</td>
                        <td className="py-3 px-4">
                          <Badge className={vacancies <= 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>
                            {vacancies <= 0 ? "Full" : `${vacancies} Vacant`}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
