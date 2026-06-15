import React from 'react';
import {
  Users,
  Calendar,
  CheckSquare,
  BarChart3,
  Settings as SettingsIcon,
  PlusCircle,
  ChevronDown,
  LogOut,
  FileText,
  TrendingUp,
} from 'lucide-react';
import * as db from '../../lib/db';
import defaultLogo from '../../assets/logo.png';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setSelectedYouthId: (id: string | null) => void;
  selectedYouthId: string | null;
  barangayLogo: string;
  // Submenu states
  isAddYouthMenuOpen: boolean;
  setIsAddYouthMenuOpen: (open: boolean) => void;
  isAnalyticsMenuOpen: boolean;
  setIsAnalyticsMenuOpen: (open: boolean) => void;
  // Import tab
  importTab: 'single' | 'bulk' | 'registry';
  setImportTab: (tab: 'single' | 'bulk' | 'registry') => void;
  // Reports subtab
  reportsSubTab: 'builder-gis-trends' | 'dss' | 'reporting-export';
  setReportsSubTab: (tab: 'builder-gis-trends' | 'dss' | 'reporting-export') => void;
  // Badge counts
  submissions: db.RegistrationSubmission[];
  programs: db.Program[];
  unreadLogsCount: number;
  // User info
  currentUser: { name: string; role: string; email: string; };
  onLogout: () => void;
  // Additional callbacks for state owned by App.tsx
  onAddYouthStepReset: () => void;
  onBulkImportErrorClear: () => void;
  onSettingsClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  setSelectedYouthId,
  selectedYouthId,
  barangayLogo,
  isAddYouthMenuOpen,
  setIsAddYouthMenuOpen,
  isAnalyticsMenuOpen,
  setIsAnalyticsMenuOpen,
  importTab,
  setImportTab,
  reportsSubTab,
  setReportsSubTab,
  submissions,
  programs,
  unreadLogsCount,
  currentUser,
  onLogout,
  onAddYouthStepReset,
  onBulkImportErrorClear,
  onSettingsClick,
}) => {
  return (
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-[#353535]/20 bg-[#131313] z-40 flex flex-col justify-between">
        <div>
          <div className="p-6">
            <div className="flex flex-col gap-1">
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                {/* Outer CORUM Logo Frame */}
                <img 
                  src={defaultLogo} 
                  alt="CORUM Logo Frame" 
                  className="w-full h-full object-contain z-10"
                />
                {/* Inner Barangay Logo Overlay */}
                {barangayLogo && barangayLogo !== defaultLogo && (
                  <img 
                    src={barangayLogo} 
                    alt="Barangay Logo" 
                    className="absolute w-[44%] h-[44%] rounded-full object-cover z-0"
                    style={{
                      top: '28%',
                      left: '28%'
                    }}
                  />
                )}
              </div>
              <div>
                <h1 className="text-xl font-black text-[#e5e2e1] tracking-tighter uppercase font-headline leading-none">
                  <span className="text-[#b4c5ff]">CORUM</span>
                </h1>
                <p className="font-headline tracking-tight font-bold text-[10px] text-[#b4c5ff]/60 mt-1">
                  SK Youth Information
                </p>
              </div>
            </div>
          </div>

          <nav className="px-3 space-y-1">
            <button 
              onClick={() => { setActiveTab('dashboard'); setSelectedYouthId(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-headline tracking-tight font-bold text-sm transition-all duration-200 ${
                activeTab === 'dashboard'
                  ? 'bg-primary/10 text-primary border-l-4 border-primary'
                  : 'text-[#e5e2e1]/60 hover:text-[#e5e2e1] hover:bg-[#353535]/30'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </button>

            <button 
              onClick={() => { setActiveTab('youth-list'); setSelectedYouthId(null); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-headline tracking-tight font-bold text-sm transition-all duration-200 ${
                activeTab === 'youth-list' || selectedYouthId !== null
                  ? 'bg-primary/10 text-primary border-l-4 border-primary'
                  : 'text-[#e5e2e1]/60 hover:text-[#e5e2e1] hover:bg-[#353535]/30'
              }`}
            >
              <Users className="w-4 h-4" />
              Youth List
            </button>

            <div className="space-y-1">
              <button 
                onClick={() => { 
                  setActiveTab('add-youth'); 
                  setIsAddYouthMenuOpen(!isAddYouthMenuOpen);
                  setImportTab('single');
                  onAddYouthStepReset();
                  setSelectedYouthId(null); 
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-headline tracking-tight font-bold text-sm transition-all duration-200 ${
                  activeTab === 'add-youth'
                    ? 'bg-primary/10 text-primary border-l-4 border-primary'
                    : 'text-[#e5e2e1]/60 hover:text-[#e5e2e1] hover:bg-[#353535]/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <PlusCircle className={`w-4 h-4 ${activeTab === 'add-youth' ? 'text-primary' : 'text-emerald-400'}`} />
                  <span>Add Youth Resident</span>
                  {submissions.filter(s => s.status === 'Pending').length > 0 && (
                    <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                      {submissions.filter(s => s.status === 'Pending').length}
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isAddYouthMenuOpen ? 'rotate-180 text-primary' : 'text-[#e5e2e1]/40'}`} />
              </button>

              {/* Submenu Items */}
              {isAddYouthMenuOpen && (
                <div className="pl-6 pr-2 py-1 space-y-1 bg-[#181818]/20 border-l border-[#353535]/15 ml-4 rounded-b-lg animate-fade-in">
                  <button 
                    onClick={() => { setActiveTab('add-youth'); setImportTab('single'); onAddYouthStepReset(); setSelectedYouthId(null); }}
                    className={`w-full text-left py-2.5 px-3 rounded-md font-headline font-bold text-xs tracking-tight transition-all ${
                      activeTab === 'add-youth' && importTab === 'single'
                        ? 'bg-primary/15 text-primary shadow-sm'
                        : 'text-[#e5e2e1]/50 hover:text-[#e5e2e1] hover:bg-[#353535]/15'
                    }`}
                  >
                    Single Resident Entry
                  </button>
                  <button 
                    onClick={() => { setActiveTab('add-youth'); setImportTab('bulk'); onBulkImportErrorClear(); setSelectedYouthId(null); }}
                    className={`w-full text-left py-2.5 px-3 rounded-md font-headline font-bold text-xs tracking-tight transition-all ${
                      activeTab === 'add-youth' && importTab === 'bulk'
                        ? 'bg-primary/15 text-primary shadow-sm'
                        : 'text-[#e5e2e1]/50 hover:text-[#e5e2e1] hover:bg-[#353535]/15'
                    }`}
                  >
                    CSV/Excel Bulk Import
                  </button>
                  <button 
                    onClick={() => { setActiveTab('add-youth'); setImportTab('registry'); onBulkImportErrorClear(); setSelectedYouthId(null); }}
                    className={`w-full text-left py-2.5 px-3 rounded-md font-headline font-bold text-xs tracking-tight transition-all flex items-center justify-between ${
                      activeTab === 'add-youth' && importTab === 'registry'
                        ? 'bg-primary/15 text-primary shadow-sm'
                        : 'text-[#e5e2e1]/50 hover:text-[#e5e2e1] hover:bg-[#353535]/15'
                    }`}
                  >
                    <span>Web Registry Requests</span>
                    {submissions.filter(s => s.status === 'Pending').length > 0 && (
                      <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                        {submissions.filter(s => s.status === 'Pending').length}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

            <button 
              disabled={currentUser.role !== 'Admin'}
              onClick={() => { setActiveTab('programs'); setSelectedYouthId(null); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-headline tracking-tight font-bold text-sm transition-all duration-200 ${
                currentUser.role === 'Admin'
                  ? activeTab === 'programs'
                    ? 'bg-primary/10 text-primary border-l-4 border-primary cursor-pointer'
                    : 'text-[#e5e2e1]/60 hover:text-[#e5e2e1] hover:bg-[#353535]/30 cursor-pointer'
                  : 'text-[#e5e2e1]/30 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className={`w-4 h-4 ${currentUser.role === 'Admin' ? (activeTab === 'programs' ? 'text-primary' : 'text-[#e5e2e1]/60') : 'text-[#e5e2e1]/30'}`} />
                <span>Programs & Events</span>
              </div>
              {currentUser.role === 'Admin' && programs.filter(p => p.status === 'Draft').length > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                  {programs.filter(p => p.status === 'Draft').length}
                </span>
              )}
            </button>

            <button 
              disabled={currentUser.role !== 'Admin'}
              onClick={() => { setActiveTab('attendance'); setSelectedYouthId(null); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-headline tracking-tight font-bold text-sm transition-all duration-200 ${
                currentUser.role === 'Admin'
                  ? activeTab === 'attendance'
                    ? 'bg-primary/10 text-primary border-l-4 border-primary cursor-pointer'
                    : 'text-[#e5e2e1]/60 hover:text-[#e5e2e1] hover:bg-[#353535]/30 cursor-pointer'
                  : 'text-[#e5e2e1]/30 opacity-40 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckSquare className={`w-4 h-4 ${currentUser.role === 'Admin' ? (activeTab === 'attendance' ? 'text-primary' : 'text-[#e5e2e1]/60') : 'text-[#e5e2e1]/30'}`} />
                <span>Attendance Logger</span>
              </div>
              {currentUser.role === 'Admin' && programs.filter(p => p.status === 'Active').length > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                  {programs.filter(p => p.status === 'Active').length}
                </span>
              )}
            </button>

            <div className="space-y-1">
              <button 
                disabled={currentUser.role !== 'Admin'}
                onClick={() => { 
                  setActiveTab('reports'); 
                  setIsAnalyticsMenuOpen(!isAnalyticsMenuOpen);
                  setSelectedYouthId(null); 
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-headline tracking-tight font-bold text-sm transition-all duration-200 ${
                  currentUser.role === 'Admin'
                    ? activeTab === 'reports'
                      ? 'bg-primary/10 text-primary border-l-4 border-primary cursor-pointer'
                      : 'text-[#e5e2e1]/60 hover:text-[#e5e2e1] hover:bg-[#353535]/30 cursor-pointer'
                    : 'text-[#e5e2e1]/30 opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className={`w-4 h-4 ${currentUser.role === 'Admin' ? (activeTab === 'reports' ? 'text-primary' : 'text-[#e5e2e1]/60') : 'text-[#e5e2e1]/30'}`} />
                  <span>Analytics and Insight</span>
                </div>
                {currentUser.role === 'Admin' && (
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isAnalyticsMenuOpen ? 'rotate-180 text-primary' : 'text-[#e5e2e1]/40'}`} />
                )}
              </button>

              {/* Submenu Items */}
              {currentUser.role === 'Admin' && isAnalyticsMenuOpen && (
                <div className="pl-6 pr-2 py-1 space-y-1 bg-[#181818]/20 border-l border-[#353535]/15 ml-4 rounded-b-lg animate-fade-in">
                  <button 
                    onClick={() => { setActiveTab('reports'); setReportsSubTab('builder-gis-trends'); setSelectedYouthId(null); }}
                    className={`w-full text-left py-2.5 px-3 rounded-md font-headline font-bold text-xs tracking-tight transition-all ${
                      activeTab === 'reports' && reportsSubTab === 'builder-gis-trends'
                        ? 'bg-primary/15 text-primary shadow-sm'
                        : 'text-[#e5e2e1]/50 hover:text-[#e5e2e1] hover:bg-[#353535]/15'
                    }`}
                  >
                    Custom Builder, GIS & Trends
                  </button>
                  <button 
                    onClick={() => { setActiveTab('reports'); setReportsSubTab('dss'); setSelectedYouthId(null); }}
                    className={`w-full text-left py-2.5 px-3 rounded-md font-headline font-bold text-xs tracking-tight transition-all ${
                      activeTab === 'reports' && reportsSubTab === 'dss'
                        ? 'bg-primary/15 text-primary shadow-sm'
                        : 'text-[#e5e2e1]/50 hover:text-[#e5e2e1] hover:bg-[#353535]/15'
                    }`}
                  >
                    Decision Support System
                  </button>
                  <button 
                    onClick={() => { setActiveTab('reports'); setReportsSubTab('reporting-export'); setSelectedYouthId(null); }}
                    className={`w-full text-left py-2.5 px-3 rounded-md font-headline font-bold text-xs tracking-tight transition-all ${
                      activeTab === 'reports' && reportsSubTab === 'reporting-export'
                        ? 'bg-primary/15 text-primary shadow-sm'
                        : 'text-[#e5e2e1]/50 hover:text-[#e5e2e1] hover:bg-[#353535]/15'
                    }`}
                  >
                    Reporting & Export Center
                  </button>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => { setActiveTab('documents'); setSelectedYouthId(null); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-headline tracking-tight font-bold text-sm transition-all duration-200 ${
                activeTab === 'documents'
                  ? 'bg-primary/10 text-primary border-l-4 border-primary'
                  : 'text-[#e5e2e1]/60 hover:text-[#e5e2e1] hover:bg-[#353535]/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className={`w-4 h-4 ${activeTab === 'documents' ? 'text-primary' : 'text-[#e5e2e1]/60'}`} />
                <span>Documents & Files</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-[#353535]/15 space-y-1">
          <button 
            onClick={onSettingsClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-headline tracking-tight font-bold text-sm transition-all duration-200 ${
              activeTab === 'settings'
                ? 'bg-primary/10 text-primary border-l-4 border-primary'
                : 'text-[#e5e2e1]/60 hover:text-[#e5e2e1] hover:bg-[#353535]/30'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            Settings
          </button>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-error/70 hover:text-error hover:bg-[#353535]/30 transition-all duration-200 font-headline tracking-tight font-bold text-sm rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
  );
};

export default Sidebar;
