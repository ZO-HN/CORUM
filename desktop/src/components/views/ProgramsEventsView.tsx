import React from 'react';
import { PlusCircle } from 'lucide-react';
import * as db from '../../lib/db';

interface ProgramsEventsViewProps {
  programs: db.Program[];
  currentUserRole?: string;
  onCreateProgramClick?: () => void;
}

export default function ProgramsEventsView({
  programs,
  currentUserRole,
  onCreateProgramClick
}: ProgramsEventsViewProps) {
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

      <div className="flex justify-between items-center bg-surface-container-low p-5 rounded-xl border border-[#353535]/15">
        <div>
          <h3 className="font-headline font-black text-xl text-on-surface">
            SK Youth Development Programs
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Manage profiling programs, scholarships orientation, disaster prep seminars, and sports fests.
          </p>
        </div>
        <button 
          disabled={currentUserRole !== 'Admin'}
          onClick={onCreateProgramClick}
          className={currentUserRole === 'Admin'
            ? "bg-primary text-on-primary hover:opacity-90 text-xs font-extrabold px-4 py-2.5 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all shadow-md cursor-pointer"
            : "bg-primary/50 text-on-primary/70 text-xs font-extrabold px-4 py-2.5 rounded-lg flex items-center gap-1.5 opacity-50 cursor-not-allowed transition-all shadow-md"
          }
        >
          <PlusCircle className={`w-4 h-4 ${currentUserRole === 'Admin' ? 'text-on-primary' : 'text-on-primary/70'}`} /> CREATE NEW PROGRAM
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {programs.map((prog) => (
          <div key={prog.id} className="bg-surface-container-low p-6 rounded-xl border border-[#353535]/15 hover:border-primary/20 transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  prog.status === 'Active' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : prog.status === 'Draft'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : 'bg-surface-bright text-on-surface border border-outline/20'
                }`}>
                  {prog.status}
                </span>
                <span className="text-[10px] font-bold text-on-surface-variant font-mono uppercase">
                  ID: {prog.id}
                </span>
              </div>

              <h4 className="font-headline font-bold text-lg text-on-surface leading-tight hover:text-primary transition-colors cursor-pointer">
                {prog.title}
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-2.5">
                {prog.description}
              </p>
            </div>

            <div className="border-t border-[#353535]/15 pt-4 mt-6 flex justify-between items-center text-xs">
              <div>
                <p className="text-[9px] uppercase font-bold text-on-surface-variant tracking-wider">Date Timeline</p>
                <p className="font-semibold mt-0.5 text-on-surface">{prog.startDate}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase font-bold text-on-surface-variant tracking-wider">Registered Participants</p>
                <p className="font-semibold text-primary mt-0.5">{prog.registeredCount} Youth</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
