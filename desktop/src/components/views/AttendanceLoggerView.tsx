import React from 'react';
import { Check, QrCode, Zap, Filter, Download, ChevronDown } from 'lucide-react';
import * as db from '../../lib/db';

interface AttendanceRecord {
  id: string;
  name: string;
  purok: string;
  timeIn: string;
  status: 'Present' | 'Absent';
}

interface AttendanceLoggerViewProps {
  programs: db.Program[];
  selectedAttendanceProgram: string;
  setSelectedAttendanceProgram: (v: string) => void;
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  onSimulateQRScan: () => void;
  playScanBeep: () => void;
  setScanNotification: (v: { message: string; type: 'success' | 'info' | 'error' } | null) => void;
  currentUserRole?: string;
}

export default function AttendanceLoggerView({
  programs,
  selectedAttendanceProgram,
  setSelectedAttendanceProgram,
  attendanceRecords,
  setAttendanceRecords,
  onSimulateQRScan,
  playScanBeep,
  setScanNotification,
  currentUserRole
}: AttendanceLoggerViewProps) {
  return (
    <div className="space-y-6 relative min-h-[500px]">
      {/* Opaque overlay with Unavailable message */}
      {currentUserRole !== 'Admin' && (
        <div className="absolute inset-0 bg-[#131313]/70 backdrop-blur-[2.5px] z-40 flex flex-col justify-center items-center rounded-xl border border-red-500/10 p-8 text-center">
          <div className="glass-panel p-8 rounded-xl border border-red-500/20 max-w-sm flex flex-col items-center">
            <h2 className="text-red-500 font-headline font-black text-3xl tracking-wider uppercase drop-shadow-[0_2px_10px_rgba(239,68,68,0.2)]">
              Unavailable
            </h2>
            <p className="text-[#e5e2e1]/70 font-headline font-semibold text-xs mt-3">
              temporarily unavailable for this version
            </p>
          </div>
        </div>
      )}

      {/* Controls and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Selector */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-low p-6 rounded-xl border border-[#353535]/15 space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Active Sangguniang Kabataan Program
              </label>
              <div className="relative">
                <select 
                  value={selectedAttendanceProgram}
                  onChange={(e) => setSelectedAttendanceProgram(e.target.value)}
                  className="w-full appearance-none bg-surface-container-high border-none rounded-xl py-4 px-5 text-on-surface font-headline font-bold focus:ring-2 focus:ring-primary transition-all text-sm"
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.title}>{p.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5 pointer-events-none" />
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setScanNotification({
                    message: `SUCCESS: Live Attendance logs for "${selectedAttendanceProgram}" saved to Supabase DB.`,
                    type: 'success'
                  });
                }}
                className="bg-primary hover:bg-primary-fixed-dim text-on-primary px-6 py-3.5 rounded-xl font-headline font-black text-xs flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/10 w-full justify-center md:w-auto"
              >
                <Check className="w-4 h-4" /> SAVE LIVE ATTENDANCE LOGS
              </button>
            </div>
          </div>

          {/* Quick Stats horizontal */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface-container-low p-4 rounded-xl border-l-4 border-primary border border-[#353535]/15">
              <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-wider">Total Registered</p>
              <p className="text-2xl font-headline font-black text-on-surface mt-1">124</p>
            </div>
            <div className="bg-surface-container-low p-4 rounded-xl border-l-4 border-secondary border border-[#353535]/15">
              <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-wider">Current Present</p>
              <p className="text-2xl font-headline font-black text-secondary mt-1">
                {attendanceRecords.filter(r => r.status === 'Present').length}
              </p>
            </div>
            <div className="bg-surface-container-low p-4 rounded-xl border-l-4 border-tertiary border border-[#353535]/15">
              <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-wider">Remaining</p>
              <p className="text-2xl font-headline font-black text-tertiary mt-1">
                {attendanceRecords.filter(r => r.status === 'Absent').length}
              </p>
            </div>
          </div>
        </div>

        {/* QR Scanner Simulation Area */}
        <div className="bg-glass border border-outline-variant/10 rounded-xl overflow-hidden flex flex-col items-center justify-center p-6 text-center group relative shadow-2xl">
          {/* Glowing simulated laser bar */}
          <div className="relative w-full aspect-square max-w-[180px] mb-4 overflow-hidden border border-outline-variant/10 rounded-lg bg-surface/50">
            <div className="absolute inset-0 border-2 border-primary/20 rounded-lg"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <QrCode className="w-20 h-20 text-primary/30 group-hover:scale-105 transition-transform" />
            </div>
            {/* Corners */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary"></div>
            {/* Laser Scanner Bar animation */}
            <div className="absolute w-[94%] left-[3%] h-[2px] bg-secondary/80 shadow-[0_0_12px_#ddb8ff] animate-bounce" style={{ top: '48%' }}></div>
          </div>

          <p className="font-headline font-bold text-sm text-on-surface mb-1">
            Integrated USB/QR Logger
          </p>
          <p className="text-[10px] text-on-surface-variant max-w-[200px]">
            Place resident QR ID card in front of camera lens or trigger barcode scan.
          </p>
          
          <button 
            onClick={onSimulateQRScan}
            className="mt-4 bg-secondary hover:bg-secondary/95 text-on-secondary font-black text-[10px] uppercase tracking-wider py-2.5 px-4 rounded-lg flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Zap className="w-3 h-3" /> Simulate Scanner Scan
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-surface-container-low rounded-xl border-t-4 border-primary overflow-hidden border border-[#353535]/15">
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#353535]/15">
          <div>
            <h4 className="font-headline font-bold text-sm text-[#e5e2e1]">Attendance Ledger Log</h4>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2.5 bg-surface-container-highest rounded-lg text-on-surface-variant hover:text-on-surface transition-colors">
              <Filter className="w-4 h-4" />
            </button>
            <button className="p-2.5 bg-surface-container-highest rounded-lg text-on-surface-variant hover:text-on-surface transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-highest/30 border-b border-[#353535]/15">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Youth Resident Name</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Purok</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Timestamp Log</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Manual Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#353535]/10">
              {attendanceRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-surface-variant/20 transition-colors group">
                  <td className="px-6 py-4.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-headline font-bold text-primary text-xs">
                        {rec.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-headline font-bold text-sm text-on-surface">{rec.name}</p>
                        <p className="text-[9px] text-on-surface-variant font-bold">UID: {rec.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4.5">
                    <span className="text-xs font-semibold text-on-surface-variant">{rec.purok}</span>
                  </td>
                  <td className="px-6 py-4.5">
                    <span className="text-xs font-mono font-medium">{rec.timeIn}</span>
                  </td>
                  <td className="px-6 py-4.5 text-center">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      rec.status === 'Present' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {rec.status}
                    </span>
                  </td>
                  <td className="px-6 py-4.5 text-right">
                    {rec.status === 'Absent' ? (
                      <button 
                        onClick={() => {
                          playScanBeep();
                          setAttendanceRecords(prev => prev.map(r => r.id === rec.id ? { ...r, status: 'Present', timeIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : r));
                          setScanNotification({ message: `MANUAL CHECK-IN: ${rec.name} marked Present.`, type: 'success' });
                        }}
                        className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg transition-colors border border-emerald-500/20"
                      >
                        Check In
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setAttendanceRecords(prev => prev.map(r => r.id === rec.id ? { ...r, status: 'Absent', timeIn: '--:--' } : r));
                          setScanNotification({ message: `REMOVED LOG: Checked out ${rec.name}.`, type: 'info' });
                        }}
                        className="text-[10px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg transition-colors border border-red-500/20"
                      >
                        Check Out
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
