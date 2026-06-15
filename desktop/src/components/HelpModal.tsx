import React from 'react';
import { X, HelpCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface border border-[#353535]/15 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative animate-scale-in text-left">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-[#e5e2e1] transition-colors"
            >
              <X className="w-5 h-5 text-on-surface" />
            </button>
            
            <h3 className="font-headline font-black text-xl text-[#e5e2e1] mb-2 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-primary" />
              CORUM Help Center & Guide
            </h3>
            <p className="text-xs text-on-surface-variant border-b border-[#353535]/15 pb-3 mb-4">
              Learn how to manage the Youth Profiling Database and operational portals.
            </p>

            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 text-xs">
              <div className="space-y-1">
                <h4 className="font-bold text-on-surface">1. Web Registry Submissions</h4>
                <p className="text-on-surface-variant leading-relaxed">
                  Go to **Add Youth Resident** &rarr; **Web Registry Requests**. Here you can review, approve, or reject submissions made by youth residents through the public portal. Approved profiles are added to the database automatically.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-on-surface">2. Youth Profiling & Excel Export</h4>
                <p className="text-on-surface-variant leading-relaxed">
                  Navigate to the **Youth List** page to view all profiles. Use the space-separated search bar for custom combinations (e.g. "purok 4 active female"). Click **Export to Excel** to download the currently filtered list as a CSV.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-on-surface">3. Programs & Attendance Logging</h4>
                <p className="text-on-surface-variant leading-relaxed">
                  Select **Programs & Events** to view drafts or active programs. Navigate to **Attendance Logger** and scan QR IDs or click "Simulate Scanner Scan" to log youth attendance for active programs.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-[#e5e2e1]">4. System Settings</h4>
                <p className="text-on-surface-variant leading-relaxed">
                  Unlock the **Settings** page to configure your Barangay profile, official seal logo, council member names (Treasurer, Secretary, Kagawads), and view the system audit logs.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#353535]/15 mt-5">
              <button 
                onClick={onClose}
                className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-headline font-black text-xs hover:opacity-95 shadow-md transition-all active:scale-95"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
  );
};

export default HelpModal;
