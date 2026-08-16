import React, { useEffect, useRef, useState } from 'react';
import {
  Filter,
  X,
  Download,
  PlusCircle,
  Archive,
  ArrowLeft,
  ArrowRight,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Check,
} from 'lucide-react';
import * as db from '../../lib/db';
import { formatYouthName } from 'shared';

interface YouthListViewProps {
  paginatedProfiles: db.YouthProfile[];
  totalProfilesCount: number;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  // Search
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  // Filters (multi-select, empty array = "All")
  puroks: string[];
  purokFilter: string[];
  setPurokFilter: (v: string[]) => void;
  genderFilter: string[];
  setGenderFilter: (v: string[]) => void;
  voterFilter: string;
  setVoterFilter: (v: string) => void;
  civilStatusFilter: string[];
  setCivilStatusFilter: (v: string[]) => void;
  workStatusFilter: string[];
  setWorkStatusFilter: (v: string[]) => void;
  classificationFilter: string[];
  setClassificationFilter: (v: string[]) => void;
  educationFilter: string[];
  setEducationFilter: (v: string[]) => void;
  statusFilter: string[];
  setStatusFilter: (v: string[]) => void;
  skillsFilter: string[];
  setSkillsFilter: (v: string[]) => void;
  ageMinFilter: string;
  setAgeMinFilter: (v: string) => void;
  ageMaxFilter: string;
  setAgeMaxFilter: (v: string) => void;
  skillSuggestions: string[];
  // Actions
  onResetFilters: () => void;
  onApplyFilters: () => void;
  onExportToCSV: () => void;
  onArchive: (id: string) => void;
  setActiveTab: (tab: string) => void;
  setSelectedYouthId: (id: string | null) => void;
}

interface MultiSelectProps {
  label: string;
  allLabel: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
}

