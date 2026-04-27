import { useState, useEffect } from "react";
import API_URL from "../../api";

export const useAppointmentsData = (token) => {
  const [appointments, setAppointments] = useState([]);
  const [timezone, setTimezone] = useState("UTC");
  const [workingPeriods, setWorkingPeriods] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const [appRes, bizRes] = await Promise.all([
          fetch(`${API_URL}/api/business/appointments`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/business/mybusiness`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const appData = await appRes.json();
        const bizData = await bizRes.json();

        if (appRes.ok) {
          setAppointments(appData.appointments || []);
          setTimezone(appData.timezone || "UTC");
        }

        if (bizRes.ok) {
          setWorkingPeriods(bizData.workingPeriods || null);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  return { appointments, timezone, workingPeriods, loading };
};
