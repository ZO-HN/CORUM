import React from 'react';
import {
  Settings as SettingsIcon,
  Search,
  Check,
  X,
  Trash2,
  Plus,
  Activity,
  Users,
  Key,
} from 'lucide-react';
import * as db from '../../lib/db';

// ── Types ────────────────────────────────────────────────────────────

import type { UserRole } from '../../types';

interface UserRecord {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  status: 'Active' | 'Disabled';
}

export interface SettingsViewProps {
  settingsSubTab: 'admin' | 'logs' | 'account';
  setSettingsSubTab: (tab: 'admin' | 'logs' | 'account') => void;
  isSettingsUnlocked: boolean;
  setIsSettingsUnlocked: (v: boolean) => void;
  isSecurityModalOpen: boolean;
  setIsSecurityModalOpen: (v: boolean) => void;
  securityTargetTab: 'admin' | null;
  setSecurityTargetTab: (v: 'admin' | null) => void;
  securityPasswordInput: string;
  setSecurityPasswordInput: (v: string) => void;
  // Activity logs
  activityLogs: db.AuditLog[];
  logSearchQuery: string;
  setLogSearchQuery: (v: string) => void;
  // Unread badge
  unreadLogsCount: number;
  // System config staging
  stagingBarangayName: string;
  setStagingBarangayName: (v: string) => void;
  stagingSkChairperson: string;
  setStagingSkChairperson: (v: string) => void;
  stagingBarangayLogo: string;
  setStagingBarangayLogo: (v: string) => void;
  stagingPuroks: string[];
  setStagingPuroks: (v: string[]) => void;
  newPurokName: string;
  setNewPurokName: (v: string) => void;
  stagingSkKagawads: string[];
  setStagingSkKagawads: (v: string[]) => void;
  stagingSkTreasurer: string;
  setStagingSkTreasurer: (v: string) => void;
  stagingSkSecretary: string;
  setStagingSkSecretary: (v: string) => void;
  stagingDistrict: string;
  setStagingDistrict: (v: string) => void;
  onSaveSettingsConfig: (e: React.FormEvent) => void;
  // User management
  users: UserRecord[];
  currentUser: UserRecord;
  isUserModalOpen: boolean;
  setIsUserModalOpen: (v: boolean) => void;
  newUserName: string;
  setNewUserName: (v: string) => void;
  newUserEmail: string;
  setNewUserEmail: (v: string) => void;
  newUserRole: UserRole;
  setNewUserRole: (v: UserRole) => void;
  editingUserId: string | null;
  setEditingUserId: (v: string | null) => void;
  onCreateOrUpdateUser: (e: React.FormEvent) => void;
  onToggleUserStatus: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  // Notifications
  setScanNotification: (v: { message: string; type: 'success' | 'info' | 'error' } | null) => void;
  dbStatus: 'connected' | 'disconnected';
  // Utility callbacks used inline inside JSX
  playScanBeep: () => void;
  logActivity: (action: string, tableName: string, oldValues: any, newValues: any) => void;
  onUpdateCurrentUser: (user: Partial<UserRecord>) => void;
}

// ── Component ────────────────────────────────────────────────────────

