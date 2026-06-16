import { createClient } from '@supabase/supabase-js';
import { getSecureCache, setSecureCache } from './secureCache';
import { enqueueMutation } from './offlineSync';

// types representing supabase schema
export interface YouthProfile {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  age: number;
  gender: 'Male' | 'Female' | 'LGBTQIA+' | 'Unlabeled';
  dob: string;
  civilStatus: 'Single' | 'Married' | 'Widowed';
  bloodType: string;
  nationality: string;
  contactNumber: string;
  email: string;
  additionalEmail?: string;
  address: string;
  purok: string;
  isRegisteredVoter: boolean;
  precinctNumber?: string;
  educationLevel: string;
  educationalStatus: string;
  scholarshipStatus: string;
  youthClassification?: string;
  workStatus?: string;
  workSpecify?: string;
  educationBackground?: string;
  educationSpecify?: string;
  hasScholarship?: string;
  scholarshipSpecify?: string;
  participatedLastKKElection?: string;
  attendedKKAssembly?: string;
  kkAssemblyCount?: number;
  skills: string[];
  facebookLink?: string;
  avatarUrl: string;
  status: 'Active' | 'Inactive' | 'Archived';
  participationRate: number;
  joinedDate: string;
  attendanceLogs?: { programTitle: string; role: string; date: string; status: 'Completed' | 'In Progress' }[];
  updatedAt?: string;
}

export interface Program {
  id: string;
  title: string;
  description: string;
  category: 'Sports' | 'Education' | 'Environment' | 'Health' | 'General';
  startDate: string;
  endDate: string;
  status: 'Draft' | 'Active' | 'Completed' | 'Cancelled';
  registeredCount: number;
  presentCount: number;
  budget: number;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  programId: string;
  youthId: string;
  timeIn: string;
  status: 'Present' | 'Absent' | 'Excused';
  scanMethod: 'QR' | 'Manual';
}

