import { useState } from 'react';
import { Calendar, Download, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { mockAttendanceRecords } from './mockData';
import { AttendanceRecord } from './wardenTypes';

export function AttendanceManagement() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords);
  const [selectedDate, setSelectedDate] = useState('2026-03-06');

  const filteredRecords = attendanceRecords.filter((record) => record.date === selectedDate);
  const presentCount = filteredRecords.filter((r) => r.status === 'Present').length;
  const absentCount = filteredRecords.filter((r) => r.status === 'Absent').length;

  const toggleAttendance = (studentId: string) => {
    setAttendanceRecords((prev) =>
      prev.map((record) =>
        record.studentId === studentId && record.date === selectedDate
          ? { ...record, status: record.status === 'Present' ? 'Absent' : 'Present' }
          : record
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
          <p className="text-gray-500 mt-1">Track and manage student attendance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            {selectedDate}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRecords.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-green-600">{presentCount}</div>
              <Badge className="bg-green-100 text-green-700">
                {filteredRecords.length > 0
                  ? Math.round((presentCount / filteredRecords.length) * 100)
                  : 0}
                %
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-red-600">{absentCount}</div>
              <Badge className="bg-red-100 text-red-700">
                {filteredRecords.length > 0
                  ? Math.round((absentCount / filteredRecords.length) * 100)
                  : 0}
                %
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records - {selectedDate}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Student ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Student Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Room No.</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.studentId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{record.studentId}</td>
                    <td className="py-3 px-4">{record.studentName}</td>
                    <td className="py-3 px-4">{record.roomNo}</td>
                    <td className="py-3 px-4">
                      <Badge
                        className={
                          record.status === 'Present'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }
                      >
                        {record.status === 'Present' ? (
                          <CheckCircle className="h-3 w-3 mr-1 inline" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1 inline" />
                        )}
                        {record.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAttendance(record.studentId)}
                      >
                        Mark {record.status === 'Present' ? 'Absent' : 'Present'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Today</span>
              <div className="flex items-center gap-2">
                <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{
                      width: `${
                        filteredRecords.length > 0 ? (presentCount / filteredRecords.length) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium">{presentCount}/{filteredRecords.length}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">This Week</span>
              <div className="flex items-center gap-2">
                <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '92%' }} />
                </div>
                <span className="text-sm font-medium">92%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">This Month</span>
              <div className="flex items-center gap-2">
                <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '89%' }} />
                </div>
                <span className="text-sm font-medium">89%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
