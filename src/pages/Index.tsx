import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useHospital, type UserRole } from "@/contexts/HospitalContext";
import Login from "@/pages/Login";
import PatientLayout from "@/components/patient/PatientLayout";
import StaffDashboard from "@/components/staff/StaffDashboard";

export default function Index() {
  const { role, setRole } = useHospital();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const urlRole = searchParams.get("role");
    const normalizedRole: UserRole = urlRole === "patient" || urlRole === "staff" ? urlRole : null;
    if (normalizedRole !== role) {
      setRole(normalizedRole);
    }
  }, [role, searchParams, setRole]);

  if (!role) return <Login />;
  if (role === "patient") return <PatientLayout />;
  return <StaffDashboard />;
}