export interface RegistrationSubmission {
  id: string;
  formData: {
    firstName: string;
    lastName: string;
    middleName?: string;
    age: number;
    gender: 'Male' | 'Female' | 'LGBTQIA+' | 'Unlabeled';
    dob: string;
    civilStatus: 'Single' | 'Married' | 'Widowed';
    bloodType: string;
    nationality: string;
    contactNumber: string;
    email: string;
    address: string;
    purok: string;
    isRegisteredVoter: boolean;
    precinctNumber?: string;
    educationLevel: string;
    educationalStatus: string;
    scholarshipStatus: string;
    skills: string[];
    facebookLink?: string;
    workStatus?: string;
    workSpecify?: string;
    educationSpecify?: string;
    educationBackground?: string;
  };
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewerNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

// initial mock seeds
const initialYouthProfiles: YouthProfile[] = [
  {
    id: "YTH-2024-0892",
    firstName: "Elena",
    lastName: "Rodriguez",
    middleName: "Santos",
    age: 22,
    gender: "Female",
    dob: "2002-05-15",
    civilStatus: "Single",
    bloodType: "O+",
    nationality: "Filipino",
    contactNumber: "+63 917 123 4567",
    email: "e.rodriguez@example.com",
    address: "Block 12, Lot 4, Sapphire St., Brgy. San Antonio, District 2",
    purok: "Purok 4",
    isRegisteredVoter: true,
    precinctNumber: "04A",
    educationLevel: "Bachelor of Science in Information Technology",
    educationalStatus: "College Student (4th Year)",
    scholarshipStatus: "Merit-Based",
    skills: ["Leadership", "Public Speaking", "Web Design", "Python", "Project Management"],
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDKaYhw6zrZPw9QtJes_18VQQRNZ-vakBoPNTJiKvzVt86Y7zR73cYGJbYScZSWdyxp2twAkKpHNItQg06lOziCUFXfTyg2M2xAiTZcUSW_ex53gRXnuv_jbHbg2ahedBxYtQ3T9kTUjj8nELOSSq1lH9472CpH443XUpIYgZELjGDXkMxjSsFD4Qviqh_s4twRiq0kDKyJaREfs1tEULch2tCpkfM5ajAeLE2WggQ3eBeixA6-RLJOtOniog7H0Rhd-r-U-KTFP14",
    status: "Active",
    participationRate: 94,
    joinedDate: "March 12, 2021",
    attendanceLogs: [
      { programTitle: "Digital Literacy Bootcamp 2024", role: "Lead Facilitator / Peer Mentor", date: "Jan - Mar 2024", status: "Completed" },
      { programTitle: "Local Government Internship", role: "Administrative Assistant Trainee", date: "Ongoing", status: "In Progress" },
      { programTitle: "Green City Initiative", role: "Community Volunteer", date: "Nov 2023", status: "Completed" }
    ]
  },
  {
    id: "YTH-2024-0012",
    firstName: "Juan",
    lastName: "Dela Cruz",
    middleName: "Mercado",
    age: 20,
    gender: "Male",
    dob: "2004-08-20",
    civilStatus: "Single",
    bloodType: "A-",
    nationality: "Filipino",
    contactNumber: "+63 918 765 4321",
    email: "juan.delacruz@example.com",
    address: "123 Mabini St., Purok 1-A, Brgy. San Antonio",
    purok: "Purok 1-A",
    isRegisteredVoter: true,
    precinctNumber: "01B",
    educationLevel: "Bachelor of Science in Criminology",
    educationalStatus: "College Student (2nd Year)",
    scholarshipStatus: "None",
    skills: ["First Aid", "Sports Coaching", "Event Organizing"],
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBv4H0cIQS7i8d8ylPsp7ekqouRL3KLQ76tR1hSH1d7UTW9KnK9Ni6iLw523l84g8FbOAoPFVAIQXhPFY_5py7476XcUNnByOb7r4xPdukAasILpvY6-_rHdJtIdxCKIVB2NeoCAqjVaInOdCha7L7T0YtAkviS9MtDiEn8f54ut3O5Nk8_WdDsaRRBCOAnfGG1D5JsAXYYEg73GAwGl4A9YWgq8PBwe9C_7M44ZFr26O_ZZ-TLmkGT7unuuigx-LD2WP4C7b699mA",
    status: "Active",
    participationRate: 88,
    joinedDate: "January 15, 2022",
    attendanceLogs: [
      { programTitle: "Linggo ng Kabataan 2024 - Sports Fest", role: "Basketball Team Captain", date: "May 2024", status: "Completed" },
      { programTitle: "Disaster Preparedness Seminar", role: "Attendee", date: "April 2024", status: "Completed" }
    ]
  },
  {
    id: "YTH-2024-0341",
    firstName: "Maria",
    lastName: "Santos",
    middleName: "Cruz",
    age: 18,
    gender: "Female",
    dob: "2006-11-02",
    civilStatus: "Single",
    bloodType: "B+",
    nationality: "Filipino",
    contactNumber: "+63 920 555 1234",
    email: "maria.santos@example.com",
    address: "Block 5, Lot 8, Emerald St., Purok 3, Brgy. San Antonio",
    purok: "Purok 3",
    isRegisteredVoter: false,
    precinctNumber: "",
    educationLevel: "Senior High School Graduate",
    educationalStatus: "Incoming Freshmen",
    scholarshipStatus: "Financial-Need",
    skills: ["Graphic Design", "Social Media Management", "Content Writing"],
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuChyOvu3leC_dDOUGY31FsXkHDgQfmvUH-az42b2vnwE6iixNNUoe72klFCfGDQiR0uwQ4hn59r2_ojZ-X6SaNClayVUaLB8VXl5Jc2ipN_eAzapxK3EsMadzIBQurGAqL8Y17xvC_iVadws3hR_ehTNkneRDctkbrPOyLEBm4F3PzH1f1MO9aCQd_-rTX3R3J-V4nPp-JDJt4SZ8XuXbJlV76RUFdHsqBnrZSTsS0HsekalQfwLGvJdaNSJvYWFa7F4yGi-ttdW8Y",
    status: "Active",
    participationRate: 91,
    joinedDate: "July 08, 2023",
    attendanceLogs: [
      { programTitle: "SK Scholarship Orientation", role: "Beneficiary", date: "May 2024", status: "Completed" },
      { programTitle: "Digital Literacy Bootcamp 2024", role: "Creative Design Learner", date: "Feb 2024", status: "Completed" }
    ]
  },
  {
    id: "YTH-2024-1102",
    firstName: "Gabriel",
    lastName: "Reyes",
    middleName: "Bautista",
    age: 26,
    gender: "Male",
    dob: "1998-03-30",
    civilStatus: "Married",
    bloodType: "O-",
    nationality: "Filipino",
    contactNumber: "+63 945 999 8888",
    email: "g.reyes@example.com",
    address: "45 Bonifacio St., Purok 2, Brgy. San Antonio",
    purok: "Purok 2",
    isRegisteredVoter: true,
    precinctNumber: "02C",
    educationLevel: "Bachelor of Secondary Education",
    educationalStatus: "Working Professional (Teacher)",
    scholarshipStatus: "None",
    skills: ["Teaching", "Conflict Resolution", "Community Organizing"],
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAqIvDuCXRcluyt4k3BQA1DBuo4lDG50AFjVRZX4QQNS7jU9ntsiVj2XkEsDRbqAuu03EovENd6FiLvtd1Q5JqzOBe3gTSL1jbMw2-1rLVqAhofpuycILJQ6evXzqPEunoth29D8trk22GI_7PqclRvp1rsnJaYreuO508OLTdWj5TV7IP4NwjPDYPFid-jK-gRHXSrHoPF5lXt1bTChXyMQC7qvkjEDBs7XLRYzH4eTXXHff4n8H5gnNhrYfL2OdKG7X4CH8oqswQ",
    status: "Active",
    participationRate: 75,
    joinedDate: "October 10, 2020",
    attendanceLogs: [
      { programTitle: "Youth Leadership Summit", role: "Guest Speaker / Panelist", date: "April 2024", status: "Completed" },
      { programTitle: "Community Clean-up Drive", role: "Purok Leader", date: "March 2024", status: "Completed" }
    ]
  }
];

const initialPrograms: Program[] = [
  { id: "PROG-001", title: "Linggo ng Kabataan 2024 - Sports Fest", description: "Annual sports tournament promoting health, camaraderie, and teamwork among the youth of Barangay San Antonio.", category: "Sports", startDate: "2024-05-20", endDate: "2024-05-27", status: "Active", registeredCount: 124, presentCount: 86, budget: 45000 },
  { id: "PROG-002", title: "Community Clean-up Drive - Purok 4", description: "Ecological clean-up program focusing on plastic pollution reduction and tree planting.", category: "Environment", startDate: "2024-06-05", endDate: "2024-06-05", status: "Draft", registeredCount: 45, presentCount: 0, budget: 8500 },
  { id: "PROG-003", title: "SK Scholarship Orientation", description: "Informative orientation regarding municipal and provincial educational financial assistant programs.", category: "Education", startDate: "2024-05-10", endDate: "2024-05-10", status: "Completed", registeredCount: 80, presentCount: 78, budget: 12000 },
  { id: "PROG-004", title: "Youth Leadership Summit", description: "Capacity building training and governance seminar for Sangguniang Kabataan leaders.", category: "Education", startDate: "2024-04-18", endDate: "2024-04-20", status: "Completed", registeredCount: 50, presentCount: 49, budget: 25000 },
  { id: "PROG-005", title: "Basic First Aid & Disaster Response", description: "Emergency training and disaster management workshop for the local youth community.", category: "Health", startDate: "2024-06-15", endDate: "2024-06-16", status: "Draft", registeredCount: 30, presentCount: 0, budget: 15000 },
  { id: "PROG-006", title: "Tree Planting Initiative", description: "Greening our surroundings and establishing sustainable plant boxes in selected Purok areas.", category: "Environment", startDate: "2024-06-20", endDate: "2024-06-20", status: "Draft", registeredCount: 60, presentCount: 0, budget: 7500 },
  { id: "PROG-007", title: "Web Design and Literacy Seminar", description: "A basic introduction to HTML, CSS, and modern digital literacy tools.", category: "Education", startDate: "2024-06-25", endDate: "2024-06-27", status: "Draft", registeredCount: 25, presentCount: 0, budget: 18000 }
];

const initialSubmissions: RegistrationSubmission[] = [
  {
    id: "SUB-8812",
    formData: {
      firstName: "Dianne",
      lastName: "Flores",
      middleName: "Alvarez",
      age: 19,
      gender: "Female",
      dob: "2007-02-14",
      civilStatus: "Single",
      bloodType: "A+",
      nationality: "Filipino",
      contactNumber: "+63 929 111 2222",
      email: "d.flores@example.com",
      address: "14 Ruby St., Purok 3, Brgy. San Antonio",
      purok: "Purok 3",
      isRegisteredVoter: false,
      educationLevel: "Incoming Freshmen",
      educationalStatus: "Student",
      scholarshipStatus: "None",
      skills: ["Dance", "Photography", "Video Editing"]
    },
    status: "Pending",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString() // 4 hours ago
  },
  {
    id: "SUB-1204",
    formData: {
      firstName: "Nathaniel",
      lastName: "Cruz",
      middleName: "Santos",
      age: 21,
      gender: "Male",
      dob: "2005-09-08",
      civilStatus: "Single",
      bloodType: "O-",
      nationality: "Filipino",
      contactNumber: "+63 947 555 8899",
      email: "nathan.cruz@example.com",
      address: "Block 3, Lot 9, Diamond St., Purok 2, Brgy. San Antonio",
      purok: "Purok 2",
      isRegisteredVoter: true,
      precinctNumber: "02B",
      educationLevel: "Bachelor of Science in Accountancy",
      educationalStatus: "College Student (3rd Year)",
      scholarshipStatus: "Barangay Scholarship",
      skills: ["Mathematics", "Excel", "Tutoring"]
    },
    status: "Pending",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
  }
];

// env credentials config
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// persistence helpers using aes-gcm encryption
const getLocalData = async <T>(key: string, initialData: T[]): Promise<T[]> => {
  const data = await getSecureCache<T[]>(key, []);
  if (!data || data.length === 0) {
    await setSecureCache(key, initialData);
    return initialData;
  }
  return data;
};

const setLocalData = async <T>(key: string, data: T[]): Promise<void> => {
  await setSecureCache(key, data);
};

// data layer methods

export const getProfiles = async (): Promise<YouthProfile[]> => {
  if (isSupabaseConfigured && supabase) {
    const [profilesRes, programsRes, attendanceRes] = await Promise.all([
      supabase.from('youth_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('programs').select('id, title, status, start_date'),
      supabase.from('attendance').select('youth_id, program_id, status')
    ]);
    
    if (profilesRes.error) {
      console.error("Error fetching profiles from Supabase, falling back to encrypted LocalStorage:", profilesRes.error);
      return await getLocalData<YouthProfile>('kk_youth_profiles', initialYouthProfiles);
    }
    
    const activeOrCompletedPrograms = (programsRes.data || []).filter(p => p.status === 'Active' || p.status === 'Completed');
    const totalProgramsCount = activeOrCompletedPrograms.length;
    const attendanceRecords = attendanceRes.data || [];
    
      // convert snake_case to camelCase
    return (profilesRes.data || []).map(p => {
      const youthPresentCount = attendanceRecords.filter(
        a => a.youth_id === p.id && a.status === 'Present'
      ).length;

      const rate = totalProgramsCount > 0 
        ? Math.round((youthPresentCount / totalProgramsCount) * 100) 
        : 0;

      const logs = attendanceRecords
        .filter(a => a.youth_id === p.id)
        .map(a => {
          const prog = (programsRes.data || []).find(pr => pr.id === a.program_id);
          return {
            programTitle: prog ? prog.title : 'Unknown Program',
            role: 'Participant',
            date: prog && prog.start_date ? new Date(prog.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown',
            status: prog && prog.status === 'Completed' ? 'Completed' as const : 'In Progress' as const
          };
        });

      return {
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
        avatarUrl: p.profile_picture_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuChyOvu3leC_dDOUGY31FsXkHDgQfmvUH-az42b2vnwE6iixNNUoe72klFCfGDQiR0uwQ4hn59r2_ojZ-X6SaNClayVUaLB8VXl5Jc2ipN_eAzapxK3EsMadzIBQurGAqL8Y17xvC_iVadws3hR_ehTNkneRDctkbrPOyLEBm4F3PzH1f1MO9aCQd_-rTX3R3J-V4nPp-JDJt4SZ8XuXbJlV76RUFdHsqBnrZSTsS0HsekalQfwLGvJdaNSJvYWFa7F4yGi-ttdW8Y',
        status: p.status,
        participationRate: rate,
        joinedDate: p.joined_date ? new Date(p.joined_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown',
        attendanceLogs: logs,
        updatedAt: p.updated_at
      };
    });
  }

  // offline fallback using secure cache
  return await getLocalData<YouthProfile>('kk_youth_profiles', initialYouthProfiles);
};

export const saveProfile = async (profile: Omit<YouthProfile, 'participationRate' | 'joinedDate'>): Promise<YouthProfile> => {
  const fullProfile: YouthProfile = {
    ...profile,
    participationRate: 100,
    joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    updatedAt: new Date().toISOString()
  };

  const dbProfile = {
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
    profile_picture_url: profile.avatarUrl,
    status: profile.status
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('youth_profiles')
      .insert(dbProfile)
      .select()
      .single();

    if (error) {
      console.error("Error creating profile in Supabase, queuing mutation:", error);
      await enqueueMutation('INSERT', 'youth_profiles', fullProfile.id, dbProfile);
    } else if (data) {
      fullProfile.id = data.id;
      fullProfile.updatedAt = data.updated_at;
    }
  } else {
    await enqueueMutation('INSERT', 'youth_profiles', fullProfile.id, dbProfile);
  }

  const profiles = await getLocalData<YouthProfile>('kk_youth_profiles', initialYouthProfiles);
  profiles.unshift(fullProfile);
  await setLocalData('kk_youth_profiles', profiles);
  return fullProfile;
};

export const getPrograms = async (): Promise<Program[]> => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('programs')
      .select(`
        *,
        attendance (
          status
        )
      `)
      .order('start_date', { ascending: false });

    if (error) {
      console.error("Error fetching programs from Supabase:", error);
      return await getLocalData<Program>('kk_programs', initialPrograms);
    }

    return (data || []).map(p => {
      const attendanceList = (p.attendance || []) as { status: string }[];
      const registered = attendanceList.length;
      const present = attendanceList.filter(a => a.status === 'Present').length;

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
        startDate: new Date(p.start_date).toISOString().split('T')[0],
        endDate: new Date(p.end_date).toISOString().split('T')[0],
        status: p.status,
        registeredCount: registered,
        presentCount: present,
        budget: p.budget || 15000,
        updatedAt: p.updated_at
      };
    });
  }

  return await getLocalData<Program>('kk_programs', initialPrograms);
};


export const saveProgram = async (program: Omit<Program, 'id' | 'registeredCount' | 'presentCount'>): Promise<Program> => {
  const fullProgram: Program = {
    ...program,
    id: `PROG-00${Math.floor(Math.random() * 900) + 100}`,
    registeredCount: 0,
    presentCount: 0,
    budget: program.budget || 10000,
    updatedAt: new Date().toISOString()
  };

  const dbProgram = {
    title: program.title,
    description: program.description,
    category: program.category,
    start_date: new Date(program.startDate).toISOString(),
    end_date: new Date(program.endDate).toISOString(),
    status: program.status
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('programs')
      .insert(dbProgram)
      .select()
      .single();

    if (error) {
      console.error("Error creating program in Supabase, queuing:", error);
      await enqueueMutation('INSERT', 'programs', fullProgram.id, dbProgram);
    } else if (data) {
      fullProgram.id = data.id;
      fullProgram.updatedAt = data.updated_at;
    }
  } else {
    await enqueueMutation('INSERT', 'programs', fullProgram.id, dbProgram);
  }

  const progs = await getLocalData<Program>('kk_programs', initialPrograms);
  progs.unshift(fullProgram);
  await setLocalData('kk_programs', progs);
  return fullProgram;
};

export const getSubmissions = async (): Promise<RegistrationSubmission[]> => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('registration_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching web submissions from Supabase:", error);
      return await getLocalData<RegistrationSubmission>('kk_web_submissions', initialSubmissions);
    }