const SettingsView: React.FC<SettingsViewProps> = (props) => {
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [pwdStatus, setPwdStatus] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isUpdatingPwd, setIsUpdatingPwd] = React.useState(false);

  const [displayNameInput, setDisplayNameInput] = React.useState(props.currentUser.name);
  const [nameStatus, setNameStatus] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isUpdatingName, setIsUpdatingName] = React.useState(false);
  const [activeInnerTab, setActiveInnerTab] = React.useState<'users' | 'config'>('config');

  const {
    settingsSubTab,
    setSettingsSubTab,
    isSettingsUnlocked,
    setIsSettingsUnlocked,
    setIsSecurityModalOpen,
    setSecurityTargetTab,
    isSecurityModalOpen,
    securityPasswordInput,
    setSecurityPasswordInput,
    securityTargetTab,
    // Activity logs
    activityLogs,
    logSearchQuery,
    setLogSearchQuery,
    unreadLogsCount,
    onUpdateCurrentUser,
    // System config staging
    stagingBarangayName,
    setStagingBarangayName,
    stagingSkChairperson,
    setStagingSkChairperson,
    stagingBarangayLogo,
    setStagingBarangayLogo,
    stagingPuroks,
    setStagingPuroks,
    newPurokName,
    setNewPurokName,
    stagingSkKagawads,
    setStagingSkKagawads,
    stagingSkTreasurer,
    setStagingSkTreasurer,
    stagingSkSecretary,
    setStagingSkSecretary,
    stagingDistrict,
    setStagingDistrict,
    onSaveSettingsConfig,
    // User management
    users,
    currentUser,
    isUserModalOpen,
    setIsUserModalOpen,
    newUserName,
    setNewUserName,
    newUserEmail,
    setNewUserEmail,
    newUserRole,
    setNewUserRole,
    editingUserId,
    setEditingUserId,
    onCreateOrUpdateUser,
    onToggleUserStatus,
    onDeleteUser,
    // Notifications / utilities
    setScanNotification,
    playScanBeep,
    logActivity,
  } = props;

  return (
            <div className="space-y-6">
              {/* Header and Sub-tabs */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-surface-container-low p-5 rounded-xl border border-[#353535]/15 gap-4">
                <div>
                  <h3 className="font-headline font-black text-xl text-on-surface flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5 text-primary" />
                    System Settings
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Manage Barangay profiles, administrative officials, Purok divisions, staff credentials, and view system logs.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Public Sub-tabs Group */}
                  <div className="flex flex-wrap gap-1.5 bg-[#131313] p-1 rounded-lg w-fit border border-[#353535]/10">
                    <button 
                      type="button"
                      onClick={() => setSettingsSubTab('logs')}
                      className={`px-4 py-2 rounded-md font-headline font-bold text-xs tracking-tight transition-all flex items-center gap-1.5 ${
                        settingsSubTab === 'logs' 
                          ? 'bg-primary text-on-primary shadow-md' 
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Audit Logs
                      {unreadLogsCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none bg-red-500 text-white animate-pulse">
                          {unreadLogsCount}
                        </span>
                      )}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSettingsSubTab('account')}
                      className={`px-4 py-2 rounded-md font-headline font-bold text-xs tracking-tight transition-all flex items-center gap-1.5 ${
                        settingsSubTab === 'account' 
                          ? 'bg-primary text-on-primary shadow-md' 
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <Key className="w-3.5 h-3.5" />
                      Account Security
                    </button>
                  </div>

                  {/* Visual Divider */}
                  <div className="w-[1px] h-6 bg-[#353535]/30 hidden md:block"></div>

                  {/* Separated User Management & Configuration Button */}
                  <button 
                    type="button"
                    onClick={() => {
                      if (props.currentUser.role !== 'Admin' && props.currentUser.role !== 'SK Chairperson') {
                        alert("This section can only be accessed by an SK Admin.");
                        return;
                      }
                      if (!isSettingsUnlocked) {
                        setSecurityTargetTab('admin');
                        setIsSecurityModalOpen(true);
                      } else {
                        setSettingsSubTab('admin');
                      }
                    }}
                    className={`px-4 py-2 rounded-md font-headline font-bold text-xs tracking-tight transition-all flex items-center gap-1.5 ${
                      settingsSubTab === 'admin' 
                        ? 'bg-amber-500 text-black shadow-md font-black shadow-amber-500/10' 
                        : 'text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15'
                    }`}
                  >
                    User Management & Configuration
                  </button>
                </div>
              </div>

              {/* Sub-tab: User Management & Configuration */}
              {settingsSubTab === 'admin' && (
                <div className="space-y-6">
                  {/* Inner tab buttons */}
                  <div className="flex border-b border-[#353535]/15 mb-6">
                    <button
                      type="button"
                      onClick={() => setActiveInnerTab('config')}
                      className={`pb-3 px-4 text-xs font-headline font-bold tracking-tight transition-all border-b-2 -mb-[2px] flex items-center gap-1.5 ${
                        activeInnerTab === 'config'
                          ? 'border-primary text-primary font-black'
                          : 'border-transparent text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      Configuration
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveInnerTab('users')}
                      className={`pb-3 px-4 text-xs font-headline font-bold tracking-tight transition-all border-b-2 -mb-[2px] flex items-center gap-1.5 ${
                        activeInnerTab === 'users'
                          ? 'border-primary text-primary font-black'
                          : 'border-transparent text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      User Management
                    </button>
                  </div>

                  {/* Inner tab content: Configuration */}
                  {activeInnerTab === 'config' && (
                    <form onSubmit={onSaveSettingsConfig} className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-scale-in">
                      
                      {/* Left & Middle Column: Barangay & Official Settings */}
                      <div className="lg:col-span-2 space-y-6">
                        {!isSettingsUnlocked ? (
                          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs font-bold flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2"><span>🔒</span> System Configuration is Locked. You can view settings, but editing is disabled.</span>
                            <button 
                              type="button"
                              onClick={() => {
                                setSecurityTargetTab('admin');
                                setIsSecurityModalOpen(true);
                              }}
                              className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/20 rounded-lg text-[10px] font-black uppercase transition-all"
                            >
                              Unlock Settings
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2"><span>🔓</span> Administrative edits enabled.</span>
                            <button 
                              type="button" 
                              onClick={() => {
                                setIsSettingsUnlocked(false);
                                playScanBeep();
                                setScanNotification({
                                  message: "SUCCESS: System settings locked successfully.",
                                  type: 'info'
                                });
                                logActivity('LOCK', 'security_lock', null, { message: "System configuration locked" });
                              }}
                              className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-black uppercase transition-all"
                            >
                              Lock Settings
                            </button>
                          </div>
                        )}

                        <div className="bg-surface-container-low p-6 rounded-xl border border-[#353535]/15 space-y-6">
                          <h4 className="font-headline font-bold text-sm text-primary uppercase tracking-wider border-b border-[#353535]/15 pb-2">
                            Barangay Profile & Logo
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-on-surface-variant">Barangay Name</label>
                              <input 
                                type="text" 
                                required
                                disabled={!isSettingsUnlocked}
                                value={stagingBarangayName}
                                onChange={(e) => setStagingBarangayName(e.target.value)}
                                className="w-full bg-[#181818] border border-outline-variant/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-on-surface-variant">District</label>
                              <input 
                                type="text" 
                                required
                                disabled={!isSettingsUnlocked}
                                value={stagingDistrict}
                                onChange={(e) => setStagingDistrict(e.target.value)}
                                className="w-full bg-[#181818] border border-outline-variant/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                              />
                            </div>
                          </div>

                          {/* Logo File Uploader */}
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-on-surface-variant">Barangay Official Logo</label>
                            <div className="flex flex-col md:flex-row gap-4 items-center bg-[#131313]/30 p-4 rounded-xl border border-outline-variant/10">
                              <img src={stagingBarangayLogo} alt="Barangay Logo Preview" className="w-32 h-32 rounded-full object-cover shrink-0" />
                              <div className="flex-1 space-y-1">
                                <input 
                                  type="file" 
                                  id="logo-upload-input"
                                  accept="image/png, image/jpeg, image/webp"
                                  disabled={!isSettingsUnlocked}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      if (file.size > 512000) {
                                        alert("File is too large! Maximum file size is 500KB.");
                                        return;
                                      }
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        setStagingBarangayLogo(reader.result as string);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="hidden"
                                />
                                <label 
                                  htmlFor="logo-upload-input" 
                                  className={`inline-flex items-center gap-1.5 px-4 py-2 bg-surface-container-high border border-outline-variant/20 hover:bg-surface-container-highest rounded-lg text-xs font-bold text-on-surface cursor-pointer active:scale-95 transition-all select-none ${!isSettingsUnlocked ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                                >
                                  Upload Logo File
                                </label>
                                <p className="text-[10px] text-on-surface-variant/80">
                                  Format: PNG, JPG, or WEBP • Recommended size: 200x200px • Max size: 500KB
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Official Slots Panel */}
                        <div className="bg-surface-container-low p-6 rounded-xl border border-[#353535]/15 space-y-6">
                          <h4 className="font-headline font-bold text-sm text-primary uppercase tracking-wider border-b border-[#353535]/15 pb-2">
                            Official Sangguniang Kabataan Council Members
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-on-surface-variant">SK Chairperson Name</label>
                              <input 
                                type="text" 
                                required
                                disabled={!isSettingsUnlocked}
                                value={stagingSkChairperson}
                                onChange={(e) => setStagingSkChairperson(e.target.value)}
                                className="w-full bg-[#181818] border border-outline-variant/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-on-surface-variant">SK Treasurer Name</label>
                              <input 
                                type="text" 
                                required
                                disabled={!isSettingsUnlocked}
                                value={stagingSkTreasurer}
                                onChange={(e) => setStagingSkTreasurer(e.target.value)}
                                className="w-full bg-[#181818] border border-outline-variant/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-on-surface-variant">SK Secretary Name</label>
                              <input 
                                type="text" 
                                required
                                disabled={!isSettingsUnlocked}
                                value={stagingSkSecretary}
                                onChange={(e) => setStagingSkSecretary(e.target.value)}
                                className="w-full bg-[#181818] border border-outline-variant/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="text-xs font-bold text-on-surface-variant block">SK Kagawads</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              {stagingSkKagawads.map((kagawad, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono font-bold text-primary w-5 text-right">#{idx + 1}</span>
                                  <input 
                                    type="text" 
                                    disabled={!isSettingsUnlocked}
                                    value={kagawad}
                                    onChange={(e) => {
                                      const updated = [...stagingSkKagawads];
                                      updated[idx] = e.target.value;
                                      setStagingSkKagawads(updated);
                                    }}
                                    className="flex-1 bg-[#181818] border border-outline-variant/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                                    placeholder={`Kagawad ${idx + 1}`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Purok List & Commit */}
                      <div className="space-y-6">
                        <div className="bg-surface-container-low p-6 rounded-xl border border-[#353535]/15 space-y-6">
                          <h4 className="font-headline font-bold text-sm text-primary uppercase tracking-wider border-b border-[#353535]/15 pb-2">
                            Purok Sectors List
                          </h4>

                          <p className="text-xs text-on-surface-variant">
                            Puroks are structural divisions inside the Barangay. Add, edit, or remove sectors used for residency mapping.
                          </p>

                          {/* Add new Purok inline */}
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              disabled={!isSettingsUnlocked}
                              placeholder="e.g. Purok 5"
                              value={newPurokName}
                              onChange={(e) => setNewPurokName(e.target.value)}
                              className="flex-1 bg-[#181818] border border-outline-variant/10 rounded-xl py-2 px-3 text-xs text-on-surface focus:ring-1 focus:ring-primary disabled:opacity-60"
                            />
                            <button 
                              type="button"
                              disabled={!isSettingsUnlocked}
                              onClick={() => {
                                if (!newPurokName.trim()) return;
                                if (stagingPuroks.includes(newPurokName.trim())) {
                                  alert("Purok already exists!");
                                  return;
                                }
                                setStagingPuroks([...stagingPuroks, newPurokName.trim()]);
                                setNewPurokName('');
                              }}
                              className="bg-primary hover:opacity-90 text-on-primary text-xs font-bold px-4 rounded-xl flex items-center gap-1 active:scale-95 transition-all disabled:opacity-50"
                            >
                              Add
                            </button>
                          </div>

                          {/* Purok rows list */}
                          <div className="border border-outline-variant/10 rounded-xl overflow-hidden bg-[#131313]/30 max-h-[300px] overflow-y-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-[#131313] border-b border-outline-variant/10">
                                  <th className="px-4 py-2 font-bold text-on-surface-variant uppercase text-[10px]">Purok Name</th>
                                  <th className="px-4 py-2 text-right font-bold text-on-surface-variant uppercase text-[10px] w-24">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#353535]/10">
                                {stagingPuroks.map((purok, idx) => (
                                  <tr key={idx} className="hover:bg-[#181818]/40 transition-colors">
                                    <td className="px-4 py-2.5">
                                      <input 
                                        type="text"
                                        disabled={!isSettingsUnlocked}
                                        value={purok}
                                        onChange={(e) => {
                                          const updated = [...stagingPuroks];
                                          updated[idx] = e.target.value;
                                          setStagingPuroks(updated);
                                        }}
                                        className="bg-transparent border-none p-0 focus:ring-0 font-bold text-on-surface w-full focus:bg-[#181818] focus:px-2 focus:py-1 rounded disabled:opacity-80"
                                      />
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                      <button 
                                        type="button"
                                        disabled={!isSettingsUnlocked}
                                        onClick={() => {
                                          setStagingPuroks(stagingPuroks.filter((_, i) => i !== idx));
                                        }}
                                        className="text-error/70 hover:text-error transition-colors p-1 disabled:opacity-40"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Commit Action */}
                        <div className="bg-surface-container-low p-6 rounded-xl border border-[#353535]/15 space-y-4">
                          <h4 className="font-headline font-bold text-xs uppercase text-on-surface-variant tracking-wider">
                            Commit Changes
                          </h4>
                          <p className="text-[10px] text-on-surface-variant">
                            Applying updates commits Barangay profile and purok divisions globally. Changes are written to the audit ledger.
                          </p>
                          <button 
                            type="submit"
                            disabled={!isSettingsUnlocked}
                            className="w-full py-3 bg-primary hover:opacity-90 active:scale-[0.98] text-on-primary font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Check className="w-4 h-4" /> SAVE SYSTEM CONFIG
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Inner tab content: User Management */}
                  {activeInnerTab === 'users' && (
                    <div className="bg-surface-container-low p-6 rounded-xl border border-[#353535]/15 space-y-6 animate-scale-in">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#353535]/15 pb-4">
                        <div>
                          <h4 className="font-headline font-bold text-sm text-primary uppercase tracking-wider flex items-center gap-1.5">
                            <Users className="w-4 h-4" /> Staff User Credentials Directory
                          </h4>
                          <p className="text-xs text-on-surface-variant mt-1">
                            Manage personnel permissions, create credentials for SK staff, or suspend active user profiles.
                          </p>
                        </div>

                        {currentUser.role === 'Admin' && (
                          <button 
                            type="button"
                            onClick={() => {
                              if (!isSettingsUnlocked) {
                                alert("Settings are locked! Please unlock in the Security tab first.");
                                return;
                              }
                              setEditingUserId(null);
                              setNewUserName('');
                              setNewUserEmail('');
                              setNewUserRole('Staff');
                              setIsUserModalOpen(true);
                            }}
                            disabled={!isSettingsUnlocked}
                            className="px-4 py-2.5 bg-primary hover:opacity-90 text-on-primary rounded-xl font-bold text-xs tracking-tight transition-all active:scale-95 disabled:opacity-40 flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" /> CREATE USER
                          </button>
                        )}
                      </div>

                      {!isSettingsUnlocked ? (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs font-bold flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2"><span>🔒</span> User Management is Locked. You can review staff registry below, but modifications are disabled.</span>
                          <button 
                            type="button"
                            onClick={() => {
                              setSecurityTargetTab('admin');
                              setIsSecurityModalOpen(true);
                            }}
                            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/20 rounded-lg text-[10px] font-black uppercase transition-all"
                          >
                            Unlock Settings
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2"><span>🔓</span> User modifications enabled.</span>
                          <button 
                            type="button" 
                            onClick={() => {
                              setIsSettingsUnlocked(false);
                              playScanBeep();
                              setScanNotification({
                                message: "SUCCESS: System settings locked successfully.",
                                type: 'info'
                              });
                              logActivity('LOCK', 'security_lock', null, { message: "System configuration locked" });
                            }}
                            className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-black uppercase transition-all"
                          >
                            Lock Settings
                          </button>
                        </div>
                      )}

                      {/* Users Table */}
                      <div className="rounded-xl border border-[#353535]/15 overflow-hidden bg-[#131313]/25">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-[#131313]/60 border-b border-[#353535]/15">
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Name</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-40">Role</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Email Address</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-32 text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-48 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#353535]/10 text-xs">
                              {users.map(u => {
                                return (
                                  <tr key={u.id} className="hover:bg-surface-container-highest/20 transition-colors">
                                    <td className="px-6 py-4 font-headline font-bold text-on-surface">{u.name}</td>
                                    <td className="px-6 py-4">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${
                                        (u.role === 'Admin' || u.role === 'SK Chairperson')
                                            ? 'bg-primary/20 text-primary border-primary/20' 
                                            : (u.role === 'Staff' || u.role === 'SK Kagawad' || u.role === 'SK Treasurer' || u.role === 'SK Secretary')
                                              ? 'bg-secondary/20 text-secondary border-secondary/20'
                                              : 'bg-outline-variant/20 text-on-surface-variant border-outline-variant/10'
                                      }`}>
                                        {u.role}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-on-surface-variant">{u.email}</td>
                                    <td className="px-6 py-4 text-center">
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                        u.status === 'Active'
                                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                      }`}>
                                        {u.status}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!isSettingsUnlocked) {
                                              alert("Settings are locked! Please unlock in the Security tab first.");
                                              return;
                                            }
                                            setEditingUserId(u.id);
                                            setNewUserName(u.name);
                                            setNewUserEmail(u.email);
                                            setNewUserRole(u.role);
                                            setIsUserModalOpen(true);
                                          }}
                                          disabled={!isSettingsUnlocked}
                                          className="px-2.5 py-1.5 bg-[#181818] border border-[#353535]/15 hover:bg-[#202020] text-on-surface font-bold text-[10px] rounded-lg transition-all disabled:opacity-40"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => onToggleUserStatus(u.id)}
                                          disabled={!isSettingsUnlocked}
                                          className={`px-2.5 py-1.5 border font-bold text-[10px] rounded-lg transition-all disabled:opacity-40 ${
                                            u.status === 'Active'
                                              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
                                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                                          }`}
                                        >
                                          {u.status === 'Active' ? 'Disable' : 'Enable'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => onDeleteUser(u.id)}
                                          disabled={!isSettingsUnlocked}
                                          className="px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-bold text-[10px] rounded-lg transition-all disabled:opacity-40"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Staff User Add/Edit Modal */}
                      {isUserModalOpen && (
                        <div className="fixed inset-0 bg-surface/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
                          <div className="glass-panel w-full max-w-md rounded-xl p-6 md:p-8 space-y-6 border border-[#353535]/20 animate-scale-in">
                            <div className="flex justify-between items-center border-b border-[#353535]/10 pb-4">
                              <h3 className="font-headline font-black text-lg text-on-surface">
                                {editingUserId ? "Modify Staff User Account" : "Register Staff User Account"}
                              </h3>
                              <button 
                                type="button"
                                onClick={() => {
                                  setEditingUserId(null);
                                  setNewUserName('');
                                  setNewUserEmail('');
                                  setNewUserRole('Staff');
                                  setIsUserModalOpen(false);
                                }}
                                className="p-1 hover:bg-surface-container-highest rounded-lg transition-colors text-on-surface-variant hover:text-on-surface"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            <form onSubmit={onCreateOrUpdateUser} className="space-y-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-on-surface-variant">Full Name</label>
                                <input 
                                  type="text" 
                                  required
                                  value={newUserName}
                                  onChange={(e) => setNewUserName(e.target.value)}
                                  className="w-full bg-[#181818] border border-outline-variant/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                                  placeholder="e.g. Mark Smith"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-on-surface-variant">Email Address</label>
                                <input 
                                  type="email" 
                                  required
                                  value={newUserEmail}
                                  onChange={(e) => setNewUserEmail(e.target.value)}
                                  className="w-full bg-[#181818] border border-outline-variant/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                                  placeholder="e.g. mark.smith@kksync.gov"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-on-surface-variant">Authority Role</label>
                                <select 
                                  value={newUserRole}
                                  onChange={(e) => setNewUserRole(e.target.value as any)}
                                  className="w-full bg-[#181818] border border-outline-variant/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                                >
                                  <option value="Admin">Admin</option>
                                  <option value="Staff">Staff</option>
                                  <option value="Viewer">Viewer</option>
                                  <option value="SK Chairperson">SK Chairperson</option>
                                  <option value="SK Kagawad">SK Kagawad</option>
                                  <option value="SK Treasurer">SK Treasurer</option>
                                  <option value="SK Secretary">SK Secretary</option>
                                </select>
                              </div>

                              <div className="flex justify-end gap-3 border-t border-[#353535]/10 pt-4 mt-6">
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setEditingUserId(null);
                                    setNewUserName('');
                                    setNewUserEmail('');
                                    setNewUserRole('Staff');
                                    setIsUserModalOpen(false);
                                  }}
                                  className="px-4 py-2 bg-[#181818] text-on-surface rounded-lg font-bold text-xs hover:bg-[#202020] transition-all"
                                >
                                  Cancel
                                </button>
                                
                                <button 
                                  type="submit"
                                  className="px-5 py-2.5 bg-primary text-on-primary rounded-lg font-headline font-black text-xs hover:opacity-95 shadow-md active:scale-95 transition-all"
                                >
                                  {editingUserId ? "Update User" : "Add User"}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab: Audit Logs */}
              {settingsSubTab === 'logs' && (
                <div className="bg-surface-container-low p-6 rounded-xl border border-[#353535]/15 space-y-6 animate-scale-in">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#353535]/15 pb-4">
                    <div>
                      <h4 className="font-headline font-bold text-sm text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-4 h-4" /> System activity audit logs
                      </h4>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Secure immutable record of database mutations and administrative system changes.
                      </p>
                    </div>

                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
                      <input 
                        type="text" 
                        placeholder="Search actions or tables..."
                        value={logSearchQuery}
                        onChange={(e) => setLogSearchQuery(e.target.value)}
                        className="w-full bg-[#181818] border border-outline-variant/10 rounded-xl py-2 pl-10 pr-4 text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Logs Table */}
                  <div className="rounded-xl border border-[#353535]/15 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#131313]/60 border-b border-[#353535]/15">
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-48">Timestamp</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-32">Action</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-48">Target Table/Module</th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Mutation Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#353535]/10 text-xs font-mono">
                          {activityLogs
                            .filter(log => {
                              const query = logSearchQuery.toLowerCase();
                              return (
                                log.action.toLowerCase().includes(query) ||
                                log.table_name.toLowerCase().includes(query) ||
                                (log.new_values && JSON.stringify(log.new_values).toLowerCase().includes(query)) ||
                                (log.old_values && JSON.stringify(log.old_values).toLowerCase().includes(query))
                              );
                            })
                            .length > 0 ? (
                            activityLogs
                              .filter(log => {
                                const query = logSearchQuery.toLowerCase();
                                return (
                                  log.action.toLowerCase().includes(query) ||
                                  log.table_name.toLowerCase().includes(query) ||
                                  (log.new_values && JSON.stringify(log.new_values).toLowerCase().includes(query)) ||
                                  (log.old_values && JSON.stringify(log.old_values).toLowerCase().includes(query))
                                );
                              })
                              .map(log => (
                                <tr key={log.id} className="hover:bg-surface-container-highest/20 transition-colors">
                                  <td className="px-6 py-4 text-on-surface-variant font-sans">
                                    {new Date(log.created_at).toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider font-sans ${
                                      log.action === 'INSERT' 
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' 
                                        : log.action === 'UPDATE'
                                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                                          : log.action === 'DELETE'
                                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20'
                                            : 'bg-primary/20 text-primary border border-primary/20'
                                    }`}>
                                      {log.action}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-secondary font-semibold">
                                    {log.table_name}
                                  </td>
                                  <td className="px-6 py-4 text-on-surface max-w-lg truncate font-sans">
                                    {log.action === 'UPDATE' && log.old_values && log.new_values ? (
                                      <div className="space-y-0.5 text-[11px] text-on-surface-variant font-mono">
                                        {Object.keys(log.new_values).map(k => {
                                          if (JSON.stringify(log.old_values[k]) !== JSON.stringify(log.new_values[k])) {
                                            return (
                                              <div key={k} className="flex gap-2">
                                                <span className="text-secondary font-bold font-sans">{k}:</span>
                                                <span className="text-rose-400 line-through truncate max-w-[150px]">
                                                  {typeof log.old_values[k] === 'object' ? JSON.stringify(log.old_values[k]) : String(log.old_values[k])}
                                                </span>
                                                <span className="text-on-surface-variant">→</span>
                                                <span className="text-emerald-400 font-bold truncate max-w-[200px]">
                                                  {typeof log.new_values[k] === 'object' ? JSON.stringify(log.new_values[k]) : String(log.new_values[k])}
                                                </span>
                                              </div>
                                            );
                                          }
                                          return null;
                                        })}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-on-surface-variant font-mono block overflow-hidden text-ellipsis whitespace-nowrap">
                                        {JSON.stringify(log.new_values || log.old_values)}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-6 py-10 text-center text-on-surface-variant/60 italic">
                                No activity audit logs match the query filter or exist yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab: Change Password & Display Name */}
              {settingsSubTab === 'account' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-scale-in">
                  {/* Left Column: Change Display Name & Settings Passcode */}
                  <div className="space-y-6">
                    {/* Change Display Name */}
                    <div className="bg-[#181818]/60 p-6 rounded-xl border border-[#353535]/15 text-left h-fit">
                      <h4 className="font-headline font-black text-base text-on-surface mb-2">Change Display Name</h4>
                      <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                        Update the display name shown on your profile header and activity audit logs.
                      </p>

                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        setNameStatus(null);
                        if (!displayNameInput.trim()) {
                          setNameStatus({ message: "Display name cannot be empty.", type: 'error' });
                          return;
                        }
                        setIsUpdatingName(true);
                        try {
                          const { error } = await db.updateProfileName(displayNameInput.trim());
                          if (error) {
                            setNameStatus({ message: error.message, type: 'error' });
                          } else {
                            // Update parent state so UI changes immediately
                            onUpdateCurrentUser({ name: displayNameInput.trim() });
                            setNameStatus({ message: "Display name updated successfully!", type: 'success' });
                          }
                        } catch (err: any) {
                          setNameStatus({ message: err.message || "An unexpected error occurred.", type: 'error' });
                        } finally {
                          setIsUpdatingName(false);
                        }
                      }} className="space-y-4">
                        <div className="space-y-1.5 text-left">
                          <label className="text-xs font-bold text-on-surface-variant">Full Name / Display Name</label>
                          <input 
                            type="text"
                            required
                            value={displayNameInput}
                            onChange={(e) => setDisplayNameInput(e.target.value)}
                            className="w-full bg-[#131313] border border-outline-variant/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                            placeholder="Your full name"
                          />
                        </div>

                        {nameStatus && (
                          <div className={`p-3 rounded-lg text-xs font-bold ${
                            nameStatus.type === 'success' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {nameStatus.message}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isUpdatingName || displayNameInput.trim() === currentUser.name}
                          className="w-full bg-primary text-on-primary hover:bg-primary/95 transition-all py-2.5 px-4 rounded-xl text-xs font-bold disabled:opacity-65 cursor-pointer"
                        >
                          {isUpdatingName ? "Saving..." : "Save Display Name"}
                        </button>
                      </form>
                    </div>

                  </div>

                  {/* Right Column: Change Password */}
                  <div className="bg-[#181818]/60 p-6 rounded-xl border border-[#353535]/15 text-left h-fit">
                    <h4 className="font-headline font-black text-base text-on-surface mb-2">Change Account Password</h4>
                    <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                      Update your account login password. Please choose a strong password with at least 6 characters.
                    </p>

                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setPwdStatus(null);
                      if (newPassword.length < 6) {
                        setPwdStatus({ message: "Password must be at least 6 characters.", type: 'error' });
                        return;
                      }
                      if (newPassword !== confirmPassword) {
                        setPwdStatus({ message: "Passwords do not match.", type: 'error' });
                        return;
                      }
                      setIsUpdatingPwd(true);
                      try {
                        const { error } = await db.updatePassword(newPassword);
                        if (error) {
                          setPwdStatus({ message: error.message, type: 'error' });
                        } else {
                          setPwdStatus({ message: "Password updated successfully!", type: 'success' });
                          setNewPassword('');
                          setConfirmPassword('');
                        }
                      } catch (err: any) {
                        setPwdStatus({ message: err.message || "An unexpected error occurred.", type: 'error' });
                      } finally {
                        setIsUpdatingPwd(false);
                      }
                    }} className="space-y-4">
                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-on-surface-variant">New Password</label>
                        <input 
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-[#131313] border border-outline-variant/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                          placeholder="••••••••"
                        />
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-on-surface-variant">Confirm New Password</label>
                        <input 
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-[#131313] border border-outline-variant/10 rounded-xl py-2.5 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                          placeholder="••••••••"
                        />
                      </div>

                      {pwdStatus && (
                        <div className={`p-3 rounded-lg text-xs font-bold ${
                          pwdStatus.type === 'success' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {pwdStatus.message}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isUpdatingPwd || !newPassword}
                        className="w-full bg-primary text-on-primary hover:bg-primary/95 transition-all py-2.5 px-4 rounded-xl text-xs font-bold disabled:opacity-65 cursor-pointer"
                      >
                        {isUpdatingPwd ? "Updating..." : "Update Password"}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Security Lock Password Modal */}
              {isSecurityModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-[#181818] border border-[#353535]/25 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in text-left">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-headline font-black text-lg text-[#e5e2e1] uppercase tracking-wider">
                        Unlock Settings
                      </h3>
                      <button 
                        onClick={() => {
                          setIsSecurityModalOpen(false);
                          setSecurityPasswordInput('');
                          setSecurityTargetTab(null);
                        }} 
                        className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-[#353535]/20"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                      System configuration and user management are locked to prevent unauthorized modifications. Please enter the security passkey to continue.
                    </p>

                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const input = securityPasswordInput.trim();
                      const isCorrect = (input === 'SKBSA2024-2026');

                      if (isCorrect) {
                        setIsSettingsUnlocked(true);
                        setIsSecurityModalOpen(false);
                        setSecurityPasswordInput('');
                        
                        // Navigate to the target sub-tab if specified
                        if (securityTargetTab) {
                          setSettingsSubTab(securityTargetTab);
                        }
                        setSecurityTargetTab(null);
                        
                        playScanBeep();
                        setScanNotification({
                          message: "SUCCESS: System settings unlocked successfully.",
                          type: 'success'
                        });
                        logActivity('UNLOCK', 'security_lock', null, { message: "System configuration unlocked" });
                      } else {
                        alert("Incorrect passcode. Access denied.");
                        setSecurityPasswordInput('');
                      }
                    }} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant">Security Passkey</label>
                        <input 
                          type="password"
                          required
                          autoFocus
                          value={securityPasswordInput}
                          onChange={(e) => setSecurityPasswordInput(e.target.value)}
                          className="w-full bg-[#131313] border border-outline-variant/10 rounded-xl py-3 px-3.5 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                          placeholder="Enter security passkey"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSecurityModalOpen(false);
                            setSecurityPasswordInput('');
                            setSecurityTargetTab(null);
                          }}
                          className="flex-1 bg-[#252525] hover:bg-[#303030] text-on-surface font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-primary text-on-primary hover:bg-primary/95 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                        >
                          Unlock
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
  );
};

export default SettingsView;
