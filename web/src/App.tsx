import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Check, 
  AlertCircle, 
  ChevronRight,
  ShieldCheck,
  User,
  Lock,
  LogOut,
  QrCode,
  Bookmark,
  Sparkles,
  MapPin,
  Fingerprint,
  RefreshCw
} from 'lucide-react';
import * as db from './lib/db';
import { z } from 'zod';
import { useNetworkStatus } from 'shared';
import defaultLogo from './assets/logo.png';

const page1Schema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  middleName: z.string().max(100).optional(),
  age: z.number().int().min(15, "Age must be 15 to 30 years old").max(30, "Age must be 15 to 30 years old"),
  gender: z.string().min(1, "Gender is required"),
  genderSpecify: z.string().optional(),
  dob: z.string().min(1, "Date of birth is required"),
  civilStatus: z.string().min(1, "Civil status is required"),
  contactNumber: z.string().min(7, "Contact number must be at least 7 characters").max(30),
  email: z.string().email("Invalid email address"),
  facebookLink: z.string().min(1, "Facebook profile link is required"),
  address: z.string().min(1, "Address details are required"),
  purok: z.string().min(1, "Purok/Sub-village is required")
}).refine(data => {
  if ((data.gender === 'LGBTQIA+' || data.gender === 'Unlabeled') && (!data.genderSpecify || data.genderSpecify.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Please specify gender identifier",
  path: ["genderSpecify"]
});

const page2Schema = z.object({
  youthClassification: z.string().min(1, "Youth classification is required"),
  registeredVoter: z.string().min(1, "Voter status is required"),
  participatedLastKKElection: z.string().min(1, "Election participation field is required"),
  attendedKKAssembly: z.string().min(1, "KK Assembly attendance is required"),
  kkAssemblyCount: z.number().int().nonnegative().optional(),
  educationBackground: z.string().min(1, "Education background is required"),
  educationSpecify: z.string().optional(),
  workStatus: z.string().min(1, "Work status is required"),
  workSpecify: z.string().optional(),
  hasScholarship: z.string().min(1, "Scholarship status is required"),
  scholarshipSpecify: z.string().optional()
}).refine(data => {
  if (data.attendedKKAssembly === 'Yes' && (data.kkAssemblyCount === undefined || data.kkAssemblyCount === null || data.kkAssemblyCount < 0)) {
    return false;
  }
  return true;
}, {
  message: "Assembly check-in count is required",
  path: ["kkAssemblyCount"]
}).refine(data => {
  if (data.hasScholarship === 'Yes' && (!data.scholarshipSpecify || data.scholarshipSpecify.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Please specify scholarship provider",
  path: ["scholarshipSpecify"]
}).refine(data => {
  if ((data.workStatus === 'Employed' || data.workStatus === 'Self-employed') && (!data.workSpecify || data.workSpecify.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Please specify work occupation",
  path: ["workSpecify"]
});

const getYouthAgeGroup = (age: number): string => {
  if (age >= 15 && age <= 17) return "Child Youth (15-17 yrs old)";
  if (age >= 18 && age <= 24) return "Core Youth (18-24 yrs old)";
  if (age >= 25 && age <= 30) return "Young Adult (25-30 yrs old)";
  return "Out of Range (15-30 only)";
};

export default function App() {
  const { isOnline, isSyncing, pendingCount, syncNow } = useNetworkStatus();

  const [barangayName, setBarangayName] = useState<string>('San Antonio');
  const [barangayLogo, setBarangayLogo] = useState<string>(defaultLogo);
  const [puroks, setPuroks] = useState<string[]>([
    "East", "West A", "West B", "Holy Cross Drive", "Special Block",
    "Belisario", "Ibula", "Puting Lupa", "Ruiz", "Sto. Niño A",
    "Sto. Niño B", "Freedom", "Fatima", "San Vicente", "Green Village", "Gosi Blaza"
  ]);

  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [programs, setPrograms] = useState<db.Program[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Registration Form Steps: 1, 2
  const [formStep, setFormStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<db.RegistrationSubmission | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    age: 18,
    gender: 'Male',
    genderSpecify: '',
    dob: '',
    civilStatus: '',
    nationality: 'Filipino',
    contactNumber: '',
    email: '',
    facebookLink: '',
    address: '',
    purok: '',
    registeredVoter: '',
    participatedLastKKElection: '',
    attendedKKAssembly: '',
    kkAssemblyCount: 0,
    educationBackground: '',
    youthClassification: '',
    workStatus: '',
    hasScholarship: '',
    scholarshipSpecify: '',
    skills: [] as string[],
    recommendations: '',
    workSpecify: '',
    educationSpecify: ''
  });

  const [skillInput, setSkillInput] = useState<string>('');
  
  const skillSuggestions = ["Basketball", "Badminton", "Pickleball", "Volleyball", "Esports", "Coding", "Photography", "Cooking", "Music", "Writing", "First Aid", "Design", "Leadership"];

  const handleAddSuggestion = (suggested: string) => {
    if (!formData.skills.includes(suggested)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, suggested]
      }));
    }
  };
  const [dataPrivacyConsent, setDataPrivacyConsent] = useState<boolean>(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [triedNextStep, setTriedNextStep] = useState<boolean>(false);
  const [triedSubmit, setTriedSubmit] = useState<boolean>(false);
  const [_validationErrors, setValidationErrors] = useState<Record<string, string>>({});


  const requiresWorkSpecify = (status: string) => {
    return status === 'Employed' || status === 'Self-employed';
  };

  const getInputClass = (isInvalid: boolean, isPage2: boolean = false) => {
    const hasError = isPage2 ? (triedSubmit && isInvalid) : (triedNextStep && isInvalid);
    return `w-full bg-surface-container-high rounded-xl py-3 px-4 text-xs text-on-surface focus:ring-1 ${
      hasError ? 'border border-red-500/80 focus:ring-red-500 bg-red-500/5' : 'border-none focus:ring-primary'
    }`;
  };

  const isPage1Valid = () => {
    const res = page1Schema.safeParse(formData);
    if (!res.success) {
      const errs: Record<string, string> = {};
      res.error.issues.forEach(issue => {
        const path = issue.path[0] as string;
        errs[path] = issue.message;
      });
      setValidationErrors(errs);
      return false;
    }
    setValidationErrors({});
    return true;
  };

  const isPage2Valid = () => {
    const res = page2Schema.safeParse(formData);
    if (!res.success) {
      const errs: Record<string, string> = {};
      res.error.issues.forEach(issue => {
        const path = issue.path[0] as string;
        errs[path] = issue.message;
      });
      setValidationErrors(errs);
      return false;
    }
    setValidationErrors({});
    return true;
  };

  // Authentication States
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPasscode, setLoginPasscode] = useState<string>(''); // Expected MMDDYYYY DOB format
  const [loginError, setLoginError] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  
  // Authenticated Session State
  const [sessionUser, setSessionUser] = useState<{
    profile?: db.YouthProfile;
    submission?: db.RegistrationSubmission;
    type: 'synced_profile' | 'pending_submission';
  } | null>(() => {
    const saved = localStorage.getItem('kk_session_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (sessionUser) {
      localStorage.setItem('kk_session_user', JSON.stringify(sessionUser));
    } else {
      localStorage.removeItem('kk_session_user');
    }
  }, [sessionUser]);

  // Update Contacts States
  const [isEditingContacts, setIsEditingContacts] = useState<boolean>(false);
  const [editPhone, setEditPhone] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [isUpdatingContacts, setIsUpdatingContacts] = useState<boolean>(false);
  const [updateContactsSuccess, setUpdateContactsSuccess] = useState<string>('');
  const [updateContactsError, setUpdateContactsError] = useState<string>('');

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [progs, config] = await Promise.all([
          db.getPrograms(),
          db.getSystemConfig()
        ]);
        setPrograms(progs);
        if (config) {
          if (config.barangayName) {
            setBarangayName(config.barangayName);
          }
          if (config.barangayLogo) {
            setBarangayLogo(config.barangayLogo);
          }
          if (config.puroks && config.puroks.length > 0) {
            setPuroks(config.puroks);
          }
        }
      } catch (e) {
        console.error("Error loading initial web data:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (db.isSupabaseConfigured && db.supabase) {
      const channel = db.supabase
        .channel('realtime-web-sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'programs' },
          async () => {
            try {
              const progs = await db.getPrograms();
              setPrograms(progs);
            } catch (e) {
              console.error("Error updating programs in real-time:", e);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'system_config' },
          async () => {
            try {
              const config = await db.getSystemConfig();
              if (config) {
                if (config.barangayName) setBarangayName(config.barangayName);
                if (config.barangayLogo) setBarangayLogo(config.barangayLogo);
                if (config.puroks && config.puroks.length > 0) setPuroks(config.puroks);
              }
            } catch (e) {
              console.error("Error updating config in real-time:", e);
            }
          }
        )
        .subscribe();

      return () => {
        if (db.supabase) {
          db.supabase.removeChannel(channel);
        }
      };
    }
    return () => {};
  }, []);

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!formData.skills.includes(skillInput.trim())) {
        setFormData({
          ...formData,
          skills: [...formData.skills, skillInput.trim()]
        });
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill)
    });
  };

  const handleRegisterSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTriedSubmit(true);
    if (!isPage1Valid() || !isPage2Valid()) return;
    if (!dataPrivacyConsent) return;
    setIsSubmitting(true);
    try {
      const submissionPayload = {
        ...formData,
        // Map fields to what the desktop app / database schema expects:
        isPWD: formData.youthClassification === 'Youth w/ specific needs: PWD',
        bloodType: 'N/A', // Removed from UI
        isRegisteredVoter: formData.registeredVoter === 'Yes',
        precinctNumber: '', // Will be assigned by administrator
        educationLevel: formData.educationSpecify
          ? `${formData.educationBackground} (${formData.educationSpecify})`
          : formData.educationBackground,
        educationalStatus: (formData.youthClassification === 'Working Youth' && formData.workSpecify)
          ? `Working Youth (${formData.workSpecify})`
          : formData.youthClassification,
        scholarshipStatus: formData.hasScholarship === 'Yes' ? (formData.scholarshipSpecify || 'Yes') : 'None',
        // Support legacy variables in database payload just in case:
        isRegisteredSKVoter: formData.registeredVoter === 'Yes' ? 'Yes' : 'No',
        isRegisteredNationalVoter: formData.registeredVoter === 'Yes' ? 'Yes' : 'No',
        votedLastSKElection: formData.participatedLastKKElection
      };

      const submission = await db.saveSubmission(submissionPayload as any);
      setSubmissionSuccess(submission);
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        middleName: '',
        age: 18,
        gender: 'Male',
        genderSpecify: '',
        dob: '',
        civilStatus: '',
        nationality: 'Filipino',
        contactNumber: '',
        email: '',
        facebookLink: '',
        address: '',
        purok: '',
        registeredVoter: '',
        participatedLastKKElection: '',
        attendedKKAssembly: '',
        kkAssemblyCount: 0,
        educationBackground: '',
        youthClassification: '',
        workStatus: '',
        hasScholarship: '',
        scholarshipSpecify: '',
        skills: [],
        recommendations: '',
        workSpecify: '',
        educationSpecify: ''
      });
      setDataPrivacyConsent(false);
      setTriedNextStep(false);
      setTriedSubmit(false);
      setFormStep(1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };



  // Login handler
  const handlePortalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsAuthenticating(true);

    try {
      const emailQuery = loginEmail.trim().toLowerCase();
      const enteredPasscode = loginPasscode.trim().replace(/\D/g, ''); // Remove non-numeric

      if (emailQuery === '123' && enteredPasscode === '123') {
        const placeholderUser = {
          id: "YTH-PLACEHOLDER-123",
          firstName: "Placeholder",
          lastName: "User",
          middleName: "D",
          age: 21,
          gender: "Unlabeled",
          dob: "2005-01-01",
          civilStatus: "Single",
          bloodType: "O+",
          nationality: "Filipino",
          contactNumber: "+63 900 123 4567",
          email: "123",
          address: `123 Main St., Purok East, Barangay ${barangayName}`,
          purok: "East",
          isRegisteredVoter: true,
          precinctNumber: "123-X",
          educationLevel: "Bachelor of Science in Computer Science",
          educationalStatus: "College Graduate",
          scholarshipStatus: "None",
          skills: ["Programming", "Design", "Problem Solving"],
          avatarUrl: "",
          status: "Active",
          participationRate: 100,
          joinedDate: "June 04, 2026",
          attendanceLogs: [
            { programTitle: "SK Profiling Rollout", role: "Beta Tester", date: "June 2026", status: "Completed" }
          ]
        };
        setSessionUser({
          profile: placeholderUser as any,
          type: 'synced_profile'
        });
        setIsAuthenticating(false);
        return;
      }

      // 1. Authenticate resident securely via backend RPC
      const result = await db.verifyResidentAccess(emailQuery, enteredPasscode);

      if (result) {
        if (result.type === 'synced_profile' && result.profile) {
          setSessionUser({
            profile: result.profile,
            type: 'synced_profile'
          });
          setIsAuthenticating(false);
          return;
        } else if (result.type === 'pending_submission' && result.submission) {
          setSessionUser({
            submission: result.submission,
            type: 'pending_submission'
          });
          setIsAuthenticating(false);
          return;
        }
      }

      setLoginError("Incorrect username or password.");
    } catch (err) {
      console.error(err);
      setLoginError("An error occurred during authentication. Please retry.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePortalLogout = () => {
    setSessionUser(null);
    setLoginEmail('');
    setLoginPasscode('');
    setLoginError('');
  };

  const startEditingContacts = () => {
    if (sessionUser && sessionUser.profile) {
      setEditPhone(sessionUser.profile.contactNumber || '');
      setEditEmail(sessionUser.profile.additionalEmail || '');
      setUpdateContactsSuccess('');
      setUpdateContactsError('');
      setIsEditingContacts(true);
    }
  };

  const saveContacts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionUser || !sessionUser.profile) return;
    setIsUpdatingContacts(true);
    setUpdateContactsSuccess('');
    setUpdateContactsError('');
    try {
      const success = await db.updateProfileContacts(
        sessionUser.profile.id,
        sessionUser.profile.email,
        sessionUser.profile.dob,
        editPhone.trim(),
        editEmail.trim()
      );
      if (success) {
        setSessionUser({
          ...sessionUser,
          profile: {
            ...sessionUser.profile,
            contactNumber: editPhone.trim(),
            additionalEmail: editEmail.trim()
          }
        });
        setUpdateContactsSuccess('Contacts updated successfully!');
        setTimeout(() => {
          setIsEditingContacts(false);
          setUpdateContactsSuccess('');
        }, 2000);
      } else {
        setUpdateContactsError('Failed to update contacts. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setUpdateContactsError('An error occurred. Please try again.');
    } finally {
      setIsUpdatingContacts(false);
    }
  };

  // Smooth scroll helper for mobile/desktop layout interactions
  const handleNavClick = (targetTab: 'register' | 'login' | 'home') => {
    if (targetTab === 'home') {
      setIsRegistering(false);
      setDataPrivacyConsent(false);
      setSubmissionSuccess(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (targetTab === 'register') {
      setShowPrivacyModal(true);
    } else {
      setIsRegistering(false);
      setSubmissionSuccess(null);
      // Let the DOM update first then scroll
      setTimeout(() => {
        const element = document.getElementById('profiling-hub');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    }
  };

  return (
    <div className="bg-background text-on-surface font-body min-h-screen selection:bg-secondary selection:text-on-secondary relative flex flex-col justify-between overflow-x-hidden">
      {/* Background Decorative Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-15%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px]"></div>
        <div className="absolute bottom-[-15%] left-[-15%] w-[700px] h-[700px] rounded-full bg-secondary/5 blur-[150px]"></div>
      </div>

      {/* --- DATA PRIVACY POPUP MODAL --- */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-surface-container-low border border-[#353535]/35 rounded-2xl max-w-xl w-full shadow-2xl p-6 md:p-8 space-y-6 relative overflow-hidden glass-panel glow-accent animate-scale-in">
            {/* Ambient background light */}
            <div className="absolute top-[-20%] right-[-10%] w-40 h-40 rounded-full bg-primary/10 blur-3xl"></div>
            
            <div className="flex items-center gap-3 border-b border-[#353535]/15 pb-4">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-headline font-black text-lg md:text-xl text-on-surface tracking-tight">
                  Data Privacy Consent Agreement
                </h3>
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-secondary leading-none mt-1">
                  Republic Act No. 10173 (Data Privacy Act of 2012)
                </p>
              </div>
            </div>

            <div className="text-xs text-on-surface-variant leading-relaxed space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar font-medium">
              <p>
                In compliance with the <strong>Data Privacy Act of 2012 (R.A. 10173)</strong>, the Sangguniang Kabataan (SK) of Barangay {barangayName} is committed to protecting and securing your personal information.
              </p>
              <p>
                By clicking <strong>"Agree & Proceed"</strong>, you explicitly authorize and consent to the collection, storage, processing, and retention of your personal data, which includes:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-[11px]">
                <li>Your full name, date of birth, age, gender identity, and civil status.</li>
                <li>Your home address, contact number, and Gmail address.</li>
                <li>Your educational background, employment status, and youth classification (e.g., In-School, Out-of-School, Working, PWD).</li>
                <li>Your voter registration status and custom skills/hobbies.</li>
              </ul>
              <p>
                <strong>Purpose of Processing:</strong> Your data will be strictly used for official youth profiling under DILG Memorandum Circular No. 2022-033, coordination of SK programs/events, verification of local youth status, and distribution of community assistance.
              </p>
              <p>
                <strong>Security & Confidentiality:</strong> All records will be stored in a secured digital environment accessible only to authorized SK administration officers. Your details will never be shared with outside third-parties without your consent, unless mandated by law.
              </p>
              <p>
                <strong>Your Rights:</strong> You have the right to access your personal profile, request corrections, or ask for the deletion of your records from our system at any time by contacting the SK Office of Barangay {barangayName}.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#353535]/15">
              <button
                type="button"
                onClick={() => {
                  setShowPrivacyModal(false);
                  setDataPrivacyConsent(true);
                  setIsRegistering(true);
                  setSubmissionSuccess(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex-1 bg-primary hover:opacity-95 text-on-primary font-headline font-black text-xs py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 order-2 sm:order-1"
              >
                <Check className="w-4 h-4" />
                Agree & Proceed
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPrivacyModal(false);
                  setDataPrivacyConsent(false);
                  setIsRegistering(false);
                  setSubmissionSuccess(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/10 text-on-surface font-bold text-xs py-3.5 px-6 rounded-xl transition-all order-1 sm:order-2"
              >
                Disagree & Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRMATION SUMMARY POPUP MODAL --- */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-surface-container-low border border-[#353535]/35 rounded-2xl max-w-2xl w-full shadow-2xl p-6 md:p-8 space-y-6 relative overflow-hidden glass-panel glow-accent animate-scale-in">
            {/* Ambient background light */}
            <div className="absolute top-[-20%] right-[-10%] w-40 h-40 rounded-full bg-primary/10 blur-3xl"></div>
            
            <div className="flex items-center gap-3 border-b border-[#353535]/15 pb-4">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary shrink-0">
                <Bookmark className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-headline font-black text-lg md:text-xl text-on-surface tracking-tight">
                  Verify Profile Summary
                </h3>
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-secondary leading-none mt-1">
                  Online Profiling Record Summary
                </p>
              </div>
            </div>

            <div className="text-xs text-on-surface-variant leading-relaxed space-y-5 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar font-medium">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal Profile Details Card */}
                <div className="bg-[#131313] p-4 rounded-xl border border-[#353535]/15 space-y-3">
                  <h4 className="font-headline font-bold text-[10px] uppercase tracking-wider text-secondary border-b border-[#353535]/10 pb-1.5">
                    Personal & Contacts
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[8px] text-on-surface-variant/60 uppercase font-black">Full Name</p>
                      <p className="font-bold text-[#e5e2e1]">{formData.firstName} {formData.middleName ? formData.middleName + ' ' : ''}{formData.lastName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[8px] text-on-surface-variant/60 uppercase font-black">Age & Gender</p>
                        <p className="font-semibold text-on-surface">{formData.age} Yrs • {formData.gender === 'Unlabeled' || formData.gender === 'LGBTQIA+' ? formData.genderSpecify : formData.gender}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-on-surface-variant/60 uppercase font-black">DOB</p>
                        <p className="font-semibold text-on-surface">{formData.dob}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-on-surface-variant/60 uppercase font-black">Purok Area</p>
                        <p className="font-semibold text-primary">{formData.purok}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-on-surface-variant/60 uppercase font-black">Civil Status</p>
                        <p className="font-semibold text-on-surface">{formData.civilStatus}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[8px] text-on-surface-variant/60 uppercase font-black">Gmail Address</p>
                      <p className="font-semibold text-on-surface truncate">{formData.email}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-on-surface-variant/60 uppercase font-black">Phone Number</p>
                      <p className="font-semibold text-on-surface">{formData.contactNumber}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-on-surface-variant/60 uppercase font-black">Complete Address</p>
                      <p className="font-semibold text-on-surface leading-normal text-[11px]">{formData.address}</p>
                    </div>
                  </div>
                </div>

                {/* Academic & Affiliations Card */}
                <div className="bg-[#131313] p-4 rounded-xl border border-[#353535]/15 space-y-3">
                  <h4 className="font-headline font-bold text-[10px] uppercase tracking-wider text-secondary border-b border-[#353535]/10 pb-1.5">
                    Background & Voter Info
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[8px] text-on-surface-variant/60 uppercase font-black">Youth Age Group</p>
                      <p className="font-bold text-on-surface">{getYouthAgeGroup(formData.age)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-on-surface-variant/60 uppercase font-black">Classification</p>
                      <p className="font-semibold text-on-surface">{formData.youthClassification}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[8px] text-on-surface-variant/60 uppercase font-black">Registered Voter</p>
                        <p className="font-semibold text-on-surface">{formData.registeredVoter}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-on-surface-variant/60 uppercase font-black">Voted last KK</p>
                        <p className="font-semibold text-on-surface">{formData.participatedLastKKElection}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[8px] text-on-surface-variant/60 uppercase font-black">Attended KK Assembly</p>
                      <p className="font-semibold text-on-surface">
                        {formData.attendedKKAssembly === 'Yes' ? `Yes (${formData.kkAssemblyCount} times)` : 'No'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] text-on-surface-variant/60 uppercase font-black">Educational Background</p>
                      <p className="font-semibold text-on-surface truncate">
                        {formData.educationBackground}
                        {formData.educationSpecify && ` - ${formData.educationSpecify}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] text-on-surface-variant/60 uppercase font-black">Work Status</p>
                      <p className="font-semibold text-on-surface">
                        {formData.workStatus}
                        {requiresWorkSpecify(formData.workStatus) && ` (${formData.workSpecify})`}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] text-on-surface-variant/60 uppercase font-black">Active Scholarship</p>
                      <p className="font-semibold text-on-surface truncate">
                        {formData.hasScholarship === 'Yes' ? formData.scholarshipSpecify : 'No'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Skills Card */}
                <div className="md:col-span-2 bg-[#131313] p-4 rounded-xl border border-[#353535]/15 space-y-2">
                  <p className="text-[8px] text-on-surface-variant/60 uppercase font-black">Competencies (Skills & Hobbies)</p>
                  <div className="flex flex-wrap gap-1">
                    {formData.skills.length > 0 ? (
                      formData.skills.map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-surface-container-high rounded text-[9px] font-bold border border-outline-variant/10 text-on-surface">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-on-surface-variant italic text-[10px]">No custom skills or hobbies declared.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#353535]/15">
              <button
                type="button"
                onClick={async () => {
                  setShowConfirmModal(false);
                  await handleRegisterSubmit();
                }}
                disabled={isSubmitting}
                className="flex-1 bg-primary hover:opacity-95 text-on-primary font-headline font-black text-xs py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 order-2 sm:order-1 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Proceed Submission'}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/10 text-on-surface font-bold text-xs py-3.5 px-6 rounded-xl transition-all order-1 sm:order-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TOP PORTAL BAR --- */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#131313]/70 backdrop-blur-xl border-b border-[#353535]/15 px-6 md:px-12 h-24 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleNavClick('home')}>
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            {/* Outer CORUM Logo Frame */}
            <img 
              src={defaultLogo} 
              alt="CORUM Logo Frame" 
              className="w-full h-full object-contain z-10"
            />
            {/* Inner Barangay Logo Overlay */}
            {barangayLogo && barangayLogo !== defaultLogo && (
              <img 
                src={barangayLogo} 
                alt="Barangay Logo" 
                className="absolute w-[44%] h-[44%] rounded-full object-cover z-0"
                style={{
                  top: '28%',
                  left: '28%'
                }}
              />
            )}
          </div>
          <div>
            <h1 className="text-xl font-black text-[#e5e2e1] tracking-tighter uppercase font-headline">
              <span className="text-[#b4c5ff]">CORUM</span>
            </h1>
            <p className="text-[9px] uppercase tracking-wider font-extrabold text-secondary leading-none">
              Youth Information System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!isOnline ? (
            <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider select-none animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Working Offline
            </div>
          ) : (isSyncing || pendingCount > 0) ? (
            <button 
              onClick={() => syncNow()}
              className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider select-none"
              title="Click to force sync"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
              Syncing... [{pendingCount} remaining]
            </button>
          ) : null}

          {sessionUser && (
            <div className="flex items-center gap-2.5 bg-surface-container-low/50 px-3.5 py-1.5 rounded-xl border border-[#353535]/15">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-headline font-black text-xs">
                {sessionUser.type === 'synced_profile' 
                  ? `${sessionUser.profile!.firstName[0]}${sessionUser.profile!.lastName[0]}`
                  : `${sessionUser.submission!.formData.firstName[0]}${sessionUser.submission!.formData.lastName[0]}`
                }
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-on-surface leading-tight">
                  {sessionUser.type === 'synced_profile' 
                    ? `${sessionUser.profile!.firstName} ${sessionUser.profile!.lastName}`
                    : `${sessionUser.submission!.formData.firstName} ${sessionUser.submission!.formData.lastName}`
                  }
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[8px] font-black uppercase tracking-wider text-emerald-400">
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {sessionUser && (
            <button 
              onClick={handlePortalLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3.5 py-2 rounded-lg border border-red-500/20 transition-all active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Log Out</span>
            </button>
          )}
        </div>
      </header>
      <div className="h-24 shrink-0"></div>

      {/* --- MAIN PAGE CANVAS --- */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10 md:py-16">
        
        {/* ================= PUBLIC USER PORTAL (LOGGED OUT) ================= */}
        {!sessionUser ? (
          isRegistering ? (
            // ================= STANDALONE REGISTRATION PAGE =================
            <div className="max-w-3xl mx-auto animate-fade-in space-y-8">
              {/* Back to Home Link */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => { setIsRegistering(false); setDataPrivacyConsent(false); setSubmissionSuccess(null); }}
                  className="inline-flex items-center gap-2 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors bg-surface-container-low border border-outline-variant/10 px-4 py-2 rounded-xl"
                >
                  &larr; Back to Home
                </button>
              </div>

              {/* Title Section */}
              <div className="text-center space-y-3 pb-6 border-b border-[#353535]/15">
                <p className="text-[10px] md:text-xs font-mono font-bold text-secondary uppercase tracking-widest">
                  SANGGUNIANG KABATAAN OF BARANGAY {barangayName.toUpperCase()}
                </p>
                <h2 className="text-3xl md:text-4xl font-black font-headline text-on-surface leading-tight tracking-tighter">
                  Online CORUM Profiling
                </h2>
                <p className="text-xs md:text-sm text-on-surface-variant max-w-2xl mx-auto">
                  in compliance to the DILG Memorandum Circular NO. 2022-033
                </p>
              </div>

              {submissionSuccess ? (
                // Success View
                <div className="bg-surface-container-low p-8 rounded-2xl border border-primary/20 shadow-2xl space-y-6 text-center animate-scale-in max-w-xl mx-auto">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                    <Check className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-headline font-black text-2xl text-on-surface">Application Submitted!</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Your application has been submitted successfully. Please wait for updates regarding approval or further verification, as well as your login details, which will be sent to your email address or phone number.
                    </p>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                      onClick={() => {
                        setLoginEmail(submissionSuccess.formData.email);
                        setIsRegistering(false);
                        setSubmissionSuccess(null);
                      }}
                      className="bg-primary hover:opacity-95 text-on-primary font-headline font-black text-xs py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      Go to Portal Login
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setIsRegistering(false);
                        setSubmissionSuccess(null);
                      }}
                      className="bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/10 text-on-surface font-bold text-xs py-3.5 px-6 rounded-xl transition-all"
                    >
                      Back to Home
                    </button>
                  </div>
                </div>
              ) : (
                // Multi-step form (Part 1 and 2)
                <div className="bg-surface-container-low rounded-2xl border border-[#353535]/15 shadow-2xl p-6 md:p-8">
                  {/* Step indicators */}
                  <div className="flex items-center justify-between border-b border-[#353535]/10 pb-4 mb-6">
                    <div>
                      <span className="text-xs font-mono font-bold text-primary uppercase">Part {formStep} of 2</span>
                      <h3 className="font-headline font-bold text-lg text-on-surface mt-1">
                        {formStep === 1 ? 'Personal & Demographic Information' : 'Background, Registration & Affiliation'}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <span className={`w-8 h-2 rounded-full transition-colors ${formStep >= 1 ? 'bg-primary' : 'bg-surface-container-highest'}`}></span>
                      <span className={`w-8 h-2 rounded-full transition-colors ${formStep >= 2 ? 'bg-primary' : 'bg-surface-container-highest'}`}></span>
                    </div>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      setTriedSubmit(true);
                      if (isPage1Valid() && isPage2Valid()) {
                        setShowConfirmModal(true);
                      }
                    }} 
                    className="space-y-6"
                  >
                    {formStep === 1 && (
                      <div className="space-y-4 animate-scale-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">First Name</label>
                            <input 
                              type="text" 
                              required
                              value={formData.firstName}
                              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                              className={getInputClass(formData.firstName.trim() === '')}
                              placeholder="e.g. Dianne"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">Middle Name (Optional)</label>
                            <input 
                              type="text" 
                              value={formData.middleName}
                              onChange={(e) => setFormData({...formData, middleName: e.target.value})}
                              className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                              placeholder="e.g. Santos"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">Last Name</label>
                            <input 
                              type="text" 
                              required
                              value={formData.lastName}
                              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                              className={getInputClass(formData.lastName.trim() === '')}
                              placeholder="e.g. Flores"
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
                              value={formData.age}
                              onChange={(e) => setFormData({...formData, age: Number(e.target.value)})}
                              className={getInputClass(formData.age < 15 || formData.age > 30)}
                              min="15"
                              max="30"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">Date of Birth</label>
                            <input 
                              type="date" 
                              required
                              value={formData.dob}
                              onChange={(e) => setFormData({...formData, dob: e.target.value})}
                              className={getInputClass(formData.dob.trim() === '')}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">Gender</label>
                            <select 
                              value={formData.gender}
                              onChange={(e) => setFormData({...formData, gender: e.target.value})}
                              className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="LGBTQIA+">LGBTQIA+</option>
                              <option value="Unlabeled">Unlabeled (Please specify)</option>
                            </select>
                          </div>
                        </div>

                        {(formData.gender === 'LGBTQIA+' || formData.gender === 'Unlabeled') && (
                          <div className="space-y-1.5 animate-scale-in">
                            <label className="text-xs font-bold text-on-surface-variant">Specify Gender Identity/Expression</label>
                            <input 
                              type="text" 
                              value={formData.genderSpecify}
                              onChange={(e) => setFormData({...formData, genderSpecify: e.target.value})}
                              className={getInputClass((formData.gender === 'LGBTQIA+' || formData.gender === 'Unlabeled') && formData.genderSpecify.trim() === '')}
                              placeholder="Specify preferred identity"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">Civil Status</label>
                            <select 
                              value={formData.civilStatus}
                              onChange={(e) => setFormData({...formData, civilStatus: e.target.value})}
                              className={getInputClass(formData.civilStatus === '')}
                            >
                              <option value="" disabled hidden className="bg-[#1c1b1b] text-on-surface-variant/40">-- Select Civil Status --</option>
                              <option value="Single" className="bg-[#1c1b1b] text-[#e5e2e1]">Single</option>
                              <option value="Married" className="bg-[#1c1b1b] text-[#e5e2e1]">Married</option>
                              <option value="Widowed" className="bg-[#1c1b1b] text-[#e5e2e1]">Widowed</option>
                              <option value="Divorce" className="bg-[#1c1b1b] text-[#e5e2e1]">Divorce</option>
                              <option value="Separated" className="bg-[#1c1b1b] text-[#e5e2e1]">Separated</option>
                              <option value="Annulled" className="bg-[#1c1b1b] text-[#e5e2e1]">Annulled</option>
                              <option value="Unknown" className="bg-[#1c1b1b] text-[#e5e2e1]">Unknown</option>
                              <option value="Live-in" className="bg-[#1c1b1b] text-[#e5e2e1]">Live-in</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">Purok</label>
                            <select 
                              value={formData.purok}
                              onChange={(e) => setFormData({...formData, purok: e.target.value})}
                              className={getInputClass(formData.purok === '')}
                            >
                              <option value="" disabled hidden className="bg-[#1c1b1b] text-on-surface-variant/40">-- Select Purok --</option>
                              {puroks.map(p => (
                                <option key={p} value={p} className="bg-[#1c1b1b] text-[#e5e2e1]">{p}</option>
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
                              value={formData.email}
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
                              className={getInputClass(formData.email.trim() === '' || !formData.email.includes('@'))}
                              placeholder="username@gmail.com"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">Contact Phone Number</label>
                            <input 
                              type="text" 
                              required
                              value={formData.contactNumber}
                              onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                              className={getInputClass(formData.contactNumber.trim() === '')}
                              placeholder="+63 900 000 0000"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">Facebook Profile Link</label>
                            <input 
                              type="text" 
                              required
                              value={formData.facebookLink}
                              onChange={(e) => setFormData({...formData, facebookLink: e.target.value})}
                              className={getInputClass(formData.facebookLink.trim() === '')}
                              placeholder="e.g. facebook.com/username"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-on-surface-variant">Complete Home Address</label>
                          <textarea 
                            rows={2}
                            required
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            className={`w-full bg-surface-container-high rounded-xl py-3 px-4 text-xs text-on-surface focus:ring-1 resize-none ${triedNextStep && formData.address.trim() === '' ? 'border border-red-500/80 focus:ring-red-500' : 'border-none focus:ring-primary'}`}
                            placeholder="House No, Street, Subdivision..."
                          />
                        </div>

                        <div className="pt-4 flex justify-end border-t border-[#353535]/15">
                          <button 
                            type="button"
                            onClick={() => {
                              setTriedNextStep(true);
                              if (isPage1Valid()) {
                                setFormStep(2);
                              }
                            }}
                            className="bg-primary hover:opacity-95 text-on-primary font-headline font-black text-xs py-3.5 px-6 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                          >
                            Next Step
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {formStep === 2 && (
                      <div className="space-y-4 animate-scale-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">Youth Age Group (Auto-calculated)</label>
                            <div className="w-full bg-[#181818] rounded-xl py-3 px-4 text-xs text-secondary font-bold border border-outline-variant/10 select-none">
                              {getYouthAgeGroup(formData.age)}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">Youth Classification</label>
                            <select 
                              required
                              value={formData.youthClassification}
                              onChange={(e) => setFormData({...formData, youthClassification: e.target.value})}
                              className={getInputClass(formData.youthClassification === '', true)}
                            >
                              <option value="" disabled hidden className="bg-[#1c1b1b] text-[#e5e2e1]">-- Select Classification --</option>
                              <option value="In School Youth (Nag skwela)" className="bg-[#1c1b1b] text-[#e5e2e1]">In School Youth (Nag skwela)</option>
                              <option value="Out of School Youth (Wala nag Skwela)" className="bg-[#1c1b1b] text-[#e5e2e1]">Out of School Youth (Wala nag Skwela)</option>
                              <option value="Working Youth" className="bg-[#1c1b1b] text-[#e5e2e1]">Working Youth</option>
                              <option value="Youth w/ specific needs: PWD" className="bg-[#1c1b1b] text-[#e5e2e1]">Youth w/ specific needs: PWD</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">Are you a registered voter?</label>
                            <select 
                              required
                              value={formData.registeredVoter}
                              onChange={(e) => setFormData({...formData, registeredVoter: e.target.value})}
                              className={getInputClass(formData.registeredVoter === '', true)}
                            >
                              <option value="" disabled hidden className="bg-[#1c1b1b] text-[#e5e2e1]">-- Select Voter Status --</option>
                              <option value="Yes" className="bg-[#1c1b1b] text-[#e5e2e1]">Yes</option>
                              <option value="No" className="bg-[#1c1b1b] text-[#e5e2e1]">No</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-on-surface-variant">Have you participated on the Last KK Election?</label>
                            <select 
                              required
                              value={formData.participatedLastKKElection}
                              onChange={(e) => setFormData({...formData, participatedLastKKElection: e.target.value})}
                              className={getInputClass(formData.participatedLastKKElection === '', true)}
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
                              value={formData.attendedKKAssembly}
                              onChange={(e) => setFormData({...formData, attendedKKAssembly: e.target.value})}
                              className={getInputClass(formData.attendedKKAssembly === '', true)}
                            >
                              <option value="" disabled hidden className="bg-[#1c1b1b] text-[#e5e2e1]">-- Select Answer --</option>
                              <option value="Yes" className="bg-[#1c1b1b] text-[#e5e2e1]">Yes</option>
                              <option value="No" className="bg-[#1c1b1b] text-[#e5e2e1]">No</option>
                            </select>
                          </div>

                          {formData.attendedKKAssembly === 'Yes' && (
                            <div className="space-y-1.5 animate-scale-in">
                              <label className="text-xs font-bold text-on-surface-variant">If Yes, How many times?</label>
                              <input 
                                type="number" 
                                value={formData.kkAssemblyCount}
                                onChange={(e) => setFormData({...formData, kkAssemblyCount: Number(e.target.value)})}
                                className={getInputClass(formData.attendedKKAssembly === 'Yes' && (formData.kkAssemblyCount === undefined || formData.kkAssemblyCount === null || formData.kkAssemblyCount < 0), true)}
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
                                value={formData.educationBackground}
                                onChange={(e) => setFormData({...formData, educationBackground: e.target.value})}
                                className={getInputClass(formData.educationBackground === '', true)}
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
                                value={formData.educationSpecify}
                                onChange={(e) => setFormData({...formData, educationSpecify: e.target.value})}
                                className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                                placeholder="special program/strand/course/degree/masteral"
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-on-surface-variant">Work Status</label>
                              <select 
                                required
                                value={formData.workStatus}
                                onChange={(e) => setFormData({...formData, workStatus: e.target.value})}
                                className={getInputClass(formData.workStatus === '', true)}
                              >
                                <option value="" disabled hidden className="bg-[#1c1b1b] text-[#e5e2e1]">-- Select Work Status --</option>
                                <option value="Employed" className="bg-[#1c1b1b] text-[#e5e2e1]">Employed</option>
                                <option value="Unemployed" className="bg-[#1c1b1b] text-[#e5e2e1]">Unemployed</option>
                                <option value="Self-employed" className="bg-[#1c1b1b] text-[#e5e2e1]">Self-employed</option>
                                <option value="Currently looking for a job" className="bg-[#1c1b1b] text-[#e5e2e1]">Currently looking for a job</option>
                                <option value="Not interested looking for a job" className="bg-[#1c1b1b] text-[#e5e2e1]">Not interested looking for a job</option>
                              </select>
                            </div>

                            {requiresWorkSpecify(formData.workStatus) && (
                              <div className="space-y-1.5 animate-scale-in">
                                <label className="text-xs font-bold text-on-surface-variant">Specify Occupation / Work Details</label>
                                <input 
                                  type="text" 
                                  required
                                  value={formData.workSpecify}
                                  onChange={(e) => setFormData({...formData, workSpecify: e.target.value})}
                                  className={getInputClass(requiresWorkSpecify(formData.workStatus) && formData.workSpecify.trim() === '', true)}
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
                              value={formData.hasScholarship}
                              onChange={(e) => setFormData({...formData, hasScholarship: e.target.value})}
                              className={getInputClass(formData.hasScholarship === '', true)}
                            >
                              <option value="" disabled hidden className="bg-[#1c1b1b] text-[#e5e2e1]">-- Select Answer --</option>
                              <option value="Yes" className="bg-[#1c1b1b] text-[#e5e2e1]">Yes</option>
                              <option value="No" className="bg-[#1c1b1b] text-[#e5e2e1]">No</option>
                            </select>
                          </div>

                          {formData.hasScholarship === 'Yes' && (
                            <div className="space-y-1.5 animate-scale-in">
                              <label className="text-xs font-bold text-on-surface-variant">Specify Scholarship</label>
                              <input 
                                type="text" 
                                value={formData.scholarshipSpecify}
                                onChange={(e) => setFormData({...formData, scholarshipSpecify: e.target.value})}
                                className={getInputClass(formData.hasScholarship === 'Yes' && formData.scholarshipSpecify.trim() === '', true)}
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
                            onKeyDown={handleAddSkill}
                            className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                            placeholder="e.g. Basketball, Web Design, First Aid..."
                          />
                          <div className="flex flex-wrap gap-1.5 pt-1.5">
                            {skillSuggestions.map((suggested, index) => (
                              <button 
                                key={index}
                                type="button"
                                onClick={() => handleAddSuggestion(suggested)}
                                className="bg-surface-container-low border border-outline-variant/10 text-on-surface-variant hover:text-primary hover:border-primary/30 text-[9px] font-bold px-2 py-0.5 rounded-lg transition-colors select-none"
                              >
                                + {suggested}
                              </button>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2 pt-2.5">
                            {formData.skills.map((skill, index) => (
                              <span 
                                key={index} 
                                className="inline-flex items-center gap-2 bg-[#b4c5ff]/15 border border-[#b4c5ff]/40 text-[#b4c5ff] text-xs md:text-sm font-black px-3.5 py-1.5 rounded-xl shadow-md transition-all duration-200 hover:scale-105 animate-scale-in select-none"
                              >
                                {skill}
                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveSkill(skill)}
                                  className="text-[#b4c5ff]/60 hover:text-red-400 font-extrabold ml-1 text-sm md:text-base leading-none transition-colors"
                                  title="Remove"
                                >
                                  &times;
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-on-surface-variant">Recommendations & Comments</label>
                          <textarea 
                            rows={3}
                            value={formData.recommendations}
                            onChange={(e) => setFormData({...formData, recommendations: e.target.value})}
                            className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-xs text-on-surface focus:ring-1 focus:ring-primary resize-none"
                            placeholder="Write any recommendations, suggestions, or comments here..."
                          />
                        </div>

                        <div className="flex justify-between pt-4 border-t border-[#353535]/15 mt-6">
                          <button 
                            type="button"
                            onClick={() => setFormStep(1)}
                            className="bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/10 text-on-surface font-bold text-xs py-3.5 px-6 rounded-xl transition-all"
                          >
                            Back
                          </button>
                          
                          <button 
                            type="submit"
                            className="bg-primary hover:opacity-95 text-on-primary font-headline font-black text-xs py-3.5 px-6 rounded-xl transition-all shadow-lg active:scale-95"
                          >
                            Submit Profile Application
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              )}
            </div>
          ) : (
            // ================= PUBLIC LANDING PAGE =================
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start animate-fade-in">
              
              {/* LEFT COLUMN: HERO DESCRIPTION & LIVE EVENTS */}
              <div className="lg:col-span-7 space-y-12">
                <div className="space-y-6">
                  <h2 className="text-4xl md:text-5xl font-black font-headline text-on-surface leading-tight tracking-tighter">
                    Kabataang Magkakaugnay. <br/>
                    <span className="bg-gradient-to-r from-primary to-[#ddb8ff] bg-clip-text text-transparent">Pamayanang Maunlad.</span>
                  </h2>
                  <p className="text-on-surface-variant text-base leading-relaxed max-w-xl">
                    Welcome to CORUM Portal. Register securely online, then log in using your Gmail and passcode to access your digital SK youth ID.
                  </p>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <button 
                      onClick={() => setShowPrivacyModal(true)}
                      className="bg-primary hover:bg-[#a0b3ff] text-on-primary font-headline font-black text-sm py-4 px-6 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-primary/20 transition-all duration-200 active:scale-95 animate-pulse"
                    >
                      KK Profiling Register
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <a 
                      href="https://www.facebook.com/skbsa"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/20 text-[#1877F2] font-headline font-bold text-sm py-4 px-6 rounded-xl transition-all duration-200"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      SKBSA FB Page
                    </a>
                  </div>
                </div>

                <div className="space-y-3 pt-0 mt-6">
                  <div className="border-b border-[#353535]/15 pb-2">
                    <h3 className="font-headline font-black text-2xl text-on-surface">
                      SK Events & Projects
                    </h3>
                  </div>

                  {isLoading ? (
                    <div className="space-y-4">
                      <div className="h-20 bg-surface-container-low rounded-xl animate-pulse"></div>
                      <div className="h-20 bg-surface-container-low rounded-xl animate-pulse"></div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 max-h-[290px] overflow-y-auto pr-2 custom-scrollbar">
                      {programs.filter(p => p.status === 'Active' || p.status === 'Completed' || p.status === 'Draft').slice(0, 6).map((prog) => {
                        // Custom indicators mapping
                        let badgeLabel = '';
                        let badgeClass = '';
                        if (prog.status === 'Draft') {
                          badgeLabel = 'Upcoming Event';
                          badgeClass = 'bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider';
                        } else if (prog.status === 'Active') {
                          badgeLabel = 'Actively Happening';
                          badgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider animate-pulse';
                        } else if (prog.status === 'Completed') {
                          badgeLabel = 'Finished';
                          badgeClass = 'bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider';
                        } else {
                          badgeLabel = prog.status;
                          badgeClass = 'bg-surface-container-highest text-on-surface-variant border border-outline px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider';
                        }

                        // Dynamic date text mapping based on program status
                        let dateDisplay = '';
                        if (prog.status === 'Draft') {
                          dateDisplay = `On - ${prog.startDate}`;
                        } else if (prog.status === 'Active') {
                          dateDisplay = `Started - ${prog.startDate}`;
                        } else if (prog.status === 'Completed') {
                          dateDisplay = `${prog.startDate} - ${prog.endDate}`;
                        } else {
                          dateDisplay = prog.startDate;
                        }

                        return (
                          <div key={prog.id} className="bg-surface-container-low p-5 rounded-xl border border-[#353535]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-primary/20 transition-all duration-200">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider font-mono">
                                  Cat: {prog.category}
                                </span>
                                <span className="text-[10px] text-on-surface-variant/40">•</span>
                                <span className="text-[10px] text-on-surface-variant font-bold">
                                  Date: {dateDisplay}
                                </span>
                              </div>
                              <h4 className="font-headline font-bold text-base text-on-surface">
                                {prog.title}
                              </h4>
                              <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-1 max-w-xl">
                                {prog.description}
                              </p>
                            </div>

                            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-[#353535]/10 pt-3 sm:pt-0">
                              <span className={badgeClass}>
                                {badgeLabel}
                              </span>
                              <a 
                                href="https://www.facebook.com/skbsa"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#1877F2] hover:text-white bg-[#1877F2]/10 hover:bg-[#1877F2] border border-[#1877F2]/20 px-2.5 py-1 rounded-lg transition-all"
                              >
                                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                                View FB Post
                              </a>
                            </div>
                          </div>
                        );
                      })}
                      {programs.filter(p => p.status === 'Active' || p.status === 'Completed' || p.status === 'Draft').length === 0 && (
                        <div className="text-center py-10 bg-surface-container-low rounded-xl border border-[#353535]/15 text-xs text-on-surface-variant">
                          No active or upcoming Barangay programs listed at the moment.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: SK PROFILING HUB (ONLY LOGIN IN SIDEBAR) */}
              <div id="profiling-hub" className="lg:col-span-5 w-full scroll-mt-24">
                <div className="bg-surface-container-low rounded-2xl border border-[#353535]/15 shadow-2xl overflow-hidden glass-panel glow-accent flex flex-col p-8 md:p-10 lg:p-12">
                  {/* Youth Portal Login Form */}
                  <div className="space-y-8">
                    <div className="text-center pb-4 border-b border-[#353535]/10">
                      <h3 className="font-headline font-black text-2xl text-on-surface">Youth Portal Login</h3>
                      <p className="text-xs text-on-surface-variant mt-1.5 font-medium">Enter your username and password</p>
                    </div>

                    <form onSubmit={handlePortalLogin} className="space-y-6 animate-scale-in">
                      {loginError && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                          <AlertCircle className="w-5 h-5 shrink-0" />
                          <p className="font-semibold leading-relaxed">{loginError}</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-on-surface-variant px-0.5">Username</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                            <User className="w-5 h-5" />
                          </div>
                          <input 
                            type="text" 
                            required
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="w-full bg-surface-container-high border-none rounded-xl py-4 pl-12 pr-5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:ring-1 focus:ring-primary"
                            placeholder="username"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-0.5">
                          <label className="text-sm font-bold text-on-surface-variant">Password</label>
                          <a href="#" className="text-xs text-primary hover:underline font-semibold transition-colors">Forgot Password?</a>
                        </div>
                        
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                            <Lock className="w-5 h-5" />
                          </div>
                          <input 
                            type="password" 
                            required
                            value={loginPasscode}
                            onChange={(e) => setLoginPasscode(e.target.value)}
                            className="w-full bg-surface-container-high border-none rounded-xl py-4 pl-12 pr-5 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:ring-1 focus:ring-primary"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>

                      <div className="pt-4">
                        <button 
                          type="submit" 
                          disabled={isAuthenticating}
                          className="w-full bg-primary hover:opacity-95 text-on-primary font-headline font-black text-sm py-4 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {isAuthenticating ? 'Logging in...' : 'Login'}
                        </button>
                      </div>
                    </form>

                    {/* Help & Portal Notes Box */}
                    <div className="mt-8 pt-6 border-t border-[#353535]/15 text-xs text-on-surface-variant leading-relaxed space-y-3">
                      <p className="font-bold text-[#e5e2e1] text-sm uppercase tracking-wide">Verification Status Notice:</p>
                      <p>
                        To access your digital youth ID, your profiling registration must first be reviewed and verified by Barangay SK administrators.
                      </p>
                      <p>
                        The details are sent in your mails registered instead.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )
        ) : (
          // ================= AUTHENTICATED USER PORTAL (DASHBOARD) =================
          <div className="space-y-8 animate-scale-in">

            {/* Submissions Timeline tracker (if not fully approved/synced yet) */}
            {sessionUser.type === 'pending_submission' && sessionUser.submission && (
              <div className="bg-[#1c1b1b] p-6 rounded-xl border border-[#353535]/15 space-y-6">
                <div className="flex justify-between items-center border-b border-[#353535]/10 pb-4">
                  <div>
                    <h4 className="font-headline font-black text-lg text-on-surface">Verification Review Audit</h4>
                    <p className="text-[10px] text-on-surface-variant font-medium mt-0.5 font-mono">Reference Token: {sessionUser.submission.id}</p>
                  </div>
                  
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    sessionUser.submission.status === 'Pending' 
                      ? 'bg-primary/15 text-primary border border-primary/20 animate-pulse' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {sessionUser.submission.status} Application
                  </span>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant">Audit status updates</p>
                  
                  <div className="relative pl-6 space-y-5 border-l border-[#353535]/20 text-xs">
                    <div className="relative">
                      <span className="absolute left-[-29px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-surface flex items-center justify-center text-[8px] text-white">✓</span>
                      <p className="font-bold text-on-surface leading-none">Application Logged</p>
                      <p className="text-[9px] text-on-surface-variant mt-1">Online registration parameters successfully synchronized on central server portal.</p>
                    </div>

                    <div className="relative">
                      {sessionUser.submission.status === 'Pending' ? (
                        <>
                          <span className="absolute left-[-29px] top-0.5 w-4 h-4 rounded-full bg-primary border-2 border-surface flex items-center justify-center text-[10px] animate-pulse">●</span>
                          <p className="font-bold text-primary leading-none">Review Queue Pending</p>
                          <p className="text-[9px] text-on-surface-variant mt-1">SK Council administrators are verifying documentation files in the local desktop application.</p>
                        </>
                      ) : (
                        <>
                          <span className="absolute left-[-29px] top-0.5 w-4 h-4 rounded-full bg-red-500 border-2 border-surface flex items-center justify-center text-[8px] text-white">✕</span>
                          <p className="font-bold text-red-400 leading-none">Archived & Rejected</p>
                          <p className="text-[9px] text-on-surface-variant mt-1">Verification audit failed due to incorrect/missing files. Please see details below.</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {sessionUser.submission.reviewerNotes && (
                  <div className="bg-[#131313] p-4 rounded-xl border border-[#353535]/15 text-xs space-y-2">
                    <p className="text-[9px] font-black uppercase text-on-surface-variant tracking-wider">Auditor remarks</p>
                    <p className="text-on-surface font-medium italic">
                      "{sessionUser.submission.reviewerNotes}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Synced Profile Layout (Digital Card + Bento Details) */}
            {sessionUser.type === 'synced_profile' && sessionUser.profile && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Visual Digital Youth ID Card */}
                <div className="lg:col-span-5 flex flex-col items-center gap-4 w-full">
                  <p className="text-sm md:text-base font-black uppercase tracking-wider text-on-surface-variant self-start pl-1">Youth Digital ID</p>
                  
                  {/* Breathtaking glassmorphic ID card container */}
                  <div className="w-full aspect-[1.58/1] rounded-2xl py-2.5 px-4 bg-gradient-to-br from-[#1e1e1e] via-[#1c1b1b] to-[#131313] border border-[#353535]/25 shadow-2xl relative overflow-hidden group hover:border-primary/30 transition-all duration-300 select-none glass-panel glow-accent flex items-center">
                    {/* Internal card background lights */}
                    <div className="absolute top-[-20%] right-[-10%] w-40 h-40 rounded-full bg-primary/10 blur-3xl group-hover:scale-110 transition-transform"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 rounded-full bg-secondary/5 blur-2xl"></div>

                    {/* Card Details grid */}
                    <div className="grid grid-cols-12 gap-3 w-full items-center">
                      {/* Left Column: Name, Purok, Voter Precinct */}
                      <div className="col-span-7 flex flex-col justify-start space-y-3.5 pr-2">
                        {/* Card branding header */}
                        <div className="border-b border-[#353535]/15 pb-2">
                          <p className="text-xs md:text-sm font-black uppercase tracking-widest text-[#e5e2e1] leading-none">KK Profile</p>
                          <p className="text-[9px] md:text-xs font-bold text-secondary uppercase tracking-wider leading-none mt-1">Sangguniang Kabataan of Barangay {barangayName}</p>
                        </div>

                        <div className="space-y-2.5">
                          <div>
                            <p className="text-[7px] text-on-surface-variant font-bold uppercase tracking-wider">Full Name</p>
                            <p className="font-extrabold text-[#e5e2e1] text-xs md:text-sm truncate mt-0.5">
                              {sessionUser.profile.firstName} {sessionUser.profile.middleName ? `${sessionUser.profile.middleName} ` : ''}{sessionUser.profile.lastName}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-[7px] text-on-surface-variant font-bold uppercase tracking-wider">Purok Area</p>
                            <p className="font-semibold text-primary mt-0.5 text-[9px] md:text-xs">{sessionUser.profile.purok}</p>
                          </div>
                          
                          <div>
                            <p className="text-[7px] text-on-surface-variant font-bold uppercase tracking-wider">Voter Precinct</p>
                            <p className="font-semibold text-on-surface mt-0.5 text-[9px] md:text-xs">
                              {sessionUser.profile.isRegisteredVoter ? (sessionUser.profile.precinctNumber || '---') : '---'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: QR Code, System ID, Issue Date */}
                      <div className="col-span-5 flex flex-col justify-start items-center space-y-2.5 pl-2 self-center">
                        <div className="p-1 border border-white/10 bg-white/5 aspect-square w-full max-w-[135px] flex items-center justify-center">
                          <div className="bg-white p-0.5 w-full h-full">
                             <QrCode className="w-full h-full text-black" />
                          </div>
                        </div>
                        <div className="text-[7px] font-mono text-on-surface-variant/50 space-y-0.5 text-center w-full">
                          <p className="truncate">UID: {sessionUser.profile.id}</p>
                          <p>ISSUED: 2026</p>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Dynamic Contact Details Update Box */}
                  <div className="w-full mt-4 bg-[#1c1b1b]/50 p-5 rounded-xl border border-[#353535]/15 space-y-4 text-left">
                    <div className="flex justify-between items-center pb-2 border-b border-[#353535]/10">
                      <h4 className="text-xs md:text-sm font-black uppercase tracking-widest text-[#e5e2e1]">Contact Information</h4>
                      {!isEditingContacts && (
                        <button 
                          onClick={startEditingContacts}
                          className="text-[9px] font-bold text-primary hover:underline transition-all"
                        >
                          Update Contacts
                        </button>
                      )}
                    </div>

                    {isEditingContacts ? (
                      <form onSubmit={saveContacts} className="space-y-3.5 animate-scale-in">
                        {updateContactsError && (
                          <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded-lg">
                            {updateContactsError}
                          </div>
                        )}
                        {updateContactsSuccess && (
                          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] rounded-lg">
                            {updateContactsSuccess}
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-[8px] text-on-surface-variant font-bold uppercase tracking-wider block">Phone Number</label>
                          <input 
                            type="text" 
                            required
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full bg-[#131313] border border-[#353535]/35 rounded-lg py-2 px-3 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                            placeholder="+63 9xx xxx xxxx"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8px] text-on-surface-variant font-bold uppercase tracking-wider block">Secondary Email</label>
                          <input 
                            type="email" 
                            required
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full bg-[#131313] border border-[#353535]/35 rounded-lg py-2 px-3 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                            placeholder="username@gmail.com"
                          />
                        </div>

                        <div className="flex gap-2 pt-1.5">
                          <button 
                            type="submit" 
                            disabled={isUpdatingContacts}
                            className="flex-1 bg-primary hover:opacity-95 text-on-primary font-bold text-[10px] py-2.5 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                          >
                            {isUpdatingContacts ? 'Saving...' : 'Save Details'}
                          </button>
                          <button 
                            type="button" 
                            disabled={isUpdatingContacts}
                            onClick={() => setIsEditingContacts(false)}
                            className="flex-1 bg-[#2e2d2d] hover:bg-[#3d3c3c] text-on-surface font-bold text-[10px] py-2.5 rounded-lg border border-[#353535]/35 transition-all active:scale-95 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-3 text-xs leading-normal">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">Phone</span>
                          <span className="font-semibold text-primary">{sessionUser.profile.contactNumber}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">Primary Email</span>
                          <span className="font-semibold text-on-surface truncate max-w-[180px]">{sessionUser.profile.email}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">Secondary Email</span>
                          <span className="font-semibold text-on-surface truncate max-w-[180px]">{sessionUser.profile.additionalEmail || '---'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bento Information Details Canvas */}
                <div className="lg:col-span-7 space-y-6">
                  <p className="text-sm md:text-base font-black uppercase tracking-wider text-on-surface-variant pl-1">Audited Profile Details</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Demographic File */}
                    <div className="bg-[#1c1b1b] p-5 rounded-xl border border-[#353535]/15 space-y-3.5">
                      <div className="flex items-center gap-1.5 text-secondary font-headline font-black text-sm md:text-base uppercase tracking-wider mb-1">
                        <User className="w-4.5 h-4.5 text-secondary" />
                        Personal File
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs leading-normal">
                        <div className="col-span-2">
                          <p className="text-[9px] text-on-surface-variant font-bold uppercase">Full Name</p>
                          <p className="font-bold text-on-surface text-sm mt-0.5">
                            {sessionUser.profile.firstName} {sessionUser.profile.middleName ? `${sessionUser.profile.middleName} ` : ''}{sessionUser.profile.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-on-surface-variant font-bold uppercase">First Name</p>
                          <p className="font-semibold text-on-surface mt-0.5">{sessionUser.profile.firstName}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-on-surface-variant font-bold uppercase">Last Name</p>
                          <p className="font-semibold text-on-surface mt-0.5">{sessionUser.profile.lastName}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-on-surface-variant font-bold uppercase">Middle Name</p>
                          <p className="font-semibold text-on-surface mt-0.5">{sessionUser.profile.middleName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-on-surface-variant font-bold uppercase">Age / Gender</p>
                          <p className="font-semibold text-on-surface mt-0.5">{sessionUser.profile.age} Yrs • {sessionUser.profile.gender}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-on-surface-variant font-bold uppercase">Birthdate</p>
                          <p className="font-semibold text-on-surface mt-0.5">{sessionUser.profile.dob}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-on-surface-variant font-bold uppercase">Civil Status</p>
                          <p className="font-semibold text-on-surface mt-0.5">{sessionUser.profile.civilStatus}</p>
                        </div>
                      </div>
                    </div>

                    {/* Academic & Contacts */}
                    <div className="bg-[#1c1b1b] p-5 rounded-xl border border-[#353535]/15 space-y-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-secondary font-headline font-black text-sm md:text-base uppercase tracking-wider mb-2">
                          <Bookmark className="w-4.5 h-4.5 text-secondary" />
                          Education
                        </div>
                        <p className="text-[9px] text-on-surface-variant font-bold uppercase">Educational status</p>
                        <p className="font-bold text-on-surface leading-tight mt-0.5">{sessionUser.profile.educationLevel}</p>
                        <p className="text-[9px] text-secondary font-semibold uppercase tracking-tight mt-0.5">{sessionUser.profile.educationalStatus}</p>
                      </div>

                      <div className="border-t border-[#353535]/10 pt-3 text-xs">
                        <div>
                          <p className="text-[9px] text-on-surface-variant font-bold uppercase">Scholarship</p>
                          <span className="inline-block bg-[#2a2a2a] px-2 py-0.5 rounded text-[8px] font-bold text-on-surface uppercase border border-outline/25 mt-1">
                            {sessionUser.profile.scholarshipStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SK Profiling Status & Voter Registration */}
                    <div className="md:col-span-2 bg-[#1c1b1b] p-5 rounded-xl border border-[#353535]/15 space-y-3.5">
                      <div className="flex items-center gap-1.5 text-secondary font-headline font-black text-sm md:text-base uppercase tracking-wider mb-1">
                        <Fingerprint className="w-4.5 h-4.5 text-secondary" />
                        Profiling
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs leading-normal">
                        <div>
                          <p className="text-[9px] text-on-surface-variant font-bold uppercase">Youth Age Group</p>
                          <p className="font-semibold text-on-surface mt-0.5">{getYouthAgeGroup(sessionUser.profile.age)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-on-surface-variant font-bold uppercase">Youth Classification</p>
                          <p className="font-semibold text-on-surface mt-0.5">{sessionUser.profile.educationalStatus || '---'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-on-surface-variant font-bold uppercase">Work Status</p>
                          <p className="font-semibold text-on-surface mt-0.5">
                            {sessionUser.profile.educationalStatus?.toLowerCase().includes('working') ? 'Employed' : 'Unemployed'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-on-surface-variant font-bold uppercase">Registered Voter?</p>
                          <p className="font-semibold text-on-surface mt-0.5">
                            {sessionUser.profile.isRegisteredVoter 
                              ? `Yes (Precinct: ${sessionUser.profile.precinctNumber || '---'})` 
                              : 'No'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-on-surface-variant font-bold uppercase">KK Position</p>
                          <p className="font-semibold text-on-surface mt-0.5">Member</p>
                        </div>
                      </div>
                    </div>

                    {/* Full Address */}
                    <div className="md:col-span-2 bg-[#1c1b1b] p-5 rounded-xl border border-[#353535]/15 space-y-3">
                      <div className="flex items-center gap-1.5 text-secondary font-headline font-black text-sm md:text-base uppercase tracking-wider">
                        <MapPin className="w-4.5 h-4.5 text-secondary" />
                        Registered Youth Address
                      </div>
                      <p className="font-semibold text-on-surface leading-normal text-xs">{sessionUser.profile.address}</p>
                    </div>

                    {/* Skills Pills */}
                    <div className="md:col-span-2 bg-[#1c1b1b] p-5 rounded-xl border border-[#353535]/15 space-y-3">
                      <div className="flex items-center gap-1.5 text-secondary font-headline font-black text-sm md:text-base uppercase tracking-wider">
                        <Sparkles className="w-4.5 h-4.5 text-secondary" />
                        Youth Competencies
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {sessionUser.profile.skills.length > 0 ? (
                          sessionUser.profile.skills.map((skill, index) => (
                            <span key={index} className="px-2.5 py-1 bg-surface-container-high rounded text-[10px] font-bold border border-outline-variant/10 text-on-surface">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-on-surface-variant font-medium">No custom skills declared in profile.</span>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* --- FOOTER CENTRAL COMPLIANCE --- */}
      <footer className="border-t border-[#353535]/15 py-8 px-6 text-center text-[10px] text-on-surface-variant/40 leading-relaxed uppercase tracking-widest bg-[#131313] z-10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 Sangguniang Kabataan of Barangay {barangayName}. Web portal sync channel.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary transition-colors">Privacy Charter</a>
            <a href="#" className="hover:text-primary transition-colors">Secure Ledger v4.2</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
