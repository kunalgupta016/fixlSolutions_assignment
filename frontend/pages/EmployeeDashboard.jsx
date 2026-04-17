import React, { useState, useEffect } from "react";
import { useAuth } from "../components/context/AuthContext";
import Card from "../components/UI/Card";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";
import api from "../services/api";
import toast from "react-hot-toast";
import { CalendarDays, Clock, CheckCircle, XCircle, Edit2, Trash2, History } from "lucide-react";
import Pagination from "../components/UI/Pagination";

const EmployeeDashboard = () => {
  const { user, checkAuthStatus } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({});
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  
  // Pagination
  const [leavePagination, setLeavePagination] = useState({});
  const [leavePage, setLeavePage] = useState(1);
  const [attPagination, setAttPagination] = useState({});
  const [attPage, setAttPage] = useState(1);
  
  // Modal state
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [editingLeaveId, setEditingLeaveId] = useState(null);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "casual",
    startDate: "",
    endDate: "",
    reason: "",
    isHalfDay: false,
    halfDayPeriod: "first_half",
  });
  const [isApplying, setIsApplying] = useState(false);

  // Fetch logic
  const fetchLeaves = async (p = 1) => {
    try {
      const res = await api.get(`/leaves/me?page=${p}&limit=5`);
      setLeaves(res.data.leaves || []);
      setLeavePagination(res.data.pagination || {});
    } catch (e) {}
  };

  const fetchAttendance = async (p = 1) => {
    try {
      const [summaryRes, historyRes] = await Promise.all([
        api.get("/attendance/summary"),
        api.get(`/attendance/me?page=${p}&limit=10`)
      ]);
      setAttendanceSummary(summaryRes.data || {});
      setAttendanceHistory(historyRes.data.history || []);
      setAttPagination(historyRes.data.pagination || {});
    } catch (e) {}
  };

  useEffect(() => {
    fetchLeaves(leavePage);
  }, [leavePage]);

  useEffect(() => {
    fetchAttendance(attPage);
  }, [attPage]);

  const refreshAll = () => {
    setLeavePage(1);
    setAttPage(1);
    fetchLeaves(1);
    fetchAttendance(1);
  };

  const handleCheckInOut = async (type) => {
    try {
      if (type === "in") {
        await api.post("/attendance/check-in");
        toast.success("Checked in successfully!");
      } else {
        await api.patch("/attendance/check-out");
        toast.success("Checked out! Great job today.");
      }
      refreshAll();
    } catch (error) {
      // toast handled centrally
    }
  };

  const handleOpenNewLeave = () => {
    setEditingLeaveId(null);
    setLeaveForm({
      leaveType: "casual",
      startDate: "",
      endDate: "",
      reason: "",
      isHalfDay: false,
      halfDayPeriod: "first_half",
    });
    setIsLeaveModalOpen(true);
  };

  const handleEditClick = (leave) => {
    setEditingLeaveId(leave._id);
    setLeaveForm({
      leaveType: leave.leaveType,
      startDate: new Date(leave.startDate).toISOString().split('T')[0],
      endDate: new Date(leave.endDate).toISOString().split('T')[0],
      reason: leave.reason,
      isHalfDay: leave.isHalfDay,
      halfDayPeriod: leave.halfDayPeriod || "first_half",
    });
    setIsLeaveModalOpen(true);
  };

  const handleCancelLeave = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this leave application?")) return;
    try {
      await api.patch(`/leaves/${id}/cancel`);
      toast.success("Leave cancelled successfully!");
      refreshAll();
      checkAuthStatus();
    } catch (err) {
      // Interceptor catches specific errors
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      toast.error("Please fill in all leave request fields.");
      return;
    }
    
    // Quick validation start <= end date
    if (new Date(leaveForm.startDate) > new Date(leaveForm.endDate)) {
        toast.error("Start date cannot be after end date.");
        return;
    }

    try {
      setIsApplying(true);
      if (editingLeaveId) {
        await api.put(`/leaves/${editingLeaveId}`, leaveForm);
        toast.success("Leave application updated!");
      } else {
        await api.post("/leaves", leaveForm);
        toast.success("Leave applied successfully!");
      }
      setIsLeaveModalOpen(false);
      refreshAll();
      checkAuthStatus(); // Refresh user profile (leaveBalance logic)
    } finally {
      setIsApplying(false);
    }
  };

  const balances = [
    { label: "Casual", key: "casual", color: "bg-blue-400", amount: user?.leaveBalance?.casual, max: 5 },
    { label: "Sick", key: "sick", color: "bg-red-400", amount: user?.leaveBalance?.sick, max: 7 },
    { label: "Earned", key: "earned", color: "bg-green-400", amount: user?.leaveBalance?.earned, max: 8 },
    { label: "Unpaid", key: "unpaid", color: "bg-gray-400", amount: user?.leaveBalance?.unpaid, max: 1 },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved": return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Approved</span>;
      case "rejected": return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Rejected</span>;
      case "cancelled": return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">Cancelled</span>;
      default: return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.name.split(" ")[0]}! Have a great day.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => handleCheckInOut("in")}>
            <Clock className="w-4 h-4" /> Check In
          </Button>
          <Button variant="outline" onClick={() => handleCheckInOut("out")}>
            <Clock className="w-4 h-4" /> Check Out
          </Button>
          <Button onClick={handleOpenNewLeave}>
            <CalendarDays className="w-4 h-4" /> Apply Leave
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map((b) => (
          <Card key={b.label} className="flex flex-col gap-2">
            <span className="text-sm text-gray-500 font-semibold uppercase">{b.label} Leave</span>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-gray-800">{b.amount}</span>
              <span className="text-sm text-gray-500 pb-1">{b.key === "unpaid" ? "Days Taken" : `of ${b.max} Days Left`}</span>
            </div>
            {b.key !== "unpaid" && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div className={`h-1.5 rounded-full ${b.color}`} style={{ width: `${Math.min((b.amount / b.max) * 100, 100)}%` }}></div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200/50 pb-2">Recent Leave Requests</h2>
          {leaves.length === 0 ? (
            <div className="text-center py-6 text-gray-500">No leave requests found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Dates</th>
                    <th className="px-4 py-3">Days</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((l, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 capitalize font-medium">{l.leaveType}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">{l.totalDays}</td>
                      <td className="px-4 py-3">{getStatusBadge(l.status)}</td>
                      <td className="px-4 py-3">
                         {l.status === "pending" ? (
                           <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleEditClick(l)}
                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                                title="Edit Request"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleCancelLeave(l._id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                title="Cancel Request"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                         ) : (
                           <div className="text-right text-gray-400 text-xs italic">--</div>
                         )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination pagination={leavePagination} onPageChange={setLeavePage} />
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200/50 pb-2">This Month</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-green-50/50 p-3 rounded-xl border border-green-100">
               <div className="flex items-center gap-3"><CheckCircle className="text-green-500 w-5 h-5" /><span className="font-semibold text-gray-700">Present</span></div>
               <span className="font-bold">{attendanceSummary?.summary?.present || 0}</span>
            </div>
            <div className="flex justify-between items-center bg-red-50/50 p-3 rounded-xl border border-red-100">
               <div className="flex items-center gap-3"><XCircle className="text-red-500 w-5 h-5" /><span className="font-semibold text-gray-700">Absent</span></div>
               <span className="font-bold">{attendanceSummary?.summary?.absent || 0}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4 border-b border-gray-200/50 pb-2">
          <History className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-800">Attendance History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">In Time</th>
                <th className="px-4 py-3">Out Time</th>
                <th className="px-4 py-3 text-right">Hours</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistory.map((log) => (
                <tr key={log._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{new Date(log.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{log.checkIn?.time ? new Date(log.checkIn.time).toLocaleTimeString() : "--"}</td>
                  <td className="px-4 py-3">{log.checkOut?.time ? new Date(log.checkOut.time).toLocaleTimeString() : "--"}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium">{log.workHours}h</td>
                </tr>
              ))}
              {attendanceHistory.length === 0 && (
                <tr><td colSpan="4" className="text-center py-6 text-gray-500">No attendance records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination pagination={attPagination} onPageChange={setAttPage} />
      </Card>

      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm px-4">
          <Card className="w-full max-w-md bg-white border border-white/60 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">{editingLeaveId ? "Edit Leave Request" : "Apply for Leave"}</h2>
            <form onSubmit={handleApplyLeave} className="space-y-4">
               <div>
                  <label className="text-sm font-semibold text-gray-700 ml-1">Leave Type</label>
                  <select 
                    className="glass-input w-full appearance-none mt-1" 
                    value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm({...leaveForm, leaveType: e.target.value})}
                  >
                     <option value="casual">Casual</option>
                     <option value="sick">Sick</option>
                     <option value="earned">Earned</option>
                     <option value="unpaid">Unpaid</option>
                  </select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <Input 
                    type="date" label="Start Date" 
                    value={leaveForm.startDate} 
                    onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} 
                  />
                  <Input 
                    type="date" label="End Date" 
                    value={leaveForm.endDate} 
                    onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} 
                  />
               </div>
               
               <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    id="halfDay"
                    checked={leaveForm.isHalfDay} 
                    onChange={e => setLeaveForm({...leaveForm, isHalfDay: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="halfDay" className="text-sm font-medium text-gray-700">This is a half day</label>
               </div>

               {leaveForm.isHalfDay && (
                 <div>
                    <label className="text-sm font-semibold text-gray-700 ml-1">Half Day Period</label>
                    <select 
                      className="glass-input w-full appearance-none mt-1" 
                      value={leaveForm.halfDayPeriod}
                      onChange={(e) => setLeaveForm({...leaveForm, halfDayPeriod: e.target.value})}
                    >
                       <option value="first_half">First Half</option>
                       <option value="second_half">Second Half</option>
                    </select>
                 </div>
               )}

               <div className="flex flex-col gap-1 w-full">
                  <label className="text-sm font-semibold text-gray-700 ml-1">Reason</label>
                  <textarea 
                    className="glass-input w-full min-h-[100px] resize-none" 
                    placeholder="Brief description..."
                    value={leaveForm.reason}
                    onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})}
                  />
               </div>
               
               <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" type="button" onClick={() => setIsLeaveModalOpen(false)}>Cancel</Button>
                  <Button type="submit" isLoading={isApplying}>
                     {editingLeaveId ? "Update Leave" : "Submit Leave"}
                  </Button>
               </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
