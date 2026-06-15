import React from 'react';
import {
  ArrowRight,
  ArrowLeft,
  FileText,
  Download,
  Zap,
  PlusCircle,
  RefreshCw,
  X,
  Users,
  Award,
} from 'lucide-react';
import * as db from '../../lib/db';

interface AddYouthViewProps {
  importTab: 'single' | 'bulk' | 'registry';
  // Single entry form
  addYouthStep: number;
  setAddYouthStep: (step: number) => void;
  triedNextStep: boolean;
  setTriedNextStep: (v: boolean) => void;
  triedSubmit: boolean;
  setTriedSubmit: (v: boolean) => void;
  newYouth: any; // The newYouth state object
  setNewYouth: (v: any) => void;
  skillInput: string;
  setSkillInput: (v: string) => void;
  puroks: string[];
  onAddYouth: (e: React.FormEvent) => void;
  isPage1Valid: () => boolean;
  isPage2Valid: () => boolean;
  getInputClass: (isInvalid: boolean, isPage2?: boolean) => string;
  requiresWorkSpecify: (status: string) => boolean;
  onAddSkill: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRemoveSkill: (skill: string) => void;
  onAddSuggestion: (suggested: string) => void;
  skillSuggestions: string[];
  getYouthAgeGroup: (age: number) => string;
  // Bulk import
  bulkText: string;
  setBulkText: (v: string) => void;
  parsedProfiles: any[];
  bulkImportError: string | null;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBulkImportSubmit: (e: React.FormEvent) => void;
  onClearBulk: () => void;
  isLoading: boolean;
  // Web registry
  submissions: db.RegistrationSubmission[];
  registrySubTab: 'Pending' | 'Approved' | 'Rejected';
  setRegistrySubTab: (tab: 'Pending' | 'Approved' | 'Rejected') => void;
  selectedSubmission: db.RegistrationSubmission | null;
  setSelectedSubmission: (v: db.RegistrationSubmission | null) => void;
  rejectionNotes: string;
  setRejectionNotes: (v: string) => void;
  onApproveSubmission: (sub: db.RegistrationSubmission) => void;
  onRejectSubmission: (id: string, notes: string) => void;
  onSyncPortalData: () => void;
}

