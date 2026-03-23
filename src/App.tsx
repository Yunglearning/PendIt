import React, { useState, useMemo, useEffect } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { 
  Search, 
  Bell, 
  Plus, 
  PackageX, 
  FileEdit, 
  ArrowRightLeft, 
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  MoreVertical,
  TrendingUp,
  Box,
  Activity,
  Database,
  Settings,
  X,
  Trash2,
  Camera,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Reason = 'Damaged' | 'Amendment' | 'Missing' | 'Transfer' | 'Other';
type Status = 'Pending' | 'Resolved';

interface Issue {
  id: string;
  title: string;
  outlet: string;
  reason: Reason;
  dateReported: Date;
  status: Status;
  notes: string;
  timeLimitDays: number;
  photo?: string;
}

// --- Constants & Mock Data ---
const OUTLETS = ['Store A', 'Store B', 'Store C', 'Store D', 'Warehouse'] as const;
const REASONS: Reason[] = ['Damaged', 'Amendment', 'Missing', 'Transfer', 'Other'];
const TIME_LIMITS = [
  { label: '1 Day', value: 1 },
  { label: '3 Days', value: 3 },
  { label: '7 Days (1 Week)', value: 7 },
  { label: '14 Days (2 Weeks)', value: 14 },
  { label: '30 Days (1 Month)', value: 30 },
];

const INITIAL_ISSUES: Issue[] = [
  {
    id: '1',
    title: 'Broken Monitor',
    outlet: 'Outlet 3',
    reason: 'Damaged',
    dateReported: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    status: 'Pending',
    notes: 'Screen cracked during delivery. Waiting for supplier response.',
    timeLimitDays: 7,
  },
  {
    id: '2',
    title: 'Stock Count Mismatch',
    outlet: 'Outlet 1',
    reason: 'Amendment',
    dateReported: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: 'Pending',
    notes: 'System shows 5, physical count is 4. Investigating.',
    timeLimitDays: 3,
  },
  {
    id: '3',
    title: 'Missing Keyboard',
    outlet: 'Outlet 5',
    reason: 'Missing',
    dateReported: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'Pending',
    notes: 'Not found in the latest shipment box.',
    timeLimitDays: 7,
  },
  {
    id: '4',
    title: 'Wrong Item Delivered',
    outlet: 'Outlet 2',
    reason: 'Transfer',
    dateReported: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    status: 'Pending',
    notes: 'Received mouse instead of headset. Need to transfer back to HQ.',
    timeLimitDays: 14,
  },
  {
    id: '5',
    title: 'Water Damaged Box',
    outlet: 'Outlet 7',
    reason: 'Damaged',
    dateReported: new Date(Date.now() - 0 * 24 * 60 * 60 * 1000),
    status: 'Pending',
    notes: 'Rain leaked into storage area.',
    timeLimitDays: 7,
  },
];

// --- Theme Components ---

const Card = ({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={cn(
      "bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden",
      onClick && "cursor-pointer active:scale-[0.98] hover:shadow-md transition-all",
      className
    )}
  >
    {children}
  </div>
);

const FilterButton = ({ children, onClick, className, active }: { children: React.ReactNode, onClick?: () => void, className?: string, active?: boolean, key?: React.Key }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-5 py-2.5 rounded-xl font-medium transition-all duration-200 text-sm",
      active 
        ? "bg-indigo-600 text-white shadow-sm" 
        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50",
      className
    )}
  >
    {children}
  </button>
);

const FlatInput = ({ 
  label, 
  value, 
  onChange, 
  multiline = false,
  required = false
}: { 
  label: string, 
  value: string, 
  onChange: (val: string) => void,
  multiline?: boolean,
  required?: boolean
}) => (
  <div className="flex flex-col gap-1.5 mb-5">
    <label className="text-sm font-semibold text-gray-700 ml-1">{label} {required && <span className="text-red-500">*</span>}</label>
    {multiline ? (
      <textarea 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
      />
    ) : (
      <input 
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
      />
    )}
  </div>
);

const FlatSelect = ({ 
  label, 
  value, 
  options, 
  onChange 
}: { 
  label: string, 
  value: string, 
  options: string[], 
  onChange: (val: string) => void 
}) => (
  <div className="flex flex-col gap-1.5 mb-5">
    <label className="text-sm font-semibold text-gray-700 ml-1">{label}</label>
    <div className="relative">
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
        <ChevronLeft className="w-5 h-5 -rotate-90" />
      </div>
    </div>
  </div>
);

