import React from 'react';
import { QrCode, ScanLine, Filter, Download, ChevronDown } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import * as db from '../../lib/db';

interface AttendanceLoggerViewProps {
  programs: db.Program[];
  selectedAttendanceProgram: string;
  setSelectedAttendanceProgram: (v: string) => void;
  attendanceRecords: db.AttendanceLogEntry[];
  webPortalUrl: string;
  onManualCheckIn: (youthId: string, youthName: string) => void;
  onManualCheckOut: (youthId: string, youthName: string) => void;
  onOpenYouthScanner: () => void;
  currentUserRole?: string;
}

export default function AttendanceLoggerView({
  programs,
  selectedAttendanceProgram,
  setSelectedAttendanceProgram,
  attendanceRecords,
  webPortalUrl,
  onManualCheckIn,
  onManualCheckOut,
  onOpenYouthScanner,
  currentUserRole
}: AttendanceLoggerViewProps) {
  const activeProgram = programs.find(p => p.id === selectedAttendanceProgram);
  const checkInUrl = activeProgram ? `${webPortalUrl}/?checkin=${activeProgram.id}` : '';

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
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5 pointer-events-none" />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onOpenYouthScanner}
                className="bg-primary hover:bg-primary-fixed-dim text-on-primary px-6 py-3.5 rounded-xl font-headline font-black text-xs flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/10 w-full justify-center md:w-auto"
              >
                <ScanLine className="w-4 h-4" /> SCAN RESIDENT QR
              </button>
            </div>
          </div>

          {/* Quick Stats horizontal */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface-container-low p-4 rounded-xl border-l-4 border-primary border border-[#353535]/15">
              <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-wider">Total Registered</p>
              <p className="text-2xl font-headline font-black text-on-surface mt-1">{attendanceRecords.length}</p>
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
                {attendanceRecords.filter(r => r.status !== 'Present').length}
              </p>
            </div>
          </div>
        </div>

        {/* Program QR Check-in Code */}
        <div className="bg-glass border border-outline-variant/10 rounded-xl overflow-hidden flex flex-col items-center justify-center p-6 text-center group relative shadow-2xl">
          {activeProgram ? (
            <>
              <div className="relative w-full aspect-square max-w-[180px] mb-4 overflow-hidden border border-outline-variant/10 rounded-lg bg-white p-3">
                <QRCodeSVG value={checkInUrl} className="w-full h-full" />
              </div>
              <p className="font-headline font-bold text-sm text-on-surface mb-1">
                Program Check-In QR
              </p>
              <p className="text-[10px] text-on-surface-variant max-w-[220px]">
                Display this code at the venue. Residents logged into their web portal account can scan it with their phone camera to check themselves into "{activeProgram.title}".
              </p>
            </>
          ) : (
            <>
              <QrCode className="w-16 h-16 text-primary/30 mb-4" />
              <p className="text-[11px] text-on-surface-variant">Select a program to generate its check-in QR.</p>
            </>
          )}
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
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant text-sm font-semibold">
                    No residents registered yet.
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((rec) => (
                  <tr key={rec.youthId} className="hover:bg-surface-variant/20 transition-colors group">
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-headline font-bold text-primary text-xs">
                          {rec.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <p className="font-headline font-bold text-sm text-on-surface">{rec.name}</p>
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
                      {rec.status !== 'Present' ? (
                        <button
                          onClick={() => onManualCheckIn(rec.youthId, rec.name)}
                          className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg transition-colors border border-emerald-500/20"
                        >
                          Check In
                        </button>
                      ) : (
                        <button
                          onClick={() => onManualCheckOut(rec.youthId, rec.name)}
                          className="text-[10px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg transition-colors border border-red-500/20"
                        >
                          Check Out
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
