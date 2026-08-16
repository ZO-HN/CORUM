import React, { useState } from 'react';
import {
  Users,
  FileText,
  Calendar,
  Award,
  CheckSquare,
  Edit,
  Printer,
  Archive,
  X,
} from 'lucide-react';
import * as db from '../../lib/db';
import { formatYouthName, formatDob } from 'shared';

interface YouthProfileDetailProps {
  youth: db.YouthProfile;
  ageGroups: { id: string; label: string; minAge: number; maxAge: number }[];
  onBack: () => void;
  onArchive: (id: string) => void;
  onSave: (id: string, patch: Partial<db.YouthProfile>) => Promise<boolean>;
  getYouthAgeGroup: (age: number) => string;
}

type EditForm = {
  firstName: string;
  middleName: string;
  lastName: string;
  civilStatus: db.YouthProfile['civilStatus'];
  dob: string;
  nationality: string;
  contactNumber: string;
  email: string;
  facebookLink: string;
  address: string;
  isRegisteredVoter: boolean;
  precinctNumber: string;
  educationBackground: string;
  educationSpecify: string;
  educationalStatus: string;
  scholarshipStatus: string;
};

const formFromYouth = (youth: db.YouthProfile): EditForm => ({
  firstName: youth.firstName,
  middleName: youth.middleName || '',
  lastName: youth.lastName,
  civilStatus: youth.civilStatus,
  dob: youth.dob,
  nationality: youth.nationality,
  contactNumber: youth.contactNumber,
  email: youth.email,
  facebookLink: youth.facebookLink || '',
  address: youth.address,
  isRegisteredVoter: youth.isRegisteredVoter,
  precinctNumber: youth.precinctNumber || '',
  educationBackground: youth.educationBackground || youth.educationLevel || '',
  educationSpecify: youth.educationSpecify || '',
  educationalStatus: youth.educationalStatus,
  scholarshipStatus: youth.scholarshipStatus,
});

const inputClass =
  'w-full bg-surface-container-highest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40';
const labelClass = 'text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1 block';

