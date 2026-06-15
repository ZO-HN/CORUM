export type UserRole = 'Admin' | 'Staff' | 'Viewer' | 'SK Chairperson' | 'SK Kagawad' | 'SK Treasurer' | 'SK Secretary';

export interface UserRecord {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  status: 'Active' | 'Disabled';
}

export type ScanNotification = { message: string; type: 'success' | 'info' | 'error' } | null;

export type ImportTab = 'single' | 'bulk' | 'registry';

export type SettingsSubTab = 'config' | 'users' | 'logs';

export type ReportsSubTab = 'builder-gis-trends' | 'dss' | 'reporting-export';

export type ReportsInnerSubTab = 'builder' | 'gis' | 'trends';

export type RegistrySubTab = 'Pending' | 'Approved' | 'Rejected';

export type GisOverlayLayer = 'density' | 'age' | 'gender' | 'participation' | 'needs' | 'impact' | 'risk';

export type DocType = 'ID' | 'Certificate' | 'Recommendation' | 'Other';
