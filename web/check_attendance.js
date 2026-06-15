import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvyymoavlhxwwxebooyj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2eXltb2F2bGh4d3d4ZWJvb3lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTMxOTIsImV4cCI6MjA4OTU4OTE5Mn0.-frXJOmQg0THgkbsItXsQjFMg-gMGasAF8vqGTl5eNc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Fetching attendance counts...");
  const { data: attendanceData, error: err1 } = await supabase.from('attendance').select('status');
  if (err1) {
    console.error("Error fetching attendance:", err1);
  } else {
    console.log(`Total attendance rows: ${attendanceData.length}`);
    console.log("Rows by status:", attendanceData.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {}));
  }

  console.log("Fetching program counts...");
  const { data: programData, error: err2 } = await supabase.from('programs').select('id, title, status');
  if (err2) {
    console.error("Error fetching programs:", err2);
  } else {
    console.log("Programs:", JSON.stringify(programData, null, 2));
  }
}

check();