const EditProfileModal: React.FC<{
  youth: db.YouthProfile;
  onClose: () => void;
  onSave: (id: string, patch: Partial<db.YouthProfile>) => Promise<boolean>;
}> = ({ youth, onClose, onSave }) => {
  const [form, setForm] = useState<EditForm>(() => formFromYouth(youth));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof EditForm>(key: K, value: EditForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const success = await onSave(youth.id, form);
    setSaving(false);
    if (success) {
      onClose();
    } else {
      setError('Failed to save changes. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-surface-container rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-outline-variant/20">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 sticky top-0 bg-surface-container">
            <h3 className="text-lg font-black font-headline text-on-surface">Edit Profile Record</h3>
            <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">Personal Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>First Name</label>
                  <input className={inputClass} value={form.firstName} onChange={(e) => set('firstName', e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Last Name</label>
                  <input className={inputClass} value={form.lastName} onChange={(e) => set('lastName', e.target.value)} required />
                </div>
                <div>
                  <label className={labelClass}>Middle Name</label>
                  <input className={inputClass} value={form.middleName} onChange={(e) => set('middleName', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Civil Status</label>
                  <select className={inputClass} value={form.civilStatus} onChange={(e) => set('civilStatus', e.target.value as EditForm['civilStatus'])}>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Date of Birth</label>
                  <input type="date" className={inputClass} value={form.dob} onChange={(e) => set('dob', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Nationality</label>
                  <input className={inputClass} value={form.nationality} onChange={(e) => set('nationality', e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">Contact Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input className={inputClass} value={form.contactNumber} onChange={(e) => set('contactNumber', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Email Address</label>
                  <input type="email" className={inputClass} value={form.email} onChange={(e) => set('email', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Facebook Profile</label>
                  <input className={inputClass} value={form.facebookLink} onChange={(e) => set('facebookLink', e.target.value)} placeholder="https://facebook.com/..." />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Home Address</label>
                  <textarea className={inputClass} rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Registered Voter</label>
                  <select
                    className={inputClass}
                    value={form.isRegisteredVoter ? 'yes' : 'no'}
                    onChange={(e) => set('isRegisteredVoter', e.target.value === 'yes')}
                  >
                    <option value="no">Non-Voter</option>
                    <option value="yes">Registered</option>
                  </select>
                </div>
                {form.isRegisteredVoter && (
                  <div>
                    <label className={labelClass}>Precinct Number</label>
                    <input className={inputClass} value={form.precinctNumber} onChange={(e) => set('precinctNumber', e.target.value)} />
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">Education & Status</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Educational Background</label>
                  <input className={inputClass} value={form.educationBackground} onChange={(e) => set('educationBackground', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Program / Strand / Course</label>
                  <input className={inputClass} value={form.educationSpecify} onChange={(e) => set('educationSpecify', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <input className={inputClass} value={form.educationalStatus} onChange={(e) => set('educationalStatus', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Scholarship Status</label>
                  <input className={inputClass} value={form.scholarshipStatus} onChange={(e) => set('scholarshipStatus', e.target.value)} />
                </div>
              </div>
            </div>

            {error && <p className="text-xs text-error font-semibold">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant/20 sticky bottom-0 bg-surface-container">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold border border-outline-variant/30 text-on-surface hover:bg-surface-container-highest transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg text-xs font-bold bg-primary text-on-primary hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const YouthProfileDetail: React.FC<YouthProfileDetailProps> = ({
  youth,
  onBack,
  onArchive,
  onSave,
}) => {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
            <div className="space-y-6">
              {/* Back to list */}
              <div className="flex justify-between items-center">
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 text-xs font-bold text-primary hover:underline"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Youth Database
                </button>

                <div className="flex gap-2">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-high py-1 px-3 rounded-lg border border-[#353535]/10">
                    Audit Status: Secure Ledger Verified
                  </span>
                </div>
              </div>

              {/* Header Profile Info Panel */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-panel rounded-xl p-8 flex flex-col md:flex-row gap-8 items-center md:items-start border-l-4 border-secondary">
                  <div className="relative">
                    <div className="w-36 h-36 rounded-2xl overflow-hidden ring-4 ring-secondary/20">
                      <img src={youth.avatarUrl} alt="Resident Profile" className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-secondary text-on-secondary px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase">
                      {youth.status}
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-3xl font-black font-headline tracking-tighter text-on-surface leading-none mb-4">
                      {formatYouthName(youth)}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">ID Number</p>
                        <p className="font-semibold text-on-surface text-sm break-all">{youth.id}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">Signup Date</p>
                        <p className="font-semibold text-on-surface text-sm">{youth.joinedDate}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Panel */}
                <div className="glass-panel rounded-xl p-6 flex flex-col justify-between border border-[#353535]/10">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-6">
                    Record Management
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setIsEditOpen(true)}
                      className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-bold py-3 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all text-xs"
                    >
                      <Edit className="w-4 h-4" /> Edit Profile Record
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 border border-outline-variant/30 text-on-surface font-bold py-3 rounded-lg hover:bg-surface-container-highest transition-colors text-xs">
                      <Printer className="w-4 h-4" /> Print Full Dossier
                    </button>
                  </div>
                  <div className="mt-8">
                    <button
                      onClick={() => onArchive(youth.id)}
                      className="w-full flex items-center justify-center gap-2 text-error/70 hover:text-error font-semibold py-2 rounded-lg transition-colors text-xs"
                    >
                      <Archive className="w-4 h-4" /> Archive Youth Record
                    </button>
                  </div>
                </div>
              </section>

              {/* Bento Grid Info Sections */}
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Personal Info Bento */}
                <div className="bg-surface-container-low rounded-xl p-6 border-l-4 border-secondary/50 border border-[#353535]/15">
                  <div className="flex items-center gap-2 mb-6 text-secondary">
                    <Users className="w-4 h-4" />
                    <h3 className="font-black tracking-tight font-headline">Personal Information</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
                      <span className="text-on-surface-variant text-sm">Age / Gender</span>
                      <span className="font-semibold">{youth.age} Years • {youth.gender}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
                      <span className="text-on-surface-variant text-sm">Voter Status</span>
                      <span className="font-semibold">
                        {youth.isRegisteredVoter ? `Registered (Precinct ${youth.precinctNumber})` : 'Non-Voter'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
                      <span className="text-on-surface-variant text-sm">Civil Status</span>
                      <span className="font-semibold">{youth.civilStatus}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
                      <span className="text-on-surface-variant text-sm">Date of Birth</span>
                      <span className="font-semibold">{formatDob(youth.dob)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2">
                      <span className="text-on-surface-variant text-sm">Nationality</span>
                      <span className="font-semibold">{youth.nationality}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Info Bento */}
                <div className="bg-surface-container-low rounded-xl p-6 border-l-4 border-secondary/50 border border-[#353535]/15">
                  <div className="flex items-center gap-2 mb-6 text-secondary">
                    <FileText className="w-4 h-4" />
                    <h3 className="font-black tracking-tight font-headline">Contact Information</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-on-surface-variant tracking-wider font-bold">Phone Number</span>
                      <p className="font-semibold text-primary">{youth.contactNumber}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-on-surface-variant tracking-wider font-bold">Email Address</span>
                      <p className="font-semibold text-on-surface">{youth.email}</p>
                    </div>
                    {youth.facebookLink && (
                      <div className="space-y-1 min-w-0">
                        <span className="text-[10px] uppercase text-on-surface-variant tracking-wider font-bold">Facebook Profile</span>
                        <p className="font-semibold text-on-surface min-w-0">
                          <a
                            href={youth.facebookLink.startsWith('http') ? youth.facebookLink : `https://${youth.facebookLink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline break-all"
                          >
                            {youth.facebookLink}
                          </a>
                        </p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-on-surface-variant tracking-wider font-bold">Home Address</span>
                      <p className="font-semibold text-on-surface text-xs leading-normal">{youth.address}</p>
                    </div>
                  </div>
                </div>

                {/* Education Bento */}
                <div className="bg-surface-container-low rounded-xl p-6 border-l-4 border-secondary/50 border border-[#353535]/15">
                  <div className="flex items-center gap-2 mb-6 text-secondary">
                    <Award className="w-4 h-4" />
                    <h3 className="font-black tracking-tight font-headline">Education & Status</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-surface-container-highest/30 space-y-3">
                      <div>
                        <p className="text-[9px] uppercase text-secondary tracking-widest font-extrabold">Educational Background</p>
                        <p className="font-black text-sm text-on-surface mt-1">
                          {youth.educationBackground || youth.educationLevel || "N/A"}
                        </p>
                      </div>
                      {youth.educationSpecify && (
                        <div>
                          <p className="text-[9px] uppercase text-secondary tracking-widest font-extrabold">Program / Strand / Course</p>
                          <p className="font-bold text-xs text-on-surface mt-0.5">{youth.educationSpecify}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[9px] uppercase text-secondary tracking-widest font-extrabold">Status</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">{youth.educationalStatus}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-on-surface-variant text-sm">Scholarship Status</span>
                      <span className="bg-surface-bright px-2 py-0.5 rounded text-[9px] font-bold text-on-surface uppercase border border-outline/20">
                        {youth.scholarshipStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Bottom row bento: Participation History & Skills */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Participation History */}
                <div className="lg:col-span-8 bg-surface-container-low rounded-xl p-8 border-t-4 border-tertiary border border-[#353535]/15">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2 text-tertiary">
                      <Calendar className="w-5 h-5" />
                      <h3 className="text-xl font-black tracking-tight font-headline">Program Participation History</h3>
                    </div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                      Total: {(youth.attendanceLogs || []).length} Active Logs
                    </span>
                  </div>

                  <div className="space-y-4">
                    {(youth.attendanceLogs || []).length > 0 ? (
                      (youth.attendanceLogs || []).map((log, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-4 items-center p-3 rounded-xl hover:bg-surface-variant transition-all duration-150 group">
                          <div className="col-span-6">
                            <p className="font-bold text-on-surface group-hover:text-tertiary transition-colors text-sm">
                              {log.programTitle}
                            </p>
                            <p className="text-xs text-on-surface-variant mt-0.5">{log.role}</p>
                          </div>
                          <div className="col-span-3 text-right">
                            <span className="text-xs font-semibold text-on-surface-variant">{log.date}</span>
                          </div>
                          <div className="col-span-3 flex justify-end">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              log.status === 'Completed'
                                ? 'bg-tertiary-container text-tertiary border border-tertiary/20'
                                : 'bg-primary-container text-primary-fixed-dim border border-primary/20'
                            }`}>
                              {log.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-on-surface-variant text-center py-6 font-semibold">
                        No previous program logs registered for this resident.
                      </p>
                    )}
                  </div>
                </div>

                {/* Skills & Statistics Bento */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <div className="bg-surface-container-low rounded-xl p-6 border-l-4 border-secondary border border-[#353535]/15 flex-1">
                    <div className="flex items-center gap-2 mb-4 text-secondary">
                      <Award className="w-4 h-4" />
                      <h3 className="font-black tracking-tight font-headline uppercase text-xs">Skills & Competencies</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {youth.skills.map((skill, i) => (
                        <span key={i} className="px-3 py-1.5 bg-surface-container-highest rounded-lg text-[10px] font-bold border border-outline-variant/20 text-on-surface">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-surface-container-low rounded-xl p-6 border-l-4 border-primary border border-[#353535]/15">
                    <div className="flex items-center gap-2 mb-3 text-primary">
                      <CheckSquare className="w-4 h-4" />
                      <h3 className="font-black tracking-tight font-headline uppercase text-xs">Attendance Metrics</h3>
                    </div>
                    <div className="flex items-end gap-2 mb-2 mt-1">
                      <span className="text-4xl font-black text-on-surface font-headline leading-none">{youth.participationRate}%</span>
                      <span className="text-on-surface-variant text-xs mb-0.5 font-bold uppercase">Participation</span>
                    </div>
                    <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden mt-2">
                      <div style={{ width: `${youth.participationRate}%` }} className="bg-primary h-full"></div>
                    </div>
                    <p className="mt-4 text-[9px] text-on-surface-variant font-bold uppercase tracking-widest">
                      Last scan active: 2 days ago
                    </p>
                  </div>
                </div>
              </section>

              {isEditOpen && (
                <EditProfileModal youth={youth} onClose={() => setIsEditOpen(false)} onSave={onSave} />
              )}
            </div>
  );
};

export default YouthProfileDetail;
