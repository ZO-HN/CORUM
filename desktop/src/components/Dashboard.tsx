
import { 
  Users, 
  Hourglass, 
  Calendar, 
  Download, 
  UserPlus, 
  FileUp, 
  CalendarPlus,
  TrendingUp,
  CheckSquare
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { ErrorBoundary } from 'shared';

// --- TypeScript Interfaces ---
export interface YouthRegistration {
  id: string;
  fullName: string;
  purok: string;
  age: number;
  registeredOn: string;
  status: 'Approved' | 'Pending';
  initials: string;
}

export interface AgeGroupData {
  group: string;
  count: number;
}

export interface PurokData {
  purok: string;
  count: number;
  percentage: number;
}

export interface GenderData {
  name: string;
  value: number;
  color: string;
}

export interface DashboardMetrics {
  totalYouth: number;
  totalYouthGrowth: string;
  pendingReviews: number;
  activePrograms: number;
  activeProgramsDetail: string;
  upcomingEvents: number;
  upcomingEventsDetail: string;
  attendanceRate: number;
}

export interface DashboardProgram {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  status: string;
  registeredCount: number;
  presentCount: number;
  budget: number;
}

export interface ChartDataItem {
  name: string;
  value: number;
}

interface DashboardProps {
  onAction?: (actionType: string) => void;
  dbStatus?: 'connected' | 'disconnected';
  realMetrics?: {
    totalYouth: number;
    pendingReviews: number;
    activePrograms: number;
    upcomingEvents: number;
    attendanceRate: number;
  };
  realRecentRegistrations?: YouthRegistration[];
  realClassificationData?: ChartDataItem[];
  realPurokData?: PurokData[];
  realGenderData?: GenderData[];
  realEducationData?: ChartDataItem[];
  realEmploymentData?: ChartDataItem[];
  realPrograms?: DashboardProgram[];
  realSkillsData?: ChartDataItem[];
  realParticipationData?: ChartDataItem[];
  barangayName?: string;
  skChairperson?: string;
  currentUserRole?: string;
  currentUserName?: string;
  currentUserStatus?: string;
}

// --- Mock Fallback Data ---
const MOCK_METRICS: DashboardMetrics = {
  totalYouth: 1248,
  totalYouthGrowth: "+12% Growth this month",
  pendingReviews: 18,
  activePrograms: 4,
  activeProgramsDetail: "2 in progress, 2 planned",
  upcomingEvents: 2,
  upcomingEventsDetail: "Next: June 15 (Sports Fest)",
  attendanceRate: 85,
};

const MOCK_CLASSIFICATION_DATA: ChartDataItem[] = [
  { name: "In School Youth (Nag skwela)", value: 620 },
  { name: "Out of School Youth (Wala nag Skwela)", value: 240 },
  { name: "Working Youth", value: 310 },
  { name: "Youth w/ specific needs: PWD", value: 45 }
];

const MOCK_PUROK_DATA: PurokData[] = [
  { purok: "East", count: 340, percentage: 27 },
  { purok: "West A", count: 280, percentage: 22 },
  { purok: "West B", count: 250, percentage: 20 },
  { purok: "Holy Cross", count: 200, percentage: 16 },
  { purok: "Special Blk", count: 178, percentage: 15 },
  { purok: "Belisario", count: 120, percentage: 10 },
  { purok: "Ibula", count: 95, percentage: 8 },
  { purok: "Puting Lupa", count: 85, percentage: 7 },
  { purok: "Ruiz", count: 60, percentage: 5 },
  { purok: "Sto. Niño A", count: 50, percentage: 4 },
  { purok: "Sto. Niño B", count: 45, percentage: 4 },
  { purok: "Freedom", count: 30, percentage: 2 },
  { purok: "Fatima", count: 20, percentage: 2 },
  { purok: "San Vicente", count: 15, percentage: 1 },
];

const MOCK_GENDER_DATA: GenderData[] = [
  { name: "Male", value: 580, color: "#b4c5ff" },       // Primary light blue
  { name: "Female", value: 540, color: "#ddb8ff" },     // Secondary light purple
  { name: "LGBTQIA+", value: 98, color: "#10b981" },    // Emerald Green
  { name: "Unlabeled", value: 30, color: "#8e9192" },   // Neutral gray
];

const MOCK_EDUCATION_DATA: ChartDataItem[] = [
  { name: "High School Graduate", value: 380 },
  { name: "College Level", value: 140 },
  { name: "College Graduate", value: 480 },
  { name: "Vocational Graduate", value: 180 },
  { name: "Elementary Level", value: 45 },
  { name: "High School Level", value: 95 }
];

const MOCK_EMPLOYMENT_DATA: ChartDataItem[] = [
  { name: "Unemployed", value: 450 },
  { name: "Employed", value: 380 },
  { name: "Self-employed", value: 120 },
  { name: "Currently looking for a job", value: 90 },
  { name: "Not interested looking for a job", value: 35 }
];

export interface DashboardEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  status: 'Active' | 'Draft' | 'Completed';
}