    return (data || []).map(s => ({
      id: s.id,
      formData: s.form_data,
      status: s.status,
      reviewerNotes: s.reviewer_notes,
      createdAt: s.created_at,
      updatedAt: s.updated_at
    }));
  }

  return await getLocalData<RegistrationSubmission>('kk_web_submissions', initialSubmissions);
};

export const saveSubmission = async (formData: RegistrationSubmission['formData']): Promise<RegistrationSubmission> => {
  const newSub: RegistrationSubmission = {
    id: `SUB-${Math.floor(Math.random() * 9000) + 1000}`,
    formData,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const dbSubmission = {
    form_data: formData,
    status: 'Pending'
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('registration_submissions')
      .insert(dbSubmission)
      .select()
      .single();

    if (error) {
      console.error("Error saving submission to Supabase, queuing:", error);
      await enqueueMutation('INSERT', 'registration_submissions', newSub.id, dbSubmission);
    } else if (data) {
      newSub.id = data.id;
      newSub.createdAt = data.created_at;
      newSub.updatedAt = data.updated_at;
    }
  } else {
    await enqueueMutation('INSERT', 'registration_submissions', newSub.id, dbSubmission);
  }

  const subs = await getLocalData<RegistrationSubmission>('kk_web_submissions', initialSubmissions);
  subs.unshift(newSub);
  await setLocalData('kk_web_submissions', subs);
  return newSub;
};

export const updateSubmissionStatus = async (
  id: string, 
  status: 'Approved' | 'Rejected', 
  reviewerNotes?: string
): Promise<boolean> => {
  const localUpdatedAt = new Date().toISOString();
  const dbPayload = { status, reviewer_notes: reviewerNotes };

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('registration_submissions')
      .update(dbPayload)
      .eq('id', id);

    if (error) {
      console.error("Error updating web submission on Supabase, queuing:", error);
      await enqueueMutation('UPDATE', 'registration_submissions', id, dbPayload);
    }
  } else {
    await enqueueMutation('UPDATE', 'registration_submissions', id, dbPayload);
  }

  const subs = await getLocalData<RegistrationSubmission>('kk_web_submissions', initialSubmissions);
  const updated = subs.map(sub => {
    if (sub.id === id) {
      return { ...sub, status, reviewerNotes, updatedAt: localUpdatedAt };
    }
    return sub;
  });
  await setLocalData('kk_web_submissions', updated);
  return true;
};

