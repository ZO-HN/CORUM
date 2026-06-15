import React from 'react';
import {
  Users,
  FileText,
  Calendar,
  Award,
  CheckSquare,
  Edit,
  Printer,
  Archive,
} from 'lucide-react';
import * as db from '../../lib/db';

interface YouthProfileDetailProps {
  youth: db.YouthProfile;
  ageGroups: { id: string; label: string; minAge: number; maxAge: number }[];
  onBack: () => void;
  onArchive: (id: string) => void;
  getYouthAgeGroup: (age: number) => string;
}

const YouthProfileDetail: React.FC<YouthProfileDetailProps> = ({
  youth,
  ageGroups,
  onBack,
  onArchive,
  getYouthAgeGroup,
}) => {
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
                    <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
                      <h2 className="text-3xl font-black font-headline tracking-tighter text-on-surface leading-none">
                        {youth.firstName} {youth.middleName ? youth.middleName + ' ' : ''}{youth.lastName}
                      </h2>
                      <span className="text-on-surface-variant font-medium text-sm mb-0.5">
                        ID: {youth.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-4">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">Age / Gender</p>
                        <p className="font-semibold text-on-surface text-sm">{youth.age} Years • {youth.gender}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">Voter Status</p>
                        <p className="font-semibold text-on-surface text-sm">
                          {youth.isRegisteredVoter ? `Registered (Precinct ${youth.precinctNumber})` : 'Non-Voter'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">Joined Date</p>
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
                    <button className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-bold py-3 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all text-xs">
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
                      <span className="text-on-surface-variant text-sm">Civil Status</span>
                      <span className="font-semibold">{youth.civilStatus}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
                      <span className="text-on-surface-variant text-sm">Date of Birth</span>
                      <span className="font-semibold">{youth.dob}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
                      <span className="text-on-surface-variant text-sm">Blood Type</span>
                      <span className="font-semibold">{youth.bloodType}</span>
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
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-on-surface-variant tracking-wider font-bold">Facebook Profile</span>
                        <p className="font-semibold text-on-surface">
                          <a 
                            href={youth.facebookLink.startsWith('http') ? youth.facebookLink : `https://${youth.facebookLink}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
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
            </div>
  );
};

export default YouthProfileDetail;