const FloatingActionButton = ({ onClick }: { onClick: () => void }) => (
  <motion.button 
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-indigo-700 transition-colors"
  >
    <Plus className="w-6 h-6" />
  </motion.button>
);

// --- Flat/Soft Icon Components ---
const SoftIcon = ({ icon: Icon, colorClass, bgClass }: { icon: any, colorClass: string, bgClass: string }) => (
  <div className={cn("relative w-12 h-12 rounded-xl flex items-center justify-center", bgClass)}>
    <Icon className={cn("w-6 h-6", colorClass)} />
  </div>
);

const getReasonIcon = (reason: Reason) => {
  switch (reason) {
    case 'Damaged': return <SoftIcon icon={PackageX} colorClass="text-red-500" bgClass="bg-red-50" />;
    case 'Amendment': return <SoftIcon icon={FileEdit} colorClass="text-blue-500" bgClass="bg-blue-50" />;
    case 'Transfer': return <SoftIcon icon={ArrowRightLeft} colorClass="text-emerald-500" bgClass="bg-emerald-50" />;
    case 'Missing': return <SoftIcon icon={AlertCircle} colorClass="text-orange-500" bgClass="bg-orange-50" />;
    default: return <SoftIcon icon={Box} colorClass="text-gray-500" bgClass="bg-gray-50" />;
  }
};

