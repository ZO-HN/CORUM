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
      console.error("Error fetching profiles from Supabase, falling back to LocalStorage:", profilesRes.error);
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

  return await getLocalData<YouthProfile>('kk_youth_profiles', initialYouthProfiles);
};

export interface GetProfilesOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  purok?: string[];
  gender?: string[];
  isRegisteredVoter?: boolean;
  civilStatus?: string[];
  workStatus?: string[];
  youthClassification?: string[];
  educationLevel?: string[];
  status?: string[];
  skill?: string[];
  ageMin?: number;
  ageMax?: number;
}

export interface PaginatedProfiles {
  profiles: YouthProfile[];
  totalCount: number;
}

export const getProfilesPaginated = async (options: GetProfilesOptions): Promise<PaginatedProfiles> => {
  const {
    page = 1,
    pageSize = 20,
    search,
    purok,
    gender,
    isRegisteredVoter,
    civilStatus,
    workStatus,
    youthClassification,
    educationLevel,
    status,
    skill,
    ageMin,
    ageMax
  } = options;

  if (isSupabaseConfigured && supabase) {
    let query = supabase
      .from('youth_profiles')
      .select('*', { count: 'exact' });

    if (purok && purok.length > 0) {
      query = query.in('purok', purok);
    }
    if (gender && gender.length > 0) {
      query = query.in('gender', gender);
    }
    if (isRegisteredVoter !== undefined) {
      query = query.eq('is_registered_voter', isRegisteredVoter);
    }
    if (civilStatus && civilStatus.length > 0) {
      query = query.in('civil_status', civilStatus);
    }
    if (workStatus && workStatus.length > 0) {
      query = query.in('work_status', workStatus);
    }
    if (youthClassification && youthClassification.length > 0) {
      query = query.in('youth_classification', youthClassification);
    }
    if (educationLevel && educationLevel.length > 0) {
      query = query.in('education_level', educationLevel);
    }
    if (status && status.length > 0) {
      query = query.in('status', status);
    }
    if (skill && skill.length > 0) {
      query = query.overlaps('skills', skill);
    }
    if (ageMin !== undefined) {
      query = query.gte('age', ageMin);
    }
    if (ageMax !== undefined) {
      query = query.lte('age', ageMax);
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query = query.or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},contact_number.ilike.${term}`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching paginated profiles from Supabase:", error);
    } else if (data) {
      const pageProfileIds = data.map(p => p.id);
      const [programsRes, attendanceRes, programCountRes] = await Promise.all([
        supabase.from('programs').select('id, title, status, start_date'),
        supabase.from('attendance').select('youth_id, program_id, status').in('youth_id', pageProfileIds),
        supabase.from('programs').select('id', { count: 'exact', head: true }).in('status', ['Active', 'Completed'])
      ]);
      const totalProgramsCount = programCountRes.count || 0;
      const attendanceRecords = attendanceRes.data || [];

      const profiles = data.map(p => {
        const { participationRate, attendanceLogs } = computeParticipation(
          p.id, totalProgramsCount, attendanceRecords, programsRes.data || []
        );
        return {
          ...mapDbRowToProfileFields(p),
          participationRate,
          attendanceLogs
        };
      });
      return { profiles, totalCount: count || 0 };
    }
  }

  // fallback to local filtering
  const allProfiles = await getLocalData<YouthProfile>('kk_youth_profiles', initialYouthProfiles);
  let filtered = allProfiles;

  if (purok && purok.length > 0) {
    filtered = filtered.filter(p => purok.includes(p.purok));
  }
  if (gender && gender.length > 0) {
    filtered = filtered.filter(p => gender.includes(p.gender));
  }
  if (isRegisteredVoter !== undefined) {
    filtered = filtered.filter(p => p.isRegisteredVoter === isRegisteredVoter);
  }
  if (civilStatus && civilStatus.length > 0) {
    filtered = filtered.filter(p => civilStatus.includes(p.civilStatus));
  }
  if (workStatus && workStatus.length > 0) {
    filtered = filtered.filter(p => !!p.workStatus && workStatus.includes(p.workStatus));
  }
  if (youthClassification && youthClassification.length > 0) {
    filtered = filtered.filter(p => !!p.youthClassification && youthClassification.includes(p.youthClassification));
  }
  if (educationLevel && educationLevel.length > 0) {
    filtered = filtered.filter(p => educationLevel.includes(p.educationLevel));
  }
  if (status && status.length > 0) {
    filtered = filtered.filter(p => status.includes(p.status));
  }
  if (skill && skill.length > 0) {
    filtered = filtered.filter(p => (p.skills || []).some(s => skill.includes(s)));
  }
  if (ageMin !== undefined) {
    filtered = filtered.filter(p => p.age >= ageMin);
  }
  if (ageMax !== undefined) {
    filtered = filtered.filter(p => p.age <= ageMax);
  }

  if (search && search.trim() !== '') {
    const s = search.toLowerCase();
    filtered = filtered.filter(p => 
      p.firstName.toLowerCase().includes(s) || 
      p.lastName.toLowerCase().includes(s) || 
      p.email.toLowerCase().includes(s) || 
      p.contactNumber.includes(s)
    );
  }

  const totalCount = filtered.length;
  const from = (page - 1) * pageSize;
  const slice = filtered.slice(from, from + pageSize);

  return { profiles: slice, totalCount };
};

export interface AttendanceLogEntry {
  attendanceId: string;
  youthId: string;
  name: string;
  purok: string;
  timeIn: string;
  status: 'Present' | 'Absent' | 'Excused';
}

// Real attendance rows for a program, joined with youth profile display fields.
// Registrants with no attendance row yet are surfaced as "Absent" placeholders so the
// ledger can still offer a manual "Check In" action for them.
export const getAttendanceForProgram = async (programId: string): Promise<AttendanceLogEntry[]> => {
  if (isSupabaseConfigured && supabase) {
    const [attendanceRes, profilesRes] = await Promise.all([
      supabase.from('attendance').select('*').eq('program_id', programId),
      supabase.from('youth_profiles').select('id, first_name, last_name, purok').eq('status', 'Active')
    ]);

    if (attendanceRes.error || profilesRes.error) {
      console.error("Error loading attendance for program:", attendanceRes.error || profilesRes.error);
      return [];
    }

    const attendanceByYouth = new Map((attendanceRes.data || []).map(a => [a.youth_id, a]));

    return (profilesRes.data || []).map(p => {
      const rec = attendanceByYouth.get(p.id);
      return {
        attendanceId: rec?.id || '',
        youthId: p.id,
        name: `${p.first_name} ${p.last_name}`,
        purok: p.purok,
        timeIn: rec ? new Date(rec.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
        status: rec ? rec.status : 'Absent'
      };
    });
  }

  const attendance = await getLocalData<{ id: string; program_id: string; youth_id: string; time_in: string; status: string }>('kk_attendance', []);
  const profiles = await getLocalData<YouthProfile>('kk_youth_profiles', initialYouthProfiles);
  const attendanceByYouth = new Map(attendance.filter(a => a.program_id === programId).map(a => [a.youth_id, a]));

  return profiles.filter(p => p.status === 'Active').map(p => {
    const rec = attendanceByYouth.get(p.id);
    return {
      attendanceId: rec?.id || '',
      youthId: p.id,
      name: `${p.firstName} ${p.lastName}`,
      purok: p.purok,
      timeIn: rec ? new Date(rec.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
      status: (rec?.status as AttendanceLogEntry['status']) || 'Absent'
    };
  });
};

// Staff-side manual/scanned check-in (desktop is authenticated as admin/staff, so this writes
// directly -- resident self-check-in via a scanned program QR instead goes through the
// check_in_attendance RPC from the web portal, which re-verifies the resident's session).
export const checkInYouth = async (programId: string, youthId: string): Promise<boolean> => {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('attendance')
      .upsert({ program_id: programId, youth_id: youthId, status: 'Present', scan_method: 'Manual' }, { onConflict: 'program_id,youth_id' });
    if (error) {
      console.error("Error checking in youth:", error);
      return false;
    }
    return true;
  }

  const attendance = await getLocalData<any>('kk_attendance', []);
  const existingIdx = attendance.findIndex(a => a.program_id === programId && a.youth_id === youthId);
  const row = { id: existingIdx >= 0 ? attendance[existingIdx].id : crypto.randomUUID(), program_id: programId, youth_id: youthId, time_in: new Date().toISOString(), status: 'Present', scan_method: 'Manual' };
  if (existingIdx >= 0) attendance[existingIdx] = row; else attendance.push(row);
  await setLocalData('kk_attendance', attendance);
  return true;
};

export const checkOutYouth = async (programId: string, youthId: string): Promise<boolean> => {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('program_id', programId)
      .eq('youth_id', youthId);
    if (error) {
      console.error("Error checking out youth:", error);
      return false;
    }
    return true;
  }

  const attendance = await getLocalData<any>('kk_attendance', []);
  await setLocalData('kk_attendance', attendance.filter(a => !(a.program_id === programId && a.youth_id === youthId)));
  return true;
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

export const saveProfilesBulk = async (profiles: Omit<YouthProfile, 'participationRate' | 'joinedDate'>[]): Promise<YouthProfile[]> => {
  const fullProfiles = profiles.map(profile => ({
    ...profile,
    participationRate: 100,
    joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    updatedAt: new Date().toISOString()
  }));

  const dbProfiles = profiles.map(profile => mapProfileToDbRow(profile));

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('youth_profiles')
      .insert(dbProfiles)
      .select();

    if (error) {
      console.error("Error creating bulk profiles in Supabase, queuing mutations:", error);
      for (let i = 0; i < fullProfiles.length; i++) {
        await enqueueMutation('INSERT', 'youth_profiles', fullProfiles[i].id, dbProfiles[i]);
      }
    } else if (data) {
      (data || []).forEach((p, idx) => {
        fullProfiles[idx].id = p.id;
        fullProfiles[idx].updatedAt = p.updated_at;
      });
    }
  } else {
    for (let i = 0; i < fullProfiles.length; i++) {
      await enqueueMutation('INSERT', 'youth_profiles', fullProfiles[i].id, dbProfiles[i]);
    }
  }

  const existing = await getLocalData<YouthProfile>('kk_youth_profiles', initialYouthProfiles);
  const updated = [...fullProfiles, ...existing];
  await setLocalData('kk_youth_profiles', updated);
  return fullProfiles;
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

export const updateProfileStatus = async (
  id: string,
  status: 'Active' | 'Inactive' | 'Archived'
): Promise<boolean> => {
  const localUpdatedAt = new Date().toISOString();
  const dbPayload = { status };

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('youth_profiles')
      .update(dbPayload)
      .eq('id', id);

    if (error) {
      console.error("Error updating profile status on Supabase, queuing:", error);
      await enqueueMutation('UPDATE', 'youth_profiles', id, dbPayload);
    }
  } else {
    await enqueueMutation('UPDATE', 'youth_profiles', id, dbPayload);
  }

  const profiles = await getLocalData<YouthProfile>('kk_youth_profiles', initialYouthProfiles);
  const updated = profiles.map(p => p.id === id ? { ...p, status, updatedAt: localUpdatedAt } : p);
  await setLocalData('kk_youth_profiles', updated);
  return true;
};

export const updateProfile = async (
  id: string,
  patch: Partial<YouthProfile>
): Promise<boolean> => {
  const localUpdatedAt = new Date().toISOString();
  const dbPayload = mapProfileToDbRow(patch);

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('youth_profiles')
      .update(dbPayload)
      .eq('id', id);

    if (error) {
      console.error("Error updating profile on Supabase, queuing:", error);
      await enqueueMutation('UPDATE', 'youth_profiles', id, dbPayload);
    }
  } else {
    await enqueueMutation('UPDATE', 'youth_profiles', id, dbPayload);
  }

  const profiles = await getLocalData<YouthProfile>('kk_youth_profiles', initialYouthProfiles);
  const updated = profiles.map(p => p.id === id ? { ...p, ...patch, updatedAt: localUpdatedAt } : p);
  await setLocalData('kk_youth_profiles', updated);
  return true;
};

// local audit log layer
export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name: string;
  old_values: any;
  new_values: any;
  created_at: string;
}

const initialAuditLogs: AuditLog[] = [
  {
    id: "LOG-000001",
    action: "INSERT",
    table_name: "youth_profiles",
    old_values: null,
    new_values: { firstName: "Elena", lastName: "Rodriguez", purok: "Purok 4" },
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "LOG-000002",
    action: "UPDATE",
    table_name: "registration_submissions",
    old_values: { status: "Pending" },
    new_values: { status: "Approved" },
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: "LOG-000003",
    action: "INSERT",
    table_name: "programs",
    old_values: null,
    new_values: { title: "Linggo ng Kabataan 2024 - Sports Fest", category: "Sports" },
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

export const getAuditLogs = async (): Promise<AuditLog[]> => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      return data.map(log => ({
        id: log.id,
        user_id: log.user_id,
        action: log.action,
        table_name: log.table_name,
        old_values: log.old_values,
        new_values: log.new_values,
        created_at: log.created_at
      }));
    }
    console.error("Error fetching audit logs from Supabase, falling back to LocalStorage:", error);
  }
  return getLocalData<AuditLog>('kk_audit_logs', initialAuditLogs);
};

export const saveAuditLog = async (log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> => {
  const newLog: AuditLog = {
    ...log,
    id: `LOG-${Math.floor(Math.random() * 900000) + 100000}`,
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        action: log.action,
        table_name: log.table_name,
        old_values: log.old_values,
        new_values: log.new_values
      })
      .select()
      .single();

    if (!error && data) {
      return {
        id: data.id,
        user_id: data.user_id,
        action: data.action,
        table_name: data.table_name,
        old_values: data.old_values,
        new_values: data.new_values,
        created_at: data.created_at
      };
    }
    console.error("Error saving audit log to Supabase:", error);
  }

  const logs = await getLocalData<AuditLog>('kk_audit_logs', initialAuditLogs);
  logs.unshift(newLog);
  await setLocalData('kk_audit_logs', logs);
  return newLog;
};

export const signIn = async (email: string, password: string) => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }
  return { data: null, error: new Error("Supabase is not configured.") };
};

export const signOut = async () => {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
};

export const updatePassword = async (newPassword: string) => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    return { data, error };
  }
  return { data: null, error: new Error("Supabase is not configured.") };
};

export const updateProfileName = async (newName: string) => {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.updateUser({
      data: { full_name: newName }
    });
    return { data, error };
  }
  return { data: null, error: new Error("Supabase is not configured.") };
};

export const getFullNameFromEmail = (email: string): string => {
  const normalized = email.toLowerCase().trim();
  const username = normalized.split('@')[0];
  return username
    .split('.')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export type SystemUserRole = 'Admin' | 'Staff' | 'Viewer' | 'SK Chairperson' | 'SK Kagawad' | 'SK Treasurer' | 'SK Secretary';

export interface SystemUser {
  id: string;
  name: string;
  role: SystemUserRole;
  email: string;
  status: 'Active' | 'Disabled';
  createdAt?: string;
}

const mapDbRoleToFrontend = (role: string): SystemUserRole => {
  const r = (role || '').toLowerCase().trim();
  if (r === 'admin') return 'Admin';
  if (r === 'staff') return 'Staff';
  if (r === 'sk chairperson') return 'SK Chairperson';
  if (r === 'sk kagawad') return 'SK Kagawad';
  if (r === 'sk treasurer') return 'SK Treasurer';
  if (r === 'sk secretary') return 'SK Secretary';
  return 'Viewer';
};

export const getSystemUsers = async (): Promise<SystemUser[]> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('get_system_users');
      if (!error && data) {
        return (data || []).map((u: any) => ({
          id: u.id,
          name: u.name || getFullNameFromEmail(u.email),
          role: mapDbRoleToFrontend(u.role),
          email: u.email,
          status: 'Active',
          createdAt: u.created_at
        }));
      }
      console.error("Error fetching system users via RPC:", error);
    } catch (err) {
      console.error(err);
    }
  }
  return [];
};

export const createSystemUser = async (email: string, role: string, password: string, displayName?: string): Promise<string | null> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const dbRole = role.toLowerCase();
      const { data, error } = await supabase.rpc('create_system_user', {
        p_email: email,
        p_password: password,
        p_role: dbRole,
        p_display_name: displayName || null
      });
      if (!error && data) {
        return data;
      }
      console.error("Error creating system user via RPC:", error);
    } catch (err) {
      console.error(err);
    }
  }
  return null;
};

export const deleteSystemUser = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('delete_system_user', {
        p_id: id
      });
      if (error) {
        console.error("Error deleting system user via RPC:", error);
        return false;
      }
      return data === true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
  return false;
};

export const updateSystemUserRole = async (id: string, role: string): Promise<boolean> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const dbRole = role.toLowerCase();
      const { data, error } = await supabase.rpc('update_system_user_role', {
        p_id: id,
        p_role: dbRole
      });
      if (error) {
        console.error("Error updating system user role via RPC:", error);
        return false;
      }
      return data === true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
  return false;
};

export interface DocumentRecord {
  id: string;
  youthId?: string;
  fileName: string;
  fileUrl: string;
  fileType: 'ID' | 'Certificate' | 'Recommendation' | 'Other';
  createdAt: string;
}

export const getDocuments = async (): Promise<DocumentRecord[]> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        return data.map(d => ({
          id: d.id,
          youthId: d.youth_id,
          fileName: d.file_name,
          fileUrl: d.file_url,
          fileType: d.file_type,
          createdAt: d.created_at
        }));
      }
      console.error("Error fetching documents from Supabase:", error);
    } catch (err) {
      console.error(err);
    }
  }
  return getLocalData<DocumentRecord>('kk_documents', []);
};

export const saveDocument = async (doc: Omit<DocumentRecord, 'id' | 'createdAt'>): Promise<DocumentRecord> => {
  const newDoc: DocumentRecord = {
    ...doc,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };

  const dbDoc = {
    youth_id: doc.youthId,
    file_name: doc.fileName,
    file_url: doc.fileUrl,
    file_type: doc.fileType
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert({ id: newDoc.id, ...dbDoc })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          youthId: data.youth_id,
          fileName: data.file_name,
          fileUrl: data.file_url,
          fileType: data.file_type,
          createdAt: data.created_at
        };
      }
      console.error("Error saving document to Supabase, queuing mutation:", error);
      await enqueueMutation('INSERT', 'documents', newDoc.id, dbDoc);
    } catch (err) {
      console.error(err);
      await enqueueMutation('INSERT', 'documents', newDoc.id, dbDoc);
    }
  } else {
    await enqueueMutation('INSERT', 'documents', newDoc.id, dbDoc);
  }

  const docs = await getLocalData<DocumentRecord>('kk_documents', []);
  docs.unshift(newDoc);
  await setLocalData('kk_documents', docs);
  return newDoc;
};

export const deleteDocument = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting document from Supabase, queuing mutation:", error);
        await enqueueMutation('DELETE', 'documents', id, null);
      }
    } catch (err) {
      console.error(err);
      await enqueueMutation('DELETE', 'documents', id, null);
    }
  } else {
    await enqueueMutation('DELETE', 'documents', id, null);
  }

  const docs = await getLocalData<DocumentRecord>('kk_documents', []);
  const filtered = docs.filter(d => d.id !== id);
  await setLocalData('kk_documents', filtered);
  return true;
};

export interface DashboardSummary {
  metrics: {
    totalYouth: number;
    pendingReviews: number;
    activePrograms: number;
    upcomingEvents: number;
    attendanceRate: number;
  };
  purokData: { purok: string; count: number }[];
  genderData: { name: string; value: number; color?: string }[];
  ageGroupData: { group: string; count: number }[];
  workData: { name: string; value: number }[];
  educationData: { name: string; value: number }[];
  classificationData: { name: string; value: number }[];
  skillsData: { name: string; value: number }[];
  participationData: { name: string; value: number }[];
  recentRegistrations: {
    id: string;
    fullName: string;
    purok: string;
    age: number;
    registeredOn: string;
    status: 'Approved' | 'Pending';
    initials?: string;
  }[];
}

export const getDashboardSummary = async (): Promise<DashboardSummary | null> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('get_dashboard_summary');
      if (error) {
        console.error("Error fetching dashboard summary RPC from Supabase:", error);
      } else if (data) {
        // map timestamps and add initials
        const mappedRecent = (data.recentRegistrations || []).map((r: any) => ({
          ...r,
          registeredOn: new Date(r.registeredOn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          initials: r.fullName ? r.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'YTH'
        }));
        
        return {
          ...data,
          recentRegistrations: mappedRecent
        } as DashboardSummary;
      }
    } catch (err) {
      console.error("getDashboardSummary RPC exception:", err);
    }
  }
  return null;
};

export interface SystemConfig {
  barangayName: string;
  barangayLogo: string;
  skChairperson: string;
  puroks: string[];
  skKagawads: string[];
  skTreasurer: string;
  skSecretary: string;
  district: string;
}

export const getSystemConfig = async (): Promise<SystemConfig | null> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .eq('id', 1)
        .single();
      if (error) {
        console.error("Error fetching system config:", error);
      } else if (data) {
        return {
          barangayName: data.barangay_name,
          barangayLogo: data.barangay_logo,
          skChairperson: data.sk_chairperson,
          puroks: data.puroks || [],
          skKagawads: data.sk_kagawads || [],
          skTreasurer: data.sk_treasurer || '',
          skSecretary: data.sk_secretary || '',
          district: data.district || 'District I',
        };
      }
    } catch (err) {
      console.error("getSystemConfig exception:", err);
    }
  }
  return null;
};

export const saveSystemConfig = async (config: SystemConfig): Promise<boolean> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('system_config')
        .upsert({
          id: 1,
          barangay_name: config.barangayName,
          barangay_logo: config.barangayLogo,
          sk_chairperson: config.skChairperson,
          puroks: config.puroks,
          sk_kagawads: config.skKagawads,
          sk_treasurer: config.skTreasurer,
          sk_secretary: config.skSecretary,
          district: config.district,
          updated_at: new Date().toISOString(),
        });
      if (error) {
        console.error("Error saving system config:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("saveSystemConfig exception:", err);
      return false;
    }
  }
  return false;
};