const MOCK_UPCOMING_EVENTS: DashboardEvent[] = [
  { id: "1", title: "SK Barangay Sports Fest 2026", category: "Sports", date: "2026-06-15", status: "Active" },
  { id: "2", title: "Green City Clean-Up Drive", category: "Environment", date: "2026-07-02", status: "Draft" },
  { id: "3", title: "Digital Literacy & AI Seminar", category: "Education", date: "2026-07-10", status: "Draft" }
];

const MOCK_SKILLS_DATA: ChartDataItem[] = [
  { name: "Leadership", value: 320 },
  { name: "Graphic Design", value: 240 },
  { name: "Public Speaking", value: 210 },
  { name: "First Aid", value: 180 },
  { name: "Sports Coaching", value: 160 },
  { name: "Event Organizing", value: 140 },
  { name: "Web Design", value: 110 }
];

const MOCK_PARTICIPATION_DATA: ChartDataItem[] = [
  { name: "Sports Fest 2024", value: 86 },
  { name: "Scholarship Orientation", value: 78 },
  { name: "Leadership Summit", value: 49 },
  { name: "Digital Literacy", value: 35 },
  { name: "Clean-up Drive", value: 25 }
];

const MOCK_RECENT_REGISTRATIONS: YouthRegistration[] = [
  { id: "1", fullName: "Elena Santos Rodriguez", purok: "Purok 4", age: 22, registeredOn: "June 12, 2026", status: "Approved", initials: "ER" },
  { id: "2", fullName: "Juan Dela Cruz Mercado", purok: "Purok 1", age: 20, registeredOn: "June 11, 2026", status: "Approved", initials: "JM" },
  { id: "3", fullName: "Dianne Flores Alvarez", purok: "Purok 3", age: 19, registeredOn: "June 10, 2026", status: "Pending", initials: "DA" },
  { id: "4", fullName: "Maria Santos Cruz", purok: "Purok 3", age: 18, registeredOn: "June 08, 2026", status: "Approved", initials: "MC" },
  { id: "5", fullName: "Nathaniel Cruz Santos", purok: "Purok 2", age: 21, registeredOn: "June 07, 2026", status: "Pending", initials: "NS" },
];

