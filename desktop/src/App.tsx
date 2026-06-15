import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  CheckSquare, 
  BarChart3, 
  Settings as SettingsIcon, 
  PlusCircle, 
  Search, 
  Bell, 
  HelpCircle, 
  ChevronDown, 
  QrCode, 
  LogOut, 
  Filter, 
  Download, 
  Printer, 
  Archive, 
  Edit, 
  Check, 
  X, 
  FileText,
  ShieldCheck,
  Zap,
  TrendingUp,
  Award,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import * as db from './lib/db';
import { purgeAllPiiCache } from './lib/secureCache';
import Dashboard from './components/Dashboard';
import { useNetworkStatus } from './lib/useNetworkStatus';
import { clearOfflineQueue } from './lib/offlineSync';
import ErrorBoundary from './components/ErrorBoundary';
import { z } from 'zod';
import LoginPage from './components/LoginPage';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import HelpModal from './components/HelpModal';
import YouthListView from './components/views/YouthListView';
import YouthProfileDetail from './components/views/YouthProfileDetail';
import SettingsView from './components/views/SettingsView';
import AddYouthView from './components/views/AddYouthView';
import DocumentsView from './components/views/DocumentsView';
import AttendanceLoggerView from './components/views/AttendanceLoggerView';
import ProgramsEventsView from './components/views/ProgramsEventsView';
import AnalyticsInsightView from './components/views/AnalyticsInsightView';
import defaultLogo from './assets/logo.png';

const DEFAULT_REAL_PUROKS = [
  "East",
  "West A",
  "West B",
  "Holy Cross Drive",
  "Special Block",
  "Belisario",
  "Ibula",
  "Puting Lupa",
  "Ruiz",
  "Sto. Niño A",
  "Sto. Niño B",
  "Freedom",
  "Fatima",
  "San Vicente",
  "Green Village",
  "Gosi Blaza"
];

