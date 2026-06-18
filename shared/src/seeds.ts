import type { YouthProfile, Program, RegistrationSubmission } from './types';

export const initialYouthProfiles: YouthProfile[] = [
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

export const initialPrograms: Program[] = [
  { id: "PROG-001", title: "Linggo ng Kabataan 2024 - Sports Fest", description: "Annual sports tournament promoting health, camaraderie, and teamwork among the youth of Barangay San Antonio.", category: "Sports", startDate: "2024-05-20", endDate: "2024-05-27", status: "Active", registeredCount: 124, presentCount: 86, budget: 45000 },
  { id: "PROG-002", title: "Community Clean-up Drive - Purok 4", description: "Ecological clean-up program focusing on plastic pollution reduction and tree planting.", category: "Environment", startDate: "2024-06-05", endDate: "2024-06-05", status: "Draft", registeredCount: 45, presentCount: 0, budget: 8500 },
  { id: "PROG-003", title: "SK Scholarship Orientation", description: "Informative orientation regarding municipal and provincial educational financial assistant programs.", category: "Education", startDate: "2024-05-10", endDate: "2024-05-10", status: "Completed", registeredCount: 80, presentCount: 78, budget: 12000 },
  { id: "PROG-004", title: "Youth Leadership Summit", description: "Capacity building training and governance seminar for Sangguniang Kabataan leaders.", category: "Education", startDate: "2024-04-18", endDate: "2024-04-20", status: "Completed", registeredCount: 50, presentCount: 49, budget: 25000 },
  { id: "PROG-005", title: "Basic First Aid & Disaster Response", description: "Emergency training and disaster management workshop for the local youth community.", category: "Health", startDate: "2024-06-15", endDate: "2024-06-16", status: "Draft", registeredCount: 30, presentCount: 0, budget: 15000 },
  { id: "PROG-006", title: "Tree Planting Initiative", description: "Greening our surroundings and establishing sustainable plant boxes in selected Purok areas.", category: "Environment", startDate: "2024-06-20", endDate: "2024-06-20", status: "Draft", registeredCount: 60, presentCount: 0, budget: 7500 },
  { id: "PROG-007", title: "Web Design and Literacy Seminar", description: "A basic introduction to HTML, CSS, and modern digital literacy tools.", category: "Education", startDate: "2024-06-25", endDate: "2024-06-27", status: "Draft", registeredCount: 25, presentCount: 0, budget: 18000 }
];

export const initialSubmissions: RegistrationSubmission[] = [
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
