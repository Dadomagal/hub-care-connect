import { useHospital } from "@/contexts/HospitalContext";
import Login from "@/pages/Login";
import PatientLayout from "@/components/patient/PatientLayout";
import StaffDashboard from "@/components/staff/StaffDashboard";

export default function Index() {
  const { role } = useHospital();

  if (!role) return <Login />;
  if (role === "patient") return <PatientLayout />;
  return <StaffDashboard />;
}
