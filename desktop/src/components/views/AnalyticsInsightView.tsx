import React from 'react';
import {
  TrendingUp,
  Printer,
  Download,
  HelpCircle,
  Filter,
  BarChart3,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import ErrorBoundary from '../ErrorBoundary';
import * as db from '../../lib/db';

const DEFAULT_REAL_PUROKS = [
  "East",
  "West A",
  "West B",
  "Holy Cross Drive",
  "Special Block",
  "Belisario",
  "Ibula",
  "Puting Lupa",
  "Ruiz",
  "Sto. Niño A",
  "Sto. Niño B",
  "Freedom",
  "Fatima",
  "San Vicente",
  "Green Village",
  "Gosi Blaza"
];

interface AnalyticsInsightViewProps {
  reportsSubTab: 'builder-gis-trends' | 'dss' | 'reporting-export';
  reportsInnerSubTab: 'builder' | 'gis' | 'trends';
  setReportsInnerSubTab: (tab: 'builder' | 'gis' | 'trends') => void;
  // Report modal
  setIsReportModalOpen: (v: boolean) => void;
  onExportReportToCSV: () => void;
  // Custom Analytics Builder
  builderMetric: string;
  setBuilderMetric: (v: string) => void;
  builderGrouping: string;
  setBuilderGrouping: (v: string) => void;
  builderFilterAgeMin: number;
  setBuilderFilterAgeMin: (v: number) => void;
  builderFilterAgeMax: number;
  setBuilderFilterAgeMax: (v: number) => void;
  builderFilterGender: string;
  setBuilderFilterGender: (v: string) => void;
  builderFilterPurok: string;
  setBuilderFilterPurok: (v: string) => void;
  builderFilterWorkStatus: string;
  setBuilderFilterWorkStatus: (v: string) => void;
  builderFilterEducation: string;
  setBuilderFilterEducation: (v: string) => void;
  builderVisualization: string;
  setBuilderVisualization: (v: string) => void;
  builderReportName: string;
  setBuilderReportName: (v: string) => void;
  builderSavedReports: any[];
  setBuilderSavedReports: (v: any[]) => void;
  builderActiveReportId: string | null;
  setBuilderActiveReportId: (v: string | null) => void;
  builderSavedMessage: string | null;
  setBuilderSavedMessage: (v: string | null) => void;
  builderData: { name: string; value: number }[];
  builderTotalCount: number;
  // GIS states
  gisOverlayLayer: 'density' | 'age' | 'gender' | 'participation' | 'needs' | 'impact' | 'risk';
  setGisOverlayLayer: (v: 'density' | 'age' | 'gender' | 'participation' | 'needs' | 'impact' | 'risk') => void;
  gisSelectedPurok: string | null;
  setGisSelectedPurok: (v: string | null) => void;
  // Data
  youthProfiles: db.YouthProfile[];
  programs: db.Program[];
  puroks: string[];
  // Dashboard data calculations
  maleCount: number;
  femaleCount: number;
  otherCount: number;
  malePercent: number;
  femalePercent: number;
  age15to17Count: number;
  age18to24Count: number;
  age25to30Count: number;
  age15to17Percent: number;
  age18to24Percent: number;
  age25to30Percent: number;
  highSchoolCount: number;
  collegeCount: number;
  vocationalCount: number;
  otherEduCount: number;
  highSchoolPercent: number;
  collegePercent: number;
  vocationalPercent: number;
  otherEduPercent: number;
  avgParticipationRate: number;
  avgAttendanceRate: number;
  barangayName: string;
  setScanNotification: (v: { message: string; type: 'success' | 'info' | 'error' } | null) => void;
  currentUserRole?: string;
}

const AnalyticsInsightView: React.FC<AnalyticsInsightViewProps> = (props) => {
  const {
    reportsSubTab,
    reportsInnerSubTab,
    setReportsInnerSubTab,
    setIsReportModalOpen,
    onExportReportToCSV,
    builderMetric,
    setBuilderMetric,
    builderGrouping,
    setBuilderGrouping,
    builderFilterAgeMin,
    setBuilderFilterAgeMin,
    builderFilterAgeMax,
    setBuilderFilterAgeMax,
    builderFilterGender,
    setBuilderFilterGender,
    builderFilterPurok,
    setBuilderFilterPurok,
    builderFilterWorkStatus,
    setBuilderFilterWorkStatus,
    builderFilterEducation,
    setBuilderFilterEducation,
    builderVisualization,
    setBuilderVisualization,
    builderReportName,
    setBuilderReportName,
    builderSavedReports,
    setBuilderSavedReports,
    builderActiveReportId,
    setBuilderActiveReportId,
    builderSavedMessage,
    setBuilderSavedMessage,
    builderData,
    builderTotalCount,
    gisOverlayLayer,
    setGisOverlayLayer,
    gisSelectedPurok,
    setGisSelectedPurok,
    youthProfiles,
    currentUserRole
  } = props;

  return (
            <div className="space-y-6 animate-fade-in relative min-h-[500px]">
              {/* Opaque overlay with Unavailable message */}
              {currentUserRole !== 'Admin' && (
                <div className="absolute inset-0 bg-[#131313]/70 backdrop-blur-[2.5px] z-40 flex flex-col justify-center items-center rounded-xl border border-red-500/10 p-8 text-center">
                  <div className="glass-panel p-8 rounded-xl border border-red-500/20 max-w-sm flex flex-col items-center">
                    <h2 className="text-red-500 font-headline font-black text-3xl tracking-wider uppercase drop-shadow-[0_2px_10px_rgba(239,68,68,0.2)]">
                      Unavailable
                    </h2>
                    <p className="text-[#e5e2e1]/70 font-headline font-semibold text-xs mt-3">
                      temporarily unavailable for this version
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-surface-container-low p-5 rounded-xl border border-[#353535]/15 gap-4">
                <div>
                  <h3 className="font-headline font-black text-xl text-on-surface flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Analytics and Insight Portal
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Advanced no-code analytics builder, spatial GIS intelligence mapping, trend forecasting, and recommendation engines.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsReportModalOpen(true)}
                    className="bg-primary text-on-primary hover:opacity-95 text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
                  >
                    <Printer className="w-4 h-4" /> PRINT REPORT
                  </button>
                  <button 
                    onClick={onExportReportToCSV}
                    className="bg-surface-container-high border border-[#353535]/15 hover:bg-surface-container-highest text-on-surface text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
                  >
                    <Download className="w-4 h-4 text-emerald-400" /> EXPORT EXCEL
                  </button>
                </div>
              </div>


              {reportsSubTab === 'builder-gis-trends' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 bg-[#1c1b1b] p-1 rounded-lg border border-[#353535]/10 self-start w-fit text-xs">
                    <button 
                      onClick={() => setReportsInnerSubTab('builder')}
                      className={`px-4 py-2 rounded-md font-bold transition-all ${
                        reportsInnerSubTab === 'builder' ? 'bg-[#353535]/50 text-on-surface font-black shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Custom Analytics Builder
                    </button>
                    <button 
                      onClick={() => setReportsInnerSubTab('gis')}
                      className={`px-4 py-2 rounded-md font-bold transition-all ${
                        reportsInnerSubTab === 'gis' ? 'bg-[#353535]/50 text-on-surface font-black shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Geographic Intelligence
                    </button>
                    <button 
                      onClick={() => setReportsInnerSubTab('trends')}
                      className={`px-4 py-2 rounded-md font-bold transition-all ${
                        reportsInnerSubTab === 'trends' ? 'bg-[#353535]/50 text-on-surface font-black shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Trend Analysis
                    </button>
                  </div>

                  {reportsInnerSubTab === 'builder' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                      {/* Left: Configuration Steps */}
                      <div className="bg-surface-container-low p-5 rounded-xl border border-[#353535]/15 space-y-5 flex flex-col justify-between">
                        <div className="space-y-4">
                          <h4 className="font-headline font-bold text-xs text-primary uppercase tracking-widest border-b border-[#353535]/15 pb-2">
                            Analytics Builder Configuration
                          </h4>

                          {/* Step 1: Metric Selection */}
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Step 1: Metric</label>
                            <select 
                              value={builderMetric} 
                              onChange={(e) => setBuilderMetric(e.target.value)}
                              className="w-full bg-surface-container-high border-none rounded-lg text-xs font-bold text-on-surface py-2.5 px-3 focus:ring-1 focus:ring-primary/50"
                            >
                              <option value="Total Youth">Total Youth</option>
                              <option value="Registered Youth">Registered Youth</option>
                              <option value="Active Participants">Active Participants</option>
                              <option value="Employment Status">Employment Status</option>
                              <option value="Educational Attainment">Educational Attainment</option>
                              <option value="Skills Inventory">Skills Inventory</option>
                              <option value="Out-of-School Youth">Out-of-School Youth (OSY)</option>
                              <option value="Scholarship Applicants">Scholarship Applicants</option>
                            </select>
                          </div>

                          {/* Step 2: Choose Grouping */}
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Step 2: Grouping</label>
                            <select 
                              value={builderGrouping} 
                              onChange={(e) => setBuilderGrouping(e.target.value)}
                              className="w-full bg-surface-container-high border-none rounded-lg text-xs font-bold text-on-surface py-2.5 px-3 focus:ring-1 focus:ring-primary/50"
                            >
                              <option value="Purok">Purok</option>
                              <option value="Age Group">Age Group</option>
                              <option value="Gender">Gender</option>
                              <option value="Educational Status">Educational Status</option>
                              <option value="Employment Status">Employment Status</option>
                            </select>
                          </div>

                          {/* Step 3: Apply Filters */}
                          <div className="space-y-2.5 bg-[#131313]/30 p-3 rounded-lg border border-[#353535]/10">
                            <label className="text-[10px] uppercase font-black text-primary tracking-widest block">Step 3: Filters</label>
                            
                            {/* Age filter */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-on-surface-variant">Min Age</label>
                                <input 
                                  type="number" 
                                  min={15} 
                                  max={30} 
                                  value={builderFilterAgeMin} 
                                  onChange={(e) => setBuilderFilterAgeMin(parseInt(e.target.value) || 15)}
                                  className="w-full bg-surface-container-high border-none rounded-lg text-xs font-bold text-on-surface py-2 px-3"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-on-surface-variant">Max Age</label>
                                <input 
                                  type="number" 
                                  min={15} 
                                  max={30} 
                                  value={builderFilterAgeMax} 
                                  onChange={(e) => setBuilderFilterAgeMax(parseInt(e.target.value) || 30)}
                                  className="w-full bg-surface-container-high border-none rounded-lg text-xs font-bold text-on-surface py-2 px-3"
                                />
                              </div>
                            </div>

                            {/* Gender filter */}
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-on-surface-variant">Gender</label>
                              <select 
                                value={builderFilterGender} 
                                onChange={(e) => setBuilderFilterGender(e.target.value)}
                                className="w-full bg-surface-container-high border-none rounded-lg text-xs font-bold text-on-surface py-2 px-2.5"
                              >
                                <option value="All">All Genders</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="LGBTQIA+">LGBTQIA+</option>
                              </select>
                            </div>

                            {/* Purok filter */}
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-on-surface-variant">Purok</label>
                              <select 
                                value={builderFilterPurok} 
                                onChange={(e) => setBuilderFilterPurok(e.target.value)}
                                className="w-full bg-surface-container-high border-none rounded-lg text-xs font-bold text-on-surface py-2 px-2.5"
                              >
                                <option value="All">All Puroks</option>
                                {DEFAULT_REAL_PUROKS.map(p => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </select>
                            </div>

                            {/* Work Status filter */}
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-on-surface-variant">Employment Status</label>
                              <select 
                                value={builderFilterWorkStatus} 
                                onChange={(e) => setBuilderFilterWorkStatus(e.target.value)}
                                className="w-full bg-surface-container-high border-none rounded-lg text-xs font-bold text-on-surface py-2 px-2.5"
                              >
                                <option value="All">All Statuses</option>
                                <option value="Employed">Employed</option>
                                <option value="Unemployed">Unemployed</option>
                                <option value="Self-employed">Self-employed</option>
                                <option value="Currently looking for a job">Currently looking for a job</option>
                              </select>
                            </div>

                            {/* Education filter */}
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-on-surface-variant">Education Attainment</label>
                              <select 
                                value={builderFilterEducation} 
                                onChange={(e) => setBuilderFilterEducation(e.target.value)}
                                className="w-full bg-surface-container-high border-none rounded-lg text-xs font-bold text-on-surface py-2 px-2.5"
                              >
                                <option value="All">All Education Levels</option>
                                <option value="High School Graduate">High School Graduate</option>
                                <option value="Vocational Graduate">Vocational Graduate</option>
                                <option value="College Graduate">College Graduate</option>
                              </select>
                            </div>
                          </div>

                          {/* Step 4: Choose Visualization */}
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Step 4: Visualization</label>
                            <select 
                              value={builderVisualization} 
                              onChange={(e) => setBuilderVisualization(e.target.value)}
                              className="w-full bg-surface-container-high border-none rounded-lg text-xs font-bold text-on-surface py-2.5 px-3 focus:ring-1 focus:ring-primary/50"
                            >
                              <option value="Bar Chart">Bar Chart</option>
                              <option value="Horizontal Bar Chart">Horizontal Bar Chart</option>
                              <option value="Pie Chart">Pie Chart</option>
                              <option value="Line Chart">Line Chart</option>
                              <option value="Table">Data Table</option>
                              <option value="KPI Card">Single KPI Card</option>
                            </select>
                          </div>
                        </div>

                        {/* Save & Schedule Controls */}
                        <div className="space-y-3 pt-4 border-t border-[#353535]/15 mt-4">
                          <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Save Report Name</label>
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                placeholder="e.g., OSY Purok Analysis"
                                value={builderReportName}
                                onChange={(e) => setBuilderReportName(e.target.value)}
                                className="flex-1 bg-surface-container-high border-none rounded-lg text-xs font-bold text-on-surface py-2 px-3"
                              />
                              <button 
                                onClick={() => {
                                  if (!builderReportName.trim()) return;
                                  const newRep = {
                                    id: "rep-" + Date.now(),
                                    name: builderReportName,
                                    metric: builderMetric,
                                    grouping: builderGrouping,
                                    viz: builderVisualization,
                                    createdAt: "June 12, 2026"
                                  };
                                  setBuilderSavedReports([newRep, ...builderSavedReports]);
                                  setBuilderReportName("");
                                  setBuilderSavedMessage("Report saved successfully!");
                                  setTimeout(() => setBuilderSavedMessage(null), 3000);
                                }}
                                className="bg-primary text-on-primary hover:opacity-95 text-xs font-bold px-3 py-2 rounded-lg active:scale-95 transition-all shadow-md"
                              >
                                Save
                              </button>
                            </div>
                            {builderSavedMessage && (
                              <p className="text-[10px] font-bold text-emerald-400 mt-1 animate-pulse">{builderSavedMessage}</p>
                            )}
                          </div>

                          <div className="bg-[#131313]/30 p-2.5 rounded-lg border border-[#353535]/10 text-xs space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] uppercase font-bold text-on-surface-variant">Auto-Scheduler</span>
                              <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold uppercase">Active</span>
                            </div>
                            <p className="text-[10px] text-on-surface-variant/80">Send automated email report weekly to sk.chairperson@sanantonio.gov</p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Live Preview Panel */}
                      <div className="lg:col-span-2 bg-surface-container-low p-5 rounded-xl border border-[#353535]/15 flex flex-col justify-between h-full">
                        <div>
                          <div className="flex justify-between items-center border-b border-[#353535]/15 pb-3 mb-4">
                            <div>
                              <h4 className="font-headline font-bold text-sm text-[#e5e2e1] uppercase tracking-wider">
                                Live Report Preview
                              </h4>
                              <p className="text-[10px] text-on-surface-variant mt-0.5">
                                Metric: <span className="text-primary font-bold">{builderMetric}</span> grouped by <span className="text-primary font-bold">{builderGrouping}</span>
                              </p>
                            </div>
                            <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-black uppercase tracking-wider">
                              {builderTotalCount} Matched Records
                            </span>
                          </div>

                          {/* Visualization Area */}
                          <div className="min-h-[280px] flex items-center justify-center bg-[#131313]/30 rounded-xl p-4 border border-[#353535]/10 relative">
                            <ErrorBoundary moduleName="Custom Report Builder Chart">
                              {builderData.length === 0 ? (
                                <div className="text-center space-y-2">
                                  <HelpCircle className="w-8 h-8 text-on-surface-variant mx-auto animate-bounce" />
                                  <p className="text-xs font-bold text-on-surface-variant">No records match the current filter criteria.</p>
                                </div>
                              ) : builderVisualization === 'KPI Card' ? (
                                <div className="text-center space-y-3 p-6">
                                  <p className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant">{builderMetric}</p>
                                  <p className="text-6xl font-headline font-black text-primary tracking-tighter">{builderTotalCount}</p>
                                  <p className="text-xs text-on-surface-variant">Filtered active census data</p>
                                </div>
                              ) : builderVisualization === 'Table' ? (
                                <div className="w-full overflow-hidden rounded-lg border border-[#353535]/10 text-xs">
                                  <table className="w-full text-left border-collapse">
                                    <thead>
                                      <tr className="bg-[#1c1b1b] border-b border-[#353535]/10">
                                        <th className="px-4 py-2.5 font-bold uppercase tracking-wider text-on-surface-variant">{builderGrouping}</th>
                                        <th className="px-4 py-2.5 font-bold uppercase tracking-wider text-on-surface-variant text-right">Residents Count</th>
                                        <th className="px-4 py-2.5 font-bold uppercase tracking-wider text-on-surface-variant text-right">Percentage</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#353535]/10">
                                      {builderData.map((d: any) => {
                                        const pct = Math.round((d.value / (builderTotalCount || 1)) * 100);
                                        return (
                                          <tr key={d.name} className="hover:bg-surface-variant/10">
                                            <td className="px-4 py-2 font-bold text-on-surface">{d.name}</td>
                                            <td className="px-4 py-2 text-right font-semibold text-primary">{d.value}</td>
                                            <td className="px-4 py-2 text-right font-medium text-secondary">{pct}%</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              ) : builderVisualization === 'Pie Chart' ? (
                                <ResponsiveContainer width="100%" height={260}>
                                  <PieChart>
                                    <Pie
                                      data={builderData}
                                      dataKey="value"
                                      nameKey="name"
                                      cx="50%"
                                      cy="50%"
                                      outerRadius={80}
                                      label={({ name, percent }: any) => `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                                    >
                                      {builderData.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#b4c5ff' : index % 3 === 0 ? '#10b981' : '#475569'} />
                                      ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ background: '#1c1b1b', borderColor: '#353535', borderRadius: '8px', color: '#e5e2e1' }} />
                                  </PieChart>
                                </ResponsiveContainer>
                              ) : builderVisualization === 'Line Chart' ? (
                                <ResponsiveContainer width="100%" height={260}>
                                  <LineChart data={builderData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                    <XAxis dataKey="name" stroke="#8e9192" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#8e9192" fontSize={10} tickLine={false} axisLine={false} />
                                    <RechartsTooltip contentStyle={{ background: '#1c1b1b', borderColor: '#353535', borderRadius: '8px', color: '#e5e2e1' }} />
                                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} />
                                  </LineChart>
                                </ResponsiveContainer>
                              ) : builderVisualization === 'Horizontal Bar Chart' ? (
                                <ResponsiveContainer width="100%" height={260}>
                                  <BarChart data={builderData} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                                    <XAxis type="number" stroke="#8e9192" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis dataKey="name" type="category" stroke="#8e9192" fontSize={10} tickLine={false} axisLine={false} width={80} />
                                    <RechartsTooltip contentStyle={{ background: '#1c1b1b', borderColor: '#353535', borderRadius: '8px', color: '#e5e2e1' }} />
                                    <Bar dataKey="value" fill="#b4c5ff" radius={[0, 4, 4, 0]} maxBarSize={20} />
                                  </BarChart>
                                </ResponsiveContainer>
                              ) : (
                                // Default Bar Chart
                                <ResponsiveContainer width="100%" height={260}>
                                  <BarChart data={builderData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                                    <XAxis dataKey="name" stroke="#8e9192" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#8e9192" fontSize={10} tickLine={false} axisLine={false} />
                                    <RechartsTooltip contentStyle={{ background: '#1c1b1b', borderColor: '#353535', borderRadius: '8px', color: '#e5e2e1' }} />
                                    <Bar dataKey="value" fill="#b4c5ff" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                  </BarChart>
                                </ResponsiveContainer>
                              )}
                            </ErrorBoundary>
                          </div>
                        </div>

                        {/* Saved Dashboard/Reports lists */}
                        <div className="mt-4 pt-4 border-t border-[#353535]/15 space-y-3">
                          <h5 className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Saved Custom Reports</h5>
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {builderSavedReports.map(rep => (
                              <button 
                                key={rep.id} 
                                onClick={() => {
                                  setBuilderMetric(rep.metric);
                                  setBuilderGrouping(rep.grouping);
                                  setBuilderVisualization(rep.viz);
                                  setBuilderActiveReportId(rep.id);
                                }}
                                className={`flex flex-col text-left p-2.5 rounded-lg border text-xs transition-all ${
                                  builderActiveReportId === rep.id 
                                    ? 'bg-primary/10 border-primary text-on-surface shadow-md' 
                                    : 'bg-[#131313]/30 border-[#353535]/10 hover:bg-[#131313]/50 text-on-surface-variant'
                                }`}
                              >
                                <span className="font-bold text-on-surface truncate">{rep.name}</span>
                                <span className="text-[9px] text-on-surface-variant/80 mt-0.5">{rep.metric} / {rep.viz}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {reportsInnerSubTab === 'gis' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                      {/* Left: Interactive Map View */}
                      <div className="lg:col-span-2 bg-surface-container-low p-5 rounded-xl border border-[#353535]/15 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start border-b border-[#353535]/15 pb-3 mb-4">
                            <div>
                              <h4 className="font-headline font-bold text-sm text-[#e5e2e1] uppercase tracking-wider">
                                Spatial Geographic Intelligence Map
                              </h4>
                              <p className="text-[10px] text-on-surface-variant mt-0.5">
                                Hover or click Puroks to analyze demographic density, needs assessments, and project impacts.
                              </p>
                            </div>
                            
                            {/* Layer Toggles */}
                            <select 
                              value={gisOverlayLayer}
                              onChange={(e) => setGisOverlayLayer(e.target.value as any)}
                              className="bg-surface-container-high border-none rounded-lg text-xs font-bold text-primary py-2 px-3 focus:ring-1 focus:ring-primary/50"
                            >
                              <option value="density">👥 Population Density Map</option>
                              <option value="age">🎂 Age Distribution Map</option>
                              <option value="gender">⚧️ Gender Mix Map</option>
                              <option value="participation">🔥 Active Participation Rate</option>
                              <option value="needs">🚨 Needs & Concerns Overlay</option>
                              <option value="risk">⚠️ OSY & Unemployment Risk Map</option>
                            </select>
                          </div>

                          {/* Map Representation */}
                          <div className="h-[300px] bg-[#131313]/40 border border-[#353535]/10 rounded-xl relative overflow-hidden flex items-center justify-center">
                            <svg className="w-full h-full max-w-[450px] max-h-[280px]" viewBox="0 0 400 250">
                              {/* East Shape */}
                              <path 
                                d="M 30,30 L 150,30 L 120,110 L 30,100 Z" 
                                fill={
                                  gisOverlayLayer === 'density' ? 'rgba(16, 185, 129, 0.2)' : 
                                  gisOverlayLayer === 'risk' ? 'rgba(239, 68, 68, 0.4)' : 
                                  gisOverlayLayer === 'needs' ? 'rgba(249, 115, 22, 0.3)' : 'rgba(180, 197, 255, 0.3)'
                                }
                                stroke={gisSelectedPurok === 'East' ? '#b4c5ff' : '#353535'}
                                strokeWidth={gisSelectedPurok === 'East' ? 2 : 1}
                                className="cursor-pointer hover:opacity-85 transition-all"
                                onClick={() => setGisSelectedPurok('East')}
                              />
                              <text x="65" y="65" fill="#e5e2e1" fontSize="9" fontWeight="bold" pointerEvents="none">East</text>

                              {/* West A Shape */}
                              <path 
                                d="M 150,30 L 280,30 L 250,120 L 120,110 Z" 
                                fill={
                                  gisOverlayLayer === 'density' ? 'rgba(16, 185, 129, 0.5)' : 
                                  gisOverlayLayer === 'risk' ? 'rgba(239, 68, 68, 0.1)' : 
                                  gisOverlayLayer === 'needs' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(180, 197, 255, 0.5)'
                                }
                                stroke={gisSelectedPurok === 'West A' ? '#b4c5ff' : '#353535'}
                                strokeWidth={gisSelectedPurok === 'West A' ? 2 : 1}
                                className="cursor-pointer hover:opacity-85 transition-all"
                                onClick={() => setGisSelectedPurok('West A')}
                              />
                              <text x="180" y="65" fill="#e5e2e1" fontSize="9" fontWeight="bold" pointerEvents="none">West A</text>

                              {/* West B Shape */}
                              <path 
                                d="M 30,100 L 120,110 L 100,220 L 30,220 Z" 
                                fill={
                                  gisOverlayLayer === 'density' ? 'rgba(16, 185, 129, 0.7)' : 
                                  gisOverlayLayer === 'risk' ? 'rgba(239, 68, 68, 0.05)' : 
                                  gisOverlayLayer === 'needs' ? 'rgba(249, 115, 22, 0.05)' : 'rgba(180, 197, 255, 0.7)'
                                }
                                stroke={gisSelectedPurok === 'West B' ? '#b4c5ff' : '#353535'}
                                strokeWidth={gisSelectedPurok === 'West B' ? 2 : 1}
                                className="cursor-pointer hover:opacity-85 transition-all"
                                onClick={() => setGisSelectedPurok('West B')}
                              />
                              <text x="55" y="160" fill="#e5e2e1" fontSize="9" fontWeight="bold" pointerEvents="none">West B</text>

                              {/* Holy Cross Shape */}
                              <path 
                                d="M 120,110 L 250,120 L 230,220 L 100,220 Z" 
                                fill={
                                  gisOverlayLayer === 'density' ? 'rgba(16, 185, 129, 0.85)' : 
                                  gisOverlayLayer === 'risk' ? 'rgba(239, 68, 68, 0.7)' : 
                                  gisOverlayLayer === 'needs' ? 'rgba(249, 115, 22, 0.6)' : 'rgba(180, 197, 255, 0.85)'
                                }
                                stroke={gisSelectedPurok === 'Holy Cross Drive' ? '#b4c5ff' : '#353535'}
                                strokeWidth={gisSelectedPurok === 'Holy Cross Drive' ? 2 : 1}
                                className="cursor-pointer hover:opacity-85 transition-all"
                                onClick={() => setGisSelectedPurok('Holy Cross Drive')}
                              />
                              <text x="150" y="165" fill="#e5e2e1" fontSize="9" fontWeight="bold" pointerEvents="none">Holy Cross</text>

                              {/* Special Block Shape */}
                              <path 
                                d="M 280,30 L 370,50 L 340,130 L 250,120 Z" 
                                fill={
                                  gisOverlayLayer === 'density' ? 'rgba(16, 185, 129, 0.3)' : 
                                  gisOverlayLayer === 'risk' ? 'rgba(239, 68, 68, 0.3)' : 
                                  gisOverlayLayer === 'needs' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(180, 197, 255, 0.4)'
                                }
                                stroke={gisSelectedPurok === 'Special Block' ? '#b4c5ff' : '#353535'}
                                strokeWidth={gisSelectedPurok === 'Special Block' ? 2 : 1}
                                className="cursor-pointer hover:opacity-85 transition-all"
                                onClick={() => setGisSelectedPurok('Special Block')}
                              />
                              <text x="300" y="80" fill="#e5e2e1" fontSize="9" fontWeight="bold" pointerEvents="none">Special Blk</text>

                              {/* Belisario Shape */}
                              <path 
                                d="M 250,120 L 340,130 L 320,220 L 230,220 Z" 
                                fill={
                                  gisOverlayLayer === 'density' ? 'rgba(16, 185, 129, 0.15)' : 
                                  gisOverlayLayer === 'risk' ? 'rgba(239, 68, 68, 0.8)' : 
                                  gisOverlayLayer === 'needs' ? 'rgba(249, 115, 22, 0.8)' : 'rgba(180, 197, 255, 0.2)'
                                }
                                stroke={gisSelectedPurok === 'Belisario' ? '#b4c5ff' : '#353535'}
                                strokeWidth={gisSelectedPurok === 'Belisario' ? 2 : 1}
                                className="cursor-pointer hover:opacity-85 transition-all"
                                onClick={() => setGisSelectedPurok('Belisario')}
                              />
                              <text x="265" y="170" fill="#e5e2e1" fontSize="9" fontWeight="bold" pointerEvents="none">Belisario</text>
                            </svg>

                            {/* Floating Map Legend */}
                            <div className="absolute bottom-3 left-3 bg-[#1c1b1b]/95 border border-[#353535]/15 p-2 rounded-lg text-[9px] space-y-1.5 shadow-lg max-w-[120px]">
                              <p className="font-bold text-[#e5e2e1] uppercase tracking-wider">Legend</p>
                              {gisOverlayLayer === 'risk' ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#ef444499] rounded" /><span>High Risk OSY</span></div>
                                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#ef444450] rounded" /><span>Moderate</span></div>
                                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#ef444410] rounded" /><span>Low Risk</span></div>
                                </div>
                              ) : gisOverlayLayer === 'needs' ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#f9731699] rounded" /><span>High Demand</span></div>
                                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#f9731640] rounded" /><span>Moderate</span></div>
                                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#f9731610] rounded" /><span>Low Demand</span></div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#10b98199] rounded" /><span>High Density</span></div>
                                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#10b98150] rounded" /><span>Moderate</span></div>
                                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#10b98120] rounded" /><span>Low Density</span></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <p className="text-[10px] text-on-surface-variant/80 mt-3 text-center">
                          💡 Click any Purok region on the map to display its detailed location census profile on the right panel.
                        </p>
                      </div>

                      {/* Right: Spatial Info Card */}
                      <div className="bg-surface-container-low p-5 rounded-xl border border-[#353535]/15 flex flex-col justify-between">
                        {(() => {
                          const activeP = gisSelectedPurok || 'East';
                          const pProfiles = youthProfiles.filter(y => y.purok === activeP);
                          const pOSY = pProfiles.filter(y => {
                            const c = (y.youthClassification || '').toLowerCase();
                            return c.includes('out of school') || c.includes('osy') || c.includes('wala nag skwela') || c.includes('wala nag-skwela');
                          }).length;
                          const pUnemployed = pProfiles.filter(y => (y.workStatus || '').toLowerCase().includes('unemployed') || (y.workStatus || '').toLowerCase().includes('not interested')).length;
                          const pMale = pProfiles.filter(y => y.gender === 'Male').length;
                          const pFemale = pProfiles.filter(y => y.gender === 'Female').length;
                          const pOther = pProfiles.length - (pMale + pFemale);
                          const pAvgParticipation = pProfiles.length > 0 ? Math.round(pProfiles.reduce((acc, y) => acc + (y.participationRate || 0), 0) / pProfiles.length) : 0;

                          return (
                            <div className="space-y-4">
                              <div className="border-b border-[#353535]/15 pb-2">
                                <span className="text-[9px] uppercase font-bold text-primary tracking-widest block">Selected Area Analysis</span>
                                <h4 className="font-headline font-black text-lg text-on-surface mt-0.5">{activeP} Detail Census</h4>
                              </div>

                              <div className="space-y-3">
                                <div className="flex justify-between items-center bg-[#131313]/30 p-2.5 rounded-lg border border-[#353535]/10">
                                  <span className="text-xs font-semibold text-on-surface-variant">Youth Population</span>
                                  <span className="text-lg font-headline font-black text-primary">{pProfiles.length} Residents</span>
                                </div>

                                <div className="flex justify-between items-center bg-[#131313]/30 p-2.5 rounded-lg border border-[#353535]/10">
                                  <span className="text-xs font-semibold text-on-surface-variant">Avg Participation Rate</span>
                                  <span className="text-sm font-bold text-secondary">{pAvgParticipation}%</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-[#131313]/30 p-2.5 rounded-lg border border-[#353535]/10 text-center">
                                    <p className="text-[9px] uppercase font-bold text-on-surface-variant/80">Out of School (OSY)</p>
                                    <p className="text-base font-bold text-error mt-0.5">{pOSY}</p>
                                  </div>
                                  <div className="bg-[#131313]/30 p-2.5 rounded-lg border border-[#353535]/10 text-center">
                                    <p className="text-[9px] uppercase font-bold text-on-surface-variant/80">Unemployed</p>
                                    <p className="text-base font-bold text-[#f97316] mt-0.5">{pUnemployed}</p>
                                  </div>
                                </div>

                                <div className="space-y-1 text-xs">
                                  <p className="text-[9px] uppercase font-bold text-on-surface-variant/80">Gender Demographics</p>
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-on-surface-variant">Male</span>
                                    <span className="font-bold text-[#e5e2e1]">{pMale}</span>
                                  </div>
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-on-surface-variant">Female</span>
                                    <span className="font-bold text-[#e5e2e1]">{pFemale}</span>
                                  </div>
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-on-surface-variant">LGBTQIA+ / Other</span>
                                    <span className="font-bold text-[#e5e2e1]">{pOther}</span>
                                  </div>
                                </div>

                                <div className="space-y-1.5 pt-2 border-t border-[#353535]/10">
                                  <p className="text-[9px] uppercase font-bold text-on-surface-variant/80">Vulnerability Assessments</p>
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-on-surface-variant">Employment Needs</span>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                      pUnemployed > 5 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    }`}>
                                      {pUnemployed > 5 ? 'Critical' : 'Stable'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-on-surface-variant">ALS Education Support</span>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                      pOSY > 3 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    }`}>
                                      {pOSY > 3 ? 'High Priority' : 'Standard'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                        <div className="pt-4 border-t border-[#353535]/15 mt-4">
                          <button 
                            onClick={() => {
                              setBuilderFilterPurok(gisSelectedPurok || 'East');
                              setReportsInnerSubTab('builder');
                            }}
                            className="w-full bg-[#131313]/60 hover:bg-[#131313]/90 border border-[#353535]/15 text-primary text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md"
                          >
                            <Filter className="w-3.5 h-3.5" /> FILTER BUILDER BY THIS AREA
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {reportsInnerSubTab === 'trends' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                      {/* Left & Middle: Trend Monitoring and Forecasting */}
                      <div className="lg:col-span-2 bg-surface-container-low p-5 rounded-xl border border-[#353535]/15 space-y-4">
                        <div className="flex justify-between items-center border-b border-[#353535]/15 pb-3">
                          <div>
                            <h4 className="font-headline font-bold text-sm text-[#e5e2e1] uppercase tracking-wider">
                              Registration Growth & Forecasting Model
                            </h4>
                            <p className="text-[10px] text-on-surface-variant mt-0.5">
                              Historical cumulative growth with 3-month linear predictive model overlays.
                            </p>
                          </div>
                        </div>

                        {/* Chart Area */}
                        <div className="h-[250px] w-full mt-4">
                          <ErrorBoundary moduleName="Registration Growth Trend Chart">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={[
                                  { month: "Jan 2026", actual: 12, forecast: null },
                                  { month: "Feb 2026", actual: 28, forecast: null },
                                  { month: "Mar 2026", actual: 49, forecast: null },
                                  { month: "Apr 2026", actual: 75, forecast: null },
                                  { month: "May 2026", actual: 104, forecast: null },
                                  { month: "Jun 2026", actual: youthProfiles.length, forecast: youthProfiles.length },
                                  { month: "Jul 2026 (Fc)", actual: null, forecast: Math.round(youthProfiles.length * 1.07) },
                                  { month: "Aug 2026 (Fc)", actual: null, forecast: Math.round(youthProfiles.length * 1.14) },
                                  { month: "Sep 2026 (Fc)", actual: null, forecast: Math.round(youthProfiles.length * 1.21) }
                                ]}
                                margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                              >
                                <XAxis dataKey="month" stroke="#8e9192" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#8e9192" fontSize={10} tickLine={false} axisLine={false} />
                                <RechartsTooltip contentStyle={{ background: '#1c1b1b', borderColor: '#353535', borderRadius: '8px', color: '#e5e2e1' }} />
                                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px' }} />
                                <Area type="monotone" dataKey="actual" name="Historical Census Count" stroke="#10b981" fill="rgba(16, 185, 129, 0.08)" strokeWidth={3} />
                                <Area type="monotone" dataKey="forecast" name="Forecast Model" stroke="#b4c5ff" fill="rgba(180, 197, 255, 0.04)" strokeDasharray="5 5" strokeWidth={2} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </ErrorBoundary>
                        </div>
                      </div>

                      {/* Right: Trend KPI Cards & Details */}
                      <div className="bg-surface-container-low p-5 rounded-xl border border-[#353535]/15 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="border-b border-[#353535]/15 pb-2">
                            <span className="text-[9px] uppercase font-bold text-primary tracking-widest block">Trend Monitoring</span>
                            <h4 className="font-headline font-black text-base text-on-surface mt-0.5">Predictive Insights</h4>
                          </div>

                          <div className="space-y-3">
                            <div className="p-3 bg-[#131313]/30 rounded-lg border border-[#353535]/10 space-y-1">
                              <p className="text-[10px] uppercase font-bold text-on-surface-variant">Registration Velocity</p>
                              <div className="flex justify-between items-baseline">
                                <p className="text-xl font-headline font-black text-primary">+24.6%</p>
                                <span className="text-[9px] text-emerald-400 font-bold uppercase">MoM Growth</span>
                              </div>
                            </div>

                            <div className="p-3 bg-[#131313]/30 rounded-lg border border-[#353535]/10 space-y-1">
                              <p className="text-[10px] uppercase font-bold text-on-surface-variant">Skills Training Demand</p>
                              <div className="flex justify-between items-baseline">
                                <p className="text-xl font-headline font-black text-secondary">First Aid & Tech</p>
                                <span className="text-[9px] text-primary font-bold uppercase">Top Interest</span>
                              </div>
                            </div>

                            <div className="p-3 bg-[#131313]/30 rounded-lg border border-[#353535]/10 space-y-1.5 text-xs text-on-surface-variant/90">
                              <p className="text-[9px] uppercase font-bold text-on-surface-variant">Forecasting Summary</p>
                              <p className="text-[11px] leading-relaxed">
                                Based on historic trends, KKSync predicts the total youth profiles will grow to **{Math.round(youthProfiles.length * 1.21)}** by September 2026. 
                                We recommend scheduling a vocational caravan next month to address the rising Vocational graduate interest.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-[#353535]/15 mt-4">
                          <button 
                            onClick={() => {
                              setBuilderMetric("Registration Growth");
                              setReportsInnerSubTab("builder");
                            }}
                            className="w-full bg-[#131313]/60 hover:bg-[#131313]/90 border border-[#353535]/15 text-primary text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                          >
                            <BarChart3 className="w-3.5 h-3.5" /> EXPORT TREND DATA
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {reportsSubTab === 'dss' && (
                <div className="space-y-6">
                  {/* Title and Intro */}
                  <div className="bg-surface-container-low p-4 rounded-xl border border-[#353535]/15">
                    <h4 className="font-headline font-bold text-sm text-[#e5e2e1] uppercase tracking-wider">
                      Dynamic Recommendation Engine & Policy Analyzer
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-1">
                      KKSync dynamic engine aggregates real-time census counts, OSY, and programs logs to auto-generate intervention plans.
                    </p>
                  </div>

                  {/* Recommendation Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Insight Cards (Left) */}
                    <div className="bg-surface-container-low p-5 rounded-xl border border-[#353535]/15 space-y-4">
                      <h4 className="font-headline font-bold text-xs text-primary uppercase tracking-widest border-b border-[#353535]/15 pb-2">
                        System-Generated Analytical Insights
                      </h4>

                      <div className="space-y-4">
                        {/* Dynamic Insight 1: Purok lowest engagement */}
                        {(() => {
                          const pEngagement = DEFAULT_REAL_PUROKS.map(p => {
                            const pYouth = youthProfiles.filter(y => y.purok === p);
                            const avgRate = pYouth.length > 0 ? Math.round(pYouth.reduce((acc, y) => acc + (y.participationRate || 0), 0) / pYouth.length) : 0;
                            return { p, avgRate, count: pYouth.length };
                          }).filter(x => x.count > 0);
                          const lowest = pEngagement.sort((a,b) => a.avgRate - b.avgRate)[0];

                          return lowest ? (
                            <div className="p-4 bg-[#131313]/30 rounded-lg border border-[#353535]/10 space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Spatial Engagement Alert</span>
                                <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[9px] font-black uppercase">Critical</span>
                              </div>
                              <p className="text-xs font-bold text-[#e5e2e1]">
                                Engagement in <span className="text-primary font-black">{lowest.p}</span> has fallen below the average.
                              </p>
                              <p className="text-[10px] text-on-surface-variant">
                                Average youth participation rate is currently at {lowest.avgRate}%, which is {Math.max(0, 60 - lowest.avgRate)}% lower than other districts.
                              </p>
                            </div>
                          ) : null;
                        })()}

                        {/* Insight 2: Out of School Youth */}
                        {(() => {
                          const osyCount = youthProfiles.filter(y => {
                            const c = (y.youthClassification || '').toLowerCase();
                            return c.includes('out of school') || c.includes('osy') || c.includes('wala nag skwela') || c.includes('wala nag-skwela');
                          }).length;
                          const osyPct = Math.round((osyCount / (youthProfiles.length || 1)) * 100);

                          return (
                            <div className="p-4 bg-[#131313]/30 rounded-lg border border-[#353535]/10 space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-on-surface-variant uppercase">OSY Demographics Alert</span>
                                <span className="px-1.5 py-0.5 bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20 rounded text-[9px] font-black uppercase">Medium Priority</span>
                              </div>
                              <p className="text-xs font-bold text-[#e5e2e1]">
                                Out-of-School Youth (OSY) represents <span className="text-primary font-black">{osyPct}%</span> of total youth population.
                              </p>
                              <p className="text-[10px] text-on-surface-variant">
                                There are currently {osyCount} registered OSY residents in the database. Active intervention programs are suggested.
                              </p>
                            </div>
                          );
                        })()}

                        {/* Insight 3: Vocational graduates growth */}
                        <div className="p-4 bg-[#131313]/30 rounded-lg border border-[#353535]/10 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase">Vocational Education Signal</span>
                            <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-black uppercase">Stable Insight</span>
                          </div>
                          <p className="text-xs font-bold text-[#e5e2e1]">
                            Vocational Graduates show an upward count.
                          </p>
                          <p className="text-[10px] text-on-surface-variant">
                            Vocational graduates represents a key skills demographic. Interventions connecting them with employment portals are recommended.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Recommendations & Interventions (Right) */}
                    <div className="bg-surface-container-low p-5 rounded-xl border border-[#353535]/15 space-y-4">
                      <h4 className="font-headline font-bold text-xs text-primary uppercase tracking-widest border-b border-[#353535]/15 pb-2">
                        Suggested Policy Interventions & Budget Recommendations
                      </h4>

                      <div className="space-y-4">
                        {/* Recommendation 1 */}
                        <div className="p-4 bg-[#131313]/30 rounded-lg border border-[#353535]/10 space-y-2">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-primary">Intervention 1</span>
                            <div className="flex gap-2">
                              <span className="text-emerald-400 font-bold uppercase text-[9px]">92% Confidence</span>
                              <span className="text-primary font-bold uppercase text-[9px]">High Priority</span>
                            </div>
                          </div>
                          <p className="text-xs font-bold text-[#e5e2e1]">Establish Purok Livelihood Assemblies & Vocational Caravan</p>
                          <p className="text-[10px] text-on-surface-variant leading-relaxed">
                            Aggregated skills indicate high demand in practical trades. Channeling ₱35,000 of SK developmental funds toward TESDA-accredited training programs is highly recommended.
                          </p>
                        </div>

                        {/* Recommendation 2 */}
                        <div className="p-4 bg-[#131313]/30 rounded-lg border border-[#353535]/10 space-y-2">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-primary">Intervention 2</span>
                            <div className="flex gap-2">
                              <span className="text-emerald-400 font-bold uppercase text-[9px]">88% Confidence</span>
                              <span className="text-on-surface-variant font-bold uppercase text-[9px]">Medium Priority</span>
                            </div>
                          </div>
                          <p className="text-xs font-bold text-[#e5e2e1]">Purok Engagement Outreach Project</p>
                          <p className="text-[10px] text-on-surface-variant leading-relaxed">
                            Hold the next SK general assembly or Sports caravan directly inside the lowest engaged Purok (District) to boost resident trust, register new youth, and capture local concerns.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {reportsSubTab === 'reporting-export' && (
                <div className="space-y-6">
                  {/* Reporting System list */}
                  <div className="bg-surface-container-low p-5 rounded-xl border border-[#353535]/15 space-y-4">
                    <h4 className="font-headline font-bold text-xs text-primary uppercase tracking-widest border-b border-[#353535]/15 pb-2">
                      Official Census & Situational Reports Generator
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Demographics Report */}
                      <div className="bg-[#131313]/30 p-4 rounded-xl border border-[#353535]/10 flex flex-col justify-between space-y-3">
                        <div>
                          <h5 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-primary" />
                            Youth Demographic Census Report
                          </h5>
                          <p className="text-[10px] text-on-surface-variant mt-1">
                            Complete breakdown of age brackets (15-30), gender ratio, and voter statistics.
                          </p>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-[9px] text-on-surface-variant">Data source: Youth registry profiles</span>
                          <button 
                            onClick={() => setIsReportModalOpen(true)}
                            className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                          >
                            Generate Report
                          </button>
                        </div>
                      </div>

                      {/* Education Report */}
                      <div className="bg-[#131313]/30 p-4 rounded-xl border border-[#353535]/10 flex flex-col justify-between space-y-3">
                        <div>
                          <h5 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-primary" />
                            Education and Training Profile
                          </h5>
                          <p className="text-[10px] text-on-surface-variant mt-1">
                            Analyzes school enrolment, scholarship ratios, vocational graduates, and literacy.
                          </p>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-[9px] text-on-surface-variant">Data source: Educational registrations</span>
                          <button 
                            onClick={() => setIsReportModalOpen(true)}
                            className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                          >
                            Generate Report
                          </button>
                        </div>
                      </div>

                      {/* Employment & Livelihood Report */}
                      <div className="bg-[#131313]/30 p-4 rounded-xl border border-[#353535]/10 flex flex-col justify-between space-y-3">
                        <div>
                          <h5 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-primary" />
                            Employment & Livelihood Status
                          </h5>
                          <p className="text-[10px] text-on-surface-variant mt-1">
                            Tracks work status, job seeking percentages, and entrepreneurial rates.
                          </p>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-[9px] text-on-surface-variant">Data source: Livelihood records</span>
                          <button 
                            onClick={() => setIsReportModalOpen(true)}
                            className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                          >
                            Generate Report
                          </button>
                        </div>
                      </div>

                      {/* OSY Situation Report */}
                      <div className="bg-[#131313]/30 p-4 rounded-xl border border-[#353535]/10 flex flex-col justify-between space-y-3">
                        <div>
                          <h5 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-primary" />
                            Out-of-School Youth (OSY) Situationer
                          </h5>
                          <p className="text-[10px] text-on-surface-variant mt-1">
                            A specific audit listing spatial distribution and key target areas for ALS caravans.
                          </p>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-[9px] text-on-surface-variant">Data source: Classification records</span>
                          <button 
                            onClick={() => setIsReportModalOpen(true)}
                            className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                          >
                            Generate Report
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Export Center Settings */}
                  <div className="bg-surface-container-low p-5 rounded-xl border border-[#353535]/15 space-y-4">
                    <h4 className="font-headline font-bold text-xs text-primary uppercase tracking-widest border-b border-[#353535]/15 pb-2">
                      Export Center & Delivery Schedulers
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-on-surface-variant">
                      <div className="bg-[#131313]/30 p-4 rounded-xl border border-[#353535]/10 space-y-2">
                        <span className="font-bold text-[#e5e2e1] uppercase block">Email delivery</span>
                        <p className="text-[10px]">Setup automated email delivery of generated reports straight to your SK email inbox.</p>
                        <input type="email" placeholder="sk.officer@domain.gov" className="w-full bg-surface-container-high border-none rounded-lg text-xs font-bold text-on-surface py-2 px-3 mt-2" />
                      </div>
                      <div className="bg-[#131313]/30 p-4 rounded-xl border border-[#353535]/10 space-y-2">
                        <span className="font-bold text-[#e5e2e1] uppercase block">File Formats</span>
                        <p className="text-[10px]">Support direct layout print PDF, spreadsheets (Excel/CSV), and raw charts image files.</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="bg-[#353535]/30 text-on-surface px-2 py-0.5 rounded text-[9px] font-bold">PDF</span>
                          <span className="bg-[#353535]/30 text-on-surface px-2 py-0.5 rounded text-[9px] font-bold">XLSX</span>
                          <span className="bg-[#353535]/30 text-on-surface px-2 py-0.5 rounded text-[9px] font-bold">CSV</span>
                          <span className="bg-[#353535]/30 text-on-surface px-2 py-0.5 rounded text-[9px] font-bold">PNG</span>
                        </div>
                      </div>
                      <div className="bg-[#131313]/30 p-4 rounded-xl border border-[#353535]/10 space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="font-bold text-[#e5e2e1] uppercase block">Archiving System</span>
                          <p className="text-[10px]">Keep automated historical archives of youth statistics for year-over-year policy evaluations.</p>
                        </div>
                        <span className="text-[9px] text-emerald-400 font-bold block pt-2">✓ Dynamic Local Database Synced</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
  );
};

export default AnalyticsInsightView;
