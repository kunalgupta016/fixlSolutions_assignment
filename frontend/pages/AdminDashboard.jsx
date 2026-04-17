import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Card from "../components/UI/Card";
import Button from "../components/UI/Button";
import api from "../services/api";
import toast from "react-hot-toast";
import Pagination from "../components/UI/Pagination";
import { Search } from "lucide-react";

const AdminDashboard = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab || "employees";

  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);

  // Report States
  const [reportData, setReportData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Pagination States
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const filteredAttendance = attendance.filter((log) => {
    // Note: Backend handles primary filtering now, but we keep this for instant UX if needed
    return true; 
  });

  const fetchEmployees = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/users?page=${p}&limit=12&search=${searchQuery}`);
      setEmployees(res.data.users || []);
      setPagination(res.data.pagination || {});
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const fetchLeaves = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/leaves?page=${p}&limit=15`);
      setLeaves(res.data.leaves || []);
      setPagination(res.data.pagination || {});
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance?page=${p}&limit=20&search=${filterEmployee}&date=${filterDate}`);
      setAttendance(res.data.attendances || []);
      setPagination(res.data.pagination || {});
    } catch (e) {} finally {
      setLoading(false);
    }
  }

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/report?month=${selectedMonth}&year=${selectedYear}`);
      setReportData(res.data.report || []);
    } catch (e) {
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (reportData.length === 0) return;
    
    const headers = ["Employee", "Email", "Department", "Present", "Absent", "Half Day", "Late Arrivals", "Work Hours"];
    const rows = reportData.map(r => [
      r.employee.name,
      r.employee.email,
      r.employee.department,
      r.present,
      r.absent,
      r.halfDay,
      r.lateArrivals,
      r.totalWorkHours
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_report_${selectedMonth}_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    setPage(1); // Reset page on tab change
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "employees") fetchEmployees(page);
    else if (activeTab === "leaves") fetchLeaves(page);
    else if (activeTab === "attendance") fetchAttendance(page);
    else if (activeTab === "reports") fetchReport();
  }, [activeTab, page, selectedMonth, selectedYear, filterDate, filterEmployee, searchQuery]);

  const handleTabChange = (newTab) => {
    navigate(`/admin/${newTab}`);
  };

  const handleLeaveAction = async (leaveId, status) => {
    try {
      await api.patch(`/leaves/${leaveId}/action`, { status, remarks: "Admin reviewed." });
      toast.success(`Leave ${status} successfully.`);
      fetchLeaves();
    } catch (e) {
      // Interceptor handles toast natively 
    }
  };

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
      <h1 className="text-3xl font-bold text-gray-900">Admin Control Center</h1>
      
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-300/50 pb-2">
        <button
          onClick={() => handleTabChange("employees")}
          className={`font-semibold pb-2 border-b-2 transition-colors ${activeTab === "employees" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          Employees
        </button>
        <button
          onClick={() => handleTabChange("leaves")}
          className={`font-semibold pb-2 border-b-2 transition-colors ${activeTab === "leaves" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          Leave Requests
        </button>
        <button
          onClick={() => handleTabChange("attendance")}
          className={`font-semibold pb-2 border-b-2 transition-colors ${activeTab === "attendance" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          Attendance Logs
        </button>
        <button
          onClick={() => handleTabChange("reports")}
          className={`font-semibold pb-2 border-b-2 transition-colors ${activeTab === "reports" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          Monthly Reports
        </button>
      </div>

      {loading ? (
        <div className="p-10 text-center text-gray-500 animate-pulse">Loading data...</div>
      ) : (
        <>
          {activeTab === "employees" && (
            <div className="space-y-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search employees by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/50 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-inner text-sm"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employees.length === 0 ? <p className="text-gray-500">No employees found.</p> : employees.map((emp) => (
                  <Card key={emp._id} className="flex gap-4 items-center hover:-translate-y-1 hover:shadow-xl hover:border-blue-200/50 cursor-pointer transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-full flex shrink-0 items-center justify-center font-bold text-xl overflow-hidden bg-blue-500 text-white group-hover:ring-2 group-hover:ring-blue-400 group-hover:ring-offset-2 transition-all duration-300">
                      {emp.avatar ? (
                        <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                      ) : (
                        emp.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{emp.name}</h3>
                      <p className="text-sm text-gray-500">{emp.email}</p>
                      <p className="text-xs font-medium text-indigo-600 mt-1 uppercase">{emp.department} • {emp.role}</p>
                    </div>
                  </Card>
                ))}
              </div>
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          )}

          {activeTab === "leaves" && (
            <div className="space-y-6">
              <Card className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Dates</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((l) => (
                      <tr key={l._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full flex shrink-0 items-center justify-center font-bold text-sm overflow-hidden bg-blue-500 text-white">
                               {l.employee?.avatar ? <img src={l.employee.avatar} alt="..." className="w-full h-full object-cover" /> : (l.employee?.name?.charAt(0).toUpperCase() || "?")}
                             </div>
                             {l.employee?.name || "Unknown"}
                          </div>
                        </td>
                        <td className="px-4 py-3 capitalize">{l.leaveType}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                          <div className="text-xs text-gray-400 mt-0.5">{l.totalDays} Days</div>
                        </td>
                        <td className="px-4 py-3">
                          <Button 
                            variant="outline" 
                            className="!py-1 !px-3 !text-xs !bg-blue-50/50 hover:!bg-blue-100/50 !text-blue-600 !border-blue-200" 
                            onClick={() => setSelectedReason(l.reason || "No reason provided.")}
                          >
                            View Reason
                          </Button>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(l.status)}</td>
                        <td className="px-4 py-3">
                          {l.status === "pending" ? (
                            <div className="flex gap-2">
                               <Button variant="outline" className="!py-1 !px-2 !text-xs !bg-green-500/10 !border-green-500/30 !text-green-700" onClick={() => handleLeaveAction(l._id, "approved")}>Approve</Button>
                               <Button variant="outline" className="!py-1 !px-2 !text-xs !bg-red-500/10 !border-red-500/30 !text-red-700" onClick={() => handleLeaveAction(l._id, "rejected")}>Reject</Button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {leaves.length === 0 && (
                      <tr><td colSpan="6" className="text-center py-6 text-gray-500">No leave records to display.</td></tr>
                    )}
                  </tbody>
                </table>
              </Card>
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 mb-2 bg-white/40 backdrop-blur-md p-4 rounded-xl border border-white/60 shadow-sm">
                 <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Filter by Employee</label>
                    <input 
                       type="text" 
                       placeholder="Search employee name..." 
                       value={filterEmployee}
                       onChange={(e) => setFilterEmployee(e.target.value)}
                       className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm shadow-inner"
                    />
                 </div>
                 <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Filter by Date</label>
                    <input 
                       type="date"
                       value={filterDate}
                       onChange={(e) => setFilterDate(e.target.value)}
                       className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm shadow-inner"
                    />
                 </div>
                 {(filterDate || filterEmployee) && (
                   <div className="flex items-end">
                      <Button variant="outline" className="h-[38px] !text-sm text-gray-500 hover:text-red-600 border-gray-300 hover:border-red-300 hover:bg-red-50" onClick={() => { setFilterDate(''); setFilterEmployee(''); }}>Clear Filters</Button>
                   </div>
                 )}
              </div>

              <Card className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Check-In</th>
                      <th className="px-4 py-3">Check-Out</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((log) => (
                      <tr key={log._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-gray-600 font-medium">{new Date(log.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full flex shrink-0 items-center justify-center font-bold text-sm overflow-hidden bg-blue-500 text-white shadow-sm">
                               {log.employee?.avatar ? <img src={log.employee.avatar} alt="..." className="w-full h-full object-cover" /> : (log.employee?.name?.charAt(0).toUpperCase() || "?")}
                             </div>
                             {log.employee?.name || "Unknown"}
                          </div>
                        </td>
                        <td className="px-4 py-3">{log.checkIn?.time ? new Date(log.checkIn.time).toLocaleTimeString() : "--"}</td>
                        <td className="px-4 py-3">{log.checkOut?.time ? new Date(log.checkOut.time).toLocaleTimeString() : "--"}</td>
                        <td className="px-4 py-3 capitalize">{log.status.replace("_", " ")}</td>
                      </tr>
                    ))}
                    {attendance.length === 0 && (
                      <tr><td colSpan="5" className="text-center py-6 text-gray-500">No attendance logs found matching conditions.</td></tr>
                    )}
                  </tbody>
                </table>
              </Card>
              <Pagination pagination={pagination} onPageChange={setPage} />
            </div>
          )}

          {activeTab === "reports" && (
            <div className="space-y-4">
               <div className="flex flex-col md:flex-row gap-4 mb-2 bg-white/40 backdrop-blur-md p-4 rounded-xl border border-white/60 shadow-sm items-end">
                  <div className="flex-1">
                     <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Selected Month</label>
                     <select 
                       value={selectedMonth}
                       onChange={(e) => setSelectedMonth(e.target.value)}
                       className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm shadow-inner"
                     >
                        {Array.from({ length: 12 }, (_, i) => (
                           <option key={i + 1} value={i + 1}>
                              {new Date(0, i).toLocaleString('default', { month: 'long' })}
                           </option>
                        ))}
                     </select>
                  </div>
                  <div className="flex-1">
                     <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Selected Year</label>
                     <select 
                       value={selectedYear}
                       onChange={(e) => setSelectedYear(e.target.value)}
                       className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm shadow-inner"
                     >
                        {[2024, 2025, 2026].map(year => (
                           <option key={year} value={year}>{year}</option>
                        ))}
                     </select>
                  </div>
                  <Button onClick={downloadCSV} className="!bg-green-600 hover:!bg-green-700">Download CSV</Button>
               </div>

               <Card className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
                     <tr>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3 text-center">Present</th>
                        <th className="px-4 py-3 text-center">Absent</th>
                        <th className="px-4 py-3 text-center">Half Day</th>
                        <th className="px-4 py-3 text-center">Late</th>
                        <th className="px-4 py-3 text-right">Work Hours</th>
                     </tr>
                   </thead>
                   <tbody>
                     {reportData.map((r) => (
                       <tr key={r.employee._id} className="border-b border-gray-100 hover:bg-gray-50/50">
                         <td className="px-4 py-3">
                           <div className="font-bold text-gray-900">{r.employee.name}</div>
                           <div className="text-xs text-gray-400">{r.employee.department}</div>
                         </td>
                         <td className="px-4 py-3 text-center font-semibold text-green-600">{r.present}</td>
                         <td className="px-4 py-3 text-center font-semibold text-red-600">{r.absent}</td>
                         <td className="px-4 py-3 text-center font-semibold text-amber-600">{r.halfDay}</td>
                         <td className="px-4 py-3 text-center font-semibold text-orange-600">{r.lateArrivals}</td>
                         <td className="px-4 py-3 text-right font-mono">{r.totalWorkHours}h</td>
                       </tr>
                     ))}
                     {reportData.length === 0 && (
                       <tr><td colSpan="6" className="text-center py-6 text-gray-500">No data found for this period.</td></tr>
                     )}
                   </tbody>
                 </table>
               </Card>
            </div>
          )}
        </>
      )}

      {/* View Reason Modal */}
      {selectedReason && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setSelectedReason(null)}
        >
          <Card 
            className="w-full max-w-lg bg-white/95 border border-white/60 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Leave Request Justification</h2>
            <div className="bg-white p-5 rounded-xl text-gray-700 text-sm border border-gray-200/60 min-h-[120px] max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words break-all shadow-inner leading-relaxed w-full">
               {selectedReason}
            </div>
            <div className="mt-6 flex justify-end">
               <Button onClick={() => setSelectedReason(null)}>Close viewer</Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
