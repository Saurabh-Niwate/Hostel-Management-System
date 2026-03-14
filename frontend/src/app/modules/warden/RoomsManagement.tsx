import { useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { mockRooms } from './mockData';
import { Room } from './wardenTypes';

export function RoomsManagement() {
  const [rooms] = useState<Room[]>(mockRooms);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBlock, setFilterBlock] = useState<string>('all');

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.roomNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBlock = filterBlock === 'all' || room.block === filterBlock;
    return matchesSearch && matchesBlock;
  });

  const blocks = ['all', ...Array.from(new Set(rooms.map((r) => r.block)))];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Room Management</h2>
        <p className="text-gray-500 mt-1">View hostel rooms and occupancy (Read-only)</p>
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div className="flex gap-2">
              {blocks.map((block) => (
                <Button
                  key={block}
                  variant={filterBlock === block ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterBlock(block)}
                  className={filterBlock === block ? 'bg-teal-600 hover:bg-teal-700' : ''}
                >
                  {block === 'all' ? 'All Blocks' : `Block ${block}`}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                  const vacancies = room.capacity - room.occupied;
                  const statusColor = vacancies === 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
                  
                  return (
                    <tr key={room.roomNo} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{room.roomNo}</td>
                      <td className="py-3 px-4">{room.block}</td>
                      <td className="py-3 px-4">{room.floor}</td>
                      <td className="py-3 px-4">{room.capacity}</td>
                      <td className="py-3 px-4">{room.occupied}</td>
                      <td className="py-3 px-4">
                        <Badge className={statusColor}>
                          {vacancies === 0 ? 'Full' : `${vacancies} Vacant`}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Rooms</CardDescription>
            <CardTitle className="text-2xl">{rooms.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Capacity</CardDescription>
            <CardTitle className="text-2xl">{rooms.reduce((sum, r) => sum + r.capacity, 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vacancies Available</CardDescription>
            <CardTitle className="text-2xl">
              {rooms.reduce((sum, r) => sum + (r.capacity - r.occupied), 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}