export const updateProfileContacts = async (
  id: string, 
  email: string, 
  dob: string,
  contactNumber: string, 
  additionalEmail: string
): Promise<boolean> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const formatDobToPasscode = (dobStr: string): string => {
        if (!dobStr) return '';
        const parts = dobStr.split('-');
        if (parts.length === 3) {
          return `${parts[1]}${parts[2]}${parts[0]}`;
        }
        return dobStr.replace(/\D/g, '');
      };

      const passcode = formatDobToPasscode(dob);

      const { data, error } = await supabase.rpc('update_resident_contacts', {
        p_id: id,
        p_email: email,
        p_passcode: passcode,
        p_new_phone: contactNumber,
        p_new_email: additionalEmail
      });

      if (error) {
        console.error("Error updating contacts in Supabase via RPC:", error);
        return false;
      }
      return data === true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  const profiles = await getLocalData<YouthProfile>('kk_youth_profiles', initialYouthProfiles);
  const updated = profiles.map(p => {
    if (p.id === id) {
      return { ...p, contactNumber, additionalEmail };
    }
    return p;
  });
  await setLocalData('kk_youth_profiles', updated);
  return true;
};

export interface ResidentAccessResult {
  type: 'synced_profile' | 'pending_submission';
  profile?: YouthProfile;
  submission?: RegistrationSubmission;
}

