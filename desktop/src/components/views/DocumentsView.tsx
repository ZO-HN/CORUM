import React from 'react';
import { FileText, Search, Plus, Download, Trash2, X } from 'lucide-react';
import * as db from '../../lib/db';

interface DocumentsViewProps {
  documents: db.DocumentRecord[];
  youthProfiles: db.YouthProfile[];
  documentSearch: string;
  setDocumentSearch: (v: string) => void;
  documentTypeFilter: string;
  setDocumentTypeFilter: (v: string) => void;
  // Upload modal
  isDocModalOpen: boolean;
  setIsDocModalOpen: (v: boolean) => void;
  selectedYouthIdForDoc: string;
  setSelectedYouthIdForDoc: (v: string) => void;
  newDocFileName: string;
  setNewDocFileName: (v: string) => void;
  newDocType: 'ID' | 'Certificate' | 'Recommendation' | 'Other';
  setNewDocType: (v: 'ID' | 'Certificate' | 'Recommendation' | 'Other') => void;
  newDocUrl: string;
  setNewDocUrl: (v: string) => void;
  setScanNotification: (v: { message: string; type: 'success' | 'info' | 'error' } | null) => void;
  setDocuments: React.Dispatch<React.SetStateAction<db.DocumentRecord[]>>;
  logActivity: (action: string, table: string, oldData: any, newData: any) => void;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  youthProfiles,
  documentSearch,
  setDocumentSearch,
  documentTypeFilter,
  setDocumentTypeFilter,
  isDocModalOpen,
  setIsDocModalOpen,
  selectedYouthIdForDoc,
  setSelectedYouthIdForDoc,
  newDocFileName,
  setNewDocFileName,
  newDocType,
  setNewDocType,
  newDocUrl,
  setNewDocUrl,
  setScanNotification,
  setDocuments,
  logActivity,
}) => {
  const youthMap = React.useMemo(() => {
    return new Map(youthProfiles.map(y => [y.id, y]));
  }, [youthProfiles]);

  return (
            <div className="space-y-6">
              {/* Header Panel */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-surface-container-low p-5 rounded-xl border border-[#353535]/15 gap-4">
                <div>
                  <h3 className="font-headline font-black text-xl text-on-surface flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Documents & File Repository
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Manage verification IDs, SK certificates, and recommendation files for registered youth.
                  </p>
                </div>
                
                <button
                  onClick={() => setIsDocModalOpen(true)}
                  className="bg-primary hover:bg-primary-fixed-dim text-on-primary font-headline font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" /> Upload Document
                </button>
              </div>

              {/* Filters & Search Bar */}
              <div className="flex flex-col md:flex-row gap-4 items-center bg-surface-container-low/40 p-4 rounded-xl border border-[#353535]/10">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                  <input
                    type="text"
                    value={documentSearch}
                    onChange={(e) => setDocumentSearch(e.target.value)}
                    placeholder="Search by file name or resident..."
                    className="w-full bg-surface-container-high border-none rounded-lg py-2.5 pl-10 pr-4 text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/50 transition-all font-body"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-on-surface-variant whitespace-nowrap">File Type:</span>
                  <select
                    value={documentTypeFilter}
                    onChange={(e) => setDocumentTypeFilter(e.target.value)}
                    className="bg-surface-container-high text-xs text-on-surface border-none rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-primary/50 outline-none font-headline font-bold"
                  >
                    <option value="All">All Types</option>
                    <option value="ID">Government ID</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Recommendation">Recommendation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Document List Table */}
              <div className="bg-surface-container-low rounded-xl border border-[#353535]/10 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-highest/30 border-b border-[#353535]/15">
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Document Details</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Owner Profile</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">File Type</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Upload Date</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#353535]/10">
                      {(() => {
                        const filteredDocs = documents.filter(doc => {
                          const owner = doc.youthId ? youthMap.get(doc.youthId) : undefined;
                          const ownerName = owner ? `${owner.firstName} ${owner.lastName}`.toLowerCase() : 'unknown';
                          const fileMatches = doc.fileName.toLowerCase().includes(documentSearch.toLowerCase()) || ownerName.includes(documentSearch.toLowerCase());
                          const typeMatches = documentTypeFilter === 'All' || doc.fileType === documentTypeFilter;
                          return fileMatches && typeMatches;
                        });

                        if (filteredDocs.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant text-sm font-semibold">
                                No documents found matching current filters.
                              </td>
                            </tr>
                          );
                        }

                        return filteredDocs.map((doc) => {
                          const owner = doc.youthId ? youthMap.get(doc.youthId) : undefined;
                          return (
                            <tr key={doc.id} className="hover:bg-surface-variant/20 transition-colors group">
                              <td className="px-6 py-4.5">
                                <div className="flex items-center gap-3">
                                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="font-headline font-bold text-sm text-on-surface">{doc.fileName}</p>
                                    <p className="text-[10px] text-on-surface-variant/70 mt-0.5">ID: {doc.id}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4.5">
                                {owner ? (
                                  <div>
                                    <p className="text-sm font-bold text-on-surface">{owner.firstName} {owner.lastName}</p>
                                    <p className="text-[10px] text-on-surface-variant uppercase tracking-tight mt-0.5">{owner.purok} • UID: {owner.id}</p>
                                  </div>
                                ) : (
                                  <span className="text-xs italic text-on-surface-variant/60">Unknown Resident</span>
                                )}
                              </td>
                              <td className="px-6 py-4.5">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                  doc.fileType === 'ID' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                  doc.fileType === 'Certificate' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                  doc.fileType === 'Recommendation' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                  'bg-surface-container-highest text-on-surface border border-outline/10'
                                }`}>
                                  {doc.fileType}
                                </span>
                              </td>
                              <td className="px-6 py-4.5">
                                <span className="text-xs text-on-surface-variant font-semibold">
                                  {new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </td>
                              <td className="px-6 py-4.5 text-right">
                                <div className="flex justify-end gap-2">
                                  <a
                                    href={doc.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-bold text-primary hover:underline bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                                  >
                                    <Download className="w-3.5 h-3.5" /> View/Download
                                  </a>
                                  <button
                                    onClick={async () => {
                                      if (confirm(`Are you sure you want to delete "${doc.fileName}"?`)) {
                                        const success = await db.deleteDocument(doc.id);
                                        if (success) {
                                          setDocuments(prev => prev.filter(d => d.id !== doc.id));
                                          logActivity('DELETE', 'documents', doc, null);
                                          setScanNotification({ message: `SUCCESS: "${doc.fileName}" deleted successfully!`, type: 'success' });
                                        }
                                      }
                                    }}
                                    className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Upload Document Modal */}
              {isDocModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="glass-panel w-full max-w-md p-6 rounded-xl border border-[#353535]/20 flex flex-col space-y-4 animate-scale-up">
                    <div className="flex justify-between items-center pb-2 border-b border-[#353535]/15">
                      <h4 className="font-headline font-black text-lg text-on-surface">Upload Document</h4>
                      <button onClick={() => { setIsDocModalOpen(false); setSelectedYouthIdForDoc(''); setNewDocFileName(''); setNewDocUrl(''); }} className="text-on-surface-variant hover:text-on-surface">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!selectedYouthIdForDoc || !newDocFileName.trim()) {
                          alert("Resident owner and file name are required.");
                          return;
                        }

                        const docUrl = newDocUrl.trim() || `https://kvyymoavlhxwwxebooyj.supabase.co/storage/v1/object/public/documents/${encodeURIComponent(newDocFileName)}`;
                        
                        const doc = await db.saveDocument({
                          youthId: selectedYouthIdForDoc,
                          fileName: newDocFileName.trim(),
                          fileType: newDocType,
                          fileUrl: docUrl
                        });

                        setDocuments(prev => [doc, ...prev]);
                        logActivity('INSERT', 'documents', null, doc);
                        setScanNotification({ message: `SUCCESS: "${doc.fileName}" uploaded and linked successfully!`, type: 'success' });
                        
                        // Reset form
                        setSelectedYouthIdForDoc('');
                        setNewDocFileName('');
                        setNewDocUrl('');
                        setIsDocModalOpen(false);
                      }}
                      className="space-y-4 text-left"
                    >
                      {/* Select Resident Owner */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-on-surface-variant">Resident Owner</label>
                        <select
                          value={selectedYouthIdForDoc}
                          onChange={(e) => setSelectedYouthIdForDoc(e.target.value)}
                          required
                          className="w-full bg-surface-container-high text-xs text-on-surface border-none rounded-lg px-3 py-3 focus:ring-1 focus:ring-primary outline-none"
                        >
                          <option value="">-- Select Resident --</option>
                          {youthProfiles.map(y => (
                            <option key={y.id} value={y.id}>{y.firstName} {y.lastName} ({y.purok} - ID: {y.id})</option>
                          ))}
                        </select>
                      </div>

                      {/* File Name */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-on-surface-variant">Document Name</label>
                        <input
                          type="text"
                          required
                          value={newDocFileName}
                          onChange={(e) => setNewDocFileName(e.target.value)}
                          placeholder="e.g. Barangay Clearance - Dela Cruz"
                          className="w-full bg-surface-container-high border-none rounded-lg py-3 px-4 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      {/* Document Type */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-on-surface-variant">Document Type</label>
                        <select
                          value={newDocType}
                          onChange={(e) => setNewDocType(e.target.value as any)}
                          className="w-full bg-surface-container-high text-xs text-on-surface border-none rounded-lg px-3 py-3 focus:ring-1 focus:ring-primary outline-none"
                        >
                          <option value="ID">Government ID</option>
                          <option value="Certificate">Certificate</option>
                          <option value="Recommendation">Recommendation</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Simulated URL */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-on-surface-variant">File URL (Optional - will generate default if blank)</label>
                        <input
                          type="text"
                          value={newDocUrl}
                          onChange={(e) => setNewDocUrl(e.target.value)}
                          placeholder="e.g. https://storage.supabase.co/..."
                          className="w-full bg-surface-container-high border-none rounded-lg py-3 px-4 text-xs text-on-surface focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary-fixed-dim text-on-primary font-headline font-bold py-3 rounded-lg shadow-md transition-all active:scale-98"
                      >
                        Confirm Upload
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
  );
};

export default DocumentsView;
