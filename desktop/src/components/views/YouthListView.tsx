import React from 'react';
import {
  Filter,
  X,
  Download,
  PlusCircle,
  Archive,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import * as db from '../../lib/db';

interface YouthListViewProps {
  paginatedProfiles: db.YouthProfile[];
  totalProfilesCount: number;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  // Filters
  puroks: string[];
  purokFilter: string;
  setPurokFilter: (v: string) => void;
  genderFilter: string;
  setGenderFilter: (v: string) => void;
  voterFilter: string;
  setVoterFilter: (v: string) => void;
  civilStatusFilter: string;
  setCivilStatusFilter: (v: string) => void;
  workStatusFilter: string;
  setWorkStatusFilter: (v: string) => void;
  classificationFilter: string;
  setClassificationFilter: (v: string) => void;
  educationFilter: string;
  setEducationFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  // Actions
  onResetFilters: () => void;
  onExportToCSV: () => void;
  setActiveTab: (tab: string) => void;
  setSelectedYouthId: (id: string | null) => void;
}

const YouthListView: React.FC<YouthListViewProps> = ({
  paginatedProfiles,
  totalProfilesCount,
  currentPage,
  setCurrentPage,
  pageSize,
  puroks,
  purokFilter,
  setPurokFilter,
  genderFilter,
  setGenderFilter,
  voterFilter,
  setVoterFilter,
  civilStatusFilter,
  setCivilStatusFilter,
  workStatusFilter,
  setWorkStatusFilter,
  classificationFilter,
  setClassificationFilter,
  educationFilter,
  setEducationFilter,
  statusFilter,
  setStatusFilter,
  onResetFilters,
  onExportToCSV,
  setActiveTab,
  setSelectedYouthId,
}) => {
  return (
            <div className="space-y-6">
              <div className="bg-surface-container-low p-5 rounded-xl border border-[#353535]/10 space-y-4 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h3 className="font-headline font-black text-xl text-[#e5e2e1] flex items-center gap-2">
                    <Filter className="w-5 h-5 text-primary" />
                    Youth Profiling Database
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button 
                      onClick={onResetFilters}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
                    >
                      <X className="w-4 h-4" /> RESET FILTERS
                    </button>

                    <button 
                      onClick={onExportToCSV}
                      className="bg-surface-container-high border border-[#353535]/15 hover:bg-surface-container-highest text-on-surface text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
                    >
                      <Download className="w-4 h-4 text-primary" /> EXPORT TO EXCEL
                    </button>

                    <button 
                      onClick={() => setActiveTab('add-youth')}
                      className="bg-primary text-on-primary text-xs font-extrabold px-4 py-2.5 rounded-lg flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shadow-md ml-auto md:ml-0"
                    >
                      <PlusCircle className="w-4 h-4" /> ADD RESIDENT
                    </button>
                  </div>
                </div>

                {/* Filter Selects Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 pt-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant/80">Purok Area</label>
                    <select 
                      value={purokFilter}
                      onChange={(e) => setPurokFilter(e.target.value)}
                      className="bg-surface-container-high border-none rounded-lg text-xs font-bold text-on-surface py-2.5 px-3 focus:ring-1 focus:ring-primary/50 cursor-pointer"
                    >
                      <option value="All">All Puroks</option>
                      {puroks.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant/80">Gender Sex</label>
                    <select 
                      value={genderFilter}
                      onChange={(e) => setGenderFilter(e.target.value)}
                      className="bg-surface-container-high border-none rounded-lg text-xs font-bold text-on-surface py-2.5 px-3 focus:ring-1 focus:ring-primary/50 cursor-pointer"
                    >
                      <option value="All">All Genders</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant/80">Voter Status</label>
                    <select 
                      value={voterFilter}
                      onChange={(e) => setVoterFilter(e.target.value)}
                      className="bg-surface-container-high border-none rounded-lg text-xs font-bold text-on-surface py-2.5 px-3 focus:ring-1 focus:ring-primary/50 cursor-pointer"
                    >
                      <option value="All">All Voters</option>
                      <option value="Voter">Voter Only</option>
                      <option value="Non-Voter">Non-Voter Only</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant/80">Civil Status</label>
                    <select 
                      value={civilStatusFilter}
                      onChange={(e) => setCivilStatusFilter(e.target.value)}
                      className="bg-surface-container-high border-none rounded-lg text-xs font-bold text-on-surface py-2.5 px-3 focus:ring-1 focus:ring-primary/50 cursor-pointer"
                    >
                      <option value="All">All Civil Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant/80">Employment</label>
                    <select 
                      value={workStatusFilter}
                      onChange={(e) => setWorkStatusFilter(e.target.value)}
                      className="bg-surface-container-high border-none rounded-lg text-xs font-bold text-on-surface py-2.5 px-3 focus:ring-1 focus:ring-primary/50 cursor-pointer"
                    >
                      <option value="All">All Employment</option>
                      <option value="Unemployed">Unemployed</option>
                      <option value="Employed">Employed</option>
                      <option value="Self-employed">Self-employed</option>
                      <option value="Currently looking for a job">Looking for job</option>
                      <option value="Not interested looking for a job">Not interested</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant/80">Classification</label>
                    <select 
                      value={classificationFilter}
                      onChange={(e) => setClassificationFilter(e.target.value)}
                      className="bg-surface-container-high border-none rounded-lg text-xs font-bold text-on-surface py-2.5 px-3 focus:ring-1 focus:ring-primary/50 cursor-pointer"
                    >
                      <option value="All">All Classes</option>
                      <option value="In School Youth (Nag skwela)">In School</option>
                      <option value="Out of School Youth (Wala nag Skwela)">Out of School</option>
                      <option value="Working Youth">Working Youth</option>
                      <option value="Youth w/ specific needs: PWD">PWD</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant/80">Education Level</label>
                    <select 
                      value={educationFilter}
                      onChange={(e) => setEducationFilter(e.target.value)}
                      className="bg-surface-container-high border-none rounded-lg text-xs font-bold text-on-surface py-2.5 px-3 focus:ring-1 focus:ring-primary/50 cursor-pointer"
                    >
                      <option value="All">All Education</option>
                      <option value="Elementary Level">Elementary Level</option>
                      <option value="High School Level">High School Level</option>
                      <option value="High School Graduate">High School Graduate</option>
                      <option value="College Level">College Level</option>
                      <option value="College Graduate">College Graduate</option>
                      <option value="Vocational Graduate">Vocational Graduate</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant/80">Operational</label>
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-surface-container-high border-none rounded-lg text-xs font-bold text-on-surface py-2.5 px-3 focus:ring-1 focus:ring-primary/50 cursor-pointer"
                    >
                      <option value="All">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Records Table */}
              <div className="bg-surface-container-low rounded-xl border border-[#353535]/10 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-highest/30 border-b border-[#353535]/15">
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Resident Profile</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Purok</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Voter Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Education & Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#353535]/10">
                      {totalProfilesCount > 0 ? (
                        paginatedProfiles.map((y) => (
                          <tr key={y.id} className="hover:bg-surface-variant/20 transition-colors group">
                            <td className="px-6 py-4.5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/10 group-hover:ring-primary/40 transition-all">
                                  <img src={y.avatarUrl} alt={y.firstName} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-headline font-bold text-sm text-on-surface">
                                      {y.firstName} {y.lastName}
                                    </p>
                                    {y.facebookLink && (
                                      <a 
                                        href={y.facebookLink.startsWith('http') ? y.facebookLink : `https://${y.facebookLink}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#1877F2] hover:opacity-80 transition-opacity"
                                        title="Facebook Profile"
                                      >
                                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                        </svg>
                                      </a>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-on-surface-variant font-semibold uppercase">
                                    UID: {y.id} • {y.age} Yrs • {y.gender}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4.5">
                              <span className="text-sm font-semibold text-on-surface-variant">{y.purok}</span>
                            </td>
                            <td className="px-6 py-4.5">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                y.isRegisteredVoter 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {y.isRegisteredVoter ? `Voter (${y.precinctNumber})` : 'Non-Voter'}
                              </span>
                            </td>
                            <td className="px-6 py-4.5">
                              <p className="text-xs font-bold text-on-surface leading-tight">{y.educationLevel}</p>
                              <p className="text-[10px] text-secondary font-semibold uppercase tracking-tight mt-0.5">{y.educationalStatus}</p>
                            </td>
                            <td className="px-6 py-4.5 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => setSelectedYouthId(y.id)}
                                  className="text-xs font-bold text-primary hover:underline bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-all"
                                >
                                  View Details
                                </button>
                                <button className="p-2 text-on-surface-variant hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                  <Archive className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant text-sm font-semibold">
                            No youth profiles found matching specified filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Pagination Controls */}
                {totalProfilesCount > pageSize && (
                  <div className="bg-surface-container-high/40 px-6 py-4 border-t border-[#353535]/10 flex items-center justify-between">
                    <p className="text-xs text-on-surface-variant font-medium">
                      Showing <span className="font-bold text-on-surface">{Math.min(totalProfilesCount, (currentPage - 1) * pageSize + 1)}</span> to{' '}
                      <span className="font-bold text-on-surface">{Math.min(totalProfilesCount, currentPage * pageSize)}</span> of{' '}
                      <span className="font-bold text-on-surface">{totalProfilesCount}</span> residents
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-surface-container-highest border border-[#353535]/10 text-on-surface hover:bg-surface-variant/20 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalProfilesCount / pageSize), prev + 1))}
                        disabled={currentPage >= Math.ceil(totalProfilesCount / pageSize)}
                        className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-surface-container-highest border border-[#353535]/10 text-on-surface hover:bg-surface-variant/20 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                      >
                        Next <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
  );
};

export default YouthListView;