const AddYouthView: React.FC<AddYouthViewProps> = ({
  importTab,
  addYouthStep,
  setAddYouthStep,
  triedNextStep,
  setTriedNextStep,
  triedSubmit,
  setTriedSubmit,
  newYouth,
  setNewYouth,
  skillInput,
  setSkillInput,
  puroks,
  onAddYouth,
  isPage1Valid,
  isPage2Valid,
  getInputClass,
  requiresWorkSpecify,
  onAddSkill,
  onRemoveSkill,
  onAddSuggestion,
  skillSuggestions,
  getYouthAgeGroup,
  bulkText,
  setBulkText,
  parsedProfiles,
  bulkImportError,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileUpload,
  onBulkImportSubmit,
  onClearBulk,
  isLoading,
  submissions,
  registrySubTab,
  setRegistrySubTab,
  selectedSubmission,
  setSelectedSubmission,
  rejectionNotes,
  setRejectionNotes,
  onApproveSubmission,
  onRejectSubmission,
  onSyncPortalData,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">

      {importTab === 'single' && (
        <div className="glass-panel rounded-xl p-6 md:p-8 space-y-6 border border-[#353535]/20">
          <div className="flex justify-between items-center border-b border-[#353535]/10 pb-4">
            <div className="flex flex-col">
              <span className="text-xs font-mono font-bold text-primary uppercase">Part {addYouthStep} of 2</span>
              <h4 className="font-headline font-black text-lg text-on-surface mt-0.5">
                {addYouthStep === 1 ? 'Personal & Demographic Information' : 'Background, Registration & Affiliation'}
              </h4>
            </div>
            {/* Step dots */}
            <div className="flex gap-2">
              <span className={`w-8 h-2 rounded-full transition-colors ${addYouthStep >= 1 ? 'bg-primary' : 'bg-surface-container-highest'}`}></span>
              <span className={`w-8 h-2 rounded-full transition-colors ${addYouthStep >= 2 ? 'bg-primary' : 'bg-surface-container-highest'}`}></span>
            </div>
          </div>

          <form onSubmit={onAddYouth} className="space-y-6">
            {addYouthStep === 1 && (
              <div className="space-y-4 animate-scale-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">First Name</label>
                    <input 
                      type="text" 
                      required
                      value={newYouth.firstName}
                      onChange={(e) => setNewYouth({...newYouth, firstName: e.target.value})}
                      className={getInputClass(newYouth.firstName.trim() === '')}
                      placeholder="e.g. Elena"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">Middle Name (Optional)</label>
                    <input 
                      type="text" 
                      value={newYouth.middleName}
                      onChange={(e) => setNewYouth({...newYouth, middleName: e.target.value})}
                      className="w-full bg-[#181818] border border-outline-variant/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                      placeholder="e.g. Santos"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">Last Name</label>
                    <input 
                      type="text" 
                      required
                      value={newYouth.lastName}
                      onChange={(e) => setNewYouth({...newYouth, lastName: e.target.value})}
                      className={getInputClass(newYouth.lastName.trim() === '')}
                      placeholder="e.g. Rodriguez"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center px-0.5">
                      <label className="text-xs font-bold text-on-surface-variant">Age</label>
                      <span className="text-[9px] text-primary/70 font-bold uppercase tracking-wider font-mono">15-30 only</span>
                    </div>
                    <input 
                      type="number" 
                      required
                      value={newYouth.age}
                      onChange={(e) => setNewYouth({...newYouth, age: Number(e.target.value)})}
                      className={getInputClass(newYouth.age < 15 || newYouth.age > 30)}
                      min="15"
                      max="30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">Date of Birth</label>
                    <input 
                      type="date" 
                      required
                      value={newYouth.dob}
                      onChange={(e) => setNewYouth({...newYouth, dob: e.target.value})}
                      className={getInputClass(newYouth.dob.trim() === '')}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">Gender</label>
                    <select 
                      value={newYouth.gender}
                      onChange={(e) => setNewYouth({...newYouth, gender: e.target.value})}
                      className="w-full bg-[#181818] border border-outline-variant/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="LGBTQIA+">LGBTQIA+</option>
                      <option value="Unlabeled">Unlabeled (Please specify)</option>
                    </select>
                  </div>
                </div>

                {(newYouth.gender === 'LGBTQIA+' || newYouth.gender === 'Unlabeled') && (
                  <div className="space-y-1.5 animate-scale-in">
                    <label className="text-xs font-bold text-on-surface-variant">Specify Gender Identity/Expression</label>
                    <input 
                      type="text" 
                      value={newYouth.genderSpecify}
                      onChange={(e) => setNewYouth({...newYouth, genderSpecify: e.target.value})}
                      className={getInputClass((newYouth.gender === 'LGBTQIA+' || newYouth.gender === 'Unlabeled') && newYouth.genderSpecify.trim() === '')}
                      placeholder="Specify preferred identity"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">Civil Status</label>
                    <select 
                      value={newYouth.civilStatus}
                      onChange={(e) => setNewYouth({...newYouth, civilStatus: e.target.value})}
                      className="w-full bg-[#181818] border border-outline-variant/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Divorce">Divorce</option>
                      <option value="Separated">Separated</option>
                      <option value="Annulled">Annulled</option>
                      <option value="Unknown">Unknown</option>
                      <option value="Live-in">Live-in</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">Purok</label>
                    <select 
                      value={newYouth.purok}
                      onChange={(e) => setNewYouth({...newYouth, purok: e.target.value})}
                      className="w-full bg-[#181818] border border-outline-variant/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                    >
                      {puroks.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">Gmail Address</label>
                    <input 
                      type="email" 
                      required
                      value={newYouth.email}
                      onChange={(e) => setNewYouth({...newYouth, email: e.target.value})}
                      className={getInputClass(newYouth.email.trim() === '' || !newYouth.email.includes('@'))}
                      placeholder="username@gmail.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">Contact Phone Number</label>
                    <input 
                      type="text" 
                      required
                      value={newYouth.contactNumber}
                      onChange={(e) => setNewYouth({...newYouth, contactNumber: e.target.value})}
                      className={getInputClass(newYouth.contactNumber.trim() === '')}
                      placeholder="+63 900 000 0000"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">Facebook Profile Link</label>
                    <input 
                      type="text" 
                      required
                      value={newYouth.facebookLink}
                      onChange={(e) => setNewYouth({...newYouth, facebookLink: e.target.value})}
                      className={getInputClass(newYouth.facebookLink.trim() === '')}
                      placeholder="e.g. facebook.com/username"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant">Complete Home Address</label>
                  <textarea 
                    rows={2}
                    required
                    value={newYouth.address}
                    onChange={(e) => setNewYouth({...newYouth, address: e.target.value})}
                    className={`w-full bg-[#181818] border border-outline-variant/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 resize-none ${triedNextStep && newYouth.address.trim() === '' ? 'border-red-500/80 focus:ring-red-500 bg-red-500/5' : 'focus:ring-primary'}`}
                    placeholder="House No, Street, Subdivision..."
                  />
                </div>

                <div className="pt-4 flex justify-end border-t border-[#353535]/15">
                  <button 
                    type="button"
                    onClick={() => {
                      setTriedNextStep(true);
                      if (isPage1Valid()) {
                        setAddYouthStep(2);
                      }
                    }}
                    className="bg-primary hover:opacity-95 text-on-primary font-headline font-black text-xs py-3 px-6 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    Next Step
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {addYouthStep === 2 && (
              <div className="space-y-4 animate-scale-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">Youth Age Group (Auto-calculated)</label>
                    <div className="w-full bg-[#131313] rounded-xl py-2.5 px-3.5 text-xs text-secondary font-bold border border-outline-variant/10 select-none">
                      {getYouthAgeGroup(newYouth.age)}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">Youth Classification</label>
                    <select 
                      required
                      value={newYouth.youthClassification}
                      onChange={(e) => setNewYouth({...newYouth, youthClassification: e.target.value})}
                      className={getInputClass(newYouth.youthClassification === '', true)}
                    >
                      <option value="" disabled hidden className="bg-[#1c1b1b] text-[#e5e2e1]">-- Select Classification --</option>
                      <option value="In School Youth (Nag skwela)" className="bg-[#1c1b1b] text-[#e5e2e1]">In School Youth (Nag skwela)</option>
                      <option value="Out of School Youth (Wala nag Skwela)" className="bg-[#1c1b1b] text-[#e5e2e1]">Out of School Youth (Wala nag Skwela)</option>
                      <option value="Working Youth" className="bg-[#1c1b1b] text-[#e5e2e1]">Working Youth</option>
                      <option value="Youth w/ specific needs: PWD" className="bg-[#1c1b1b] text-[#e5e2e1]">Youth w/ specific needs: PWD</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">Are you a registered voter?</label>
                    <select 
                      required
                      value={newYouth.registeredVoter}
                      onChange={(e) => setNewYouth({...newYouth, registeredVoter: e.target.value})}
                      className={getInputClass(newYouth.registeredVoter === '', true)}
                    >
                      <option value="" disabled hidden className="bg-[#1c1b1b] text-[#e5e2e1]">-- Select Voter Status --</option>
                      <option value="Yes" className="bg-[#1c1b1b] text-[#e5e2e1]">Yes</option>
                      <option value="No" className="bg-[#1c1b1b] text-[#e5e2e1]">No</option>
                    </select>
                  </div>

                  {newYouth.registeredVoter === 'Yes' && (
                    <div className="space-y-1.5 animate-scale-in">
                      <label className="text-xs font-bold text-on-surface-variant">Precinct Number</label>
                      <input 
                        type="text"
                        required
                        value={newYouth.precinctNumber}
                        onChange={(e) => setNewYouth({...newYouth, precinctNumber: e.target.value})}
                        className={getInputClass(newYouth.registeredVoter === 'Yes' && newYouth.precinctNumber.trim() === '', true)}
                        placeholder="e.g. 04A"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">Have you participated on the Last KK Election?</label>
                    <select 
                      required
                      value={newYouth.participatedLastKKElection}
                      onChange={(e) => setNewYouth({...newYouth, participatedLastKKElection: e.target.value})}
                      className={getInputClass(newYouth.participatedLastKKElection === '', true)}
                    >
                      <option value="" disabled hidden className="bg-[#1c1b1b] text-[#e5e2e1]">-- Select Answer --</option>
                      <option value="Yes" className="bg-[#1c1b1b] text-[#e5e2e1]">Yes</option>
                      <option value="No" className="bg-[#1c1b1b] text-[#e5e2e1]">No</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">Have you attended KK Assembly?</label>
                    <select 
                      required
                      value={newYouth.attendedKKAssembly}
                      onChange={(e) => setNewYouth({...newYouth, attendedKKAssembly: e.target.value})}
                      className={getInputClass(newYouth.attendedKKAssembly === '', true)}
                    >
                      <option value="" disabled hidden className="bg-[#1c1b1b] text-[#e5e2e1]">-- Select Answer --</option>
                      <option value="Yes" className="bg-[#1c1b1b] text-[#e5e2e1]">Yes</option>
                      <option value="No" className="bg-[#1c1b1b] text-[#e5e2e1]">No</option>
                    </select>
                  </div>

                  {newYouth.attendedKKAssembly === 'Yes' && (
                    <div className="space-y-1.5 animate-scale-in">
                      <label className="text-xs font-bold text-on-surface-variant">If Yes, How many times?</label>
                      <input 
                        type="number" 
                        value={newYouth.kkAssemblyCount}
                        onChange={(e) => setNewYouth({...newYouth, kkAssemblyCount: Number(e.target.value)})}
                        className={getInputClass(newYouth.attendedKKAssembly === 'Yes' && (newYouth.kkAssemblyCount === undefined || newYouth.kkAssemblyCount === null || newYouth.kkAssemblyCount < 0), true)}
                        min="0"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant">Educational Background</label>
                      <select 
                        required
                        value={newYouth.educationBackground}
                        onChange={(e) => setNewYouth({...newYouth, educationBackground: e.target.value})}
                        className={getInputClass(newYouth.educationBackground === '', true)}
                      >
                        <option value="" disabled hidden className="bg-[#1c1b1b] text-[#e5e2e1]">-- Select Education --</option>
                        <option value="Elementary Level" className="bg-[#1c1b1b] text-[#e5e2e1]">Elementary Level</option>
                        <option value="Elementary Graduate" className="bg-[#1c1b1b] text-[#e5e2e1]">Elementary Graduate</option>
                        <option value="High School Level" className="bg-[#1c1b1b] text-[#e5e2e1]">High School Level</option>
                        <option value="High School Graduate" className="bg-[#1c1b1b] text-[#e5e2e1]">High School Graduate</option>
                        <option value="Vocational Graduate" className="bg-[#1c1b1b] text-[#e5e2e1]">Vocational Graduate</option>
                        <option value="College Level" className="bg-[#1c1b1b] text-[#e5e2e1]">College Level</option>
                        <option value="College Graduate" className="bg-[#1c1b1b] text-[#e5e2e1]">College Graduate</option>
                        <option value="Masters Level" className="bg-[#1c1b1b] text-[#e5e2e1]">Masters Level</option>
                        <option value="Masters Graduate" className="bg-[#1c1b1b] text-[#e5e2e1]">Masters Graduate</option>
                        <option value="Doctorate Level" className="bg-[#1c1b1b] text-[#e5e2e1]">Doctorate Level</option>
                        <option value="Doctorate Graduate" className="bg-[#1c1b1b] text-[#e5e2e1]">Doctorate Graduate</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant">Program (if applicable)</label>
                      <input 
                        type="text" 
                        value={newYouth.educationSpecify}
                        onChange={(e) => setNewYouth({...newYouth, educationSpecify: e.target.value})}
                        className="w-full bg-[#181818] border border-outline-variant/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                        placeholder="special program/strand/course/degree/masteral"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant">Work Status</label>
                      <select 
                        required
                        value={newYouth.workStatus}
                        onChange={(e) => setNewYouth({...newYouth, workStatus: e.target.value})}
                        className={getInputClass(newYouth.workStatus === '', true)}
                      >
                        <option value="" disabled hidden className="bg-[#1c1b1b] text-[#e5e2e1]">-- Select Work Status --</option>
                        <option value="Employed" className="bg-[#1c1b1b] text-[#e5e2e1]">Employed</option>
                        <option value="Unemployed" className="bg-[#1c1b1b] text-[#e5e2e1]">Unemployed</option>
                        <option value="Self-employed" className="bg-[#1c1b1b] text-[#e5e2e1]">Self-employed</option>
                        <option value="Currently looking for a job" className="bg-[#1c1b1b] text-[#e5e2e1]">Currently looking for a job</option>
                        <option value="Not interested looking for a job" className="bg-[#1c1b1b] text-[#e5e2e1]">Not interested looking for a job</option>
                      </select>
                    </div>

                    {requiresWorkSpecify(newYouth.workStatus) && (
                      <div className="space-y-1.5 animate-scale-in">
                        <label className="text-xs font-bold text-on-surface-variant">Specify Occupation / Work Details</label>
                        <input 
                          type="text" 
                          required
                          value={newYouth.workSpecify}
                          onChange={(e) => setNewYouth({...newYouth, workSpecify: e.target.value})}
                          className={getInputClass(requiresWorkSpecify(newYouth.workStatus) && newYouth.workSpecify.trim() === '', true)}
                          placeholder="e.g. Call Center Agent, Store Owner, Teacher"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant">Active Scholarship?</label>
                    <select 
                      required
                      value={newYouth.hasScholarship}
                      onChange={(e) => setNewYouth({...newYouth, hasScholarship: e.target.value})}
                      className={getInputClass(newYouth.hasScholarship === '', true)}
                    >
                      <option value="" disabled hidden className="bg-[#1c1b1b] text-[#e5e2e1]">-- Select Answer --</option>
                      <option value="Yes" className="bg-[#1c1b1b] text-[#e5e2e1]">Yes</option>
                      <option value="No" className="bg-[#1c1b1b] text-[#e5e2e1]">No</option>
                    </select>
                  </div>

                  {newYouth.hasScholarship === 'Yes' && (
                    <div className="space-y-1.5 animate-scale-in">
                      <label className="text-xs font-bold text-on-surface-variant">Specify Scholarship</label>
                      <input 
                        type="text" 
                        value={newYouth.scholarshipSpecify}
                        onChange={(e) => setNewYouth({...newYouth, scholarshipSpecify: e.target.value})}
                        className={getInputClass(newYouth.hasScholarship === 'Yes' && newYouth.scholarshipSpecify.trim() === '', true)}
                        placeholder="Specify details or scholarship program"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant">Skills & Hobbies (Press Enter)</label>
                  <input 
                    type="text" 
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={onAddSkill}
                    className="w-full bg-[#181818] border border-outline-variant/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                    placeholder="e.g. Basketball, Web Design, First Aid..."
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {skillSuggestions.map((suggested, index) => (
                      <button 
                        key={index}
                        type="button"
                        onClick={() => onAddSuggestion(suggested)}
                        className="bg-surface-container-low border border-outline-variant/10 text-on-surface-variant hover:text-primary hover:border-primary/30 text-[9px] font-bold px-2 py-0.5 rounded-lg transition-colors select-none"
                      >
                        + {suggested}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2.5">
                    {newYouth.skills.map((skill: string, index: number) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center gap-2 bg-[#b4c5ff]/15 border border-[#b4c5ff]/40 text-[#b4c5ff] text-xs font-black px-3.5 py-1.5 rounded-xl shadow-md transition-all duration-200 hover:scale-105 animate-scale-in select-none"
                      >
                        {skill}
                        <button 
                          type="button"
                          onClick={() => onRemoveSkill(skill)}
                          className="hover:text-red-400 transition-colors ml-1 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-between border-t border-[#353535]/15">
                  <button 
                    type="button"
                    onClick={() => setAddYouthStep(1)}
                    className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-headline font-black text-xs py-3 px-6 rounded-xl flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>

                  <button 
                    type="submit"
                    className="bg-primary hover:opacity-95 text-on-primary font-headline font-black text-xs py-3 px-6 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    Save Resident Profile
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {importTab === 'bulk' && (
        <div className="glass-panel rounded-xl p-6 md:p-8 space-y-6 border border-[#353535]/20">
          <div className="border-b border-[#353535]/10 pb-4">
            <h4 className="font-headline font-black text-lg text-on-surface">
              CSV/Excel Import
            </h4>
            <p className="text-xs text-on-surface-variant mt-1">
              Profile and register multiple youth residents in the database at once.
            </p>
          </div>

          <form onSubmit={onBulkImportSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: Premium File Dropzone */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  Upload CSV/Text File
                </label>
                <input 
                  type="file" 
                  id="bulk-file-input"
                  accept=".csv,.txt"
                  onChange={onFileUpload}
                  className="sr-only"
                />
                <div 
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => document.getElementById('bulk-file-input')?.click()}
                  className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer group transition-all duration-200 text-center h-48 ${
                    isDragging 
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/5' 
                      : 'border-outline-variant/10 hover:border-primary/30 bg-[#131313]/10 hover:bg-[#181818]/20'
                  }`}
                >
                  <Download className={`w-8 h-8 mb-3 transition-all duration-300 ${
                    isDragging ? 'text-primary scale-110' : 'text-on-surface-variant group-hover:text-primary group-hover:scale-105'
                  }`} />
                  <span className="text-xs font-headline font-bold text-on-surface group-hover:text-primary transition-colors">
                    {isDragging ? 'Drop file here' : 'Click or drag file to upload'}
                  </span>
                  <span className="text-[10px] text-on-surface-variant mt-1.5 leading-relaxed max-w-[220px]">
                    Supports .csv and tab-separated formats. Columns are auto-mapped.
                  </span>
                </div>
              </div>

              {/* Right Column: Paste Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  Or Paste Spreadsheet Rows
                </label>
                <textarea 
                  rows={6}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full h-48 bg-[#131313]/10 border border-outline-variant/10 rounded-2xl py-3.5 px-4 text-xs font-mono text-on-surface focus:ring-1 focus:ring-primary focus:bg-[#181818]/20 placeholder:text-on-surface-variant/20 resize-none transition-all duration-200"
                  placeholder={"first name,last name,age,gender,purok\nElena,Rodriguez,22,Female,East\nJuan,Dela Cruz,20,Male,West A"}
                />
              </div>
            </div>

            {bulkImportError && (
              <div className="p-3 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {bulkImportError}
              </div>
            )}

            {parsedProfiles.length > 0 && (
              <div className="space-y-2 animate-scale-in">
                <div className="flex justify-between items-center px-0.5">
                  <label className="text-xs font-bold text-emerald-400">Successfully Parsed Records ({parsedProfiles.length})</label>
                </div>
                <div className="max-h-48 overflow-y-auto border border-outline-variant/10 rounded-xl bg-[#131313]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-surface-container-high border-b border-[#353535]/15 font-mono text-[9px] uppercase tracking-wider text-on-surface-variant">
                        <th className="px-4 py-2.5">Name</th>
                        <th className="px-4 py-2.5">Age/Sex</th>
                        <th className="px-4 py-2.5">Purok</th>
                        <th className="px-4 py-2.5">Voter</th>
                        <th className="px-4 py-2.5">Education</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#353535]/10">
                      {parsedProfiles.map((p, idx) => (
                        <tr key={idx} className="hover:bg-surface-variant/10 text-on-surface-variant">
                          <td className="px-4 py-2 font-bold text-on-surface">{p.firstName} {p.lastName}</td>
                          <td className="px-4 py-2">{p.age} / {p.gender}</td>
                          <td className="px-4 py-2">{p.purok}</td>
                          <td className="px-4 py-2">{p.isRegisteredVoter ? "Yes" : "No"}</td>
                          <td className="px-4 py-2 max-w-[120px] truncate">{p.educationLevel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-[#353535]/10 pt-4">
              <button 
                type="button"
                onClick={onClearBulk}
                className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg font-bold text-xs hover:bg-surface-container-highest transition-all"
              >
                Clear
              </button>
              
              <button 
                type="submit"
                disabled={parsedProfiles.length === 0 || !!bulkImportError}
                className="px-5 py-2.5 bg-primary text-on-primary rounded-lg font-headline font-black text-xs hover:opacity-95 shadow-md active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                Import {parsedProfiles.length} Residents
              </button>
            </div>
          </form>
        </div>
      )}

      {importTab === 'registry' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header and Sync panel */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-surface-container-low p-5 rounded-xl border border-[#353535]/15 gap-4">
            <div>
              <h3 className="font-headline font-black text-xl text-on-surface flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary animate-pulse" />
                Online Youth Registration Portal
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Review, verify, and authorize youth profiles submitted through the public-facing KKSync registry portal.
              </p>
            </div>
            
            <button 
              onClick={onSyncPortalData}
              className="bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/20 text-on-surface text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" /> SYNC PORTAL DATA
            </button>
          </div>

          {/* Sub-tabs and Search */}
          <div className="bg-surface-container-low p-4 rounded-xl border border-[#353535]/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2 bg-[#131313] p-1 rounded-lg w-fit">
              <button 
                onClick={() => setRegistrySubTab('Pending')}
                className={`px-4 py-2 rounded-md font-headline font-bold text-xs tracking-tight transition-all ${
                  registrySubTab === 'Pending' 
                    ? 'bg-primary text-on-primary shadow-md' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Pending Review ({submissions.filter(s => s.status === 'Pending').length})
              </button>
              <button 
                onClick={() => setRegistrySubTab('Approved')}
                className={`px-4 py-2 rounded-md font-headline font-bold text-xs tracking-tight transition-all ${
                  registrySubTab === 'Approved' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-md' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Approved Syncs ({submissions.filter(s => s.status === 'Approved').length})
              </button>
              <button 
                onClick={() => setRegistrySubTab('Rejected')}
                className={`px-4 py-2 rounded-md font-headline font-bold text-xs tracking-tight transition-all ${
                  registrySubTab === 'Rejected' 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/20 shadow-md' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Rejected Archive ({submissions.filter(s => s.status === 'Rejected').length})
              </button>
            </div>

            
          </div>

          {/* Submissions List Table */}
          <div className="bg-surface-container-low rounded-xl border border-[#353535]/15 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-highest/30 border-b border-[#353535]/15">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Candidate Resident</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Purok Area</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Education & Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Date Submitted</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#353535]/10">
                  {submissions.filter(s => s.status === registrySubTab).length > 0 ? (
                    submissions.filter(s => s.status === registrySubTab).map((sub) => (
                      <tr key={sub.id} className="hover:bg-surface-variant/20 transition-colors group">
                        <td className="px-6 py-4.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-headline font-bold text-primary text-xs">
                              {sub.formData.firstName[0]}{sub.formData.lastName[0]}
                            </div>
                            <div>
                              <p className="font-headline font-bold text-sm text-on-surface">
                                {sub.formData.firstName} {sub.formData.lastName}
                              </p>
                              <p className="text-[10px] text-on-surface-variant font-semibold uppercase">
                                {sub.formData.age} Yrs • {sub.formData.gender} • Ref: {sub.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4.5">
                          <span className="text-xs font-semibold text-on-surface-variant">{sub.formData.purok}</span>
                        </td>
                        <td className="px-6 py-4.5">
                          <p className="text-xs font-bold text-on-surface leading-tight">
                            {sub.formData.educationBackground || sub.formData.educationLevel || "N/A"}
                            {sub.formData.educationSpecify ? ` - ${sub.formData.educationSpecify}` : ''}
                          </p>
                          <p className="text-[10px] text-secondary font-semibold uppercase tracking-tight mt-0.5">{sub.formData.educationalStatus}</p>
                        </td>
                        <td className="px-6 py-4.5">
                          <span className="text-xs font-medium text-on-surface-variant font-mono">
                            {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="px-6 py-4.5 text-right">
                          <button 
                            onClick={() => { setSelectedSubmission(sub); setRejectionNotes(sub.reviewerNotes || ''); }}
                            className="text-xs font-bold text-primary hover:underline bg-primary/10 hover:bg-primary/20 px-3.5 py-2 rounded-lg transition-all"
                          >
                            {registrySubTab === 'Pending' ? 'Review Application' : 'View File Logs'}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant text-sm font-semibold">
                        No registry submissions in {registrySubTab} queue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* REVIEW DETAIL SHEET OVERLAY MODAL */}
          {selectedSubmission && (
            <div className="fixed inset-0 bg-surface/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="glass-panel w-full max-w-3xl rounded-xl p-6 md:p-8 space-y-6 border border-[#353535]/20 animate-scale-in max-h-[90vh] overflow-y-auto">
                
                {/* Header */}
                <div className="flex justify-between items-center border-b border-[#353535]/15 pb-4">
                  <div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      selectedSubmission.status === 'Pending' 
                        ? 'bg-primary/15 text-primary border border-primary/20' 
                        : selectedSubmission.status === 'Approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {selectedSubmission.status} Submission File
                    </span>
                    <h3 className="font-headline font-black text-2xl text-on-surface mt-2.5">
                      Resident Verification Request
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Online Reference Token: {selectedSubmission.id} • Submitted on {new Date(selectedSubmission.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedSubmission(null)}
                    className="p-1.5 hover:bg-surface-container-highest rounded-lg transition-colors text-on-surface-variant hover:text-on-surface"
                  >
                    <X className="w-5.5 h-5.5" />
                  </button>
                </div>

                {/* Bento Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Personal File */}
                  <div className="bg-[#181818]/60 p-5 rounded-xl border border-[#353535]/10 space-y-3.5">
                    <div className="flex items-center gap-1.5 text-secondary font-headline font-bold text-xs uppercase tracking-wider mb-2">
                      <Users className="w-4 h-4" />
                      Personal File Details
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase">First Name</p>
                        <p className="font-semibold text-on-surface mt-0.5">{selectedSubmission.formData.firstName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase">Last Name</p>
                        <p className="font-semibold text-on-surface mt-0.5">{selectedSubmission.formData.lastName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase">Middle Name</p>
                        <p className="font-semibold text-on-surface mt-0.5">{selectedSubmission.formData.middleName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase">Purok Sector</p>
                        <p className="font-semibold text-primary mt-0.5">{selectedSubmission.formData.purok}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase">Age / Gender</p>
                        <p className="font-semibold text-on-surface mt-0.5">{selectedSubmission.formData.age} Yrs • {selectedSubmission.formData.gender}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase">Date of Birth</p>
                        <p className="font-semibold text-on-surface mt-0.5">{selectedSubmission.formData.dob}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase">Civil Status</p>
                        <p className="font-semibold text-on-surface mt-0.5">{selectedSubmission.formData.civilStatus}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase">Blood Type</p>
                        <p className="font-semibold text-on-surface mt-0.5">{selectedSubmission.formData.bloodType}</p>
                      </div>
                    </div>
                  </div>

                  {/* Educational Profile & Contact */}
                  <div className="bg-[#181818]/60 p-5 rounded-xl border border-[#353535]/10 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-secondary font-headline font-bold text-xs uppercase tracking-wider mb-2">
                        <Award className="w-4 h-4" />
                        Academic Profile
                      </div>
                      <div>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase">Educational Background</p>
                        <p className="font-semibold text-on-surface text-xs leading-normal mt-0.5">
                          {selectedSubmission.formData.educationBackground || selectedSubmission.formData.educationLevel || "N/A"}
                          {selectedSubmission.formData.educationSpecify ? ` - ${selectedSubmission.formData.educationSpecify}` : ''}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-[10px] text-on-surface-variant font-bold uppercase">Status</p>
                          <p className="font-semibold text-secondary uppercase text-[10px] mt-0.5">{selectedSubmission.formData.educationalStatus}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-on-surface-variant font-bold uppercase">Scholarship</p>
                          <p className="font-semibold text-on-surface text-[10px] mt-0.5">{selectedSubmission.formData.scholarshipStatus}</p>
                        </div>
                        {selectedSubmission.formData.workStatus && (
                          <div className="col-span-2 mt-1">
                            <p className="text-[10px] text-on-surface-variant font-bold uppercase">Work Status</p>
                            <p className="font-semibold text-on-surface text-[10px] mt-0.5">
                              {selectedSubmission.formData.workStatus}
                              {selectedSubmission.formData.workSpecify && ` (${selectedSubmission.formData.workSpecify})`}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-[#353535]/10 pt-3.5 space-y-2">
                      <div className="flex items-center gap-1.5 text-secondary font-headline font-bold text-xs uppercase tracking-wider mb-2">
                        <FileText className="w-4 h-4" />
                        Contact Information
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-[10px] text-on-surface-variant font-bold uppercase">Phone</p>
                          <p className="font-semibold text-primary mt-0.5">{selectedSubmission.formData.contactNumber}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-on-surface-variant font-bold uppercase">Email Address</p>
                          <p className="font-semibold text-on-surface mt-0.5 truncate">{selectedSubmission.formData.email}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-on-surface-variant font-bold uppercase">Facebook Link</p>
                          <p className="font-semibold text-on-surface mt-0.5 truncate">
                            {selectedSubmission.formData.facebookLink ? (
                              <a 
                                href={selectedSubmission.formData.facebookLink.startsWith('http') ? selectedSubmission.formData.facebookLink : `https://${selectedSubmission.formData.facebookLink}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                {selectedSubmission.formData.facebookLink}
                              </a>
                            ) : 'None'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Full Address */}
                  <div className="md:col-span-2 bg-[#181818]/60 p-4 rounded-xl border border-[#353535]/10 text-xs">
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase">Registered Residential Address</p>
                    <p className="font-medium text-on-surface leading-normal mt-1">{selectedSubmission.formData.address}</p>
                  </div>

                  {/* Skills & Competencies */}
                  <div className="md:col-span-2 bg-[#181818]/60 p-4 rounded-xl border border-[#353535]/10">
                    <p className="text-[10px] text-on-surface-variant font-bold uppercase mb-2">Resident Declared Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSubmission.formData.skills.length > 0 ? (
                        selectedSubmission.formData.skills.map((skill, index) => (
                          <span key={index} className="px-2.5 py-1 bg-surface-container-high rounded text-[10px] font-bold border border-outline-variant/10 text-on-surface">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-on-surface-variant font-medium">No skills declared in web registration form.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Review Notes and Decision Panel */}
                <div className="border-t border-[#353535]/15 pt-5 space-y-4">
                  {selectedSubmission.status === 'Pending' ? (
                    <>
                       <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Reviewer Action Feedback / Rejection Reasons</label>
                        <textarea 
                          rows={2.5}
                          value={rejectionNotes}
                          onChange={(e) => setRejectionNotes(e.target.value)}
                          className="w-full bg-[#181818]/60 border border-[#353535]/10 rounded-xl py-3 px-4 text-xs text-on-surface focus:ring-1 focus:ring-primary resize-none placeholder:text-on-surface-variant/30"
                          placeholder="Describe reasons if rejecting (e.g. Invalid Purok assignment, missing voter credentials)..."
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button 
                          onClick={() => setSelectedSubmission(null)}
                          className="px-5 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-xs rounded-lg transition-all"
                        >
                          Close File
                        </button>
                        <button 
                          onClick={() => {
                            onRejectSubmission(selectedSubmission.id, rejectionNotes);
                            setSelectedSubmission(null);
                          }}
                          className="px-5 py-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-bold text-xs rounded-lg transition-all"
                        >
                          Reject & Archive
                        </button>
                        <button 
                          onClick={() => {
                            onApproveSubmission(selectedSubmission);
                            setSelectedSubmission(null);
                          }}
                          className="px-6 py-2.5 bg-primary hover:opacity-90 text-on-primary font-headline font-black text-xs rounded-lg transition-all shadow-lg active:scale-95"
                        >
                          Approve & Sync Profile
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="bg-[#181818]/40 p-4 rounded-xl border border-[#353535]/10 text-xs space-y-2">
                      <p className="font-bold text-on-surface-variant uppercase text-[10px] tracking-wider">Reviewer Audited Remarks</p>
                      <p className="text-on-surface font-medium italic">
                        {selectedSubmission.reviewerNotes || 'No custom notes provided for this file decision.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddYouthView;