export default function App() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Add Form State
  const [newTitle, setNewTitle] = useState('');
  const [newOutlet, setNewOutlet] = useState(OUTLETS[0]);
  const [newReason, setNewReason] = useState<Reason>(REASONS[0]);
  const [newNotes, setNewNotes] = useState('');
  const [newTimeLimit, setNewTimeLimit] = useState<number>(7);
  const [newPhoto, setNewPhoto] = useState<string | undefined>(undefined);

  useEffect(() => {
    const checkStatusAndFetch = async () => {
      const gasUrl = import.meta.env.VITE_GAS_URL;
      if (!gasUrl) {
        setIsConfigured(false);
        setIsLoading(false);
        return;
      }

      try {
        const issuesRes = await fetch(gasUrl);
        if (issuesRes.ok) {
          const data = await issuesRes.json();
          
          if (Array.isArray(data)) {
            // Parse dates
            const parsedIssues = data.map((i: any) => ({
              ...i,
              dateReported: new Date(i.dateReported)
            }));
            setIssues(parsedIssues);
            setSyncError(null);
          } else if (data && data.error) {
            console.error("Google Apps Script Error:", data.error);
            setSyncError(`Script Error: ${data.error}`);
          } else {
            console.error("Unexpected response format:", data);
            setSyncError("Received unexpected data format from Google Apps Script.");
          }
        } else {
          setSyncError(`Failed to load data (HTTP ${issuesRes.status}). Check if the Web App is deployed to 'Anyone'.`);
        }
      } catch (error: any) {
        console.error("Failed to fetch data", error);
        setSyncError(`Connection error: ${error.message}. Check CORS or Web App URL.`);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatusAndFetch();
  }, []);

  const handleResolve = async (id: string) => {
    // Optimistic update
    setIssues(issues.map(issue => 
      issue.id === id ? { ...issue, status: 'Resolved' } : issue
    ));

    const gasUrl = import.meta.env.VITE_GAS_URL;
    if (!gasUrl) return;

    try {
      const res = await fetch(gasUrl, { 
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'resolve', id })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSyncError(null);
    } catch (error: any) {
      console.error("Failed to resolve issue", error);
      setSyncError(`Failed to sync resolve: ${error.message}`);
      // Revert on failure could be implemented here
    }
  };

  const handleDelete = async (id: string) => {
    // Optimistic update
    setIssues(issues.filter(issue => issue.id !== id));

    const gasUrl = import.meta.env.VITE_GAS_URL;
    if (!gasUrl) return;

    try {
      const res = await fetch(gasUrl, { 
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'delete', id })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSyncError(null);
    } catch (error: any) {
      console.error("Failed to delete issue", error);
      setSyncError(`Failed to sync delete: ${error.message}`);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setNewPhoto(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newIssue: Issue = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTitle,
      outlet: newOutlet,
      reason: newReason,
      dateReported: new Date(),
      status: 'Pending',
      notes: newNotes,
      timeLimitDays: newTimeLimit,
      photo: newPhoto,
    };

    // Optimistic update
    setIssues([newIssue, ...issues]);
    setIsAdding(false);
    setNewTitle('');
    setNewNotes('');
    setNewOutlet(OUTLETS[0]);
    setNewReason(REASONS[0]);
    setNewTimeLimit(7);
    setNewPhoto(undefined);

    const gasUrl = import.meta.env.VITE_GAS_URL;
    if (!gasUrl) return;

    try {
      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'add',
          issue: {
            ...newIssue,
            dateReported: newIssue.dateReported.toISOString()
          }
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSyncError(null);
    } catch (error: any) {
      console.error("Failed to add issue", error);
      setSyncError(`Failed to sync new issue: ${error.message}. Is the Apps Script deployed to 'Anyone'?`);
    }
  };

  const pendingIssues = useMemo(() => issues.filter(i => i.status === 'Pending'), [issues]);
  const resolvedIssues = useMemo(() => issues.filter(i => i.status === 'Resolved'), [issues]);
  const overdueIssues = useMemo(() => pendingIssues.filter(i => differenceInDays(new Date(), i.dateReported) >= i.timeLimitDays), [pendingIssues]);
  const criticalCount = overdueIssues.length;

  const filteredIssues = useMemo(() => {
    const baseIssues = activeFilter === 'History' ? resolvedIssues : pendingIssues;
    return baseIssues
      .filter(i => {
        if (activeFilter === 'All' || activeFilter === 'History') return true;
        if (activeFilter === 'Urgent') return differenceInDays(new Date(), i.dateReported) >= i.timeLimitDays;
        return i.outlet === activeFilter;
      })
      .filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.notes.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.dateReported.getTime() - a.dateReported.getTime());
  }, [pendingIssues, resolvedIssues, activeFilter, searchQuery]);

  const filters = ['All', 'Urgent', ...OUTLETS];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex items-center justify-center p-6">
        <Card className="max-w-xl w-full p-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
            <Database className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Google Apps Script Required</h1>
          <p className="text-gray-600 mb-8">
            This application uses a Google Sheet via Google Apps Script as its database. To get started, you need to configure your script.
          </p>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm">1</span>
                Create a Google Sheet
              </h3>
              <p className="text-sm text-gray-600 ml-8">
                Create a new Google Sheet and name the first tab <strong>Issues</strong>. Add the following headers to the first row (A1 to H1):<br/>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded mt-2 inline-block">id, title, outlet, reason, dateReported, status, notes, timeLimitDays</code>
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm">2</span>
                Add the Apps Script
              </h3>
              <p className="text-sm text-gray-600 ml-8">
                In your Google Sheet, go to <strong>Extensions &gt; Apps Script</strong>. Paste the script provided in the chat into the editor and save.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm">3</span>
                Deploy as Web App
              </h3>
              <p className="text-sm text-gray-600 ml-8">
                Click <strong>Deploy &gt; New deployment</strong>. Select <strong>Web app</strong>. Set "Execute as" to <strong>Me</strong> and "Who has access" to <strong>Anyone</strong>. Click Deploy and copy the Web App URL.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm">4</span>
                Add Environment Variable
              </h3>
              <p className="text-sm text-gray-600 ml-8 mb-3">
                Open the Settings menu in AI Studio and add the following secret:
              </p>
              <ul className="text-sm text-gray-600 ml-8 space-y-2 list-disc pl-4">
                <li><code className="bg-gray-100 px-1 rounded">VITE_GAS_URL</code> (Paste the Web App URL here)</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 relative overflow-hidden">
      <div className="relative z-10 max-w-3xl mx-auto min-h-screen flex flex-col">
        {syncError && (
          <div className="bg-red-50 border-b border-red-200 p-4 flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Sync Error</p>
              <p>{syncError}</p>
            </div>
            <button onClick={() => setSyncError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* App Bar */}
        <header className="px-6 py-6 flex items-center justify-between relative">
          <div className="flex items-center gap-3 z-10">
            <div className="w-12 h-12"></div>
          </div>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ y: [0, -6, 0], rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-2xl"
              >
                <svg width="36" height="36" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
                  <g transform="translate(5, 10)">
                    <path d="M20,60 Q20,85 50,85 Q80,85 85,60 Q85,45 65,45 Q45,45 20,60 Z" fill="#FFD13B"/>
                    <path d="M80,60 Q95,50 85,40 Q80,50 75,55 Z" fill="#FFD13B"/>
                    <circle cx="35" cy="35" r="22" fill="#FFD13B"/>
                    <circle cx="28" cy="30" r="4" fill="#1A1A1A"/>
                    <circle cx="26" cy="28" r="1.5" fill="#FFFFFF"/>
                    <path d="M14,35 Q2,35 5,42 Q15,45 18,40 Z" fill="#FF9800"/>
                    <path d="M40,60 Q55,75 70,60 Q55,55 40,60 Z" fill="#FBC02D"/>
                  </g>
                </svg>
              </motion.div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
                PendIt
              </h1>
            </div>
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mt-0.5">Inventory</p>
          </div>

          <div className="flex items-center gap-3 z-10 relative">
            <button 
              onClick={() => setIsAlertOpen(!isAlertOpen)}
              className="w-12 h-12 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 relative hover:bg-gray-50 transition-all"
            >
              <Bell className="w-5 h-5" />
              {criticalCount > 0 && (
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>

            <AnimatePresence>
              {isAlertOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800">Alerts</h3>
                    <span className="text-xs font-bold bg-red-50 text-red-600 px-2 py-1 rounded-md">{criticalCount} Overdue</span>
                  </div>
                  
                  {overdueIssues.length > 0 ? (
                    <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
                      {overdueIssues.map(issue => {
                        const daysOverdue = differenceInDays(new Date(), issue.dateReported) - issue.timeLimitDays;
                        return (
                          <div key={issue.id} className="p-3 bg-red-50/50 rounded-xl border border-red-100">
                            <p className="text-sm font-bold text-red-800 truncate">{issue.title}</p>
                            <p className="text-xs text-red-600 mt-1 font-medium">Overdue by {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} ({issue.outlet})</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 font-medium">No pending alerts.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main className="flex-1 px-6 pb-24 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {isAdding ? (
              <motion.div 
                key="add"
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="flex-1"
              >
                <div className="flex items-center gap-4 mb-6">
                  <button 
                    onClick={() => setIsAdding(false)} 
                    className="w-12 h-12 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <h2 className="text-xl font-bold text-gray-800">Report New Issue</h2>
                </div>

                <Card className="p-6">
                  <form onSubmit={handleAddIssue}>
                    <FlatInput 
                      label="Item / Title" 
                      value={newTitle} 
                      onChange={setNewTitle} 
                      required 
                    />
                    <FlatSelect 
                      label="Outlet" 
                      value={newOutlet} 
                      options={OUTLETS} 
                      onChange={setNewOutlet} 
                    />
                    <FlatSelect 
                      label="Reason" 
                      value={newReason} 
                      options={REASONS} 
                      onChange={(val) => setNewReason(val as Reason)} 
                    />
                    <FlatSelect 
                      label="Time Limit (SLA)" 
                      value={TIME_LIMITS.find(t => t.value === newTimeLimit)?.label || '7 Days (1 Week)'} 
                      options={TIME_LIMITS.map(t => t.label)} 
                      onChange={(val) => setNewTimeLimit(TIME_LIMITS.find(t => t.label === val)?.value || 7)} 
                    />
                    <FlatInput 
                      label="Notes" 
                      value={newNotes} 
                      onChange={setNewNotes} 
                      multiline 
                    />

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700 ml-1">Photo (Optional)</label>
                      {newPhoto ? (
                        <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-gray-100">
                          <img src={newPhoto} alt="Preview" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setNewPhoto(undefined)}
                            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-2xl hover:bg-gray-50 hover:border-indigo-400 transition-all cursor-pointer group">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <div className="w-10 h-10 mb-2 rounded-full bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Camera className="w-5 h-5 text-indigo-500" />
                            </div>
                            <p className="text-sm text-gray-500 font-medium">Tap to add photo</p>
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                        </label>
                      )}
                    </div>
                    
                    <div className="mt-8">
                      <button 
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-sm transition-all transform active:scale-[0.98]"
                      >
                        Save Issue
                      </button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            ) : (
              <motion.div 
                key="home"
                initial={{ opacity: 0, y: -15 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="flex flex-col gap-6"
              >
                {/* Dashboard Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-5 flex flex-col group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-600">Pending</span>
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                      </div>
                    </div>
                    <div className="text-4xl font-black text-gray-800 tracking-tight">{pendingIssues.length}</div>
                    <div className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {criticalCount} critical
                    </div>
                  </Card>

                  <Card 
                    onClick={() => setActiveFilter(activeFilter === 'History' ? 'All' : 'History')} 
                    className={cn(
                      "p-5 flex flex-col group cursor-pointer transition-all duration-300",
                      activeFilter === 'History' ? "ring-2 ring-emerald-500 bg-emerald-50/50" : "hover:border-emerald-200"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-600">Resolved</span>
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                    </div>
                    <div className="text-4xl font-black text-gray-800 tracking-tight">{resolvedIssues.length}</div>
                    <div className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
                      {activeFilter === 'History' ? 'Viewing history (Tap to close)' : 'Tap to view history'}
                    </div>
                  </Card>
                </div>

                {/* Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>
                  <input 
                    type="text"
                    placeholder="Search issues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200 shadow-sm rounded-xl py-3.5 pl-12 pr-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400 font-medium"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
                  {filters.map(filter => (
                    <FilterButton
                      key={filter}
                      active={activeFilter === filter}
                      onClick={() => setActiveFilter(filter)}
                      className="whitespace-nowrap shrink-0"
                    >
                      {filter}
                    </FilterButton>
                  ))}
                </div>

                {/* List */}
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {filteredIssues.length > 0 ? (
                      filteredIssues.map(issue => {
                        const daysPending = differenceInDays(new Date(), issue.dateReported);
                        const isCritical = daysPending >= issue.timeLimitDays;
                        const isWarning = daysPending >= issue.timeLimitDays - 2 && !isCritical;
                        
                        let statusText = '';
                        if (issue.status === 'Resolved') {
                          statusText = 'Resolved';
                        } else if (isCritical) {
                          statusText = `Overdue by ${daysPending - issue.timeLimitDays}d`;
                        } else {
                          const daysLeft = issue.timeLimitDays - daysPending;
                          statusText = `${daysLeft}d left`;
                        }

                        return (
                          <motion.div 
                            key={issue.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -15 }}
                            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                          >
                            <Card className="p-4 flex items-start gap-4">
                              {getReasonIcon(issue.reason)}
                              
                              <div className="flex-1 min-w-0 pt-1">
                                <h3 className="text-base font-bold text-gray-800 truncate">{issue.title}</h3>
                                <p className="text-sm text-gray-600 line-clamp-2 mt-1 leading-relaxed">{issue.notes}</p>
                                
                                <div className="flex items-center gap-2 mt-3">
                                  <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">
                                    {issue.outlet}
                                  </span>
                                  <span className={cn(
                                    "text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1",
                                    isCritical && issue.status === 'Pending' ? "bg-red-50 text-red-700" : 
                                    isWarning && issue.status === 'Pending' ? "bg-orange-50 text-orange-700" : 
                                    "bg-gray-100 text-gray-600"
                                  )}>
                                    {isCritical && issue.status === 'Pending' && <AlertCircle className="w-3 h-3" />}
                                    {statusText}
                                  </span>
                                </div>
                                {issue.photo && (
                                  <div className="mt-3 rounded-xl overflow-hidden border border-gray-100 max-h-48">
                                    <img src={issue.photo} alt="Issue" className="w-full h-full object-cover" />
                                  </div>
                                )}
                              </div>

                              {issue.status === 'Pending' ? (
                                <button 
                                  onClick={() => handleResolve(issue.id)}
                                  className="w-10 h-10 shrink-0 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all"
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleDelete(issue.id)}
                                  className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-all pointer-events-auto"
                                  title="Delete from history"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                            </Card>
                          </motion.div>
                        );
                      })
                    ) : (
                      <motion.div 
                        key="empty"
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 15 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.95, y: -15 }}
                        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                        className="text-center py-16"
                      >
                        <div className="w-24 h-24 mx-auto mb-6 relative">
                          <div className="relative w-full h-full bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {activeFilter === 'History' ? 'No history yet' : 'All caught up!'}
                        </h3>
                        <p className="text-gray-500 font-medium mt-2">
                          {activeFilter === 'History' ? 'Resolved issues will appear here.' : 'No pending issues found.'}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {!isAdding && <FloatingActionButton onClick={() => setIsAdding(true)} />}
      </div>
    </div>
  );
}

