// Central mapping between the youth_profiles DB row shape (snake_case) and
// the app-level YouthProfile shape (camelCase). Desktop and web previously
// duplicated this mapping independently across several call sites and had
// already drifted — desktop's read/write paths were missing additional_email,
// web's write path was missing facebook_link — silently dropping whichever
// field a given app didn't know about. This is the single source of truth.

import type { YouthProfile } from './types';

export const DEFAULT_AVATAR_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuChyOvu3leC_dDOUGY31FsXkHDgQfmvUH-az42b2vnwE6iixNNUoe72klFCfGDQiR0uwQ4hn59r2_ojZ-X6SaNClayVUaLB8VXl5Jc2ipN_eAzapxK3EsMadzIBQurGAqL8Y17xvC_iVadws3hR_ehTNkneRDctkbrPOyLEBm4F3PzH1f1MO9aCQd_-rTX3R3J-V4nPp-JDJt4SZ8XuXbJlV76RUFdHsqBnrZSTsS0HsekalQfwLGvJdaNSJvYWFa7F4yGi-ttdW8Y';

export interface AttendanceLogEntry {
  programTitle: string;
  role: string;
  date: string;
  status: 'Completed' | 'In Progress';
}

export type ProfileFields = Omit<YouthProfile, 'participationRate' | 'attendanceLogs'>;

interface MinimalProgram {
  id: string;
  title: string;
  status: string;
  start_date: string;
}

interface MinimalAttendance {
  youth_id: string;
  program_id: string;
  status: string;
}

// db row -> app shape, excluding participationRate/attendanceLogs since those
// depend on which programs/attendance rows the caller already fetched — use
// computeParticipation() below for that part.
export const mapDbRowToProfileFields = (p: any): ProfileFields => ({
  id: p.id,
  firstName: p.first_name,
  lastName: p.last_name,
  middleName: p.middle_name,
  age: p.age,
  gender: p.gender,
  dob: p.date_of_birth,
  civilStatus: p.civil_status,
  bloodType: p.blood_type,
  nationality: p.nationality,
  contactNumber: p.contact_number,
  email: p.email,
  additionalEmail: p.additional_email || '',
  address: p.home_address,
  purok: p.purok,
  isRegisteredVoter: p.is_registered_voter,
  precinctNumber: p.precinct_number,
  educationLevel: p.education_level,
  educationalStatus: p.educational_status,
  scholarshipStatus: p.scholarship_status,
  youthClassification: p.youth_classification || '',
  workStatus: p.work_status || '',
  workSpecify: p.work_specify || '',
  educationBackground: p.education_background || '',
  educationSpecify: p.education_specify || '',
  hasScholarship: p.has_scholarship || '',
  scholarshipSpecify: p.scholarship_specify || '',
  participatedLastKKElection: p.participated_last_kk_election || '',
  attendedKKAssembly: p.attended_kk_assembly || '',
  kkAssemblyCount: p.kk_assembly_count || 0,
  skills: p.skills || [],
  facebookLink: p.facebook_link || '',
  avatarUrl: p.profile_picture_url || DEFAULT_AVATAR_URL,
  status: p.status,
  joinedDate: p.joined_date
    ? new Date(p.joined_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Unknown',
  otpCode: p.otp_code,
  updatedAt: p.updated_at
});

// app shape -> db row for insert/update. Excludes server-managed fields
// (id, participationRate, joinedDate, attendanceLogs, otpCode, updatedAt).
export const mapProfileToDbRow = (profile: Partial<YouthProfile>) => ({
  first_name: profile.firstName,
  last_name: profile.lastName,
  middle_name: profile.middleName,
  age: profile.age,
  gender: profile.gender,
  date_of_birth: profile.dob,
  civil_status: profile.civilStatus,
  blood_type: profile.bloodType,
  nationality: profile.nationality,
  contact_number: profile.contactNumber,
  email: profile.email,
  additional_email: profile.additionalEmail || '',
  home_address: profile.address,
  purok: profile.purok,
  is_registered_voter: profile.isRegisteredVoter,
  precinct_number: profile.precinctNumber,
  education_level: profile.educationLevel,
  educational_status: profile.educationalStatus,
  scholarship_status: profile.scholarshipStatus,
  youth_classification: profile.youthClassification,
  work_status: profile.workStatus,
  work_specify: profile.workSpecify,
  education_background: profile.educationBackground,
  education_specify: profile.educationSpecify,
  has_scholarship: profile.hasScholarship,
  scholarship_specify: profile.scholarshipSpecify,
  participated_last_kk_election: profile.participatedLastKKElection,
  attended_kk_assembly: profile.attendedKKAssembly,
  kk_assembly_count: profile.kkAssemblyCount,
  skills: profile.skills,
  facebook_link: profile.facebookLink || '',
  profile_picture_url: profile.avatarUrl,
  status: profile.status
});

// "Last, First M." display format used across the youth list and detail views.
export const formatYouthName = (profile: Pick<YouthProfile, 'firstName' | 'lastName' | 'middleName'>): string => {
  const middleInitial = profile.middleName ? ` ${profile.middleName.trim().charAt(0).toUpperCase()}.` : '';
  return `${profile.lastName}, ${profile.firstName}${middleInitial}`;
};

// Formats a YYYY-MM-DD date-of-birth string as "Month D, YYYY". Parsed as a
// local date (not UTC) so it doesn't shift a day depending on timezone.
export const formatDob = (dob: string): string => {
  if (!dob) return 'N/A';
  const [year, month, day] = dob.split('-').map(Number);
  if (!year || !month || !day) return dob;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

export const computeParticipation = (
  youthId: string,
  totalProgramsCount: number,
  attendanceRecords: MinimalAttendance[],
  programs: MinimalProgram[]
): { participationRate: number; attendanceLogs: AttendanceLogEntry[] } => {
  const youthPresentCount = attendanceRecords.filter(
    a => a.youth_id === youthId && a.status === 'Present'
  ).length;

  const participationRate = totalProgramsCount > 0
    ? Math.round((youthPresentCount / totalProgramsCount) * 100)
    : 0;

  const attendanceLogs: AttendanceLogEntry[] = attendanceRecords
    .filter(a => a.youth_id === youthId)
    .map(a => {
      const prog = programs.find(pr => pr.id === a.program_id);
      return {
        programTitle: prog ? prog.title : 'Unknown Program',
        role: 'Participant',
        date: prog && prog.start_date
          ? new Date(prog.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : 'Unknown',
        status: (prog && prog.status === 'Completed' ? 'Completed' : 'In Progress') as 'Completed' | 'In Progress'
      };
    });

  return { participationRate, attendanceLogs };
};