const MultiSelectFilter: React.FC<MultiSelectProps> = ({ label, allLabel, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value]);
  };

  const displayText = selected.length === 0
    ? allLabel
    : selected.length === 1
      ? (options.find(o => o.value === selected[0])?.label || selected[0])
      : `${selected.length} selected`;

  return (
    <div className="flex flex-col gap-1 relative" ref={containerRef}>
      <label className="text-[10px] uppercase font-bold text-on-surface-variant/80">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className={`bg-surface-container-high border-none rounded-lg text-xs font-bold text-left py-2.5 px-3 focus:ring-1 focus:ring-primary/50 cursor-pointer flex items-center justify-between gap-2 ${
          selected.length > 0 ? 'text-primary' : 'text-on-surface'
        }`}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-on-surface-variant transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[180px] max-h-64 overflow-y-auto bg-surface-container-high border border-[#353535]/20 rounded-lg shadow-2xl z-30 py-1">
          {options.map(o => {
            const checked = selected.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggleOption(o.value)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-left hover:bg-surface-variant/20 transition-colors"
              >
                <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                  checked ? 'bg-primary border-primary' : 'border-outline-variant/40'
                }`}>
                  {checked && <Check className="w-3 h-3 text-on-primary" />}
                </span>
                <span className={checked ? 'text-on-surface' : 'text-on-surface-variant'}>{o.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const YouthListView: React.FC<YouthListViewProps> = ({
  paginatedProfiles,
  totalProfilesCount,
  currentPage,
  setCurrentPage,
  pageSize,
  searchQuery,
  setSearchQuery,
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
  skillsFilter,
  setSkillsFilter,
  ageMinFilter,
  setAgeMinFilter,
  ageMaxFilter,
  setAgeMaxFilter,
  skillSuggestions,
  onResetFilters,
  onApplyFilters,
  onExportToCSV,
  onArchive,
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

                {/* Search Bar (moved from top navbar) */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or contact number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-surface-container-high border-none rounded-lg pl-10 pr-4 py-2.5 text-sm w-full focus:ring-1 focus:ring-primary/50 transition-all text-on-surface placeholder:text-on-surface-variant/40"
                  />
                </div>

                {/* Age Range Filter */}
                <div className="flex items-end gap-3 flex-wrap">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant/80">Age Min</label>
                    <input
                      type="number"
                      min={15}
                      max={30}
                      value={ageMinFilter}
                      onChange={(e) => setAgeMinFilter(e.target.value)}
                      placeholder="15"
                      className="bg-surface-container-high border-none rounded-lg text-xs font-bold text-on-surface py-2.5 px-3 w-24 focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-on-surface-variant/80">Age Max</label>
                    <input
                      type="number"
                      min={15}
                      max={30}
                      value={ageMaxFilter}
                      onChange={(e) => setAgeMaxFilter(e.target.value)}
                      placeholder="30"
                      className="bg-surface-container-high border-none rounded-lg text-xs font-bold text-on-surface py-2.5 px-3 w-24 focus:ring-1 focus:ring-primary/50"
                    />
                  </div>

                  <button
                    onClick={onApplyFilters}
                    className="bg-primary text-on-primary text-xs font-extrabold px-5 py-2.5 rounded-lg flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shadow-md ml-auto"
                  >
                    <SlidersHorizontal className="w-4 h-4" /> SEARCH FILTERS
                  </button>
                </div>

                {/* Multi-select Filters Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 pt-2">
                  <MultiSelectFilter
                    label="Purok Area"
                    allLabel="All Puroks"
                    selected={purokFilter}
                    onChange={setPurokFilter}
                    options={puroks.map(p => ({ value: p, label: p }))}
                  />

                  <MultiSelectFilter
                    label="Gender"
                    allLabel="All Genders"
                    selected={genderFilter}
                    onChange={setGenderFilter}
                    options={[
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' },
                      { value: 'LGBTQIA+', label: 'LGBTQIA+' },
                      { value: 'Unlabeled', label: 'Unlabeled' },
                    ]}
                  />

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

                  <MultiSelectFilter
                    label="Civil Status"
                    allLabel="All Civil Status"
                    selected={civilStatusFilter}
                    onChange={setCivilStatusFilter}
                    options={[
                      { value: 'Single', label: 'Single' },
                      { value: 'Married', label: 'Married' },
                      { value: 'Widowed', label: 'Widowed' },
                    ]}
                  />

                  <MultiSelectFilter
                    label="Employment"
                    allLabel="All Employment"
                    selected={workStatusFilter}
                    onChange={setWorkStatusFilter}
                    options={[
                      { value: 'Unemployed', label: 'Unemployed' },
                      { value: 'Employed', label: 'Employed' },
                      { value: 'Self-employed', label: 'Self-employed' },
                      { value: 'Currently looking for a job', label: 'Looking for job' },
                      { value: 'Not interested looking for a job', label: 'Not interested' },
                    ]}
                  />

                  <MultiSelectFilter
                    label="Classification"
                    allLabel="All Classes"
                    selected={classificationFilter}
                    onChange={setClassificationFilter}
                    options={[
                      { value: 'In School Youth (Nag skwela)', label: 'In School' },
                      { value: 'Out of School Youth (Wala nag Skwela)', label: 'Out of School' },
                      { value: 'Working Youth', label: 'Working Youth' },
                      { value: 'Youth w/ specific needs: PWD', label: 'PWD' },
                    ]}
                  />

                  <MultiSelectFilter
                    label="Education Level"
                    allLabel="All Education"
                    selected={educationFilter}
                    onChange={setEducationFilter}
                    options={[
                      { value: 'Elementary Level', label: 'Elementary Level' },
                      { value: 'Elementary Graduate', label: 'Elementary Graduate' },
                      { value: 'High School Level', label: 'High School Level' },
                      { value: 'High School Graduate', label: 'High School Graduate' },
                      { value: 'Vocational Graduate', label: 'Vocational Graduate' },
                      { value: 'College Level', label: 'College Level' },
                      { value: 'College Graduate', label: 'College Graduate' },
                      { value: 'Masters Level', label: 'Masters Level' },
                      { value: 'Masters Graduate', label: 'Masters Graduate' },
                      { value: 'Doctorate Level', label: 'Doctorate Level' },
                      { value: 'Doctorate Graduate', label: 'Doctorate Graduate' },
                    ]}
                  />

                  <MultiSelectFilter
                    label="Operational"
                    allLabel="All Status"
                    selected={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                      { value: 'Active', label: 'Active' },
                      { value: 'Inactive', label: 'Inactive' },
                      { value: 'Archived', label: 'Archived' },
                    ]}
                  />

                  <MultiSelectFilter
                    label="Skills"
                    allLabel="All Skills"
                    selected={skillsFilter}
                    onChange={setSkillsFilter}
                    options={skillSuggestions.map(s => ({ value: s, label: s }))}
                  />
                </div>
              </div>

              {/* Records Table */}
              <div className="bg-surface-container-low rounded-xl border border-[#353535]/10 shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse" style={{ minWidth: '1600px' }}>
                    <thead>
                      <tr className="bg-surface-container-highest/30 border-b border-[#353535]/15">
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Resident Profile</th>
                        <th className="px-3 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Age</th>
                        <th className="px-3 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Gender</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Purok</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Voter Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Civil Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Employment</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Classification</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Education Level</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Educational Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Program</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Skills & Competencies</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Operational</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#353535]/10">
                      {totalProfilesCount > 0 ? (
                        paginatedProfiles.map((y) => (
                          <tr
                            key={y.id}
                            onClick={() => setSelectedYouthId(y.id)}
                            className="hover:bg-surface-variant/20 transition-colors group cursor-pointer"
                          >
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <p className="font-headline font-bold text-sm text-on-surface">
                                {formatYouthName(y)}
                              </p>
                            </td>
                            <td className="px-3 py-4.5 whitespace-nowrap">
                              <span className="text-sm font-semibold text-on-surface-variant">{y.age}</span>
                            </td>
                            <td className="px-3 py-4.5 whitespace-nowrap">
                              <span className="text-sm font-semibold text-on-surface-variant">{y.gender}</span>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span className="text-sm font-semibold text-on-surface-variant">{y.purok}</span>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                y.isRegisteredVoter
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {y.isRegisteredVoter ? `Voter (${y.precinctNumber})` : 'Non-Voter'}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span className="text-sm font-semibold text-on-surface-variant">{y.civilStatus}</span>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span className="text-sm font-semibold text-on-surface-variant">{y.workStatus || 'N/A'}</span>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span className="text-xs font-bold text-on-surface leading-tight">
                                {y.youthClassification || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span className="text-xs font-bold text-on-surface leading-tight">{y.educationLevel || 'N/A'}</span>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span className="text-[10px] text-secondary font-semibold uppercase tracking-tight">{y.educationalStatus || 'N/A'}</span>
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span className="text-xs text-on-surface-variant">{y.educationSpecify || 'N/A'}</span>
                            </td>
                            <td className="px-6 py-4.5">
                              {y.skills.length > 0 ? (
                                <div className="flex flex-wrap gap-1 max-w-[180px]">
                                  {y.skills.slice(0, 2).map((s) => (
                                    <span key={s} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-surface-container-highest border border-outline-variant/20 text-on-surface">
                                      {s}
                                    </span>
                                  ))}
                                  {y.skills.length > 2 && (
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-surface-container-highest border border-outline-variant/20 text-on-surface-variant">
                                      +{y.skills.length - 2}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-on-surface-variant">N/A</span>
                              )}
                            </td>
                            <td className="px-6 py-4.5 whitespace-nowrap">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                y.status === 'Active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : y.status === 'Inactive'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {y.status}
                              </span>
                            </td>
                            <td className="px-6 py-4.5 text-right whitespace-nowrap">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onArchive(y.id);
                                  }}
                                  title="Archive Resident"
                                  className="p-2 text-on-surface-variant hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={14} className="px-6 py-10 text-center text-on-surface-variant text-sm font-semibold">
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
