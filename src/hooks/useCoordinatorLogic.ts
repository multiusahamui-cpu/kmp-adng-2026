import { useState, useEffect, useMemo } from "react";
import api from "../services/api";

export const useCoordinatorLogic = (currentUser: any, level: string) => {
  const [status, setStatus] = useState({
    isLoading: false,
    areaStatus: "idle" as "idle" | "available" | "occupied",
    occupiedBy: "",
    areaName: "",
    areaCode: "",
  });

  const checkEligibility = useMemo(() => {
    const referrals = currentUser.referralStats?.totalInvited || 0;
    const requirements: Record<string, number> = {
      Regional: 200,
      Provinsi: 100,
      "Kota/Kabupaten": 50,
      Kecamatan: 10,
      "Desa/Kelurahan": 5,
    };
    return referrals >= (requirements[level] || 999);
  }, [currentUser, level]);

  useEffect(() => {
    const validateArea = async () => {
      const codeMap: any = {
        Regional: currentUser.regional,
        Provinsi: currentUser.provinceId,
        "Kota/Kabupaten": currentUser.cityId,
        Kecamatan: currentUser.districtId,
        "Desa/Kelurahan": currentUser.villageId,
      };

      const code = codeMap[level];
      if (!code) {
        setStatus((prev) => ({ ...prev, areaCode: "", areaStatus: "idle" }));
        return;
      }

      setStatus((prev) => ({ ...prev, isLoading: true, areaCode: code }));

      try {
        const [locRes, checkRes] = await Promise.all([
          api.get(`/locations/code?code=${code}`),
          api.get(`/users/check-coordinator-area?locationCode=${code}`),
        ]);

        setStatus((prev) => ({
          ...prev,
          areaName: locRes.data.data?.name || "Unknown",
          areaStatus: checkRes.data.data.occupied ? "occupied" : "available",
          occupiedBy: checkRes.data.data.occupiedBy || "",
          isLoading: false,
        }));
      } catch (err) {
        setStatus((prev) => ({ ...prev, isLoading: false }));
      }
    };

    validateArea();
  }, [level, currentUser]);

  return { ...status, checkEligibility };
};