export default function App() {
  const { isOnline, isSyncing, pendingCount, syncNow } = useNetworkStatus();
  const isManualLogoutRef = React.useRef(false);

  // --- States ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Database States
  const [youthProfiles, setYouthProfiles] = useState<db.YouthProfile[]>([]);
  const [paginatedProfiles, setPaginatedProfiles] = useState<db.YouthProfile[]>([]);
  const [totalProfilesCount, setTotalProfilesCount] = useState<number>(0);
  const [dashboardSummary, setDashboardSummary] = useState<db.DashboardSummary | null>(null);
  const [programs, setPrograms] = useState<db.Program[]>([]);
  const [submissions, setSubmissions] = useState<db.RegistrationSubmission[]>([]);
  const [documents, setDocuments] = useState<db.DocumentRecord[]>([]);
  const [documentSearch, setDocumentSearch] = useState<string>('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('All');
  const [selectedYouthIdForDoc, setSelectedYouthIdForDoc] = useState<string>('');
  const [newDocFileName, setNewDocFileName] = useState<string>('');
  const [newDocType, setNewDocType] = useState<'ID' | 'Certificate' | 'Recommendation' | 'Other'>('ID');
  const [newDocUrl, setNewDocUrl] = useState<string>('');
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected'>('disconnected');

  // --- System Configuration States (Settings Page) ---
  const [barangayName, setBarangayName] = useState<string>(() => {
    return localStorage.getItem('kk_barangay_name') || 'San Antonio';
  });

  const [barangayLogo, setBarangayLogo] = useState<string>(() => {
    return localStorage.getItem('kk_barangay_logo') || defaultLogo;
  });

  const [skChairperson, setSkChairperson] = useState<string>(() => {
    return localStorage.getItem('kk_sk_chairperson') || 'Hon. Jane Doe';
  });

  const [district, setDistrict] = useState<string>(() => {
    return localStorage.getItem('kk_district') || 'District I';
  });

  const [puroks, setPuroks] = useState<string[]>(() => {
    const saved = localStorage.getItem('kk_purok_list');
    return saved ? JSON.parse(saved) : DEFAULT_REAL_PUROKS;
  });

  const [ageGroups] = useState<{ id: string; label: string; minAge: number; maxAge: number }[]>(() => {
    const saved = localStorage.getItem('kk_age_groups');
    return saved ? JSON.parse(saved) : [
      { id: '1', label: 'Child Youth', minAge: 15, maxAge: 17 },
      { id: '2', label: 'Core Youth', minAge: 18, maxAge: 24 },
      { id: '3', label: 'Young Adult', minAge: 25, maxAge: 30 }
    ];
  });

  const [skKagawads, setSkKagawads] = useState<string[]>(() => {
    const saved = localStorage.getItem('kk_sk_kagawads');
    const parsed = saved ? JSON.parse(saved) : Array(7).fill('').map((_, i) => `Kagawad ${i + 1}`);
    const padded = [...parsed];
    while (padded.length < 7) {
      padded.push('');
    }
    return padded;
  });

  const [skTreasurer, setSkTreasurer] = useState<string>(() => {
    return localStorage.getItem('kk_sk_treasurer') || 'Treasurer Name';
  });

  const [skSecretary, setSkSecretary] = useState<string>(() => {
    return localStorage.getItem('kk_sk_secretary') || 'Secretary Name';
  });

  interface UserRecord {
    id: string;
    name: string;
    role: db.SystemUserRole;
    email: string;
    status: 'Active' | 'Disabled';
  }

  const [users, setUsers] = useState<UserRecord[]>([]);

  const [currentUser, setCurrentUser] = useState<UserRecord>({
    id: '',
    name: 'Loading...',
    role: 'Viewer',
    email: '',
    status: 'Disabled'
  });

  const fetchUserRole = async (userId: string, email: string) => {
    if (db.isSupabaseConfigured && db.supabase) {
      try {
        const { data, error } = await db.supabase
          .from('user_roles')
          .select('role, display_name')
          .eq('id', userId)
          .single();

        if (error || !data) {
          console.error("Error fetching user role:", error);
          const defaultUser: UserRecord = { 
            id: userId, 
            name: db.getFullNameFromEmail(email), 
            role: 'Staff', 
            email, 
            status: 'Active' 
          };
          setCurrentUser(defaultUser);
          setIsAuthenticated(true);
        } else {
          const mapDbRoleToFrontend = (role: string): db.SystemUserRole => {
            const r = (role || '').toLowerCase().trim();
            if (r === 'admin') return 'Admin';
            if (r === 'staff') return 'Staff';
            if (r === 'sk chairperson') return 'SK Chairperson';
            if (r === 'sk kagawad') return 'SK Kagawad';
            if (r === 'sk treasurer') return 'SK Treasurer';
            if (r === 'sk secretary') return 'SK Secretary';
            return 'Viewer';
          };
          setCurrentUser({
            id: userId,
            name: (data as any).display_name || db.getFullNameFromEmail(email),
            role: mapDbRoleToFrontend(data.role),
            email,
            status: 'Active'
          });
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error("fetchUserRole exception:", err);
      } finally {
        setIsLoadingUser(false);
      }
    } else {
      setIsLoadingUser(false);
    }
  };

  useEffect(() => {
    if (db.isSupabaseConfigured && db.supabase) {
      db.supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
          fetchUserRole(session.user.id, session.user.email || '');
        } else {
          setIsLoadingUser(false);
          const localAuth = localStorage.getItem('kk_desktop_auth') === 'true';
          if (localAuth) {
            const saved = localStorage.getItem('kk_current_user');
            if (saved) {
              try {
                setCurrentUser(JSON.parse(saved));
                setIsAuthenticated(true);
              } catch (_) {}
            }
          }
        }
      });

      const { data: { subscription } } = db.supabase.auth.onAuthStateChange((event, session) => {
        if (session && session.user) {
          fetchUserRole(session.user.id, session.user.email || '');
        } else {
          if (event === 'SIGNED_OUT' && !isManualLogoutRef.current) {
            setScanNotification({
              message: "SESSION EXPIRED: Your session has expired or been terminated. Please log in again.",
              type: 'error'
            });
          }
          setIsAuthenticated(false);
          setCurrentUser({ id: '', name: 'Logged Out', role: 'Viewer', email: '', status: 'Disabled' });
        }
      });

      return () => subscription.unsubscribe();
    } else {
      setIsLoadingUser(false);
      const localAuth = localStorage.getItem('kk_desktop_auth') === 'true';
      if (localAuth) {
        const saved = localStorage.getItem('kk_current_user');
        if (saved) {
          try {
            setCurrentUser(JSON.parse(saved));
            setIsAuthenticated(true);
          } catch (_) {}
        }
      }
    }
  }, []);

  useEffect(() => {
    if (db.isSupabaseConfigured && db.supabase && isAuthenticated) {
      const channel = db.supabase
        .channel('realtime-desktop-sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'programs' },
          () => {
            loadDatabaseData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'registration_submissions' },
          () => {
            loadDatabaseData();
          }
        )
        .subscribe();

      return () => {
        if (db.supabase) {
          db.supabase.removeChannel(channel);
        }
      };
    }
  }, [isAuthenticated]);

  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState<boolean>(false);

  const [activityLogs, setActivityLogs] = useState<db.AuditLog[]>([]);

  // Activity Logger
  const logActivity = async (action: string, tableName: string, oldValues: any, newValues: any) => {
    try {
      const log = await db.saveAuditLog({
        action,
        table_name: tableName,
        old_values: oldValues,
        new_values: newValues
      });
      setActivityLogs(prev => [log, ...prev]);
    } catch (err) {
      console.error("Failed to save audit log", err);
    }
  };

  const [settingsSubTab, setSettingsSubTab] = useState<'admin' | 'logs' | 'account'>('logs');
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [securityTargetTab, setSecurityTargetTab] = useState<'admin' | null>(null);
  const [lastSeenLogsCount, setLastSeenLogsCount] = useState<number>(0);
  const unreadLogsCount = Math.max(0, activityLogs.length - lastSeenLogsCount);
  const [stagingBarangayName, setStagingBarangayName] = useState<string>(barangayName);
  const [stagingSkChairperson, setStagingSkChairperson] = useState<string>(skChairperson);
  const [stagingBarangayLogo, setStagingBarangayLogo] = useState<string>(barangayLogo);
  const [stagingPuroks, setStagingPuroks] = useState<string[]>(puroks);
  const [stagingSkKagawads, setStagingSkKagawads] = useState<string[]>(skKagawads);
  const [stagingSkTreasurer, setStagingSkTreasurer] = useState<string>(skTreasurer);
  const [stagingSkSecretary, setStagingSkSecretary] = useState<string>(skSecretary);
  const [stagingDistrict, setStagingDistrict] = useState<string>(district);
  const [newPurokName, setNewPurokName] = useState<string>('');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  const [securityPasswordInput, setSecurityPasswordInput] = useState<string>('');
  // User Management forms
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<db.SystemUserRole>('Staff');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);

  const handleUpdateCurrentUser = (fields: Partial<UserRecord>) => {
    setCurrentUser(prev => ({
      ...prev,
      ...fields
    }));
    const saved = localStorage.getItem('kk_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        localStorage.setItem('kk_current_user', JSON.stringify({ ...parsed, ...fields }));
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    setStagingBarangayName(barangayName);
    setStagingSkChairperson(skChairperson);
    setStagingBarangayLogo(barangayLogo);
    setStagingPuroks(puroks);
    setStagingSkKagawads(skKagawads);
    setStagingSkTreasurer(skTreasurer);
    setStagingSkSecretary(skSecretary);
    setStagingDistrict(district);
  }, [barangayName, skChairperson, barangayLogo, puroks, skKagawads, skTreasurer, skSecretary, district]);

  const handleSaveSettingsConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSettingsUnlocked) {
      alert("System configuration is locked! Please authorize in the Security tab first.");
      return;
    }
    const oldValues = {
      barangayName,
      barangayLogo,
      skChairperson,
      puroks,
      skKagawads,
      skTreasurer,
      skSecretary,
      district
    };
    const newValues = {
      barangayName: stagingBarangayName,
      barangayLogo: stagingBarangayLogo,
      skChairperson: stagingSkChairperson,
      puroks: stagingPuroks,
      skKagawads: stagingSkKagawads,
      skTreasurer: stagingSkTreasurer,
      skSecretary: stagingSkSecretary,
      district: stagingDistrict
    };

    setBarangayName(stagingBarangayName);
    localStorage.setItem('kk_barangay_name', stagingBarangayName);

    setBarangayLogo(stagingBarangayLogo);
    localStorage.setItem('kk_barangay_logo', stagingBarangayLogo);

    setSkChairperson(stagingSkChairperson);
    localStorage.setItem('kk_sk_chairperson', stagingSkChairperson);

    setPuroks(stagingPuroks);
    localStorage.setItem('kk_purok_list', JSON.stringify(stagingPuroks));

    setSkKagawads(stagingSkKagawads);
    localStorage.setItem('kk_sk_kagawads', JSON.stringify(stagingSkKagawads));

    setSkTreasurer(stagingSkTreasurer);
    localStorage.setItem('kk_sk_treasurer', stagingSkTreasurer);

    setSkSecretary(stagingSkSecretary);
    localStorage.setItem('kk_sk_secretary', stagingSkSecretary);

    setDistrict(stagingDistrict);
    localStorage.setItem('kk_district', stagingDistrict);

    // Write system config to Supabase
    await db.saveSystemConfig({
      barangayName: stagingBarangayName,
      barangayLogo: stagingBarangayLogo,
      skChairperson: stagingSkChairperson,
      puroks: stagingPuroks,
      skKagawads: stagingSkKagawads,
      skTreasurer: stagingSkTreasurer,
      skSecretary: stagingSkSecretary,
      district: stagingDistrict
    });

    logActivity('UPDATE', 'system_settings', oldValues, newValues);

    setScanNotification({
      message: "SUCCESS: System settings updated successfully and written to secure ledger!",
      type: 'success'
    });
  };

  const handleExportReportToCSV = () => {
    let csvContent = "";
    
    csvContent += `Sangguniang Kabataan Census & Programs Report - Barangay ${barangayName}\n`;
    csvContent += `Generated At,${new Date().toLocaleString()}\n\n`;
    
    csvContent += "OVERALL CENSUS METRICS\n";
    csvContent += `Total Registered Youth Population,${youthProfiles.length}\n`;
    csvContent += `Average Youth Engagement Rate,${avgParticipationRate}%\n`;
    csvContent += `Average Event Attendance Rate,${avgAttendanceRate}%\n\n`;
    
    csvContent += "YOUTH BY AGE GROUP\n";
    csvContent += "Age Bracket,Count,Percentage\n";
    csvContent += `15-17 (Child Youth),${age15to17Count},${age15to17Percent}%\n`;
    csvContent += `18-24 (Core Youth),${age18to24Count},${age18to24Percent}%\n`;
    csvContent += `25-30 (Young Adult),${age25to30Count},${age25to30Percent}%\n\n`;
    
    csvContent += "YOUTH BY GENDER\n";
    csvContent += "Gender,Count,Percentage\n";
    csvContent += `Male,${maleCount},${malePercent}%\n`;
    csvContent += `Female,${femaleCount},${femalePercent}%\n`;
    csvContent += `Unlabeled/LGBTQIA+,${otherCount},${Math.round((otherCount / totalGender) * 100)}%\n\n`;
    
    csvContent += "YOUTH BY EDUCATION\n";
    csvContent += "Education Background,Count,Percentage\n";
    csvContent += `College Level/Graduate,${collegeCount},${collegePercent}%\n`;
    csvContent += `High School Level/Graduate,${highSchoolCount},${highSchoolPercent}%\n`;
    csvContent += `Vocational Level/Graduate,${vocationalCount},${vocationalPercent}%\n`;
    csvContent += `Other/Unspecified,${otherEduCount},${otherEduPercent}%\n\n`;
    
    csvContent += "YOUTH BY PUROK SECTOR\n";
    csvContent += "Purok,Count,Percentage\n";
    puroks.forEach(p => {
      const count = youthProfiles.filter(y => y.purok === p).length;
      const percent = Math.round((count / (youthProfiles.length || 1)) * 100);
      csvContent += `${p},${count},${percent}%\n`;
    });
    csvContent += "\n";
    
    csvContent += "PROGRAMS & EVENTS PERFORMANCE REPORT\n";
    csvContent += "Program ID,Title,Category,Status,Budget,Registered,Attended,Attendance Rate\n";
    programs.forEach(p => {
      const percent = p.registeredCount > 0 ? Math.round((p.presentCount / p.registeredCount) * 100) : 0;
      csvContent += `"${p.id}","${p.title.replace(/"/g, '""')}","${p.category}","${p.status}",${p.budget || 0},${p.registeredCount},${p.presentCount},${percent}%\n`;
    });
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `corum_sk_analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setScanNotification({
      message: "SUCCESS: Analytics & Program Report exported to Excel CSV!",
      type: 'success'
    });
  };

  const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== 'Admin') {
      alert("Access Denied: Only administrators can create or modify system users.");
      return;
    }
    if (!isSettingsUnlocked) {
      alert("Settings are locked! Please authorize in the Security tab first.");
      return;
    }
    if (!newUserName.trim() || !newUserEmail.trim()) {
      alert("Name and email are required fields.");
      return;
    }
    
    if (db.isSupabaseConfigured && db.supabase) {
      try {
        if (editingUserId) {
          const success = await db.updateSystemUserRole(editingUserId, newUserRole);
          if (success) {
            logActivity('UPDATE', 'users_ledger', { id: editingUserId }, { role: newUserRole });
            setScanNotification({ message: "SUCCESS: System user role updated!", type: 'success' });
          } else {
            alert("Failed to update user role on the database.");
            return;
          }
        } else {
          const newUserId = await db.createSystemUser(newUserEmail.trim(), newUserRole, newUserName.trim());
          if (newUserId) {
            logActivity('INSERT', 'users_ledger', null, { id: newUserId, email: newUserEmail.trim(), role: newUserRole });
            setScanNotification({ message: "SUCCESS: New system user created!", type: 'success' });
          } else {
            alert("Failed to create system user on the database. Make sure the email is unique.");
            return;
          }
        }
        // Reload list from DB
        const fetchedUsers = await db.getSystemUsers();
        setUsers(fetchedUsers);
      } catch (err) {
        console.error("Error saving system user:", err);
        alert("An error occurred while communicating with the database.");
      }
    } else {
      let updatedUsers = [...users];
      const oldValues = [...users];
      
      if (editingUserId) {
        updatedUsers = users.map(u => u.id === editingUserId ? {
          ...u,
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          role: newUserRole
        } : u);
        logActivity('UPDATE', 'users_ledger', oldValues, updatedUsers);
        setScanNotification({ message: "SUCCESS: Staff user profile updated!", type: 'success' });
      } else {
        const newUser: UserRecord = {
          id: `usr-${Date.now()}`,
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          role: newUserRole,
          status: 'Active'
        };
        updatedUsers = [...users, newUser];
        logActivity('INSERT', 'users_ledger', null, newUser);
        setScanNotification({ message: "SUCCESS: New staff user created!", type: 'success' });
      }
      
      setUsers(updatedUsers);
      localStorage.setItem('kk_users', JSON.stringify(updatedUsers));
    }
    
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('Staff');
    setEditingUserId(null);
    setIsUserModalOpen(false);
  };

  const handleToggleUserStatus = (userId: string) => {
    if (!isSettingsUnlocked) {
      alert("Settings are locked! Please authorize in the Security tab first.");
      return;
    }
    if (db.isSupabaseConfigured && db.supabase) {
      alert("Database user accounts cannot be disabled/enabled directly from the client. Please use the Delete button to remove them.");
      return;
    }
    const oldValues = [...users];
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'Active' ? 'Disabled' : 'Active';
        return { ...u, status: nextStatus as any };
      }
      return u;
    });
    setUsers(updatedUsers);
    localStorage.setItem('kk_users', JSON.stringify(updatedUsers));
    logActivity('UPDATE', 'users_ledger', oldValues, updatedUsers);
    setScanNotification({ message: "SUCCESS: User status toggled successfully!", type: 'success' });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isSettingsUnlocked) {
      alert("Settings are locked! Please authorize in the Security tab first.");
      return;
    }
    if (!confirm("Are you sure you want to permanently delete this user account?")) {
      return;
    }

    if (db.isSupabaseConfigured && db.supabase) {
      try {
        const success = await db.deleteSystemUser(userId);
        if (success) {
          logActivity('DELETE', 'users_ledger', { id: userId }, null);
          setScanNotification({ message: "SUCCESS: User account permanently deleted!", type: 'success' });
          const fetchedUsers = await db.getSystemUsers();
          setUsers(fetchedUsers);
        } else {
          alert("Failed to delete user account. Check if it is the last administrator.");
        }
      } catch (err) {
        console.error(err);
        alert("An error occurred while communicating with the database.");
      }
    } else {
      const oldValues = [...users];
      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      localStorage.setItem('kk_users', JSON.stringify(updatedUsers));
      logActivity('DELETE', 'users_ledger', oldValues, updatedUsers);
      setScanNotification({ message: "SUCCESS: User deleted locally!", type: 'success' });
    }
  };

  const checkDatabaseConnection = async () => {
    if (!db.isSupabaseConfigured || !db.supabase) {
      setDbStatus('disconnected');
      return;
    }
    try {
      const { error } = await db.supabase.from('youth_profiles').select('id').limit(1);
      if (error) {
        setDbStatus('disconnected');
      } else {
        setDbStatus('connected');
      }
    } catch (err) {
      setDbStatus('disconnected');
    }
  };
  
  useEffect(() => {
    checkDatabaseConnection();
  }, []);

  useEffect(() => {
    if (activeTab === 'settings' && settingsSubTab === 'logs') {
      setLastSeenLogsCount(activityLogs.length);
    }
  }, [activeTab, settingsSubTab, activityLogs.length]);

  useEffect(() => {
    if (activeTab === 'add-youth') {
      if (importTab !== 'registry' && importTab !== 'bulk') {
        setImportTab('single');
        setAddYouthStep(1);
      }
    }
  }, [activeTab]);

  // Sidebar Submenu Collapsible States
  const [isAddYouthMenuOpen, setIsAddYouthMenuOpen] = useState<boolean>(false);
  const [isAnalyticsMenuOpen, setIsAnalyticsMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    if (activeTab === 'add-youth') {
      setIsAddYouthMenuOpen(true);
      setIsAnalyticsMenuOpen(false);
    } else if (activeTab === 'reports') {
      setIsAnalyticsMenuOpen(true);
      setIsAddYouthMenuOpen(false);
    } else {
      setIsAddYouthMenuOpen(false);
      setIsAnalyticsMenuOpen(false);
    }
  }, [activeTab]);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [purokFilter, setPurokFilter] = useState<string>('All');
  const [genderFilter, setGenderFilter] = useState<string>('All');
  const [voterFilter, setVoterFilter] = useState<string>('All');
  const [civilStatusFilter, setCivilStatusFilter] = useState<string>('All');
  const [workStatusFilter, setWorkStatusFilter] = useState<string>('All');
  const [classificationFilter, setClassificationFilter] = useState<string>('All');
  const [educationFilter, setEducationFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, purokFilter, genderFilter, voterFilter, civilStatusFilter, workStatusFilter, classificationFilter, educationFilter, statusFilter]);
  
  // Selected Profile for Detail View (Bento Grid)
  const [selectedYouthId, setSelectedYouthId] = useState<string | null>(null);

  // Notification and Help States
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState<boolean>(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);

  // Web Registry Submission States
  const [selectedSubmission, setSelectedSubmission] = useState<db.RegistrationSubmission | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState<string>('');
  const [registrySubTab, setRegistrySubTab] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
  
  // Analytics & Insight Subtab & State
  const [reportsSubTab, setReportsSubTab] = useState<'builder-gis-trends' | 'dss' | 'reporting-export'>('builder-gis-trends');
  const [reportsInnerSubTab, setReportsInnerSubTab] = useState<'builder' | 'gis' | 'trends'>('builder');

  // Custom Analytics Builder States
  const [builderMetric, setBuilderMetric] = useState<string>("Total Youth");
  const [builderGrouping, setBuilderGrouping] = useState<string>("Purok");
  const [builderFilterAgeMin, setBuilderFilterAgeMin] = useState<number>(15);
  const [builderFilterAgeMax, setBuilderFilterAgeMax] = useState<number>(30);
  const [builderFilterGender, setBuilderFilterGender] = useState<string>("All");
  const [builderFilterPurok, setBuilderFilterPurok] = useState<string>("All");
  const [builderFilterWorkStatus, setBuilderFilterWorkStatus] = useState<string>("All");
  const [builderFilterEducation, setBuilderFilterEducation] = useState<string>("All");
  const [builderVisualization, setBuilderVisualization] = useState<string>("Bar Chart");
  const [builderReportName, setBuilderReportName] = useState<string>("");
  const [builderSavedReports, setBuilderSavedReports] = useState<any[]>([
    { id: "rep-1", name: "Out of School Youth by Purok", metric: "Out-of-School Youth", grouping: "Purok", viz: "Bar Chart", createdAt: "June 12, 2026" },
    { id: "rep-2", name: "Skills Distribution in Purok 4", metric: "Skills Inventory", grouping: "Purok", viz: "Pie Chart", createdAt: "June 10, 2026" }
  ]);
  const [builderActiveReportId, setBuilderActiveReportId] = useState<string | null>(null);
  const [builderSavedMessage, setBuilderSavedMessage] = useState<string | null>(null);

  // GIS Mapping States
  const [gisOverlayLayer, setGisOverlayLayer] = useState<'density' | 'age' | 'gender' | 'participation' | 'needs' | 'impact' | 'risk'>('density');
  const [gisSelectedPurok, setGisSelectedPurok] = useState<string | null>(null);
  
  // Modals & Dynamic UI
  const [isAddProgramModalOpen, setIsAddProgramModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [importTab, setImportTab] = useState<'single' | 'bulk' | 'registry'>('single');
  const [bulkText, setBulkText] = useState<string>('');
  const [parsedProfiles, setParsedProfiles] = useState<any[]>([]);
  const [bulkImportError, setBulkImportError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [scanNotification, setScanNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // New Profile Form State
  const [addYouthStep, setAddYouthStep] = useState<number>(1);
  const [triedNextStep, setTriedNextStep] = useState<boolean>(false);
  const [triedSubmit, setTriedSubmit] = useState<boolean>(false);
  const [skillInput, setSkillInput] = useState<string>('');
  const [newYouth, setNewYouth] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    age: 18,
    gender: 'Male',
    genderSpecify: '',
    dob: '',
    civilStatus: 'Single',
    nationality: 'Filipino',
    contactNumber: '',
    email: '',
    facebookLink: '',
    address: '',
    purok: 'East',
    registeredVoter: 'Yes',
    precinctNumber: '',
    participatedLastKKElection: 'No',
    attendedKKAssembly: 'No',
    kkAssemblyCount: 0,
    educationBackground: 'High School Graduate',
    youthClassification: 'In School Youth (Nag skwela)',
    workStatus: 'Unemployed',
    hasScholarship: 'No',
    scholarshipSpecify: '',
    skills: [] as string[],
    workSpecify: '',
    educationSpecify: ''
  });

  // New Program Form State
  const [newProgram, setNewProgram] = useState<Partial<db.Program>>({
    title: '', description: '', category: 'Education', startDate: '', endDate: '', status: 'Draft'
  });

  // Selected Program for Attendance Simulation
  const [selectedAttendanceProgram, setSelectedAttendanceProgram] = useState<string>("Linggo ng Kabataan 2024 - Sports Fest");
  const [attendanceRecords, setAttendanceRecords] = useState<{ id: string; name: string; purok: string; timeIn: string; status: 'Present' | 'Absent' }[]>([]);

  // Dynamically update attendance logs when profiles are fetched
  useEffect(() => {
    if (youthProfiles.length > 0 && attendanceRecords.length === 0) {
      setAttendanceRecords(youthProfiles.map((p, idx) => ({
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
        purok: p.purok,
        timeIn: idx === 2 ? '--:--' : `08:${15 + idx * 15} AM`,
        status: idx === 2 ? 'Absent' : 'Present'
      })));
    }
  }, [youthProfiles]);

  // Audio simulation for scanning beeps
  const playScanBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); // 1000Hz frequency
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15); // beep for 0.15s
    } catch (e) {
      console.log('Audio Context not allowed without user gesture.', e);
    }
  };

  // --- Handlers ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const identifier = formData.get('identifier') as string;
      const password = formData.get('password') as string;
      let emailInput = identifier.trim();

      if (db.isSupabaseConfigured && db.supabase) {
        const { data, error } = await db.signIn(emailInput, password);
        if (error) {
          setLoginError(error.message);
          setIsLoggingIn(false);
        } else if (data && data.user) {
          // fetchUserRole handles loading roles and setting isAuthenticated to true
        }
      } else {
        const foundUser = users.find(u => u.email.toLowerCase() === emailInput.toLowerCase() || u.name.toLowerCase() === identifier.toLowerCase());
        
        if (foundUser && foundUser.role === 'Admin') {
          // offline bypass
          setCurrentUser(foundUser);
          localStorage.setItem('kk_current_user', JSON.stringify(foundUser));
          localStorage.setItem('kk_desktop_auth', 'true');
          setIsAuthenticated(true);
          setIsLoggingIn(false);
        } else {
          setLoginError("Offline Authentication Failed or Insufficient Privileges.");
          setIsLoggingIn(false);
        }
      }
    } catch (err: any) {
      console.error("Login exception:", err);
      setLoginError("Failed to connect to authentication server. Please check your network connection.");
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    isManualLogoutRef.current = true;
    try {
      if (db.isSupabaseConfigured && db.supabase) {
        await db.signOut();
      }
      // Security: immediately purge ALL PII from localStorage on logout
      purgeAllPiiCache();
      await clearOfflineQueue();
      setIsAuthenticated(false);
      setCurrentUser({ id: '', name: 'Logged Out', role: 'Viewer', email: '', status: 'Disabled' });
    } catch (e) {
      console.error("Logout exception:", e);
    } finally {
      isManualLogoutRef.current = false;
    }
  };

  // Fetch from hybrid database layer on mount or tab change
  const loadDatabaseData = async () => {
    setIsLoading(true);
    try {
      // Load system settings from shared database
      const config = await db.getSystemConfig();
      if (config) {
        setBarangayName(config.barangayName);
        localStorage.setItem('kk_barangay_name', config.barangayName);
        setBarangayLogo(config.barangayLogo);
        localStorage.setItem('kk_barangay_logo', config.barangayLogo);
        setSkChairperson(config.skChairperson);
        localStorage.setItem('kk_sk_chairperson', config.skChairperson);
        setPuroks(config.puroks);
        localStorage.setItem('kk_purok_list', JSON.stringify(config.puroks));
        
        const paddedKagawads = [...config.skKagawads];
        while (paddedKagawads.length < 7) {
          paddedKagawads.push('');
        }
        setSkKagawads(paddedKagawads);
        localStorage.setItem('kk_sk_kagawads', JSON.stringify(paddedKagawads));
        
        setSkTreasurer(config.skTreasurer);
        localStorage.setItem('kk_sk_treasurer', config.skTreasurer);
        setSkSecretary(config.skSecretary);
        localStorage.setItem('kk_sk_secretary', config.skSecretary);
        setDistrict(config.district);
        localStorage.setItem('kk_district', config.district);
      }

      // 1. Always load dashboard summary (fast RPC) to keep stats and metrics updated
      const summary = await db.getDashboardSummary();
      if (summary) {
        setDashboardSummary(summary);
      }
      
      // 2. Fetch tab-specific data conditionally to avoid huge eager queries
      if (activeTab === 'youth-list') {
        await fetchPaginatedProfiles();
      } else if (activeTab === 'programs' || activeTab === 'attendance') {
        const fetchedPrograms = await db.getPrograms();
        setPrograms(fetchedPrograms);
      } else if (activeTab === 'add-youth' || activeTab === 'dashboard') {
        const fetchedSubmissions = await db.getSubmissions();
        setSubmissions(fetchedSubmissions);
      } else if (activeTab === 'documents') {
        const fetchedDocs = await db.getDocuments();
        setDocuments(fetchedDocs);
        const fetchedProfiles = await db.getProfiles();
        setYouthProfiles(fetchedProfiles);
      } else if (activeTab === 'settings') {
        const fetchedLogs = await db.getAuditLogs();
        setActivityLogs(fetchedLogs);
        setLastSeenLogsCount(prev => prev === 0 ? fetchedLogs.length : prev);
        if (db.isSupabaseConfigured && db.supabase) {
          const fetchedUsers = await db.getSystemUsers();
          setUsers(fetchedUsers);
        } else {
          const saved = localStorage.getItem('kk_users');
          setUsers(saved ? JSON.parse(saved) : []);
        }
      } else if (activeTab === 'reports') {
        const fetchedProfiles = await db.getProfiles();
        setYouthProfiles(fetchedProfiles);
        const fetchedPrograms = await db.getPrograms();
        setPrograms(fetchedPrograms);
      }
    } catch (error) {
      console.error("Error loading database:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaginatedProfiles = async () => {
    setIsLoading(true);
    try {
      const result = await db.getProfilesPaginated({
        page: currentPage,
        pageSize: pageSize,
        search: searchQuery,
        purok: purokFilter,
        gender: genderFilter,
        isRegisteredVoter: voterFilter === 'Voter' ? true : voterFilter === 'Non-Voter' ? false : undefined,
        civilStatus: civilStatusFilter,
        workStatus: workStatusFilter,
        youthClassification: classificationFilter,
        educationLevel: educationFilter,
        status: statusFilter
      });
      setPaginatedProfiles(result.profiles);
      setTotalProfilesCount(result.totalCount);
    } catch (err) {
      console.error("Error loading paginated profiles:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDatabaseData();
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'youth-list' && isAuthenticated) {
      fetchPaginatedProfiles();
    }
  }, [
    activeTab,
    currentPage,
    searchQuery,
    purokFilter,
    genderFilter,
    voterFilter,
    civilStatusFilter,
    workStatusFilter,
    classificationFilter,
    educationFilter,
    statusFilter,
    isAuthenticated
  ]);

  const handleSimulateQRScan = () => {
    // Find an absent youth to check in
    const absentYouth = attendanceRecords.find(record => record.status === 'Absent');
    
    if (absentYouth) {
      playScanBeep();
      // Mark as Present
      setAttendanceRecords(prev => prev.map(rec => {
        if (rec.id === absentYouth.id) {
          const now = new Date();
          const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return { ...rec, status: 'Present', timeIn: timeString };
        }
        return rec;
      }));

      // Update in-memory youth metrics
      setYouthProfiles(prev => prev.map(y => {
        if (y.id === absentYouth.id) {
          return {
            ...y,
            participationRate: Math.min(y.participationRate + 2, 100)
          };
        }
        return y;
      }));

      // Increment present count in program
      setPrograms(prev => prev.map(p => {
        if (p.title === selectedAttendanceProgram) {
          return { ...p, presentCount: p.presentCount + 1 };
        }
        return p;
      }));

      setScanNotification({
        message: `APPROVED: ${absentYouth.name} successfully checked into ${selectedAttendanceProgram}!`,
        type: 'success'
      });
    } else {
      setScanNotification({
        message: "SYSTEM NOTE: All active simulated attendees are already marked present.",
        type: 'info'
      });
    }
  };


  const requiresWorkSpecify = (status: string) => {
    return status === 'Employed' || status === 'Self-employed';
  };

  const skillSuggestions = [
    "Basketball", "Badminton", "Pickleball", "Volleyball", "Esports", 
    "Coding", "Photography", "Cooking", "Music", "Writing", 
    "First Aid", "Design", "Leadership"
  ];

  const handleAddSuggestion = (suggested: string) => {
    if (!newYouth.skills.includes(suggested)) {
      setNewYouth(prev => ({
        ...prev,
        skills: [...prev.skills, suggested]
      }));
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = skillInput.trim();
      if (val && !newYouth.skills.includes(val)) {
        setNewYouth(prev => ({
          ...prev,
          skills: [...prev.skills, val]
        }));
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setNewYouth(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const getInputClass = (isInvalid: boolean, isPage2: boolean = false) => {
    const hasError = isPage2 ? (triedSubmit && isInvalid) : (triedNextStep && isInvalid);
    return `w-full bg-[#181818] border border-outline-variant/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 ${
      hasError ? 'border-red-500/80 focus:ring-red-500 bg-red-500/5' : 'focus:ring-primary'
    }`;
  };

  const isPage1Valid = () => {
    const isGenderSpecifyValid = !(newYouth.gender === 'LGBTQIA+' || newYouth.gender === 'Unlabeled') || newYouth.genderSpecify.trim() !== '';
    return (
      newYouth.firstName.trim() !== '' &&
      newYouth.lastName.trim() !== '' &&
      newYouth.dob.trim() !== '' &&
      newYouth.age >= 15 &&
      newYouth.age <= 30 &&
      newYouth.email.trim() !== '' &&
      newYouth.email.includes('@') &&
      newYouth.contactNumber.trim() !== '' &&
      newYouth.facebookLink.trim() !== '' &&
      newYouth.address.trim() !== '' &&
      isGenderSpecifyValid
    );
  };

  const isPage2Valid = () => {
    const isYouthClassificationValid = newYouth.youthClassification !== '';
    const isRegisteredVoterValid = newYouth.registeredVoter !== '';
    const isParticipatedLastKKElectionValid = newYouth.participatedLastKKElection !== '';
    const isAttendedKKAssemblyValid = newYouth.attendedKKAssembly !== '';
    const isEducationBackgroundValid = newYouth.educationBackground !== '';
    const isWorkStatusValid = newYouth.workStatus !== '';
    const isHasScholarshipValid = newYouth.hasScholarship !== '';

    const isAssemblyCountValid = newYouth.attendedKKAssembly !== 'Yes' || (newYouth.kkAssemblyCount !== undefined && newYouth.kkAssemblyCount !== null && newYouth.kkAssemblyCount >= 0);
    const isScholarshipSpecifyValid = newYouth.hasScholarship !== 'Yes' || newYouth.scholarshipSpecify.trim() !== '';
    const isEducationSpecifyValid = true; // Optional field
    const isWorkSpecifyValid = !requiresWorkSpecify(newYouth.workStatus) || newYouth.workSpecify.trim() !== '';

    return (
      isYouthClassificationValid &&
      isRegisteredVoterValid &&
      isParticipatedLastKKElectionValid &&
      isAttendedKKAssemblyValid &&
      isEducationBackgroundValid &&
      isWorkStatusValid &&
      isHasScholarshipValid &&
      isAssemblyCountValid &&
      isScholarshipSpecifyValid &&
      isEducationSpecifyValid &&
      isWorkSpecifyValid
    );
  };

  const getYouthAgeGroup = (age: number): string => {
    const matched = ageGroups.find(g => age >= g.minAge && age <= g.maxAge);
    if (matched) {
      return `${matched.label} (${matched.minAge}-${matched.maxAge} yrs old)`;
    }
    return "Out of Range (Not Configured)";
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setPurokFilter('All');
    setGenderFilter('All');
    setVoterFilter('All');
    setCivilStatusFilter('All');
    setWorkStatusFilter('All');
    setClassificationFilter('All');
    setEducationFilter('All');
    setStatusFilter('All');
  };

  const handleExportToCSV = async () => {
    setIsLoading(true);
    let profilesToExport = youthProfiles;
    if (profilesToExport.length === 0) {
      try {
        profilesToExport = await db.getProfiles();
      } catch (err) {
        console.error("Error loading profiles for export:", err);
      }
    }
    setIsLoading(false);

    const headers = [
      "ID", "First Name", "Middle Name", "Last Name", "Age", "Gender", "Date of Birth",
      "Civil Status", "Blood Type", "Nationality", "Contact Number", "Email", "Home Address",
      "Purok", "Registered Voter", "Precinct Number", "Education Level", "Educational Status",
      "Scholarship Status", "Youth Classification", "Work Status", "Work Specify",
      "Education Background", "Education Specify", "Has Scholarship", "Scholarship Specify",
      "Participated Last KK Election", "Attended KK Assembly", "KK Assembly Count", "Skills",
      "Status", "Joined Date"
    ];

    const rows = profilesToExport.map(p => [
      p.id,
      p.firstName,
      p.middleName || "",
      p.lastName,
      p.age,
      p.gender,
      p.dob,
      p.civilStatus,
      p.bloodType,
      p.nationality,
      p.contactNumber,
      p.email,
      p.address,
      p.purok,
      p.isRegisteredVoter ? "Yes" : "No",
      p.precinctNumber || "",
      p.educationLevel,
      p.educationalStatus,
      p.scholarshipStatus,
      p.youthClassification || "",
      p.workStatus || "",
      p.workSpecify || "",
      p.educationBackground || "",
      p.educationSpecify || "",
      p.hasScholarship || "",
      p.scholarshipSpecify || "",
      p.participatedLastKKElection || "",
      p.attendedKKAssembly || "",
      p.kkAssemblyCount || 0,
      (p.skills || []).join("; "),
      p.status,
      p.joinedDate
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(val => {
        const strVal = String(val).replace(/"/g, '""');
        return strVal.includes(",") || strVal.includes("\n") || strVal.includes('"') 
          ? `"${strVal}"` 
          : strVal;
      }).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `corum_youth_residents_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setScanNotification({
      message: `SUCCESS: Database exported successfully to Excel-compatible CSV file!`,
      type: 'success'
    });
  };

  const handleAddYouth = async (e: React.FormEvent) => {
    e.preventDefault();
    setTriedSubmit(true);
    if (!isPage1Valid() || !isPage2Valid()) return;

    const newId = `YTH-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const mappedEducationLevel = newYouth.educationSpecify
      ? `${newYouth.educationBackground} (${newYouth.educationSpecify})`
      : newYouth.educationBackground;
    
    const mappedEducationalStatus = (newYouth.youthClassification === 'Working Youth' && newYouth.workSpecify)
      ? `Working Youth (${newYouth.workSpecify})`
      : newYouth.youthClassification;

    const mappedScholarshipStatus = newYouth.hasScholarship === 'Yes' ? (newYouth.scholarshipSpecify || 'Yes') : 'None';

    const addedProfile: db.YouthProfile = {
      id: newId,
      firstName: newYouth.firstName || "Anonymous",
      lastName: newYouth.lastName || "Youth",
      middleName: newYouth.middleName || "",
      age: Number(newYouth.age) || 18,
      gender: ((newYouth.gender === 'LGBTQIA+' || newYouth.gender === 'Unlabeled') && newYouth.genderSpecify
        ? newYouth.genderSpecify
        : newYouth.gender) as any,
      dob: newYouth.dob || "2008-01-01",
      civilStatus: (newYouth.civilStatus as any) || "Single",
      bloodType: "N/A",
      nationality: newYouth.nationality || "Filipino",
      contactNumber: newYouth.contactNumber || "+63 900 000 0000",
      email: newYouth.email || "resident@corum.gov",
      facebookLink: newYouth.facebookLink || "",
      address: newYouth.address || "Brgy. San Antonio",
      purok: newYouth.purok || "East",
      isRegisteredVoter: newYouth.registeredVoter === 'Yes',
      precinctNumber: newYouth.registeredVoter === 'Yes' ? newYouth.precinctNumber : "",
      educationLevel: mappedEducationLevel,
      educationalStatus: mappedEducationalStatus,
      scholarshipStatus: mappedScholarshipStatus,
      youthClassification: newYouth.youthClassification,
      workStatus: newYouth.workStatus,
      workSpecify: newYouth.workSpecify,
      educationBackground: newYouth.educationBackground,
      educationSpecify: newYouth.educationSpecify,
      hasScholarship: newYouth.hasScholarship,
      scholarshipSpecify: newYouth.scholarshipSpecify,
      participatedLastKKElection: newYouth.participatedLastKKElection,
      attendedKKAssembly: newYouth.attendedKKAssembly,
      kkAssemblyCount: newYouth.kkAssemblyCount,
      skills: (newYouth.skills && newYouth.skills.length > 0) ? newYouth.skills : ["Teamwork"],
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuChyOvu3leC_dDOUGY31FsXkHDgQfmvUH-az42b2vnwE6iixNNUoe72klFCfGDQiR0uwQ4hn59r2_ojZ-X6SaNClayVUaLB8VXl5Jc2ipN_eAzapxK3EsMadzIBQurGAqL8Y17xvC_iVadws3hR_ehTNkneRDctkbrPOyLEBm4F3PzH1f1MO9aCQd_-rTX3R3J-V4nPp-JDJt4SZ8XuXbJlV76RUFdHsqBnrZSTsS0HsekalQfwLGvJdaNSJvYWFa7F4yGi-ttdW8Y",
      status: "Active",
      participationRate: 100,
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      attendanceLogs: []
    };

    const saved = await db.saveProfile(addedProfile);
    logActivity('INSERT', 'youth_profiles', null, { id: saved.id, name: `${saved.firstName} ${saved.lastName}`, purok: saved.purok });
    setYouthProfiles([saved, ...youthProfiles]);

    setAttendanceRecords(prev => [
      ...prev,
      { id: saved.id, name: `${saved.firstName} ${saved.lastName}`, purok: saved.purok, timeIn: "--:--", status: "Absent" }
    ]);

    setNewYouth({
      firstName: '',
      lastName: '',
      middleName: '',
      age: 18,
      gender: 'Male',
      genderSpecify: '',
      dob: '',
      civilStatus: 'Single',
      nationality: 'Filipino',
      contactNumber: '',
      email: '',
      facebookLink: '',
      address: '',
      purok: 'East',
      registeredVoter: 'Yes',
      precinctNumber: '',
      participatedLastKKElection: 'No',
      attendedKKAssembly: 'No',
      kkAssemblyCount: 0,
      educationBackground: 'High School Graduate',
      youthClassification: 'In School Youth (Nag skwela)',
      workStatus: 'Unemployed',
      hasScholarship: 'No',
      scholarshipSpecify: '',
      skills: [] as string[],
      workSpecify: '',
      educationSpecify: ''
    });

    setAddYouthStep(1);
    setTriedNextStep(false);
    setTriedSubmit(false);

    setScanNotification({
      message: `SUCCESS: ${saved.firstName} ${saved.lastName} has been added to CORUM database!`,
      type: 'success'
    });

    setActiveTab('youth-list');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setBulkText(text);
      setBulkImportError(null);
    };
    reader.onerror = () => {
      setBulkImportError("Failed to read file.");
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setBulkText(text);
      setBulkImportError(null);
    };
    reader.onerror = () => {
      setBulkImportError("Failed to read file.");
    };
    reader.readAsText(file);
  };

  const normalizeDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    const cleanStr = dateStr.trim();
    
    // YYYY-MM-DD or YYYY/MM/DD
    let match = cleanStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (match) {
      const y = match[1];
      const m = match[2].padStart(2, '0');
      const d = match[3].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    
    // DD-MM-YYYY or MM-DD-YYYY
    match = cleanStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (match) {
      const val1 = parseInt(match[1], 10);
      const val2 = parseInt(match[2], 10);
      const y = match[3];
      
      let m = 1;
      let d = 1;
      
      if (val1 > 12) {
        // Must be DD/MM/YYYY
        d = val1;
        m = val2;
      } else if (val2 > 12) {
        // Must be MM/DD/YYYY
        m = val1;
        d = val2;
      } else {
        // Default to MM/DD/YYYY
        m = val1;
        d = val2;
      }
      
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
    
    // Fallback to JS Date
    const d = new Date(cleanStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    
    return null;
  };

  const sanitizeField = (value: any): any => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.startsWith('=') || trimmed.startsWith('+') || trimmed.startsWith('-') || trimmed.startsWith('@')) {
        return `'` + trimmed;
      }
      return trimmed;
    }
    return value;
  };

  const parseBulkText = (rawText: string): { data: any[]; errors: string[] } => {
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const errors: string[] = [];
    if (lines.length < 2) {
      return { data: [], errors: ["Import rejected: CSV must contain a header row and at least one data row."] };
    }

    const firstLine = lines[0];
    let separator = ',';
    if (firstLine.includes('\t')) separator = '\t';
    else if (firstLine.includes(';')) separator = ';';

    const headers = firstLine.split(separator).map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

    const splitLine = (line: string) => {
      if (separator === '\t') return line.split('\t');
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === separator && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result.map(v => v.replace(/^["']|["']$/g, ''));
    };

    const parsed: any[] = [];
    
    // Strict validation schema for incoming CSV row object
    const rowSchema = z.object({
      firstName: z.string().min(1, "First Name is required"),
      lastName: z.string().min(1, "Last Name is required"),
      dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Birthdate must be a valid date formatted as YYYY-MM-DD"),
      purok: z.string().min(1, "Purok is required")
    });

    for (let i = 1; i < lines.length; i++) {
      const values = splitLine(lines[i]);
      const rowObj: any = {};
      headers.forEach((header, index) => {
        if (index < values.length) {
          rowObj[header] = values[index];
        }
      });

      const getValue = (keys: string[], defaultValue: any) => {
        for (const k of keys) {
          const matchKey = headers.find(h => h === k || h.replace(/\s+/g, '').includes(k.replace(/\s+/g, '')));
          if (matchKey && rowObj[matchKey] !== undefined && rowObj[matchKey] !== '') {
            return rowObj[matchKey];
          }
        }
        return defaultValue;
      };

      const rawFirstName = getValue(['first name', 'firstname', 'first', 'name', 'pangalan'], '');
      const rawLastName = getValue(['last name', 'lastname', 'last', 'apelyido'], '');
      const rawMiddleName = getValue(['middle name', 'middlename', 'middle'], '');
      const rawDobInput = getValue(['birthdate', 'dob', 'date of birth', 'kapanganakan'], '');
      const rawPurokInput = getValue(['purok', 'sector', 'purok area'], '');

      const rowErrors: string[] = [];

      const parsedDob = rawDobInput ? normalizeDate(rawDobInput) : null;
      
      let matchedPurok: string | undefined = undefined;
      if (rawPurokInput) {
        const pInput = rawPurokInput.trim().toLowerCase();
        const found = puroks.find(p => p.toLowerCase() === pInput || p.toLowerCase().includes(pInput));
        if (found) matchedPurok = found;
      }

      // Safe parse with schema
      const zodResult = rowSchema.safeParse({
        firstName: rawFirstName,
        lastName: rawLastName,
        dob: parsedDob || '',
        purok: matchedPurok || ''
      });

      if (!zodResult.success) {
        zodResult.error.issues.forEach(err => {
          rowErrors.push(err.message);
        });
      }

      if (rawDobInput && !parsedDob) {
        rowErrors.push(`Invalid birthdate format: "${rawDobInput}"`);
      }
      if (rawPurokInput && !matchedPurok) {
        rowErrors.push(`Purok sector "${rawPurokInput}" is not registered in this Barangay`);
      }

      if (rowErrors.length > 0) {
        errors.push(`Row ${i + 1}: ${rowErrors.join(', ')}`);
        continue;
      }

      let calculatedAge = parseInt(getValue(['age', 'edad'], ''), 10);
      if (isNaN(calculatedAge) && parsedDob) {
        try {
          const birthDate = new Date(parsedDob);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          calculatedAge = age;
        } catch (_) {}
      }
      if (isNaN(calculatedAge) || calculatedAge < 15 || calculatedAge > 30) {
        calculatedAge = 18;
      }

      let rawGender = getValue(['gender', 'kasarian', 'sex'], 'Male').trim();
      if (rawGender.toLowerCase().startsWith('m')) rawGender = 'Male';
      else if (rawGender.toLowerCase().startsWith('f')) rawGender = 'Female';
      else rawGender = 'Unlabeled';

      const rawCivilStatus = getValue(['civil status', 'civilstatus', 'status'], 'Single');
      const rawBloodType = getValue(['blood type', 'bloodtype', 'blood'], 'O+');
      const rawNationality = getValue(['nationality', 'bansa'], 'Filipino');
      const rawContact = getValue(['contact number', 'contact', 'phone', 'telephone', 'telepono'], '+63 900 000 0000');
      const rawEmail = getValue(['email', 'e-mail', 'mail'], 'resident@kksync.gov');
      const rawAddress = getValue(['address', 'home address', 'tirahan'], 'Brgy. San Antonio');
      
      const rawVoterValue = getValue(['voter', 'registered voter', 'is voter', 'botante'], 'false').toLowerCase();
      const rawVoter = rawVoterValue === 'true' || rawVoterValue === 'yes' || rawVoterValue === '1' || rawVoterValue === 'voter';
      const rawPrecinct = getValue(['precinct', 'precinct number', 'precinctnumber'], '');

      const rawEduLevel = getValue(['education level', 'educationlevel', 'level'], 'High School');
      const rawEduStatus = getValue(['educational status', 'educationalstatus', 'status'], 'Student');
      const rawScholarship = getValue(['scholarship status', 'scholarshipstatus', 'scholarship'], 'None');

      let parsedWorkStatus = getValue(['work status', 'workstatus', 'work_status', 'employment status', 'work'], 'Unemployed').trim();
      const workOptions = [
        "Employed", "Unemployed", "Self-employed",
        "Currently looking for a job", "Not interested looking for a job"
      ];
      const matchedWork = workOptions.find(opt => opt.toLowerCase() === parsedWorkStatus.toLowerCase() || opt.toLowerCase().includes(parsedWorkStatus.toLowerCase()));
      const rawWorkStatus = matchedWork || parsedWorkStatus || 'Unemployed';

      const rawWorkSpecify = getValue(['work specify', 'workspecify', 'work_specify', 'occupation', 'job'], '');

      let parsedEduBackground = getValue(['education background', 'educationbackground', 'education_background', 'attainment'], '').trim();
      const eduOptions = [
        "Elementary Level", "Elementary Graduate",
        "High School Level", "High School Graduate",
        "Vocational Graduate",
        "College Level", "College Graduate",
        "Masters Level", "Masters Graduate",
        "Doctorate Level", "Doctorate Graduate"
      ];
      if (parsedEduBackground.toLowerCase().includes('vocational') || parsedEduBackground.toLowerCase().includes('tesda') || parsedEduBackground.toLowerCase().includes('vocation')) {
        parsedEduBackground = 'Vocational Graduate';
      }
      const matchedEdu = eduOptions.find(opt => opt.toLowerCase() === parsedEduBackground.toLowerCase() || opt.toLowerCase().includes(parsedEduBackground.toLowerCase()));
      const rawEduBackground = matchedEdu || parsedEduBackground || 'High School Graduate';

      const rawEduSpecify = getValue(['education specify', 'educationspecify', 'education_specify', 'course', 'strand'], '');

      let parsedYouthClassification = getValue(['youth classification', 'youthclassification', 'youth_classification', 'classification'], 'In School Youth (Nag skwela)').trim();
      const classOptions = [
        "In School Youth (Nag skwela)",
        "Out of School Youth (Wala nag Skwela)",
        "Working Youth",
        "Youth w/ specific needs: PWD"
      ];
      const matchedClass = classOptions.find(opt => opt.toLowerCase() === parsedYouthClassification.toLowerCase() || opt.toLowerCase().includes(parsedYouthClassification.toLowerCase()));
      const rawYouthClassification = matchedClass || parsedYouthClassification || 'In School Youth (Nag skwela)';
      const rawHasScholarship = getValue(['has scholarship', 'hasscholarship', 'has_scholarship', 'scholar'], 'No');
      const rawScholarshipSpecify = getValue(['scholarship specify', 'scholarshipspecify', 'scholarship_specify'], '');
      const rawParticipatedLastKK = getValue(['participated last kk election', 'participatedlastkkelection', 'participated_last_kk_election', 'kk election'], 'No');
      const rawAttendedKKAssembly = getValue(['attended kk assembly', 'attendedkkassembly', 'attended_kk_assembly', 'assembly'], 'No');
      let rawAssemblyCount = parseInt(getValue(['kk assembly count', 'kkassemblycount', 'kk_assembly_count', 'assembly count'], '0'), 10);
      if (isNaN(rawAssemblyCount)) rawAssemblyCount = 0;
      const rawFacebookLink = getValue(['facebook link', 'facebooklink', 'facebook_link', 'facebook', 'fb'], '');

      const rawSkillsText = getValue(['skills', 'talento', 'kakayahan'], '');
      const rawSkills = rawSkillsText ? rawSkillsText.split(',').map((s: string) => sanitizeField(s.trim())).filter((s: string) => s.length > 0) : [sanitizeField('Teamwork')];

      parsed.push({
        firstName: sanitizeField(rawFirstName),
        lastName: sanitizeField(rawLastName),
        middleName: sanitizeField(rawMiddleName),
        age: calculatedAge,
        gender: sanitizeField(rawGender),
        dob: parsedDob,
        civilStatus: sanitizeField(rawCivilStatus),
        bloodType: sanitizeField(rawBloodType),
        nationality: sanitizeField(rawNationality),
        contactNumber: sanitizeField(rawContact),
        email: sanitizeField(rawEmail),
        address: sanitizeField(rawAddress),
        purok: matchedPurok,
        isRegisteredVoter: rawVoter,
        precinctNumber: sanitizeField(rawPrecinct),
        educationLevel: sanitizeField(rawEduLevel),
        educationalStatus: sanitizeField(rawEduStatus),
        scholarshipStatus: sanitizeField(rawScholarship),
        youthClassification: sanitizeField(rawYouthClassification),
        workStatus: sanitizeField(rawWorkStatus),
        workSpecify: sanitizeField(rawWorkSpecify),
        educationBackground: sanitizeField(rawEduBackground),
        educationSpecify: sanitizeField(rawEduSpecify),
        hasScholarship: sanitizeField(rawHasScholarship),
        scholarshipSpecify: sanitizeField(rawScholarshipSpecify),
        participatedLastKKElection: sanitizeField(rawParticipatedLastKK),
        attendedKKAssembly: sanitizeField(rawAttendedKKAssembly),
        kkAssemblyCount: rawAssemblyCount,
        facebookLink: sanitizeField(rawFacebookLink),
        skills: rawSkills,
        avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuChyOvu3leC_dDOUGY31FsXkHDgQfmvUH-az42b2vnwE6iixNNUoe72klFCfGDQiR0uwQ4hn59r2_ojZ-X6SaNClayVUaLB8VXl5Jc2ipN_eAzapxK3EsMadzIBQurGAqL8Y17xvC_iVadws3hR_ehTNkneRDctkbrPOyLEBm4F3PzH1f1MO9aCQd_-rTX3R3J-V4nPp-JDJt4SZ8XuXbJlV76RUFdHsqBnrZSTsS0HsekalQfwLGvJdaNSJvYWFa7F4yGi-ttdW8Y",
        status: "Active"
      });
    }

    return { data: errors.length === 0 ? parsed : [], errors };
  };

  useEffect(() => {
    if (!bulkText.trim()) {
      setParsedProfiles([]);
      setBulkImportError(null);
      return;
    }
    try {
      const { data, errors } = parseBulkText(bulkText);
      if (errors.length > 0) {
        setBulkImportError(errors.join('\n'));
        setParsedProfiles([]);
      } else {
        setParsedProfiles(data);
        setBulkImportError(null);
      }
    } catch (err) {
      setBulkImportError("Error parsing input data. Please check column formats.");
      setParsedProfiles([]);
    }
  }, [bulkText]);

  const handleBulkImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedProfiles.length === 0) {
      setBulkImportError("No valid profiles parsed. Please upload a file or paste data.");
      return;
    }
    setIsLoading(true);
    try {
      const saved = await db.saveProfilesBulk(parsedProfiles);
      logActivity('INSERT', 'youth_profiles (BULK)', null, { count: saved.length, message: `Bulk imported ${saved.length} profiles` });
      
      // Also add to active attendance records
      setAttendanceRecords(prev => [
        ...prev,
        ...saved.map(s => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          purok: s.purok,
          timeIn: "--:--",
          status: "Absent" as const
        }))
      ]);

      await loadDatabaseData();
      setActiveTab('youth-list');
      
      // Reset bulk upload state
      setBulkText('');
      setParsedProfiles([]);
      setImportTab('single');

      setScanNotification({
        message: `SUCCESS: Successfully imported ${saved.length} youth records in bulk!`,
        type: 'success'
      });
    } catch (err) {
      setBulkImportError("Bulk import failed. Please check database connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newProg: Omit<db.Program, 'id' | 'registeredCount' | 'presentCount'> = {
        title: newProgram.title || "New Program",
        description: newProgram.description || "Description",
        category: (newProgram.category as any) || "Education",
        startDate: newProgram.startDate || new Date().toISOString().split('T')[0],
        endDate: newProgram.endDate || new Date().toISOString().split('T')[0],
        status: (newProgram.status as any) || "Draft",
        budget: Number(newProgram.budget) || 0
      };

      const saved = await db.saveProgram(newProg as any);
      logActivity('INSERT', 'programs', null, saved);
      setPrograms([saved, ...programs]);
      setIsAddProgramModalOpen(false);
      
      // Reset Form
      setNewProgram({
        title: '', description: '', category: 'Education', startDate: '', endDate: '', status: 'Draft'
      });

      setScanNotification({
        message: `SUCCESS: "${saved.title}" program has been created!`,
        type: 'success'
      });
    } catch (err: any) {
      console.error("Failed to add program:", err);
      setScanNotification({
        message: `ERROR: Failed to save program. Please check your network connection.`,
        type: 'error'
      });
      setIsAddProgramModalOpen(false);
    }
  };

  const handleApproveSubmission = async (sub: db.RegistrationSubmission) => {
    playScanBeep();
    try {
      const success = await db.updateSubmissionStatus(sub.id, 'Approved');
      if (!success) {
        setScanNotification({ message: "ERROR: Failed to approve submission.", type: 'error' });
        return;
      }
      logActivity('UPDATE', 'registration_submissions', { id: sub.id, status: 'Pending' }, { id: sub.id, status: 'Approved' });

      const addedProfile: Omit<db.YouthProfile, 'participationRate' | 'joinedDate'> = {
        id: `YTH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        firstName: sub.formData.firstName,
        lastName: sub.formData.lastName,
        middleName: sub.formData.middleName || "",
        age: sub.formData.age,
        gender: sub.formData.gender,
        dob: sub.formData.dob,
        civilStatus: sub.formData.civilStatus,
        bloodType: sub.formData.bloodType,
        nationality: sub.formData.nationality,
        contactNumber: sub.formData.contactNumber,
        email: sub.formData.email,
        facebookLink: sub.formData.facebookLink || "",
        address: sub.formData.address,
        purok: sub.formData.purok,
        isRegisteredVoter: sub.formData.isRegisteredVoter,
        precinctNumber: sub.formData.precinctNumber || "",
        educationLevel: sub.formData.educationLevel,
        educationalStatus: sub.formData.educationalStatus,
        scholarshipStatus: sub.formData.scholarshipStatus,
        youthClassification: (sub.formData as any).youthClassification || '',
        workStatus: (sub.formData as any).workStatus || '',
        workSpecify: (sub.formData as any).workSpecify || '',
        educationBackground: (sub.formData as any).educationBackground || '',
        educationSpecify: (sub.formData as any).educationSpecify || '',
        hasScholarship: (sub.formData as any).hasScholarship || '',
        scholarshipSpecify: (sub.formData as any).scholarshipSpecify || '',
        participatedLastKKElection: (sub.formData as any).participatedLastKKElection || '',
        attendedKKAssembly: (sub.formData as any).attendedKKAssembly || '',
        kkAssemblyCount: (sub.formData as any).kkAssemblyCount || 0,
        skills: sub.formData.skills,
        avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuChyOvu3leC_dDOUGY31FsXkHDgQfmvUH-az42b2vnwE6iixNNUoe72klFCfGDQiR0uwQ4hn59r2_ojZ-X6SaNClayVUaLB8VXl5Jc2ipN_eAzapxK3EsMadzIBQurGAqL8Y17xvC_iVadws3hR_ehTNkneRDctkbrPOyLEBm4F3PzH1f1MO9aCQd_-rTX3R3J-V4nPp-JDJt4SZ8XuXbJlV76RUFdHsqBnrZSTsS0HsekalQfwLGvJdaNSJvYWFa7F4yGi-ttdW8Y",
        status: "Active"
      };

      const saved = await db.saveProfile(addedProfile);
      logActivity('INSERT', 'youth_profiles', null, { id: saved.id, name: `${saved.firstName} ${saved.lastName}`, purok: saved.purok });
      await loadDatabaseData();

      setScanNotification({
        message: `APPROVED & SYNCED: ${saved.firstName} ${saved.lastName} is now a registered youth resident!`,
        type: 'success'
      });
    } catch (err: any) {
      console.error("Failed to approve submission:", err);
      setScanNotification({
        message: "ERROR: Failed to approve submission due to a connection timeout.",
        type: 'error'
      });
    }
  };

  const handleRejectSubmission = async (id: string, notes: string) => {
    try {
      const success = await db.updateSubmissionStatus(id, 'Rejected', notes);
      if (!success) {
        setScanNotification({ message: "ERROR: Failed to reject submission.", type: 'error' });
        return;
      }
      logActivity('UPDATE', 'registration_submissions', { id, status: 'Pending' }, { id, status: 'Rejected', reviewerNotes: notes });

      await loadDatabaseData();

      setScanNotification({
        message: `REJECTED: Registration Request #${id} has been marked as rejected.`,
        type: 'info'
      });
    } catch (err: any) {
      console.error("Failed to reject submission:", err);
      setScanNotification({
        message: "ERROR: Failed to reject submission due to a connection timeout.",
        type: 'error'
      });
    }
  };

  const handleArchiveYouth = async (id: string) => {
    const profile = youthProfiles.find(p => p.id === id);
    if (!profile) return;
    if (!window.confirm(`Are you sure you want to archive the record for ${profile.firstName} ${profile.lastName}?`)) {
      return;
    }
    const success = await db.updateProfileStatus(id, 'Archived');
    if (success) {
      logActivity('UPDATE', 'youth_profiles', { id, status: profile.status }, { id, status: 'Archived' });
      await loadDatabaseData();
      setSelectedYouthId(null);
      setScanNotification({
        message: `ARCHIVED: ${profile.firstName} ${profile.lastName}'s record has been archived.`,
        type: 'info'
      });
    } else {
      setScanNotification({
        message: "ERROR: Failed to archive profile record.",
        type: 'error'
      });
    }
  };

  // Close notifications after 4s
  useEffect(() => {
    if (scanNotification) {
      const timer = setTimeout(() => {
        setScanNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [scanNotification]);



  const selectedYouth = youthProfiles.find(y => y.id === selectedYouthId) || paginatedProfiles.find(y => y.id === selectedYouthId);

  if (isLoadingUser) {
    return (
      <div className="bg-surface text-[#e5e2e1] min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- Render Login Page ---
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={handleLogin}
        loginError={loginError}
        isLoggingIn={isLoggingIn}
        dbStatus={dbStatus}
        barangayLogo={barangayLogo}
      />
    );
  }

  // --- Dashboard Data Calculations ---
  const maleCount = youthProfiles.filter(y => y.gender === 'Male').length;
  const femaleCount = youthProfiles.filter(y => y.gender === 'Female').length;
  const otherCount = youthProfiles.filter(y => y.gender !== 'Male' && y.gender !== 'Female').length;
  const totalGender = maleCount + femaleCount + otherCount || 1;
  const malePercent = Math.round((maleCount / totalGender) * 100);
  const femalePercent = Math.round((femaleCount / totalGender) * 100);

  const age15to17Count = youthProfiles.filter(y => y.age >= 15 && y.age <= 17).length;
  const age18to24Count = youthProfiles.filter(y => y.age >= 18 && y.age <= 24).length;
  const age25to30Count = youthProfiles.filter(y => y.age >= 25 && y.age <= 30).length;
  const totalAgeGroups = age15to17Count + age18to24Count + age25to30Count || 1;
  const age15to17Percent = Math.round((age15to17Count / totalAgeGroups) * 100);
  const age18to24Percent = Math.round((age18to24Count / totalAgeGroups) * 100);
  const age25to30Percent = Math.round((age25to30Count / totalAgeGroups) * 100);

  const highSchoolCount = youthProfiles.filter(y => {
    const s = (y.educationalStatus || '').toLowerCase();
    const l = (y.educationLevel || '').toLowerCase();
    const b = (y.educationBackground || '').toLowerCase();
    return s.includes('high school') || l.includes('high school') || b.includes('high school') || s.includes('grade') || s.includes('secondary');
  }).length;
  const collegeCount = youthProfiles.filter(y => {
    const s = (y.educationalStatus || '').toLowerCase();
    const l = (y.educationLevel || '').toLowerCase();
    const b = (y.educationBackground || '').toLowerCase();
    return s.includes('college') || l.includes('college') || b.includes('college') || s.includes('bachelor') || l.includes('bachelor') || s.includes('university') || l.includes('university');
  }).length;
  const vocationalCount = youthProfiles.filter(y => {
    const s = (y.educationalStatus || '').toLowerCase();
    const l = (y.educationLevel || '').toLowerCase();
    const b = (y.educationBackground || '').toLowerCase();
    return s.includes('vocational') || l.includes('vocational') || b.includes('vocational') || s.includes('smaw') || l.includes('smaw') || s.includes('welding') || l.includes('welding') || s.includes('skills');
  }).length;
  const otherEduCount = Math.max(0, youthProfiles.length - (highSchoolCount + collegeCount + vocationalCount));
  const totalEdu = youthProfiles.length || 1;
  const highSchoolPercent = Math.round((highSchoolCount / totalEdu) * 100);
  const collegePercent = Math.round((collegeCount / totalEdu) * 100);
  const vocationalPercent = Math.round((vocationalCount / totalEdu) * 100);
  const otherEduPercent = Math.max(0, 100 - (highSchoolPercent + collegePercent + vocationalPercent));

  const avgParticipationRate = youthProfiles.length > 0
    ? Math.round(youthProfiles.reduce((acc, y) => acc + (y.participationRate || 0), 0) / youthProfiles.length)
    : 0;

  const totalPresent = programs.reduce((acc, p) => acc + (p.presentCount || 0), 0);
  const totalRegistered = programs.reduce((acc, p) => acc + (p.registeredCount || 0), 0);
  const avgAttendanceRate = totalRegistered > 0 ? Math.round((totalPresent / totalRegistered) * 100) : 0;

  // Helper to compute Custom Builder Data
  const getBuilderData = () => {
    let filtered = [...youthProfiles];

    filtered = filtered.filter(y => {
      if (y.age < builderFilterAgeMin || y.age > builderFilterAgeMax) return false;
      if (builderFilterGender !== 'All' && y.gender !== builderFilterGender) return false;
      if (builderFilterPurok !== 'All' && y.purok !== builderFilterPurok) return false;
      if (builderFilterWorkStatus !== 'All' && y.workStatus !== builderFilterWorkStatus) return false;
      if (builderFilterEducation !== 'All' && (y.educationBackground || y.educationLevel) !== builderFilterEducation) return false;
      return true;
    });

    if (builderMetric === 'Out-of-School Youth') {
      filtered = filtered.filter(y => {
        const c = (y.youthClassification || '').toLowerCase();
        return c.includes('out of school') || c.includes('osy') || c.includes('wala nag skwela') || c.includes('wala nag-skwela');
      });
    } else if (builderMetric === 'Active Participants') {
      filtered = filtered.filter(y => y.participationRate >= 50);
    } else if (builderMetric === 'Scholarship Applicants') {
      filtered = filtered.filter(y => y.scholarshipStatus && y.scholarshipStatus !== 'None');
    }

    const groups: { [key: string]: number } = {};
    filtered.forEach(y => {
      let key = 'Unspecified';
      if (builderGrouping === 'Purok') {
        key = y.purok || 'Unspecified';
      } else if (builderGrouping === 'Age Group') {
        if (y.age <= 17) key = '15-17 years';
        else if (y.age <= 24) key = '18-24 years';
        else key = '25-30 years';
      } else if (builderGrouping === 'Gender') {
        key = y.gender || 'Unspecified';
      } else if (builderGrouping === 'Educational Status') {
        key = y.educationalStatus || 'Unspecified';
      } else if (builderGrouping === 'Employment Status') {
        key = y.workStatus || 'Unspecified';
      }
      groups[key] = (groups[key] || 0) + 1;
    });

    return Object.keys(groups).map(name => ({
      name,
      value: groups[name]
    })).sort((a, b) => b.value - a.value);
  };

  const builderData = getBuilderData();
  const builderTotalCount = builderData.reduce((acc, d) => acc + d.value, 0);


  return (
    <div className="bg-background text-on-surface font-body min-h-screen selection:bg-secondary selection:text-on-secondary flex">
      {/* Background Atmospheric Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-secondary/5 blur-[120px]"></div>
      </div>

      {/* --- Side Navigation Bar --- */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setSelectedYouthId={setSelectedYouthId}
        selectedYouthId={selectedYouthId}
        barangayLogo={barangayLogo}
        isAddYouthMenuOpen={isAddYouthMenuOpen}
        setIsAddYouthMenuOpen={setIsAddYouthMenuOpen}
        isAnalyticsMenuOpen={isAnalyticsMenuOpen}
        setIsAnalyticsMenuOpen={setIsAnalyticsMenuOpen}
        importTab={importTab}
        setImportTab={setImportTab}
        reportsSubTab={reportsSubTab}
        setReportsSubTab={setReportsSubTab}
        submissions={submissions}
        programs={programs}
        unreadLogsCount={unreadLogsCount}
        currentUser={currentUser}
        onLogout={handleLogout}
        onAddYouthStepReset={() => { setAddYouthStep(1); }}
        onBulkImportErrorClear={() => { setBulkImportError(null); }}
        onSettingsClick={() => { setActiveTab('settings'); setSettingsSubTab('logs'); setSelectedYouthId(null); }}
      />

      {/* --- Top Navigation Bar --- */}
      <TopBar
        activeTab={activeTab}
        isLoading={isLoading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isOnline={isOnline}
        isSyncing={isSyncing}
        pendingCount={pendingCount}
        syncNow={syncNow}
        isNotificationDropdownOpen={isNotificationDropdownOpen}
        setIsNotificationDropdownOpen={setIsNotificationDropdownOpen}
        submissions={submissions}
        programs={programs}
        setActiveTab={setActiveTab}
        setImportTab={setImportTab}
        setIsAddYouthMenuOpen={setIsAddYouthMenuOpen}
        isHelpModalOpen={isHelpModalOpen}
        setIsHelpModalOpen={setIsHelpModalOpen}
        currentUser={currentUser}
        activityLogs={activityLogs}
        lastSeenLogsCount={lastSeenLogsCount}
        setSettingsSubTab={setSettingsSubTab}
      />

      {/* --- Main Content Window --- */}
      <main className="flex-1 ml-64 pt-24 px-8 pb-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Dynamic Notification Toast */}
          {scanNotification && (
            <div className={`flex items-center justify-between p-4 rounded-xl shadow-lg border backdrop-blur-xl animate-fade-in ${
              scanNotification.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : scanNotification.type === 'error'
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}>
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 animate-bounce" />
                <p className="text-sm font-bold">{scanNotification.message}</p>
              </div>
              <button onClick={() => setScanNotification(null)} className="text-on-surface-variant hover:text-on-surface">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* --- MODULE: 1. DASHBOARD --- */}
          {activeTab === 'dashboard' && selectedYouthId === null && (
            <ErrorBoundary moduleName="Dashboard Panel">
              <Dashboard 
                barangayName={barangayName}
                skChairperson={skChairperson}
                currentUserRole={currentUser.role}
                currentUserName={currentUser.name}
                currentUserStatus={currentUser.status}
                dbStatus={dbStatus}
                realMetrics={dashboardSummary ? {
                  totalYouth: dashboardSummary.metrics.totalYouth,
                  pendingReviews: dashboardSummary.metrics.pendingReviews,
                  activePrograms: dashboardSummary.metrics.activePrograms,
                  upcomingEvents: dashboardSummary.metrics.upcomingEvents,
                  attendanceRate: totalRegistered > 0 ? dashboardSummary.metrics.attendanceRate : 0
                } : undefined}
                realClassificationData={dashboardSummary ? dashboardSummary.classificationData : undefined}
                realPurokData={dashboardSummary ? dashboardSummary.purokData.map(p => {
                  const total = dashboardSummary.metrics.totalYouth || 1;
                  return {
                    purok: p.purok,
                    count: p.count,
                    percentage: Math.round((p.count / total) * 100)
                  };
                }) : undefined}
                realGenderData={dashboardSummary ? dashboardSummary.genderData.map(g => {
                  let color = "#cbd5e1";
                  if (g.name === 'Male') color = "#0f172a";
                  else if (g.name === 'Female') color = "#475569";
                  else if (g.name === 'LGBTQIA+') color = "#10b981";
                  return { name: g.name, value: g.value, color };
                }) : undefined}
                realEducationData={dashboardSummary ? dashboardSummary.educationData : undefined}
                realEmploymentData={dashboardSummary ? dashboardSummary.workData : undefined}
                realPrograms={programs}
                realSkillsData={dashboardSummary ? dashboardSummary.skillsData : undefined}
                realParticipationData={dashboardSummary ? dashboardSummary.participationData : undefined}
                realRecentRegistrations={dashboardSummary ? dashboardSummary.recentRegistrations.map(r => ({ ...r, initials: r.initials || 'YTH', status: r.status as 'Approved' | 'Pending' })) : undefined}
                onAction={(actionType) => {
                  if (actionType === 'add-youth') {
                    setActiveTab('add-youth');
                    setIsAddYouthMenuOpen(true);
                  } else if (actionType === 'import-csv') {
                    setActiveTab('youth-list');
                  } else if (actionType === 'new-event') {
                    setIsAddProgramModalOpen(true);
                  } else if (actionType === 'generate-report') {
                    setIsReportModalOpen(true);
                  } else if (actionType === 'youth-list') {
                    setActiveTab('youth-list');
                    setSelectedYouthId(null);
                  } else if (actionType === 'registry-requests') {
                    setActiveTab('add-youth');
                    setImportTab('registry');
                    setIsAddYouthMenuOpen(true);
                    setBulkImportError(null);
                    setSelectedYouthId(null);
                  } else if (actionType === 'programs') {
                    setActiveTab('programs');
                    setSelectedYouthId(null);
                  } else if (actionType === 'attendance') {
                    setActiveTab('attendance');
                    setSelectedYouthId(null);
                  }
                }}
              />
            </ErrorBoundary>
          )}

          {/* --- MODULE: 2. YOUTH LIST & CRUD --- */}
          {activeTab === 'youth-list' && selectedYouthId === null && (
            <YouthListView
              paginatedProfiles={paginatedProfiles}
              totalProfilesCount={totalProfilesCount}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              pageSize={pageSize}
              puroks={puroks}
              purokFilter={purokFilter}
              setPurokFilter={setPurokFilter}
              genderFilter={genderFilter}
              setGenderFilter={setGenderFilter}
              voterFilter={voterFilter}
              setVoterFilter={setVoterFilter}
              civilStatusFilter={civilStatusFilter}
              setCivilStatusFilter={setCivilStatusFilter}
              workStatusFilter={workStatusFilter}
              setWorkStatusFilter={setWorkStatusFilter}
              classificationFilter={classificationFilter}
              setClassificationFilter={setClassificationFilter}
              educationFilter={educationFilter}
              setEducationFilter={setEducationFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onResetFilters={handleResetFilters}
              onExportToCSV={handleExportToCSV}
              setActiveTab={setActiveTab}
              setSelectedYouthId={setSelectedYouthId}
            />
          )}

          {/* --- BENTO PROFILE DETAIL CANVAS --- */}
          {selectedYouthId !== null && selectedYouth && (
            <YouthProfileDetail
              youth={selectedYouth}
              ageGroups={ageGroups}
              onBack={() => setSelectedYouthId(null)}
              onArchive={handleArchiveYouth}
              getYouthAgeGroup={getYouthAgeGroup}
            />
          )}

          {/* --- MODULE: DOCUMENTS MANAGEMENT --- */}
          {activeTab === 'documents' && selectedYouthId === null && (
            <DocumentsView
              documents={documents}
              setDocuments={setDocuments}
              youthProfiles={youthProfiles}
              documentSearch={documentSearch}
              setDocumentSearch={setDocumentSearch}
              documentTypeFilter={documentTypeFilter}
              setDocumentTypeFilter={setDocumentTypeFilter}
              isDocModalOpen={isDocModalOpen}
              setIsDocModalOpen={setIsDocModalOpen}
              selectedYouthIdForDoc={selectedYouthIdForDoc}
              setSelectedYouthIdForDoc={setSelectedYouthIdForDoc}
              newDocFileName={newDocFileName}
              setNewDocFileName={setNewDocFileName}
              newDocType={newDocType}
              setNewDocType={setNewDocType}
              newDocUrl={newDocUrl}
              setNewDocUrl={setNewDocUrl}
              setScanNotification={setScanNotification}
              logActivity={logActivity}
            />
          )}

          {/* --- MODULE: 5. SYSTEM SETTINGS --- */}
          {activeTab === 'settings' && selectedYouthId === null && (
            <SettingsView
              settingsSubTab={settingsSubTab}
              setSettingsSubTab={setSettingsSubTab}
              isSettingsUnlocked={isSettingsUnlocked}
              setIsSettingsUnlocked={setIsSettingsUnlocked}
              isSecurityModalOpen={isSecurityModalOpen}
              setIsSecurityModalOpen={setIsSecurityModalOpen}
              securityTargetTab={securityTargetTab}
              setSecurityTargetTab={setSecurityTargetTab}
              securityPasswordInput={securityPasswordInput}
              setSecurityPasswordInput={setSecurityPasswordInput}
              activityLogs={activityLogs}
              logSearchQuery={logSearchQuery}
              setLogSearchQuery={setLogSearchQuery}
              stagingBarangayName={stagingBarangayName}
              setStagingBarangayName={setStagingBarangayName}
              stagingSkChairperson={stagingSkChairperson}
              setStagingSkChairperson={setStagingSkChairperson}
              stagingBarangayLogo={stagingBarangayLogo}
              setStagingBarangayLogo={setStagingBarangayLogo}
              stagingPuroks={stagingPuroks}
              setStagingPuroks={setStagingPuroks}
              newPurokName={newPurokName}
              setNewPurokName={setNewPurokName}
              stagingSkKagawads={stagingSkKagawads}
              setStagingSkKagawads={setStagingSkKagawads}
              stagingSkTreasurer={stagingSkTreasurer}
              setStagingSkTreasurer={setStagingSkTreasurer}
              stagingSkSecretary={stagingSkSecretary}
              setStagingSkSecretary={setStagingSkSecretary}
              stagingDistrict={stagingDistrict}
              setStagingDistrict={setStagingDistrict}
              onSaveSettingsConfig={handleSaveSettingsConfig}
              users={users}
              currentUser={currentUser}
              isUserModalOpen={isUserModalOpen}
              setIsUserModalOpen={setIsUserModalOpen}
              newUserName={newUserName}
              setNewUserName={setNewUserName}
              newUserEmail={newUserEmail}
              setNewUserEmail={setNewUserEmail}
              newUserRole={newUserRole}
              setNewUserRole={setNewUserRole}
              editingUserId={editingUserId}
              setEditingUserId={setEditingUserId}
              onCreateOrUpdateUser={handleCreateOrUpdateUser}
              onToggleUserStatus={handleToggleUserStatus}
              onDeleteUser={handleDeleteUser}
              setScanNotification={setScanNotification}
              dbStatus={dbStatus}
              playScanBeep={playScanBeep}
              logActivity={logActivity}
              onUpdateCurrentUser={handleUpdateCurrentUser}
              unreadLogsCount={unreadLogsCount}
            />
          )}

          {/* --- MODULE: ADD YOUTH RESIDENT --- */}
          {activeTab === 'add-youth' && selectedYouthId === null && (
            <AddYouthView
              importTab={importTab}
              addYouthStep={addYouthStep}
              setAddYouthStep={setAddYouthStep}
              triedNextStep={triedNextStep}
              setTriedNextStep={setTriedNextStep}
              triedSubmit={triedSubmit}
              setTriedSubmit={setTriedSubmit}
              newYouth={newYouth}
              setNewYouth={setNewYouth}
              skillInput={skillInput}
              setSkillInput={setSkillInput}
              puroks={puroks}
              onAddYouth={handleAddYouth}
              isPage1Valid={isPage1Valid}
              isPage2Valid={isPage2Valid}
              getInputClass={getInputClass}
              requiresWorkSpecify={requiresWorkSpecify}
              onAddSkill={handleAddSkill}
              onRemoveSkill={handleRemoveSkill}
              onAddSuggestion={handleAddSuggestion}
              skillSuggestions={skillSuggestions}
              bulkText={bulkText}
              setBulkText={setBulkText}
              parsedProfiles={parsedProfiles}
              bulkImportError={bulkImportError}
              isDragging={isDragging}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onFileUpload={handleFileUpload}
              onBulkImportSubmit={handleBulkImportSubmit}
              isLoading={isLoading}
              submissions={submissions}
              registrySubTab={registrySubTab}
              setRegistrySubTab={setRegistrySubTab}
              selectedSubmission={selectedSubmission}
              setSelectedSubmission={setSelectedSubmission}
              rejectionNotes={rejectionNotes}
              setRejectionNotes={setRejectionNotes}
              onApproveSubmission={handleApproveSubmission}
              onRejectSubmission={handleRejectSubmission}
              getYouthAgeGroup={getYouthAgeGroup}
              onClearBulk={() => { setBulkText(''); setParsedProfiles([]); setBulkImportError(null); }}
              onSyncPortalData={loadDatabaseData}
            />
          )}

          {/* --- DISABLED MODULE: 3. ATTENDANCE LOGGER --- */}
          {activeTab === 'attendance' && selectedYouthId === null && (
            <AttendanceLoggerView
              programs={programs}
              selectedAttendanceProgram={selectedAttendanceProgram}
              setSelectedAttendanceProgram={setSelectedAttendanceProgram}
              attendanceRecords={attendanceRecords}
              setAttendanceRecords={setAttendanceRecords}
              onSimulateQRScan={handleSimulateQRScan}
              playScanBeep={playScanBeep}
              setScanNotification={setScanNotification}
              currentUserRole={currentUser.role}
            />
          )}

          {/* --- DISABLED MODULE: 4. PROGRAMS & EVENTS --- */}
          {activeTab === 'programs' && selectedYouthId === null && (
            <ProgramsEventsView 
              programs={programs} 
              currentUserRole={currentUser.role}
              onCreateProgramClick={() => setIsAddProgramModalOpen(true)}
            />
          )}

          {/* --- DISABLED MODULE: 7. ANALYTICS & INSIGHT --- */}
          {activeTab === 'reports' && selectedYouthId === null && (
            <AnalyticsInsightView
              reportsSubTab={reportsSubTab}
              reportsInnerSubTab={reportsInnerSubTab}
              setReportsInnerSubTab={setReportsInnerSubTab}
              setIsReportModalOpen={setIsReportModalOpen}
              onExportReportToCSV={handleExportReportToCSV}
              builderMetric={builderMetric}
              setBuilderMetric={setBuilderMetric}
              builderGrouping={builderGrouping}
              setBuilderGrouping={setBuilderGrouping}
              builderFilterAgeMin={builderFilterAgeMin}
              setBuilderFilterAgeMin={setBuilderFilterAgeMin}
              builderFilterAgeMax={builderFilterAgeMax}
              setBuilderFilterAgeMax={setBuilderFilterAgeMax}
              builderFilterGender={builderFilterGender}
              setBuilderFilterGender={setBuilderFilterGender}
              builderFilterPurok={builderFilterPurok}
              setBuilderFilterPurok={setBuilderFilterPurok}
              builderFilterWorkStatus={builderFilterWorkStatus}
              setBuilderFilterWorkStatus={setBuilderFilterWorkStatus}
              builderFilterEducation={builderFilterEducation}
              setBuilderFilterEducation={setBuilderFilterEducation}
              builderVisualization={builderVisualization}
              setBuilderVisualization={setBuilderVisualization}
              builderReportName={builderReportName}
              setBuilderReportName={setBuilderReportName}
              builderSavedReports={builderSavedReports}
              setBuilderSavedReports={setBuilderSavedReports}
              builderActiveReportId={builderActiveReportId}
              setBuilderActiveReportId={setBuilderActiveReportId}
              builderSavedMessage={builderSavedMessage}
              setBuilderSavedMessage={setBuilderSavedMessage}
              builderData={builderData}
              builderTotalCount={builderTotalCount}
              gisOverlayLayer={gisOverlayLayer}
              setGisOverlayLayer={setGisOverlayLayer}
              gisSelectedPurok={gisSelectedPurok}
              setGisSelectedPurok={setGisSelectedPurok}
              youthProfiles={youthProfiles}
              programs={programs}
              puroks={puroks}
              maleCount={maleCount}
              femaleCount={femaleCount}
              otherCount={otherCount}
              malePercent={malePercent}
              femalePercent={femalePercent}
              age15to17Count={age15to17Count}
              age18to24Count={age18to24Count}
              age25to30Count={age25to30Count}
              age15to17Percent={age15to17Percent}
              age18to24Percent={age18to24Percent}
              age25to30Percent={age25to30Percent}
              highSchoolCount={highSchoolCount}
              collegeCount={collegeCount}
              vocationalCount={vocationalCount}
              otherEduCount={otherEduCount}
              highSchoolPercent={highSchoolPercent}
              collegePercent={collegePercent}
              vocationalPercent={vocationalPercent}
              otherEduPercent={otherEduPercent}
              avgParticipationRate={avgParticipationRate}
              avgAttendanceRate={avgAttendanceRate}
              barangayName={barangayName}
              setScanNotification={setScanNotification}
              currentUserRole={currentUser.role}
            />
          )}

        </div>
      </main>

      {/* Add Program Modal */}
      {isAddProgramModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#131313] border border-[#353535]/15 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative animate-scale-in text-left">
            <button 
              onClick={() => setIsAddProgramModalOpen(false)}
              className="absolute top-4 right-4 text-[#e5e2e1]/60 hover:text-[#e5e2e1] transition-colors"
            >
              <X className="w-5 h-5 text-on-surface" />
            </button>
            
            <h3 className="font-headline font-black text-xl text-[#e5e2e1] mb-2 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-primary" />
              Create New SK Program
            </h3>
            <p className="text-xs text-on-surface-variant border-b border-[#353535]/15 pb-3 mb-4">
              Schedule and profile youth development activities, trainings, and local events.
            </p>

            <form onSubmit={handleAddProgram} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-[#e5e2e1]/60 uppercase tracking-wider text-[10px]">Program Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g., Linggo ng Kabataan 2026 - Basketball League"
                  value={newProgram.title || ''}
                  onChange={e => setNewProgram(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-[#181818] border border-[#353535]/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#e5e2e1]/60 uppercase tracking-wider text-[10px]">Description</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Provide a detailed description of the program objectives and activities..."
                  value={newProgram.description || ''}
                  onChange={e => setNewProgram(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-[#181818] border border-[#353535]/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-[#e5e2e1]/60 uppercase tracking-wider text-[10px]">Category</label>
                  <select 
                    value={newProgram.category || 'Education'}
                    onChange={e => setNewProgram(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full bg-[#181818] border border-[#353535]/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                  >
                    <option value="Education">Education</option>
                    <option value="Health">Health</option>
                    <option value="Sports">Sports & Culture</option>
                    <option value="Disaster Preparedness">Disaster Preparedness</option>
                    <option value="Employment & Livelihood">Employment & Livelihood</option>
                    <option value="Environment">Environmental Protection</option>
                    <option value="Other">Other Initiatives</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-[#e5e2e1]/60 uppercase tracking-wider text-[10px]">Budget (PHP)</label>
                  <input 
                    type="number"
                    min="0"
                    placeholder="e.g., 50000"
                    value={newProgram.budget || ''}
                    onChange={e => setNewProgram(prev => ({ ...prev, budget: Number(e.target.value) }))}
                    className="w-full bg-[#181818] border border-[#353535]/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-[#e5e2e1]/60 uppercase tracking-wider text-[10px]">Start Date</label>
                  <input 
                    type="date"
                    required
                    value={newProgram.startDate || ''}
                    onChange={e => setNewProgram(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-[#181818] border border-[#353535]/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-[#e5e2e1]/60 uppercase tracking-wider text-[10px]">End Date</label>
                  <input 
                    type="date"
                    required
                    value={newProgram.endDate || ''}
                    onChange={e => setNewProgram(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full bg-[#181818] border border-[#353535]/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#e5e2e1]/60 uppercase tracking-wider text-[10px]">Status</label>
                <select 
                  value={newProgram.status || 'Draft'}
                  onChange={e => setNewProgram(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full bg-[#181818] border border-[#353535]/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                >
                  <option value="Draft">Draft (Planning)</option>
                  <option value="Active">Active (In Progress)</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#353535]/15 mt-5">
                <button 
                  type="button"
                  onClick={() => setIsAddProgramModalOpen(false)}
                  className="px-5 py-2.5 border border-[#353535]/20 hover:bg-[#353535]/10 text-[#e5e2e1] rounded-xl font-headline font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-headline font-black text-xs hover:opacity-95 shadow-md transition-all active:scale-95"
                >
                  Create Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

    </div>
  );
}

