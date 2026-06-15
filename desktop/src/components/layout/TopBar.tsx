import React from 'react';
import { Search, Bell, HelpCircle, RefreshCw } from 'lucide-react';
import * as db from '../../lib/db';

interface TopBarProps {
  activeTab: string;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  // Network status
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  syncNow: () => void;
  // Notifications
  isNotificationDropdownOpen: boolean;
  setIsNotificationDropdownOpen: (open: boolean) => void;
  submissions: db.RegistrationSubmission[];
  programs: db.Program[];
  setActiveTab: (tab: string) => void;
  setImportTab: (tab: 'single' | 'bulk' | 'registry') => void;
  setIsAddYouthMenuOpen: (open: boolean) => void;
  // Help modal
  isHelpModalOpen: boolean;
  setIsHelpModalOpen: (open: boolean) => void;
  // User
  currentUser: { name: string; role: string; status: string; };
  // Audit logs
  activityLogs: db.AuditLog[];
  lastSeenLogsCount: number;
  setSettingsSubTab: (tab: 'admin' | 'logs' | 'account') => void;
}

export default function TopBar({
  activeTab,
  isLoading,
  searchQuery,
  setSearchQuery,
  isOnline,
  isSyncing,
  pendingCount,
  syncNow,
  isNotificationDropdownOpen,
  setIsNotificationDropdownOpen,
  submissions,
  programs,
  setActiveTab,
  setImportTab,
  setIsAddYouthMenuOpen,
  isHelpModalOpen,
  setIsHelpModalOpen,
  currentUser,
  activityLogs,
  lastSeenLogsCount,
  setSettingsSubTab
}: TopBarProps) {
  const unseenLogsCount = Math.max(0, activityLogs.length - lastSeenLogsCount);
  const unseenLogs = activityLogs.slice(0, unseenLogsCount);
  const totalAlerts = submissions.filter(s => s.status === 'Pending').length + unseenLogsCount;

  const getLogDetailText = (log: db.AuditLog) => {
    if (log.new_values) {
      if (typeof log.new_values === 'string') {
        return log.new_values;
      }
      if (log.new_values.message) {
        return log.new_values.message;
      }
      if (log.new_values.name) {
        return `${log.action === 'INSERT' ? 'Added' : 'Updated'} resident: ${log.new_values.name}`;
      }
      if (log.new_values.title) {
        return `Event: ${log.new_values.title}`;
      }
      if (log.new_values.role) {
        return `Updated user role to ${log.new_values.role}`;
      }
    }
    return `System activity logged in table ${log.table_name}`;
  };
  return (
    <header className="fixed top-0 right-0 left-64 h-16 flex justify-between items-center px-8 z-30 bg-[#131313]/80 backdrop-blur-xl border-b border-[#353535]/10 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-primary animate-pulse" style={{ zIndex: 100 }}></div>
      )}
      <div className="flex items-center gap-4">
        <span className="text-lg font-bold text-[#e5e2e1] uppercase tracking-widest font-headline">
          CORUM Central
        </span>
        <div className="h-4 w-[1px] bg-outline-variant/30"></div>
        <span className="text-on-surface-variant font-body text-sm capitalize">
          {activeTab === 'dashboard' ? 'Analytics Portal' : activeTab === 'reports' ? 'Analytics and Insight' : activeTab.replace('-', ' ')}
        </span>
      </div>
      
      <div className="flex items-center gap-6">
        {/* Global Search */}
        {activeTab === 'youth-list' && (
          <div className="relative animate-fade-in">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search database..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-container-highest border-none rounded-lg pl-10 pr-4 py-1.5 text-sm w-64 focus:ring-1 focus:ring-primary/50 transition-all text-on-surface placeholder:text-on-surface-variant/40"
            />
          </div>
        )}

      {/* Database Mode Status Pill */}
      {!isOnline ? (
        <div className="hidden lg:flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider select-none animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Working Offline
        </div>
      ) : (isSyncing || pendingCount > 0) ? (
        <button 
          onClick={() => syncNow()}
          className="hidden lg:flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider select-none"
          title="Click to force sync"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
          Syncing... [{pendingCount} remaining]
        </button>
      ) : (
        <div className="hidden lg:flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Connected
        </div>
      )}

      <div className="flex items-center gap-3 text-on-surface-variant">
          {/* Global Notifications Bell */}
          <div className="relative">
            <button 
              onClick={() => {
                setIsNotificationDropdownOpen(!isNotificationDropdownOpen);
                setIsHelpModalOpen(false);
              }}
              className="hover:text-primary transition-colors relative flex items-center justify-center p-1.5 rounded-lg hover:bg-[#353535]/10"
            >
              <Bell className="w-5 h-5 text-on-surface" />
              {totalAlerts > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse ring-2 ring-[#131313]"></span>
              )}
            </button>

            {isNotificationDropdownOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-[#1a1a1a] border border-[#353535]/30 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 z-50 animate-fade-in text-left">
                <div className="flex justify-between items-center border-b border-[#353535]/15 pb-2 mb-3">
                  <h4 className="font-headline font-bold text-xs uppercase tracking-wider text-[#e5e2e1]">Notifications</h4>
                  <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold">
                    {totalAlerts} Alert{totalAlerts !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {/* Pending Registry requests */}
                  {submissions.filter(s => s.status === 'Pending').length > 0 && (
                    <button 
                      onClick={() => {
                        setActiveTab('add-youth');
                        setImportTab('registry');
                        setIsAddYouthMenuOpen(true);
                        setIsNotificationDropdownOpen(false);
                      }}
                      className="w-full text-left p-2.5 bg-[#131313]/60 hover:bg-[#1f1f1f] border border-[#353535]/15 rounded-lg transition-colors flex items-start gap-2.5 group"
                    >
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 shrink-0 animate-ping"></span>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-[#e5e2e1] group-hover:text-primary transition-colors">Pending Web Registry</p>
                        <p className="text-[10px] text-on-surface-variant leading-relaxed">
                          {submissions.filter(s => s.status === 'Pending').length} new youth applicants submitted profiles via the online registry portal.
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Unseen Audit Logs */}
                  {unseenLogs.map((log) => (
                    <button 
                      key={log.id}
                      onClick={() => {
                        setActiveTab('settings');
                        setSettingsSubTab('logs');
                        setIsNotificationDropdownOpen(false);
                      }}
                      className="w-full text-left p-2.5 bg-[#131313]/60 hover:bg-[#1f1f1f] border border-[#353535]/15 rounded-lg transition-colors flex items-start gap-2.5 group"
                    >
                      <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0"></span>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#e5e2e1] group-hover:text-primary transition-colors truncate">
                          {log.action} on {log.table_name.replace('_', ' ')}
                        </p>
                        <p className="text-[10px] text-on-surface-variant leading-relaxed truncate">
                          {getLogDetailText(log)}
                        </p>
                        <p className="text-[8px] text-on-surface-variant/50 font-semibold">
                          {new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </button>
                  ))}

                  {/* Draft programs */}
                  {programs.filter(p => p.status === 'Draft').length > 0 && (
                    <button 
                      onClick={() => {
                        setActiveTab('programs');
                        setIsNotificationDropdownOpen(false);
                      }}
                      className="w-full text-left p-2.5 bg-[#131313]/60 hover:bg-[#1f1f1f] border border-[#353535]/15 rounded-lg transition-colors flex items-start gap-2.5 group"
                    >
                      <span className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 shrink-0"></span>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-[#e5e2e1] group-hover:text-primary transition-colors">Draft Programs Need Action</p>
                        <p className="text-[10px] text-on-surface-variant leading-relaxed">
                          There are {programs.filter(p => p.status === 'Draft').length} programs in draft status waiting to be published.
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Active programs */}
                  {programs.filter(p => p.status === 'Active').length > 0 && (
                    <button 
                      onClick={() => {
                        setActiveTab('attendance');
                        setIsNotificationDropdownOpen(false);
                      }}
                      className="w-full text-left p-2.5 bg-[#131313]/60 hover:bg-[#1f1f1f] border border-[#353535]/15 rounded-lg transition-colors flex items-start gap-2.5 group"
                    >
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 shrink-0"></span>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-[#e5e2e1] group-hover:text-primary transition-colors">Active Event Logs</p>
                        <p className="text-[10px] text-on-surface-variant leading-relaxed">
                          {programs.filter(p => p.status === 'Active').length} programs are active. Review and log attendance.
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Empty state */}
                  {submissions.filter(s => s.status === 'Pending').length === 0 &&
                   unseenLogs.length === 0 &&
                   programs.filter(p => p.status === 'Draft').length === 0 &&
                   programs.filter(p => p.status === 'Active').length === 0 && (
                     <div className="text-center py-6 text-on-surface-variant text-[11px]">
                       No new notifications.
                     </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              setIsHelpModalOpen(!isHelpModalOpen);
              setIsNotificationDropdownOpen(false);
            }}
            className="hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-[#353535]/10 flex items-center justify-center"
          >
            <HelpCircle className="w-5 h-5 text-on-surface" />
          </button>
          <div className="h-8 w-[1px] bg-outline-variant/30"></div>
          
          {/* Avatar / Active User */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-container ring-1 ring-outline-variant/30">
                <img 
                  alt="Admin User Profile" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqIvDuCXRcluyt4k3BQA1DBuo4lDG50AFjVRZX4QQNS7jU9ntsiVj2XkEsDRbqAuu03EovENd6FiLvtd1Q5JqzOBe3gTSL1jbMw2-1rLVqAhofpuycILJQ6evXzqPEunoth29D8trk22GI_7PqclRvp1rsnJaYreuO508OLTdWj5TV7IP4NwjPDYPFid-jK-gRHXSrHoPF5lXt1bTChXyMQC7qvkjEDBs7XLRYzH4eTXXHff4n8H5gnNhrYfL2OdKG7X4CH8oqswQ"
                />
              </div>
              {currentUser.status === 'Active' && (
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#131313]"></span>
              )}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-on-surface capitalize">{currentUser.name}</p>
              <p className="text-[10px] text-on-surface-variant uppercase font-semibold tracking-wider">
                {currentUser.role === 'Admin' ? 'SK Admin' : `SK ${currentUser.role}`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
