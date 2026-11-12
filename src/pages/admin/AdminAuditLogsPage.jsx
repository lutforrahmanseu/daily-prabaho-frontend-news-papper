import React, { useMemo, useState } from 'react';
import { useGetAuditLogsQuery } from '../../store/api/auditLogApi.js';
import { extractApiError } from '../../utils/apiNormalizer.js';
import { formatBengaliRelativeTime } from '../../utils/bengaliFormatter.js';
import { Search, Download, ShieldAlert } from 'lucide-react';
import Table from '../../components/Table.jsx';

export function AdminAuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const { data: logsResponse, isLoading, isFetching, isError, error } = useGetAuditLogsQuery({
    page: currentPage,
    per_page: pageSize,
    search: searchQuery.trim() || undefined
  });

  const auditLogs = useMemo(
    () => logsResponse?.items || logsResponse?.data || (Array.isArray(logsResponse) ? logsResponse : []),
    [logsResponse]
  );

  const totalPages = logsResponse?.pagination?.last_page || 1;

  const handleExport = () => {
    const csvRows = [
      'Timestamp,User,Action,Target,IP',
      ...auditLogs.map((l) => {
        const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
        return [l.timestamp, l.user, l.action, l.target || '', l.ip || ''].map(escape).join(',');
      })
    ];
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `daily_prabaho_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      header: 'সময়কাল ও তারিখ',
      accessor: 'timestamp',
      render: (row) => (
        <div className="font-mono text-xs">
          <p className="font-semibold text-stone-800">
            {formatBengaliRelativeTime(row.timestamp)}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">
            {row.timestamp ? new Date(row.timestamp).toLocaleTimeString('bn-BD') : '—'}
          </p>
        </div>
      )
    },
    {
      header: 'কর্তা / ইউজার',
      accessor: 'user',
      render: (row) => (
        <div>
          <p className="font-bold text-stone-900 text-xs">{row.user || 'System'}</p>
          <p className="text-[10px] text-stone-500 font-medium">
            {row.role || 'সম্পাদকীয় কর্মী'}
          </p>
        </div>
      )
    },
    {
      header: 'সম্পাদিত কার্যক্রম (Action)',
      accessor: 'action',
      render: (row) => (
        <span className="inline-block px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 font-semibold text-xs border border-stone-200">
          {row.action}
        </span>
      )
    },
    {
      header: 'আক্রান্ত উপাদান / বিষয়বস্তু',
      accessor: 'target',
      render: (row) => (
        <span className="font-serif-bn font-bold text-xs text-rose-800 line-clamp-1 max-w-sm">
          {row.target || '—'}
        </span>
      )
    },
    {
      header: 'আইপি ঠিকানা (IP)',
      accessor: 'ip',
      align: 'right',
      render: (row) => (
        <span className="font-mono text-xs text-stone-500">
          {row.ip || '127.0.0.1'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {isError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-semibold">{extractApiError(error, 'অডিট লগ লোড করা যায়নি।')}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black font-serif-bn text-stone-900">
            নিরাপত্তা ও সম্পাদকীয় অডিট ট্রেইল
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            প্রতিটি প্রকাশনা, অনুমোদন, পরিবর্তন এবং মুছে ফেলার অপরিবর্তনীয় নিরাপত্তা রেকর্ড
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={auditLogs.length === 0}
          className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-stone-500" />
          <span>সিএসভি এক্সপোর্ট (CSV Export)</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="ইউজার, অ্যাকশন বা আইপি দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={auditLogs}
        isLoading={isLoading || isFetching}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
}

export default AdminAuditLogsPage;
