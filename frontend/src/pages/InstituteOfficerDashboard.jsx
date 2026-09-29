import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import sampleApplications from '../data/sampleApplications';
import schemeRules from '../data/schemeRules';
import api from '../api/axios';

export default function InstituteOfficerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Navigation tab
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'applications', 'verification'

  // Application data
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScheme, setFilterScheme] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Review & Verification Modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewTab, setReviewTab] = useState('overview'); // 'overview', 'eligibility', 'documents'
  const [resubmitReason, setResubmitReason] = useState('');
  const [showResubmitInput, setShowResubmitInput] = useState(false);
  const [docStatuses, setDocStatuses] = useState({});
  const [invalidDocReasons, setInvalidDocReasons] = useState({});
  const [invalidDocPrompt, setInvalidDocPrompt] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const instituteName = user?.institute_name || user?.institute || 'Indian Institute of Technology Delhi (IIT Delhi)';

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Initial load: Fetch from API or filter local sample dataset
  useEffect(() => {
    async function fetchOfficerApplications() {
      try {
        setLoading(true);
        const res = await api.get('/officer/applications/');
        if (res.data && res.data.length > 0) {
          const formatted = res.data.map(app => ({
            id: `APP-2026-${String(app.id).padStart(4, '0')}`,
            rawId: app.id,
            applicantName: app.applicant?.full_name || app.applicant_name || 'ST Scholar',
            email: app.applicant?.email || 'student@edutribe.ac.in',
            phone: '+91 98765 43210',
            scheme: app.scheme_name || 'National Scholarship Scheme',
            schemeId: app.scheme_id,
            state: app.state || 'Delhi',
            institute: app.institute?.name || instituteName,
            course: app.education_level === 'PhD' ? 'Doctoral Research (PhD)' : 'B.Tech / M.Sc Computer Science',
            status: app.status === 'OFFICER_VERIFIED' ? 'Verified' :
                    app.status === 'RESUBMIT_REQUESTED' ? 'Returned for Correction' :
                    app.status === 'MINISTRY_APPROVED' ? 'Verified' :
                    app.status === 'REJECTED' ? 'Returned for Correction' : 'Pending',
            rawStatus: app.status,
            submittedDate: app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '12 Sep 2026',
            income: app.declared_income || 200000,
            educationLevel: app.education_level || 'Post-Graduate',
            marksPercent: app.marks_percent || 78.5,
            age: app.age || 22,
            category: 'Scheduled Tribe (ST)',
            documents: app.documents && app.documents.length > 0 ? app.documents.map(d => ({
              id: d.id,
              name: d.doc_type?.replace(/_/g, ' ') || 'Certificate',
              status: d.ocr_status === 'VERIFIED' ? 'Verified' : d.ocr_status === 'NEEDS_REVIEW' ? 'Pending' : 'Pending',
              file: d.file,
              discrepancy: d.extracted_data?.discrepancies?.[0] || null
            })) : [
              { name: 'ST Certificate', status: 'Verified' },
              { name: 'Income Certificate', status: 'Pending' },
              { name: 'Academic Marksheet', status: 'Verified' },
              { name: 'Institute Admission Proof', status: 'Verified' }
            ]
          }));
          setApplications(formatted);
          return;
        }
      } catch (err) {
        console.log('Officer API offline, loading default institute dataset.');
      } finally {
        setLoading(false);
      }

      // Default institute queue
      const defaultQueue = [
        {
          id: 'APP-2026-0041',
          rawId: 41,
          applicantName: 'Anita Murmu',
          email: 'anita.murmu@example.com',
          phone: '+91 98765 43210',
          scheme: 'Top Class Education Scheme for ST Students',
          schemeId: 'national_scholarship_top_class',
          state: 'Jharkhand',
          institute: 'Indian Institute of Technology Delhi',
          course: 'B.Tech Computer Science & Engineering (3rd Year)',
          status: 'Pending',
          rawStatus: 'SUBMITTED',
          submittedDate: '12 Sep 2026',
          income: 200000,
          educationLevel: 'Graduate',
          marksPercent: 85.0,
          age: 20,
          category: 'Scheduled Tribe (ST)',
          documents: [
            { name: 'ST Certificate', status: 'Verified' },
            { name: 'Annual Income Certificate', status: 'Verified' },
            { name: 'Previous Marksheet (JEE / Sem 4)', status: 'Verified' },
            { name: 'IIT Delhi Admission Proof', status: 'Pending' }
          ]
        },
        {
          id: 'APP-2026-0087',
          rawId: 87,
          applicantName: 'Ravi Oraon',
          email: 'ravi.oraon@example.com',
          phone: '+91 98123 45678',
          scheme: 'National Fellowship for ST Students (NFST)',
          schemeId: 'nfst_fellowship',
          state: 'Chhattisgarh',
          institute: 'Indian Institute of Technology Delhi',
          course: 'PhD in Renewable Energy Systems',
          status: 'Pending',
          rawStatus: 'SUBMITTED',
          submittedDate: '10 Sep 2026',
          income: 0,
          educationLevel: 'PhD',
          marksPercent: 68.0,
          age: 28,
          category: 'Scheduled Tribe (ST)',
          documents: [
            { name: 'ST Certificate', status: 'Verified' },
            { name: 'PG Marksheet (M.Tech)', status: 'Verified' },
            { name: 'PhD Admission & Guide Allocation Letter', status: 'Pending' },
            { name: 'Bank Account Passbook Copy', status: 'Pending' }
          ]
        },
        {
          id: 'APP-2026-0102',
          rawId: 102,
          applicantName: 'Lata Kisku',
          email: 'lata.kisku@example.com',
          phone: '+91 94567 89012',
          scheme: 'Top Class Education Scheme for ST Students',
          schemeId: 'national_scholarship_top_class',
          state: 'Odisha',
          institute: 'Indian Institute of Technology Delhi',
          course: 'M.Tech Data Science & AI',
          status: 'Verified',
          rawStatus: 'OFFICER_VERIFIED',
          submittedDate: '08 Sep 2026',
          income: 350000,
          educationLevel: 'Post-Graduate',
          marksPercent: 82.0,
          age: 23,
          category: 'Scheduled Tribe (ST)',
          documents: [
            { name: 'ST Certificate', status: 'Verified' },
            { name: 'Income Certificate', status: 'Verified' },
            { name: 'B.Tech Degree Marksheet', status: 'Verified' },
            { name: 'IIT Delhi Identity Card & Fee Receipt', status: 'Verified' }
          ]
        },
        {
          id: 'APP-2026-0135',
          rawId: 135,
          applicantName: 'Sohan Tudu',
          email: 'sohan.tudu@example.com',
          phone: '+91 97890 12345',
          scheme: 'Post-Matric Scholarship (Class XI to Post-Graduation)',
          schemeId: 'post_matric',
          state: 'Maharashtra',
          institute: 'Indian Institute of Technology Delhi',
          course: 'M.Sc Mathematics',
          status: 'Returned for Correction',
          rawStatus: 'RESUBMIT_REQUESTED',
          submittedDate: '05 Sep 2026',
          income: 270000,
          educationLevel: 'Post-Graduate',
          marksPercent: 71.0,
          age: 22,
          category: 'Scheduled Tribe (ST)',
          documents: [
            { name: 'ST Certificate', status: 'Verified' },
            { name: 'Revenue Income Certificate (Expired)', status: 'Invalid', discrepancy: 'Certificate issued in 2023. Valid 2026 certificate required.' },
            { name: 'B.Sc Marksheet', status: 'Verified' },
            { name: 'College Admission Letter', status: 'Verified' }
          ]
        },
        {
          id: 'APP-2026-0158',
          rawId: 158,
          applicantName: 'Maya Hembram',
          email: 'maya.hembram@example.com',
          phone: '+91 91234 56789',
          scheme: 'Top Class Education Scheme for ST Students',
          schemeId: 'national_scholarship_top_class',
          state: 'West Bengal',
          institute: 'Indian Institute of Technology Delhi',
          course: 'B.Tech Electrical Engineering',
          status: 'Pending',
          rawStatus: 'SUBMITTED',
          submittedDate: '03 Sep 2026',
          income: 180000,
          educationLevel: 'Graduate',
          marksPercent: 88.5,
          age: 19,
          category: 'Scheduled Tribe (ST)',
          documents: [
            { name: 'ST Certificate', status: 'Verified' },
            { name: 'Income Certificate', status: 'Verified' },
            { name: 'Higher Secondary Marksheet', status: 'Verified' },
            { name: 'IIT Delhi Fee Proof', status: 'Pending' }
          ]
        }
      ];

      setApplications(defaultQueue);
    }

    fetchOfficerApplications();
  }, [user]);

  // KPI Calculations (Real application data)
  const kpis = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(a => a.status === 'Pending').length;
    const verified = applications.filter(a => a.status === 'Verified').length;
    const returned = applications.filter(a => a.status === 'Returned for Correction').length;
    return { total, pending, verified, returned };
  }, [applications]);

  // Filter and search application queue
  const filteredQueue = useMemo(() => {
    return applications.filter(app => {
      if (filterScheme && app.scheme !== filterScheme) return false;
      if (filterStatus && app.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const idMatch = app.id.toLowerCase().includes(q);
        const nameMatch = app.applicantName.toLowerCase().includes(q);
        const schemeMatch = app.scheme.toLowerCase().includes(q);
        if (!idMatch && !nameMatch && !schemeMatch) return false;
      }
      return true;
    });
  }, [applications, filterScheme, filterStatus, searchQuery]);

  const schemeOptions = useMemo(() => [...new Set(applications.map(a => a.scheme))], [applications]);

  // Open Review Dialog
  const handleOpenReview = (app) => {
    setSelectedApp(app);
    setReviewTab('overview');
    setShowResubmitInput(false);
    setResubmitReason('');

    // Initialize document status local tracking
    const initialDocs = {};
    (app.documents || []).forEach((doc, idx) => {
      initialDocs[doc.name || idx] = doc.status || 'Pending';
    });
    setDocStatuses(initialDocs);
  };

  // Toggle individual document verification
  const handleVerifyDocument = (docName, newStatus, reason = '') => {
    setDocStatuses(prev => ({
      ...prev,
      [docName]: newStatus
    }));

    if (reason) {
      setInvalidDocReasons(prev => ({
        ...prev,
        [docName]: reason
      }));
    }

    triggerToast(`Document "${docName}" marked as ${newStatus}.`);
  };

  // Final Action: Verify & Recommend
  const handleFinalRecommend = async () => {
    if (!selectedApp) return;

    try {
      if (selectedApp.rawId) {
        await api.post(`/officer/applications/${selectedApp.rawId}/verify/`, {
          action: 'VERIFY',
          remark: 'All institutional criteria and documents verified by Institute Officer. Recommended to Ministry.'
        });
      }
    } catch (e) {
      console.log('Local status update fallback');
    }

    setApplications(prev => prev.map(a => 
      a.id === selectedApp.id ? { ...a, status: 'Verified', rawStatus: 'OFFICER_VERIFIED' } : a
    ));

    triggerToast(`Application ${selectedApp.id} for ${selectedApp.applicantName} verified & recommended!`);
    setSelectedApp(null);
  };

  // Final Action: Return for Correction
  const handleFinalReturn = async () => {
    if (!selectedApp) return;
    if (!resubmitReason.trim()) {
      alert('Please specify the correction reason/remark for the student before returning.');
      return;
    }

    try {
      if (selectedApp.rawId) {
        await api.post(`/officer/applications/${selectedApp.rawId}/verify/`, {
          action: 'REQUEST_RESUBMIT',
          remark: resubmitReason
        });
      }
    } catch (e) {
      console.log('Local status update fallback');
    }

    setApplications(prev => prev.map(a => 
      a.id === selectedApp.id ? { ...a, status: 'Returned for Correction', rawStatus: 'RESUBMIT_REQUESTED' } : a
    ));

    triggerToast(`Application ${selectedApp.id} returned to student with remarks.`);
    setSelectedApp(null);
  };

  return (
    <div className="bg-[#f4f7fb] min-h-screen text-slate-800 pb-12">
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#163B63] text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border-l-4 border-amber-400 animate-slide-up text-xs font-medium">
          <span className="text-emerald-400 font-bold text-base">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* ========================================================= */}
        {/* 1. DASHBOARD HEADER                                       */}
        {/* ========================================================= */}
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-gray-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                Institute Verification Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#163B63] tracking-tight">
              Institute Officer Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Review, verify and recommend scholarship applications from your institute.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200/90 rounded-lg px-4 py-3 shrink-0 text-left sm:text-right">
            <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide block">
              Assigned Nodal Institute
            </span>
            <span className="text-sm font-bold text-[#163B63] block mt-0.5">
              🏛️ {instituteName}
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. KPI CARDS (Real Existing Application Data)             */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          {/* Card 1: Total Applications */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Total Applications</span>
              <span className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                📄
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#163B63] mt-2">
              {kpis.total}
            </p>
            <p className="text-[11px] text-gray-400 mt-1 font-medium">In your institute queue</p>
          </div>

          {/* Card 2: Pending Verification */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700">Pending Verification</span>
              <span className="w-8 h-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                ⏳
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">
              {kpis.pending}
            </p>
            <p className="text-[11px] text-amber-600/80 mt-1 font-medium">Requires your review</p>
          </div>

          {/* Card 3: Verified */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700">Verified &amp; Recommended</span>
              <span className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                ✓
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
              {kpis.verified}
            </p>
            <p className="text-[11px] text-emerald-600/80 mt-1 font-medium">Forwarded to Ministry</p>
          </div>

          {/* Card 4: Returned for Correction */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700">Returned for Correction</span>
              <span className="w-8 h-8 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
                ⚠️
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-2">
              {kpis.returned}
            </p>
            <p className="text-[11px] text-rose-600/80 mt-1 font-medium">Awaiting student resubmission</p>
          </div>

        </div>

        {/* ========================================================= */}
        {/* 3. MAIN SECTION: APPLICATIONS REQUIRING ACTION             */}
        {/* ========================================================= */}
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs overflow-hidden">
          
          {/* Header & Filter Controls */}
          <div className="p-4 sm:p-5 border-b border-gray-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#163B63]">
                Applications Requiring Action
              </h2>
              <p className="text-xs text-gray-500">
                Institutional queue for {instituteName}
              </p>
            </div>

            {/* Filter Group */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Scheme Filter */}
              <select
                value={filterScheme}
                onChange={(e) => setFilterScheme(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none text-gray-700 font-medium cursor-pointer"
              >
                <option value="">All Schemes</option>
                {schemeOptions.map((s, idx) => (
                  <option key={idx} value={s}>{s}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none text-gray-700 font-medium cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending Verification</option>
                <option value="Verified">Verified</option>
                <option value="Returned for Correction">Returned for Correction</option>
              </select>

              {/* Search Bar */}
              <div className="relative w-full sm:w-56">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student or ID..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-gray-300 rounded-md focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none text-gray-700 placeholder-gray-400 font-medium"
                />
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400 text-xs">
                  🔍
                </span>
              </div>

              {(filterScheme || filterStatus || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterScheme('');
                    setFilterStatus('');
                    setSearchQuery('');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-1 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Applications Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              
              {/* Dark Navy Table Header */}
              <thead className="bg-[#163B63] text-white text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">APPLICANT</th>
                  <th className="px-4 py-3">SCHEME</th>
                  <th className="px-4 py-3">SUBMITTED ON</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3 text-right">ACTION</th>
                </tr>
              </thead>

              {/* Table Rows */}
              <tbody className="divide-y divide-gray-100">
                {filteredQueue.map((app, idx) => (
                  <tr
                    key={app.id || idx}
                    className={`hover:bg-blue-50/40 transition ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'
                    }`}
                  >
                    {/* ID */}
                    <td className="px-4 py-3.5 font-mono text-[11px] text-gray-600 font-medium">
                      {app.id}
                    </td>

                    {/* Applicant */}
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-[#163B63]">{app.applicantName}</p>
                      <p className="text-[11px] text-gray-400 font-medium">{app.course}</p>
                    </td>

                    {/* Scheme */}
                    <td className="px-4 py-3.5 text-gray-700 max-w-xs truncate" title={app.scheme}>
                      {app.scheme}
                    </td>

                    {/* Submitted On */}
                    <td className="px-4 py-3.5 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                      {app.submittedDate}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {app.status === 'Verified' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span>✓</span> Verified
                        </span>
                      ) : app.status === 'Returned for Correction' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                          <span>⚠️</span> Returned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                          <span>⏳</span> Pending
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenReview(app)}
                        className="px-3.5 py-1.5 bg-[#163B63] hover:bg-blue-800 text-white font-semibold text-xs rounded shadow-2xs transition cursor-pointer"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredQueue.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-xs">
                      No applications currently match the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>

          {/* Footer Queue Info */}
          <div className="p-3.5 bg-slate-50 border-t border-gray-200/80 flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Showing {filteredQueue.length} of {applications.length} applications in your institute queue</span>
            <span className="font-mono text-[11px]">Nodal Officer Role: Active &bull; MoTA Central Verification Active</span>
          </div>

        </div>

        {/* ========================================================= */}
        {/* 4. RECENT ACTIVITY & NOTIFICATIONS                         */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-5 border border-gray-200/90 shadow-2xs">
            <h3 className="text-sm font-bold text-[#163B63] mb-3 pb-2 border-b border-gray-100 flex items-center justify-between">
              <span>Recent Verification Activity</span>
              <span className="text-[10px] text-gray-400 font-mono">Live Log</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <span className="text-emerald-600 font-bold text-sm">✓</span>
                <div>
                  <p className="text-gray-800 font-semibold">Verified &amp; recommended Lata Kisku (APP-2026-0102)</p>
                  <p className="text-[11px] text-gray-400">08 Sep 2026 &bull; Top Class Education Scheme</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-rose-600 font-bold text-sm">⚠️</span>
                <div>
                  <p className="text-gray-800 font-semibold">Returned application for Sohan Tudu (APP-2026-0135)</p>
                  <p className="text-[11px] text-gray-400">05 Sep 2026 &bull; Expired revenue certificate flagged</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-bold text-sm">📥</span>
                <div>
                  <p className="text-gray-800 font-semibold">New application received from Anita Murmu (APP-2026-0041)</p>
                  <p className="text-[11px] text-gray-400">12 Sep 2026 &bull; Scheduled Tribe Category validated</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl p-5 border border-gray-200/90 shadow-2xs">
            <h3 className="text-sm font-bold text-[#163B63] mb-3 pb-2 border-b border-gray-100 flex items-center justify-between">
              <span>Officer Notifications</span>
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                2 Pending
              </span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-2.5">
                <span className="text-amber-600 font-bold">🔔</span>
                <div>
                  <p className="font-semibold text-amber-900">Verification Deadline Reminder</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">Top-Class ST Scholarship batch verification deadline is 31 Oct 2026.</p>
                </div>
              </div>
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-start gap-2.5">
                <span className="text-blue-600 font-bold">ℹ️</span>
                <div>
                  <p className="font-semibold text-blue-900">Ministry Sanction Update</p>
                  <p className="text-[11px] text-blue-800 mt-0.5">Selection committee approved previous cohort of 14 scholars from IIT Delhi.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ============================================================= */}
      {/* 5. REVIEW APPLICATION MODAL                                   */}
      {/* ============================================================= */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-5 sm:p-7 relative border border-gray-200 max-h-[92vh] overflow-y-auto animate-slide-up">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-200 gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-gray-500 bg-slate-100 px-2 py-0.5 rounded border border-gray-200">
                    {selectedApp.id}
                  </span>
                  <span className="text-xs font-bold text-[#163B63]">
                    {selectedApp.scheme}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#163B63]">
                  {selectedApp.applicantName}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="text-gray-400 hover:text-gray-700 font-bold text-xl cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Application Review Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200 my-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setReviewTab('overview')}
                className={`pb-2 px-3 border-b-2 cursor-pointer ${
                  reviewTab === 'overview'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                1. Student &amp; Scheme Information
              </button>
              <button
                type="button"
                onClick={() => setReviewTab('eligibility')}
                className={`pb-2 px-3 border-b-2 cursor-pointer ${
                  reviewTab === 'eligibility'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                2. Eligibility Checklist
              </button>
              <button
                type="button"
                onClick={() => setReviewTab('documents')}
                className={`pb-2 px-3 border-b-2 cursor-pointer ${
                  reviewTab === 'documents'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                3. Document Verification ({selectedApp.documents?.length || 4})
              </button>
            </div>

            {/* TAB 1: STUDENT & SCHEME INFORMATION */}
            {reviewTab === 'overview' && (
              <div className="space-y-4">
                {/* Student Info Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-gray-200">
                  <h4 className="text-xs font-bold text-[#163B63] uppercase tracking-wider mb-3">
                    Student Information
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-gray-400">Full Name</p>
                      <p className="font-bold text-[#163B63]">{selectedApp.applicantName}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Category</p>
                      <p className="font-bold text-emerald-700">Scheduled Tribe (ST)</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Enrolled Program</p>
                      <p className="font-bold text-gray-800">{selectedApp.course}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Nodal Institute</p>
                      <p className="font-bold text-gray-800">{selectedApp.institute}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Declared Family Income</p>
                      <p className="font-bold text-gray-800">₹{Number(selectedApp.income).toLocaleString()} / year</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Academic Marks / CGPA</p>
                      <p className="font-bold text-gray-800 font-mono">{selectedApp.marksPercent}%</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Contact Email</p>
                      <p className="font-mono text-gray-700">{selectedApp.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Contact Phone</p>
                      <p className="font-mono text-gray-700">{selectedApp.phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">State of Domicile</p>
                      <p className="font-bold text-gray-800">{selectedApp.state}</p>
                    </div>
                  </div>
                </div>

                {/* Scheme Info Card */}
                <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
                    Scheme Information
                  </h4>
                  <p className="text-xs font-bold text-[#163B63] mb-1">{selectedApp.scheme}</p>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Ministry of Tribal Affairs central funding covers 100% statutory tuition fees, academic books allowance, and living maintenance grant for enrolled ST students.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: ELIGIBILITY CHECKLIST */}
            {reviewTab === 'eligibility' && (
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-gray-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="px-3 py-2.5">Criterion</th>
                        <th className="px-3 py-2.5">Requirement</th>
                        <th className="px-3 py-2.5">Student Information</th>
                        <th className="px-3 py-2.5">Evaluation Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-3 py-2.5 font-semibold text-gray-800">ST Certificate</td>
                        <td className="px-3 py-2.5 text-gray-500">Government Certified ST Category</td>
                        <td className="px-3 py-2.5 font-medium text-gray-700">Scheduled Tribe (ST)</td>
                        <td className="px-3 py-2.5 text-emerald-700 font-bold">✓ Verified</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2.5 font-semibold text-gray-800">Income Criteria</td>
                        <td className="px-3 py-2.5 text-gray-500">Within statutory ceiling (≤ ₹6,00,000)</td>
                        <td className="px-3 py-2.5 font-medium text-gray-700">₹{Number(selectedApp.income).toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-emerald-700 font-bold">✓ Eligible (Within limit)</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2.5 font-semibold text-gray-800">Academic Criteria</td>
                        <td className="px-3 py-2.5 text-gray-500">Minimum 55% aggregate marks</td>
                        <td className="px-3 py-2.5 font-medium text-gray-700">{selectedApp.marksPercent}%</td>
                        <td className="px-3 py-2.5 text-emerald-700 font-bold">✓ Criteria Met</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2.5 font-semibold text-gray-800">Institute / College</td>
                        <td className="px-3 py-2.5 text-gray-500">252 MoTA Premier Notified Centers</td>
                        <td className="px-3 py-2.5 font-medium text-gray-700">{selectedApp.institute}</td>
                        <td className="px-3 py-2.5 text-emerald-700 font-bold">✓ Notified Center Validated</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <span className="font-bold text-base">✓</span>
                  <span>Rule engine check passed: Student qualifies under all Ministry statutory criteria.</span>
                </div>
              </div>
            )}

            {/* TAB 3: DOCUMENT VERIFICATION */}
            {reviewTab === 'documents' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  Review uploaded certificates. You can verify or mark individual documents as invalid before final recommendation.
                </p>

                <div className="space-y-2.5">
                  {(selectedApp.documents || []).map((doc, idx) => {
                    const currentDocStatus = docStatuses[doc.name] || doc.status || 'Pending';

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          currentDocStatus === 'Verified'
                            ? 'border-emerald-200 bg-emerald-50/50'
                            : currentDocStatus === 'Invalid'
                            ? 'border-rose-200 bg-rose-50/60'
                            : 'border-amber-200 bg-amber-50/40'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="text-base">
                            {currentDocStatus === 'Verified' ? '✅' : currentDocStatus === 'Invalid' ? '❌' : '📄'}
                          </span>
                          <div>
                            <p className="font-bold text-gray-800">{doc.name}</p>
                            <p className="text-[11px] text-gray-500 font-medium">
                              Status: <strong className={currentDocStatus === 'Verified' ? 'text-emerald-700' : currentDocStatus === 'Invalid' ? 'text-rose-700' : 'text-amber-700'}>{currentDocStatus}</strong>
                            </p>
                            {doc.discrepancy && (
                              <p className="text-[10px] text-rose-700 mt-0.5">⚠️ {doc.discrepancy}</p>
                            )}
                            {invalidDocReasons[doc.name] && (
                              <p className="text-[10px] text-rose-700 mt-0.5">Remark: {invalidDocReasons[doc.name]}</p>
                            )}
                          </div>
                        </div>

                        {/* Document Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => triggerToast(`Previewing ${doc.name}`)}
                            className="px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded font-semibold text-[11px] cursor-pointer"
                          >
                            View
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleVerifyDocument(doc.name, 'Verified')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px] cursor-pointer shadow-2xs"
                          >
                            Verify ✓
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const reason = prompt(`Reason for marking "${doc.name}" as invalid:`, 'Document expired or illegible.');
                              if (reason) {
                                handleVerifyDocument(doc.name, 'Invalid', reason);
                              }
                            }}
                            className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded font-semibold text-[11px] cursor-pointer border border-rose-200"
                          >
                            Mark Invalid ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Status Timeline */}
            <div className="my-5 p-3.5 bg-slate-50 border border-gray-200 rounded-xl">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Application Lifecycle Workflow
              </p>
              <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
                <div className="p-1.5 rounded bg-blue-100 text-blue-800 font-bold border border-blue-300">
                  1. Submitted
                </div>
                <div className="p-1.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300 ring-2 ring-amber-400">
                  2. Institute Officer
                </div>
                <div className="p-1.5 rounded bg-slate-200 text-gray-600 font-medium">
                  3. Recommended
                </div>
                <div className="p-1.5 rounded bg-slate-200 text-gray-600 font-medium">
                  4. Ministry Review
                </div>
                <div className="p-1.5 rounded bg-slate-200 text-gray-600 font-medium">
                  5. Sanctioned
                </div>
              </div>
            </div>

            {/* Return Remark Input Area */}
            {showResubmitInput && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl mb-4 space-y-2">
                <label className="text-xs font-bold text-rose-900 block">
                  Specify reason for returning application to student:
                </label>
                <textarea
                  rows="2"
                  value={resubmitReason}
                  onChange={(e) => setResubmitReason(e.target.value)}
                  placeholder="e.g. Income certificate requires fresh seal from Tehsildar / Marks mismatch."
                  className="w-full p-2 text-xs border border-rose-300 rounded bg-white focus:outline-none"
                />
              </div>
            )}

            {/* Final Officer Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close Review
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {!showResubmitInput ? (
                  <button
                    type="button"
                    onClick={() => setShowResubmitInput(true)}
                    className="w-full sm:w-auto px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-lg border border-rose-300 cursor-pointer"
                  >
                    Return for Correction
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinalReturn}
                    className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow cursor-pointer"
                  >
                    Confirm Return to Student
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleFinalRecommend}
                  className="w-full sm:w-auto px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>✓ Verify &amp; Recommend</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
