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
  otpCode?: string;
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