export const verifyResidentAccess = async (email: string, passcode: string): Promise<ResidentAccessResult | null> => {
  const emailQuery = email.trim().toLowerCase();
  const enteredPasscode = passcode.trim().replace(/\D/g, ''); // Remove non-numeric

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('verify_resident_access', {
        p_email: emailQuery,
        p_passcode: enteredPasscode
      });

      if (error) {
        console.error("Error executing verify_resident_access RPC on Supabase:", error);
      } else if (data) {
        if (data.type === 'synced_profile' && data.profile) {
          const p = data.profile;
          
          let rate = 0;
          let logs: { programTitle: string; role: string; date: string; status: 'Completed' | 'In Progress' }[] = [];

          try {
            const [programsRes, attendanceRes] = await Promise.all([
              supabase.from('programs').select('id, title, status, start_date'),
              supabase.from('attendance').select('program_id, status').eq('youth_id', p.id)
            ]);

            if (!programsRes.error && !attendanceRes.error) {
              const activeOrCompletedPrograms = (programsRes.data || []).filter(pr => pr.status === 'Active' || pr.status === 'Completed');
              const totalProgramsCount = activeOrCompletedPrograms.length;
              const youthPresentCount = (attendanceRes.data || []).filter(a => a.status === 'Present').length;
              
              rate = totalProgramsCount > 0 
                ? Math.round((youthPresentCount / totalProgramsCount) * 100) 
                : 0;

              logs = (attendanceRes.data || []).map(a => {
                const prog = (programsRes.data || []).find(pr => pr.id === a.program_id);
                return {
                  programTitle: prog ? prog.title : 'Unknown Program',
                  role: 'Participant',
                  date: prog && prog.start_date ? new Date(prog.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown',
                  status: prog && prog.status === 'Completed' ? 'Completed' as const : 'In Progress' as const
                };
              });
            }
          } catch (err) {
            console.error("Error fetching dynamic attendance for verifyResidentAccess:", err);
          }

          return {
            type: 'synced_profile',
            profile: {
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
              avatarUrl: p.profile_picture_url || '',
              status: p.status,
              participationRate: rate,
              joinedDate: p.joined_date ? new Date(p.joined_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown',
              attendanceLogs: logs
            }
          };
        } else if (data.type === 'pending_submission' && data.submission) {
          const s = data.submission;
          return {
            type: 'pending_submission',
            submission: {
              id: s.id,
              formData: s.form_data,
              status: s.status,
              reviewerNotes: s.reviewer_notes,
              createdAt: s.created_at
            }
          };
        }
      }
      return null;
    } catch (err) {
      console.error("verify_resident_access RPC exception:", err);
    }
  }

  // local storage fallback
  const formatDobToPasscode = (dobStr: string): string => {
    if (!dobStr) return '';
    const parts = dobStr.split('-');
    if (parts.length === 3) {
      return `${parts[1]}${parts[2]}${parts[0]}`;
    }
    return dobStr.replace(/\D/g, '');
  };

  const profiles = await getLocalData<YouthProfile>('kk_youth_profiles', initialYouthProfiles);
  const matchedProfile = profiles.find(p => p.email.toLowerCase() === emailQuery);
  if (matchedProfile) {
    const expectedCode = formatDobToPasscode(matchedProfile.dob);
    if (enteredPasscode === expectedCode) {
      return {
        type: 'synced_profile',
        profile: matchedProfile
      };
    }
  }

  const submissions = await getLocalData<RegistrationSubmission>('kk_web_submissions', initialSubmissions);
  const matchedSubmission = submissions.find(s => s.formData.email.toLowerCase() === emailQuery);
  if (matchedSubmission) {
    const expectedCode = formatDobToPasscode(matchedSubmission.formData.dob);
    if (enteredPasscode === expectedCode) {
      return {
        type: 'pending_submission',
        submission: matchedSubmission
      };
    }
  }

  return null;
};

export interface SystemConfig {
  barangayName: string;
  barangayLogo: string;
  skChairperson: string;
  district: string;
  puroks: string[];
}

export const getSystemConfig = async (): Promise<SystemConfig | null> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('barangay_name, barangay_logo, sk_chairperson, district, puroks')
        .eq('id', 1)
        .single();
      if (error) {
        console.error("Error fetching system config:", error);
      } else if (data) {
        return {
          barangayName: data.barangay_name,
          barangayLogo: data.barangay_logo,
          skChairperson: data.sk_chairperson,
          district: data.district || 'District I',
          puroks: data.puroks || [],
        };
      }
    } catch (err) {
      console.error("getSystemConfig exception:", err);
    }
  }
  return null;
};


