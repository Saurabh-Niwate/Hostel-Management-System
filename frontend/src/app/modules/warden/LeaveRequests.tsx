import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { mockLeaveRequests } from './mockData';
import { LeaveRequest } from './wardenTypes';

export function LeaveRequests() {
  const [leaveRequests] = useState<LeaveRequest[]>(mockLeaveRequests);
  const [filter, setFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  const filteredRequests =
    filter === 'all' ? leaveRequests : leaveRequests.filter((req) => req.status === filter);

  const pendingCount = leaveRequests.filter((req) => req.status === 'Pending').length;
  const approvedCount = leaveRequests.filter((req) => req.status === 'Approved').length;
  const rejectedCount = leaveRequests.filter((req) => req.status === 'Rejected').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge className="bg-amber-100 text-amber-700"><Clock className="h-3 w-3 mr-1 inline" />Pending</Badge>;
      case 'Approved':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1 inline" />Approved</Badge>;
      case 'Rejected':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1 inline" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Leave Requests</h2>
        <p className="text-gray-500 mt-1">View student leave applications (Read-only)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaveRequests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-teal-600 hover:bg-teal-700' : ''}
        >
          All
        </Button>
        <Button
          variant={filter === 'Pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('Pending')}
          className={filter === 'Pending' ? 'bg-teal-600 hover:bg-teal-700' : ''}
        >
          Pending
        </Button>
        <Button
          variant={filter === 'Approved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('Approved')}
          className={filter === 'Approved' ? 'bg-teal-600 hover:bg-teal-700' : ''}
        >
          Approved
        </Button>
        <Button
          variant={filter === 'Rejected' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('Rejected')}
          className={filter === 'Rejected' ? 'bg-teal-600 hover:bg-teal-700' : ''}
        >
          Rejected
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Leave Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    onClick={() => setSelectedRequest(request)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedRequest?.id === request.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{request.studentName}</h3>
                        <p className="text-sm text-gray-500">
                          {request.studentId} • Room {request.roomNo}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>
                        {request.leaveFrom} to {request.leaveTo}
                      </p>
                      <p className="mt-1 text-gray-500">Applied on: {request.appliedOn}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          {selectedRequest ? (
            <Card>
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Student Name</label>
                  <p className="text-gray-900 mt-1">{selectedRequest.studentName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Student ID</label>
                  <p className="text-gray-900 mt-1">{selectedRequest.studentId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Room Number</label>
                  <p className="text-gray-900 mt-1">{selectedRequest.roomNo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Leave Period</label>
                  <p className="text-gray-900 mt-1">
                    {selectedRequest.leaveFrom} to {selectedRequest.leaveTo}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Reason</label>
                  <p className="text-gray-900 mt-1">{selectedRequest.reason}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Applied On</label>
                  <p className="text-gray-900 mt-1">{selectedRequest.appliedOn}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Eye className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Select a request to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}