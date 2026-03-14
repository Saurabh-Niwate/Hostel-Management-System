import { useState } from 'react';
import { Search, Mail, Phone, User } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { mockStudents } from './mockData';
import { Student } from './wardenTypes';

export function StudentsManagement() {
  const [students] = useState<Student[]>(mockStudents);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.name.toLowerCase().includes(searchLower) ||
      student.studentId.toLowerCase().includes(searchLower) ||
      student.roomNo.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
        <p className="text-gray-500 mt-1">View student information (Read-only)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students by name, ID, or room..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedStudent?.id === student.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">{student.name}</h3>
                          <Badge variant="outline">{student.studentId}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span>Room: {student.roomNo}</span>
                          <span>•</span>
                          <span>{student.course}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(student);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          {selectedStudent ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedStudent.name}</h3>
                    <p className="text-sm text-gray-500">{selectedStudent.studentId}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Course</label>
                  <p className="text-gray-900 mt-1">{selectedStudent.course}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Room Number</label>
                  <p className="text-gray-900 mt-1">{selectedStudent.roomNo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{selectedStudent.contact}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Parent Contact</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{selectedStudent.parentContact}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900 text-sm break-all">{selectedStudent.email}</p>
                  </div>
                </div>
                <div className="pt-4 space-y-2">
                  <Button variant="outline" className="w-full">View Attendance History</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Select a student to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}