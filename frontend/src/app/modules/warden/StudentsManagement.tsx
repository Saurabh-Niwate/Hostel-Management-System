import { useEffect, useState } from "react";
import { Search, Mail, Phone, User } from "lucide-react";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { api } from "../../lib/api";
import { WardenStudent } from "./wardenTypes";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { useListFetch } from "../../hooks/useListFetch";

export function StudentsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: students = [], loading, error, setParams } = useListFetch<WardenStudent>("/warden/students", { q: undefined }, 300);
  const [selectedStudent, setSelectedStudent] = useState<WardenStudent | null>(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  useEffect(() => {
    setParams({ q: searchTerm.trim() || undefined });
  }, [searchTerm, setParams]);

  const loadStudentBasic = async (studentId: string) => {
    try {
      const res = await api.get(`/warden/students/${studentId}/basic`);
      setSelectedStudent(res.data?.student || null);
      setImageLoadFailed(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch student details");
    }
  };

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students by name, ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-gray-500">Loading students...</p>
              ) : (
                <div className="space-y-3">
                  {students.map((student) => (
                    <div
                      key={student.STUDENT_ID}
                      onClick={() => loadStudentBasic(student.STUDENT_ID)}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedStudent?.STUDENT_ID === student.STUDENT_ID
                          ? "border-violet-500 bg-violet-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-900">{student.FULL_NAME || "Student"}</h3>
                            <Badge variant="outline">{student.STUDENT_ID}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span>Room: {student.ROOM_NO || "-"}</span>
                            <span>{student.EMAIL || "No email"}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadStudentBasic(student.STUDENT_ID);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          {selectedStudent ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-full overflow-hidden bg-violet-100 border border-violet-200 flex items-center justify-center">
                      {selectedStudent.PROFILE_IMAGE_URL ? (
                        <ImageWithFallback
                          src={selectedStudent.PROFILE_IMAGE_URL}
                          alt={selectedStudent.FULL_NAME || "Student profile"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-7 w-7 text-violet-600" />
                      )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedStudent.FULL_NAME || "Student"}</h3>
                    <p className="text-sm text-gray-500">{selectedStudent.STUDENT_ID}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Room Number</label>
                  <p className="text-gray-900 mt-1">{selectedStudent.ROOM_NO || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900 mt-1 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {selectedStudent.PHONE || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Aadhar Number</label>
                  <p className="text-gray-900 mt-1">{selectedStudent.AADHAR_NO || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900 mt-1 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {selectedStudent.EMAIL || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Guardian Name</label>
                  <p className="text-gray-900 mt-1">{selectedStudent.GUARDIAN_NAME || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Guardian Phone</label>
                  <p className="text-gray-900 mt-1">{selectedStudent.GUARDIAN_PHONE || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900 mt-1">{selectedStudent.ADDRESS || "-"}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Select a student to view details
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