export default function Dashboard({ 
  onAction,
  dbStatus: _dbStatus = 'connected',
  realMetrics,
  realRecentRegistrations,
  realClassificationData,
  realPurokData,
  realGenderData,
  realEducationData,
  realEmploymentData,
  realPrograms,
  realSkillsData,
  realParticipationData,
  barangayName: _barangayName = 'San Antonio',
  skChairperson: _skChairperson = 'Hon. Jane Doe',
  currentUserRole = 'SK Chairperson',
  currentUserName = 'Hon. Jane Doe',
  currentUserStatus: _currentUserStatus = 'Active'
}: DashboardProps) {
  
  const metrics: DashboardMetrics = {
    totalYouth: realMetrics ? realMetrics.totalYouth : 0,
    totalYouthGrowth: realMetrics ? "Barangay Census" : "Offline",
    pendingReviews: realMetrics ? realMetrics.pendingReviews : 0,
    activePrograms: realMetrics ? realMetrics.activePrograms : 0,
    activeProgramsDetail: realMetrics ? `${realMetrics.activePrograms} active` : "0 active",
    upcomingEvents: realMetrics ? realMetrics.upcomingEvents : 0,
    upcomingEventsDetail: realMetrics ? `${realMetrics.upcomingEvents} upcoming` : "0 upcoming",
    attendanceRate: realMetrics ? realMetrics.attendanceRate : 0,
  };

  const userRoleDisplay = currentUserRole === 'Admin' ? 'SK Admin' : currentUserRole === 'Staff' ? 'SK Staff' : currentUserRole === 'Viewer' ? 'SK Viewer' : currentUserRole;

  const classificationData = realClassificationData || [];
  const purokData = realPurokData || [];
  
  // Align gender chart colors with native theme colors
  const genderColors = ["#b4c5ff", "#ddb8ff", "#10b981", "#8e9192"];
  const genderData = realGenderData ? realGenderData.map((g, idx) => ({
    ...g,
    color: g.color || genderColors[idx] || "#8e9192"
  })) : [];

  const recentRegistrations = realRecentRegistrations || [];
  const educationData = realEducationData || [];
  const employmentData = realEmploymentData || [];
  const skillsData = realSkillsData || [];
  const participationData = realParticipationData || [];

  // Format upcoming events safely with date parsing fallback
  const upcomingEvents = realPrograms && realPrograms.length > 0
    ? realPrograms.filter(p => p.status === 'Active' || p.status === 'Draft').slice(0, 3).map(p => {
        let month = 'JUN';
        let day = 15;
        try {
          const d = new Date(p.startDate);
          if (!isNaN(d.getTime())) {
            month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            day = d.getDate();
          }
        } catch (_) {}
        return {
          id: p.id,
          title: p.title,
          category: p.category,
          month,
          day,
          status: p.status
        };
      })
    : [];

  const handleActionClick = (actionType: string) => {
    console.log(`Dashboard Action Triggered: ${actionType}`);
    if (onAction) {
      onAction(actionType);
    }
  };

  const handleGenerateReport = () => {
    handleActionClick('generate-report');
  };

  return (
    <div className="space-y-6 text-on-surface">
      
      {/* --- SECTION 1: Top Hero & Quick Administration Grid (Row 1) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column (8-cols): Tagline Header Banner (no bg, no borders, top-left styled) */}
        <div className="lg:col-span-8 flex flex-col justify-center text-left py-2">
          <h2 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">
            Kabataang Magkakaugnay. <span className="text-primary-fixed-dim">Pamayanang Maunlad.</span>
          </h2>
          <p className="text-on-surface-variant text-sm mt-1 max-w-xl">
            Centralized profiling, registering, attendance tracking, and youth operations. Welcome back to your dashboard!
          </p>
          <div className="mt-4 flex flex-col gap-y-1 text-sm font-semibold text-emerald-400">
            <span className="text-base font-bold">Welcome back, {userRoleDisplay} - {currentUserName}</span>
            <span className="text-xs text-on-surface-variant/70 font-medium">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Right Column (4-cols): Quick Administration Widget */}
        <div className="lg:col-span-4 bg-surface-container-low p-5 rounded-xl border border-[#353535]/10 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Quick Administration
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 flex-1 items-center">
            <button
              disabled={currentUserRole !== 'Admin'}
              onClick={handleGenerateReport}
              className={`flex items-center gap-2 border border-[#353535]/20 rounded-lg py-2 px-3 text-[11px] font-semibold transition-all group ${
                currentUserRole === 'Admin'
                  ? 'hover:border-amber-500/20 bg-[#181818] text-on-surface hover:text-[#e5e2e1] cursor-pointer'
                  : 'bg-[#181818] text-on-surface/40 opacity-50 cursor-not-allowed'
              }`}
            >
              <Download className={`w-3.5 h-3.5 shrink-0 ${currentUserRole === 'Admin' ? 'text-[#ffb95f]' : 'text-[#ffb95f]/40'}`} />
              <span className="truncate">Report Census</span>
            </button>

            <button
              onClick={() => handleActionClick('add-youth')}
              className="flex items-center gap-2 border border-[#353535]/20 hover:border-emerald-500/20 bg-[#181818] text-on-surface hover:text-[#e5e2e1] rounded-lg py-2 px-3 text-[11px] font-semibold transition-all group cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Register Youth</span>
            </button>

            <button
              onClick={() => handleActionClick('import-csv')}
              className="flex items-center gap-2 border border-[#353535]/20 hover:border-emerald-500/20 bg-[#181818] text-on-surface hover:text-[#e5e2e1] rounded-lg py-2 px-3 text-[11px] font-semibold transition-all group cursor-pointer"
            >
              <FileUp className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">Import CSV</span>
            </button>

            <button
              disabled={currentUserRole !== 'Admin'}
              onClick={() => handleActionClick('new-event')}
              className={`flex items-center gap-2 border border-[#353535]/20 rounded-lg py-2 px-3 text-[11px] font-semibold transition-all group ${
                currentUserRole === 'Admin'
                  ? 'hover:border-emerald-500/20 bg-[#181818] text-on-surface hover:text-[#e5e2e1] cursor-pointer'
                  : 'bg-[#181818] text-on-surface/40 opacity-50 cursor-not-allowed'
              }`}
            >
              <CalendarPlus className={`w-3.5 h-3.5 shrink-0 ${currentUserRole === 'Admin' ? 'text-emerald-400' : 'text-emerald-400/40'}`} />
              <span className="truncate">New Event</span>
            </button>
          </div>
        </div>

      </div>

      {/* --- SECTION 2: KPI Metric Cards (Row 2 - Full Width) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Registered Youth */}
        <button 
          onClick={() => handleActionClick('youth-list')}
          className="bg-surface-container-low p-6 rounded-xl border border-[#353535]/10 flex items-center justify-between group hover:border-primary/20 transition-all duration-200 cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-primary/50"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Total Registered Youth
            </span>
            <h3 className="text-3xl font-bold tracking-tight text-on-surface group-hover:text-primary transition-colors">
              {metrics.totalYouth.toLocaleString()}
            </h3>
            <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {metrics.totalYouthGrowth}
            </p>
          </div>
          <div className="p-3.5 bg-primary/10 rounded-xl text-primary group-hover:bg-primary/20 transition-all">
            <Users className="w-5 h-5" />
          </div>
        </button>

        {/* Card 2: Pending Registrations */}
        <button 
          onClick={() => handleActionClick('registry-requests')}
          className="bg-surface-container-low p-6 rounded-xl border border-[#353535]/10 flex items-center justify-between group hover:border-amber-500/20 transition-all duration-200 cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-amber-500/50"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Pending Registrations
            </span>
            <h3 className="text-3xl font-bold tracking-tight text-on-surface group-hover:text-amber-400 transition-colors">
              {metrics.pendingReviews}
            </h3>
            <p className="text-[11px] text-amber-400 font-medium">
              {metrics.pendingReviews === 0 ? "All verified" : `${metrics.pendingReviews} require review`}
            </p>
          </div>
          <div className="p-3.5 bg-amber-500/10 rounded-xl text-amber-400 group-hover:bg-amber-500/20 transition-all">
            <Hourglass className="w-5 h-5" />
          </div>
        </button>

        {/* Card 3: Active Programs & Events */}
        <button 
          onClick={() => handleActionClick('programs')}
          className="bg-surface-container-low p-6 rounded-xl border border-[#353535]/10 flex items-center justify-between group hover:border-primary/20 transition-all duration-200 cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-primary/50"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Programs & Events
            </span>
            <h3 className="text-3xl font-bold tracking-tight text-on-surface group-hover:text-primary transition-colors">
              {(metrics.activePrograms + metrics.upcomingEvents).toLocaleString()}
            </h3>
            <p className="text-[11px] text-on-surface-variant font-medium">
              {metrics.activePrograms} active, {metrics.upcomingEvents} upcoming
            </p>
          </div>
          <div className="p-3.5 bg-primary/10 rounded-xl text-primary group-hover:bg-primary/20 transition-all">
            <Calendar className="w-5 h-5" />
          </div>
        </button>

        {/* Card 4: Attendance Rate */}
        <button 
          onClick={() => handleActionClick('attendance')}
          className="bg-surface-container-low p-6 rounded-xl border border-[#353535]/10 flex items-center justify-between group hover:border-primary/20 transition-all duration-200 cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-primary/50"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Average Attendance
            </span>
            <h3 className="text-3xl font-bold tracking-tight text-on-surface group-hover:text-primary transition-colors">
              {metrics.attendanceRate}%
            </h3>
            <p className="text-[11px] text-on-surface-variant font-medium">
              Across all logged events
            </p>
          </div>
          <div className="p-3.5 bg-primary/10 rounded-xl text-primary group-hover:bg-primary/20 transition-all">
            <CheckSquare className="w-5 h-5" />
          </div>
        </button>

      </div>

      {/* --- SECTION 3: Analytics Visualizations (Row 3) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column (8-cols): Purok Demographics */}
        <div className="lg:col-span-8">
          <div className="bg-surface-container-low p-6 rounded-xl border border-[#353535]/10 space-y-4 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                Demographics by Purok Sector
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Resident counts and distribution ratios across all Purok sectors.
              </p>
            </div>
            
            <div className="h-64 w-full mt-4 relative">
              <ErrorBoundary moduleName="Purok Distribution Chart">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart 
                    data={purokData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
                  >
                    <XAxis 
                      dataKey="purok" 
                      stroke="#8e9192" 
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={65}
                    />
                    <YAxis 
                      stroke="#8e9192" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                      contentStyle={{ background: '#1c1b1b', borderColor: '#353535', borderRadius: '8px', color: '#e5e2e1' }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#10b981" 
                      radius={[2, 2, 0, 0]}
                      maxBarSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ErrorBoundary>
            </div>
          </div>
        </div>

        {/* Right Column (4-cols): Gender Makeup */}
        <div className="lg:col-span-4">
          {/* Gender Distribution Donut Chart */}
          <div className="bg-surface-container-low p-6 rounded-xl border border-[#353535]/10 space-y-4 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                Gender Makeup
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Gender identity representation registry.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center py-2 flex-1 justify-end">
              <div className="w-40 h-40 relative flex items-center justify-center">
                <ErrorBoundary moduleName="Gender Makeup Chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </ErrorBoundary>
                
                {/* Donut Center Label (matching darker colors) */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-on-surface">
                    {genderData.reduce((acc, curr) => acc + curr.value, 0)}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-[#8e9192] font-bold">
                    Accounted
                  </span>
                </div>
              </div>

              {/* Donut Legend */}
              <div className="w-full mt-4 space-y-2">
                {genderData.map((g) => (
                  <div key={g.name} className="flex items-center justify-between text-xs text-on-surface-variant">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }}></span>
                      <span className="font-medium">{g.name}</span>
                    </div>
                    <span className="font-semibold text-on-surface">
                      {g.value} ({Math.round((g.value / metrics.totalYouth) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* --- SECTION 4: Lower Row Visualizations (Age, Education, Employment) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        
        {/* Card 1: Youth Classification Chart */}
        <div className="bg-surface-container-low p-6 rounded-xl border border-[#353535]/10 space-y-4 h-full flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
              Youth Classification
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Demographics breakdown by youth classification categories.
            </p>
          </div>
          
          <div className="h-48 w-full mt-4 relative">
            <ErrorBoundary moduleName="Youth Classification Chart">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart 
                  data={classificationData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 45 }}
                >
                  <XAxis 
                    dataKey="name" 
                    stroke="#8e9192" 
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    angle={-35}
                    textAnchor="end"
                    height={50}
                    tickFormatter={(val) => {
                      const s = String(val);
                      return s.length > 15 ? s.slice(0, 12) + '...' : s;
                    }}
                  />
                  <YAxis 
                    stroke="#8e9192" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                    contentStyle={{ background: '#1c1b1b', borderColor: '#353535', borderRadius: '8px', color: '#e5e2e1' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={25}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ErrorBoundary>
          </div>
        </div>

        {/* Card 2: Education Attainment Chart */}
        <div className="bg-surface-container-low p-6 rounded-xl border border-[#353535]/10 space-y-4 h-full flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
              Education Level
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Distribution of educational attainment.
            </p>
          </div>
          
          <div className="h-48 w-full mt-4 relative">
            <ErrorBoundary moduleName="Education Level Chart">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart 
                  data={educationData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 45 }}
                >
                  <XAxis 
                    dataKey="name" 
                    stroke="#8e9192" 
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    angle={-35}
                    textAnchor="end"
                    height={50}
                    tickFormatter={(val) => {
                      const s = String(val);
                      return s.length > 15 ? s.slice(0, 12) + '...' : s;
                    }}
                  />
                  <YAxis 
                    stroke="#8e9192" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                    contentStyle={{ background: '#1c1b1b', borderColor: '#353535', borderRadius: '8px', color: '#e5e2e1' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={25}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ErrorBoundary>
          </div>
        </div>

        {/* Card 3: Employment Status Chart */}
        <div className="bg-surface-container-low p-6 rounded-xl border border-[#353535]/10 space-y-4 h-full flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
              Employment Status
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Work and student status breakdown.
            </p>
          </div>
          
          <div className="h-48 w-full mt-4 relative">
            <ErrorBoundary moduleName="Employment Status Chart">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart 
                  data={employmentData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 45 }}
                >
                  <XAxis 
                    dataKey="name" 
                    stroke="#8e9192" 
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    angle={-35}
                    textAnchor="end"
                    height={50}
                    tickFormatter={(val) => {
                      const s = String(val);
                      return s.length > 15 ? s.slice(0, 12) + '...' : s;
                    }}
                  />
                  <YAxis 
                    stroke="#8e9192" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                    contentStyle={{ background: '#1c1b1b', borderColor: '#353535', borderRadius: '8px', color: '#e5e2e1' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={25}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ErrorBoundary>
          </div>
        </div>

      </div>

      {/* --- SECTION 5: Recent Registrations & Upcoming Events Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column (8-cols): Recent Registrations Table */}
        <div className="lg:col-span-8 bg-surface-container-low rounded-xl border border-[#353535]/10 overflow-hidden flex flex-col justify-between">
          <div className="p-6 border-b border-[#353535]/10">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
              Recent Registrations
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Latest local registrations pending review or recently approved.
            </p>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#181818]/40 text-on-surface-variant text-[10px] font-bold uppercase tracking-wider border-b border-[#353535]/10">
                  <th className="py-3 px-6">Full Name</th>
                  <th className="py-3 px-6">Purok</th>
                  <th className="py-3 px-6">Age</th>
                  <th className="py-3 px-6">Registered On</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#353535]/10 text-xs">
                {recentRegistrations.length > 0 ? (
                  recentRegistrations.map((y) => (
                    <tr key={y.id} className="hover:bg-[#353535]/10 transition-colors">
                      <td className="py-4 px-6 font-semibold text-on-surface">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold flex items-center justify-center text-[10px] uppercase">
                            {y.initials}
                          </div>
                          {y.fullName}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-on-surface-variant">{y.purok}</td>
                      <td className="py-4 px-6 text-on-surface-variant">{y.age}</td>
                      <td className="py-4 px-6 text-on-surface-variant">{y.registeredOn}</td>
                      <td className="py-4 px-6">
                        {y.status === "Approved" ? (
                          <span className="inline-flex items-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider animate-pulse">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => console.log(`Viewing registration record ID: ${y.id} - ${y.fullName}`)}
                          className="text-primary hover:text-primary-fixed-dim font-bold hover:underline cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-on-surface-variant/60 italic">
                      No recent registrations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (4-cols): Upcoming Events Widget */}
        <div className="lg:col-span-4 bg-surface-container-low p-6 rounded-xl border border-[#353535]/10 flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-[#353535]/10 mb-4">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                Upcoming Events
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Schedule of upcoming SK programs and activities.
              </p>
            </div>
            
            <div className="space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map(event => (
                  <div key={event.id} className="flex gap-4 items-center bg-[#181818]/40 p-3 rounded-lg border border-[#353535]/10 hover:border-emerald-500/20 transition-all">
                    {/* Date badge */}
                    <div className="flex flex-col items-center justify-center bg-primary/10 text-primary border border-primary/20 w-12 h-12 rounded-lg shrink-0">
                      <span className="text-[10px] uppercase font-bold">{event.month}</span>
                      <span className="text-lg font-black leading-none">{event.day}</span>
                    </div>
                    
                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-on-surface truncate">{event.title}</h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#353535]/30 text-on-surface-variant font-semibold uppercase">{event.category}</span>
                        {event.status === 'Active' ? (
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold uppercase tracking-wider">Active</span>
                        ) : (
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold uppercase tracking-wider">Draft</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-xs text-on-surface-variant/60 italic border border-dashed border-[#353535]/15 rounded-lg">
                  No upcoming events scheduled.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* --- SECTION 6: Community Insights Row --- */}
      <div className="space-y-4 pt-4">


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          
          {/* Card 1: Skills Inventory Chart */}
          <div className="bg-surface-container-low p-6 rounded-xl border border-[#353535]/10 space-y-4 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                Skills Inventory
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Top skills among youth.
              </p>
            </div>
            
            <div className="h-56 w-full mt-4 relative">
              <ErrorBoundary moduleName="Skills Distribution Chart">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart 
                    data={skillsData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 45 }}
                  >
                    <XAxis 
                      dataKey="name" 
                      stroke="#8e9192" 
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      angle={-35}
                      textAnchor="end"
                      height={50}
                      tickFormatter={(val) => {
                        const s = String(val);
                        return s.length > 15 ? s.slice(0, 12) + '...' : s;
                      }}
                    />
                    <YAxis 
                      stroke="#8e9192" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                      contentStyle={{ background: '#1c1b1b', borderColor: '#353535', borderRadius: '8px', color: '#e5e2e1' }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#10b981" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={25}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ErrorBoundary>
            </div>
          </div>

          {/* Card 2: Participation Analytics Chart */}
          <div className="bg-surface-container-low p-6 rounded-xl border border-[#353535]/10 space-y-4 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">
                Participation Analytics
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                This is where the dashboard becomes useful. Top Participated Programs.
              </p>
            </div>
            
            <div className="h-56 w-full mt-4 relative">
              <ErrorBoundary moduleName="Participation Chart">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart 
                    data={participationData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 45 }}
                  >
                    <XAxis 
                      dataKey="name" 
                      stroke="#8e9192" 
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      angle={-35}
                      textAnchor="end"
                      height={50}
                      tickFormatter={(val) => {
                        const s = String(val);
                        return s.length > 15 ? s.slice(0, 12) + '...' : s;
                      }}
                    />
                    <YAxis 
                      stroke="#8e9192" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                      contentStyle={{ background: '#1c1b1b', borderColor: '#353535', borderRadius: '8px', color: '#e5e2e1' }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#10b981" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={25}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ErrorBoundary>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
