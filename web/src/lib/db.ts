import {
  getSecureCache,
  setSecureCache,
  enqueueMutation,
  initialYouthProfiles,
  initialPrograms,
  initialSubmissions,
  supabase as sharedSupabase,
  isSupabaseConfigured as sharedIsSupabaseConfigured,
  mapDbRowToProfileFields,
  mapProfileToDbRow,
  computeParticipation
} from 'shared';
import type {
  YouthProfile,
  Program,
  AttendanceRecord,
  RegistrationSubmission
} from 'shared';

export type {
  YouthProfile,
  Program,
  AttendanceRecord,
  RegistrationSubmission
};

export const supabase = sharedSupabase;
export const isSupabaseConfigured = sharedIsSupabaseConfigured;

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

    return (profilesRes.data || []).map(p => {
      const { participationRate, attendanceLogs } = computeParticipation(
        p.id, totalProgramsCount, attendanceRecords, programsRes.data || []
      );
      return {
        ...mapDbRowToProfileFields(p),
        participationRate,
        attendanceLogs
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

  const dbProfile = mapProfileToDbRow(profile);

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
    id: crypto.randomUUID(),
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
    status: program.status,
    budget: program.budget || 10000
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
      reviewedBy: s.reviewed_by,
      createdAt: s.created_at,
      updatedAt: s.updated_at
    }));
  }

  return await getLocalData<RegistrationSubmission>('kk_web_submissions', initialSubmissions);
};

export const saveSubmission = async (formData: RegistrationSubmission['formData']): Promise<RegistrationSubmission> => {
  const newSub: RegistrationSubmission = {
    id: crypto.randomUUID(),
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
  let reviewedBy: string | undefined = undefined;

  if (isSupabaseConfigured && supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      reviewedBy = user.id;
    }
  }

  if (!reviewedBy) {
    const savedUser = await getSecureCache<{ id: string } | null>('kk_current_user', null);
    if (savedUser && savedUser.id) {
      reviewedBy = savedUser.id;
    }
  }

  const dbPayload = { 
    status, 
    reviewer_notes: reviewerNotes,
    reviewed_by: reviewedBy
  };

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
      return { ...sub, status, reviewerNotes, reviewedBy, updatedAt: localUpdatedAt };
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
        if (typeof error.message === 'string' && error.message.includes('RATE_LIMITED')) {
          const friendly = error.message.replace(/^.*RATE_LIMITED:\s*/, '');
          throw new Error(`RATE_LIMITED_MARKER:${friendly}`);
        }
      } else if (data) {
        if (data.type === 'synced_profile' && data.profile) {
          const p = data.profile;

          let participationRate = p.participation_rate || 0;
          let attendanceLogs: { programTitle: string; role: string; date: string; status: 'Completed' | 'In Progress' }[] = p.attendance_logs || [];

          try {
            const [programsRes, attendanceRes] = await Promise.all([
              supabase.from('programs').select('id, title, status, start_date'),
              supabase.from('attendance').select('youth_id, program_id, status').eq('youth_id', p.id)
            ]);

            if (!programsRes.error && !attendanceRes.error) {
              const activeOrCompletedPrograms = (programsRes.data || []).filter(pr => pr.status === 'Active' || pr.status === 'Completed');
              const totalProgramsCount = activeOrCompletedPrograms.length;
              const computed = computeParticipation(p.id, totalProgramsCount, attendanceRes.data || [], programsRes.data || []);
              participationRate = computed.participationRate;
              attendanceLogs = computed.attendanceLogs;
            }
          } catch (err) {
            console.error("Error fetching dynamic attendance for verifyResidentAccess:", err);
          }

          return {
            type: 'synced_profile',
            profile: {
              ...mapDbRowToProfileFields(p),
              participationRate,
              attendanceLogs
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
      if (err instanceof Error && err.message.startsWith('RATE_LIMITED_MARKER:')) {
        throw new Error(err.message.replace('RATE_LIMITED_MARKER:', ''));
      }
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


