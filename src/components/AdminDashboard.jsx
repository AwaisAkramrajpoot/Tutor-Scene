import React, { useMemo, useState } from 'react';
import { Menu, MenuItem, IconButton } from '@mui/material';

const DotsVerticalIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
  </svg>
);

const StatCard = ({ title, value, subtitle, icon }) => (
  <div className="flex items-center gap-4 rounded-xl border border-blue-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
    <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
      {icon}
    </div>
    <div>
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
      {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
    </div>
  </div>
);

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors whitespace-nowrap ${
      active
        ? 'bg-blue-600 text-white border-blue-600 shadow'
        : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50'
    }`}
  >
    {children}
  </button>
);

const SectionHeader = ({ title, right }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    <div className="flex items-center gap-2">{right}</div>
  </div>
);

const FilterDropdown = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

const Table = ({ columns, data }) => (
  <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-blue-50">
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider"
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {data.map((row, idx) => (
          <tr key={row.id ?? idx} className="hover:bg-blue-50/40">
            {columns.map((col) => (
              <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                {col.render ? col.render(row, idx) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('students');
  const [statusFilter, setStatusFilter] = useState('all');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRow, setMenuRow] = useState(null);

  // Mock data – replace with API calls when available
  const students = useMemo(() => ([
    { id: 1, name: 'Alice Johnson', status: 'active' },
    { id: 2, name: 'Brian Smith', status: 'inactive' },
    { id: 3, name: 'Carla Gomez', status: 'active' },
    { id: 4, name: 'David Lee', status: 'pending' },
    { id: 5, name: 'Emma Wilson', status: 'active' },
  ]), []);

  const tutors = [
    { id: 201, name: 'Prof. Miller', subject: 'Mathematics', status: 'active' },
    { id: 202, name: 'Dr. Chen', subject: 'Physics', status: 'pending' },
    { id: 203, name: 'Ms. Patel', subject: 'English', status: 'inactive' },
  ];

  const discounts = [
    { id: 'DISC10', name: 'New User 10%', status: 'active', usage: 124 },
    { id: 'FALL20', name: 'Fall 20%', status: 'expired', usage: 89 },
  ];

  const reviews = [
    { id: 9001, by: 'Alice', for: 'Dr. Chen', rating: 4, comment: 'Clear explanations!' },
    { id: 9002, by: 'Brian', for: 'Ms. Patel', rating: 5, comment: 'Very engaging.' },
  ];

  const filteredStudents = useMemo(() => {
    if (statusFilter === 'all') return students;
    return students.filter((s) => s.status === statusFilter);
  }, [students, statusFilter]);

  const openMenu = (event, row) => {
    setMenuAnchor(event.currentTarget);
    setMenuRow(row);
  };
  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuRow(null);
  };

  const viewRow = () => {
    // hook up routing or modal as needed
    // eslint-disable-next-line no-alert
    alert(`View details for: ${menuRow?.name || menuRow?.id}`);
    closeMenu();
  };

  const statIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M3.75 3A.75.75 0 003 3.75v16.5c0 .414.336.75.75.75h16.5a.75.75 0 00.75-.75V3.75A.75.75 0 0020.25 3H3.75zM5.25 6h3v12h-3V6zm4.5 6h3v6h-3v-6zm4.5-4h3v10h-3V8z" />
    </svg>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Overview and management of platform entities.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Active Students" value={students.filter(s=>s.status==='active').length} subtitle="Current active learners" icon={statIcon} />
        <StatCard title="Active Tutors" value={tutors.filter(t=>t.status==='active').length} subtitle="Available tutors" icon={statIcon} />
        <StatCard title="Active Discounts" value={discounts.filter(d=>d.status==='active').length} subtitle="Public promotions" icon={statIcon} />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <TabButton active={activeTab==='students'} onClick={()=>setActiveTab('students')}>Students</TabButton>
        <TabButton active={activeTab==='tutors'} onClick={()=>setActiveTab('tutors')}>Tutors</TabButton>
        <TabButton active={activeTab==='discounts'} onClick={()=>setActiveTab('discounts')}>Discounts</TabButton>
        <TabButton active={activeTab==='reviews'} onClick={()=>setActiveTab('reviews')}>Reviews</TabButton>
      </div>

      {/* Content */}
      {activeTab === 'students' && (
        <section className="space-y-4">
          <SectionHeader
            title="Students"
            right={
              <FilterDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'pending', label: 'Pending' },
                ]}
              />
            }
          />
          <Table
            columns={[
              { key: 'index', header: '#', render: (_row, idx) => <span className="text-gray-500">{idx + 1}</span> },
              { key: 'name', header: "Student's Name" },
              { key: 'actions', header: '', render: (row) => (
                <div className="flex justify-end">
                  <IconButton size="small" onClick={(e)=>openMenu(e, row)}>
                    <DotsVerticalIcon />
                  </IconButton>
                </div>
              ) },
            ]}
            data={filteredStudents}
          />

          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu} anchorOrigin={{vertical:'bottom', horizontal:'right'}} transformOrigin={{vertical:'top', horizontal:'right'}}>
            <MenuItem onClick={viewRow}>View</MenuItem>
          </Menu>
        </section>
      )}

      {activeTab === 'tutors' && (
        <section className="space-y-4">
          <SectionHeader title="Tutors" right={
            <div className="text-sm text-gray-500">Total: {tutors.length}</div>
          } />
          <Table
            columns={[
              { key: 'index', header: '#', render: (_row, idx) => <span className="text-gray-500">{idx + 1}</span> },
              { key: 'name', header: 'Name' },
              { key: 'subject', header: 'Subject' },
              { key: 'status', header: 'Status', render: (row) => (
                <span className={`px-2 py-1 rounded text-xs ${row.status==='active' ? 'bg-green-50 text-green-700' : row.status==='pending' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{row.status}</span>
              ) },
              { key: 'actions', header: '', render: (row) => (
                <div className="flex justify-end">
                  <IconButton size="small" onClick={(e)=>openMenu(e, row)}>
                    <DotsVerticalIcon />
                  </IconButton>
                </div>
              ) },
            ]}
            data={tutors}
          />
          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
            <MenuItem onClick={viewRow}>View</MenuItem>
          </Menu>
        </section>
      )}

      {activeTab === 'discounts' && (
        <section className="space-y-4">
          <SectionHeader title="Discounts" right={<button className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-3 py-2 rounded-md">Create Discount</button>} />
          <Table
            columns={[
              { key: 'index', header: '#', render: (_row, idx) => <span className="text-gray-500">{idx + 1}</span> },
              { key: 'id', header: 'Code' },
              { key: 'name', header: 'Name' },
              { key: 'status', header: 'Status', render: (row) => (
                <span className={`px-2 py-1 rounded text-xs ${row.status==='active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{row.status}</span>
              ) },
              { key: 'usage', header: 'Usage' },
              { key: 'actions', header: '', render: (row) => (
                <div className="flex justify-end">
                  <IconButton size="small" onClick={(e)=>openMenu(e, row)}>
                    <DotsVerticalIcon />
                  </IconButton>
                </div>
              ) },
            ]}
            data={discounts}
          />
          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
            <MenuItem onClick={viewRow}>View</MenuItem>
          </Menu>
        </section>
      )}

      {activeTab === 'reviews' && (
        <section className="space-y-4">
          <SectionHeader title="Reviews" right={<div className="text-sm text-gray-500">Recent: {reviews.length}</div>} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900">{r.by} → {r.for}</div>
                  <div className="text-amber-600 font-medium">{Array.from({length: r.rating}).map((_,i)=>'★').join('')}</div>
                </div>
                <p className="text-sm text-gray-600">{r.comment}</p>
                <div className="flex justify-end">
                  <button onClick={()=>alert('View review '+r.id)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}