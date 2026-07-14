import React, { useState, useEffect } from "react";
import { User } from "../types";
import {
  Moon,
  Sun,
  Save,
  UserCheck,
  Bell,
  Globe,
  Lock,
  User as UserIcon,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Gift,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  FileText,
  CreditCard,
  Camera,
  Briefcase,
  LogOut,
  X,
} from "lucide-react";
import { useToast } from "../components/Toast";
import { PinModal } from "../components/PinModal";
import { userService } from "../services/user.service";
import { authService } from "../services/auth.service";
import { locationService, Location } from "../services/location.service";
import api from "../services/api";

interface SettingsProps {
  user: User;
  onUpdateUser: (updatedData: Partial<User>) => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  isInternalUser?: boolean;
}

export const Settings: React.FC<SettingsProps> = ({
  user,
  onUpdateUser,
  isDarkMode = false,
  onToggleTheme,
  isInternalUser = false,
}) => {
  const [activeTab, setActiveTab] = useState<
    | "general"
    | "notifications"
    | "security"
    | "profile"
    | "referral"
    | "kyc"
    | "membership"
  >("general");
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // PIN MODAL STATE
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinError, setPinError] = useState("");

  // PASSWORD STATE
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passData, setPassData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  // NOTIFICATION STATE
  const [notifState, setNotifState] = useState(
    user.preferences?.notifications || {
      all: true,
      transaction: true,
      promo: true,
      chat: true,
    },
  );

  // PROFILE STATE
  const [profileData, setProfileData] = useState({
    name: user.name || "",
    phone: user.phone || "",
    email: user.email || "",
    address: user.address || "",
    heir: user.heir || "",
  });

  // --- LOCATION DATA STATE ---
  const [regions, setRegions] = useState<Location[]>([]);
  const [provinces, setProvinces] = useState<Location[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [villages, setVillages] = useState<Location[]>([]);

  // --- KYC STATE (NEW IMPLEMENTATION) ---
  const [kycStep, setKycStep] = useState<"entry" | "otp">("entry");
  const [kycOtp, setKycOtp] = useState("");
  const [previews, setPreviews] = useState({ ktp: "", selfie: "" });
  const [kycFormData, setKycFormData] = useState({
    nik: user.nik || "",
    namaLengkap: user.name || "",
    jenisKelamin: user.gender || "Laki-laki",
    alamatDomisili: user.address || "",
    regional: user.regional || "",
    propinsi: user.provinceId || "",
    kabupaten: user.cityId || "",
    kecamatan: user.districtId || "",
    desa: user.villageId || "",
    kodePos: user.postalCode || "",
    pekerjaan: user.occupation || "",
    namaAhliWaris: user.heir || "",
    // Files (Mock handling for UI)
    ktpFile: null as File | null,
    fotoSelfie: null as File | null,
  });

  // --- RESIGNATION STATE ---
  const [showResignModal, setShowResignModal] = useState(false);
  const [resignReason, setResignReason] = useState("");
  const [resignDescription, setResignDescription] = useState("");

  // --- BANK ACCOUNT STATE (tujuan pencairan dana ekuitas saat resign) ---
  const [bankName, setBankName] = useState(user.bankName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(user.bankAccountNumber || "");
  const [bankAccountHolder, setBankAccountHolder] = useState(user.bankAccountHolder || "");

  // --- SMART INIT ---
  useEffect(() => {
    // Fetch Regions on mount
    locationService.getRegions().then(setRegions).catch(console.error);
  }, []);

  useEffect(() => {
    const syncUserProfile = async () => {
      try {
        const freshUser = await authService.getProfile();
        const safeUpdate = {
          ...freshUser,
          balance: user.balance,
          savings: user.savings,
          loanBalance: user.loanBalance,
        };
        onUpdateUser(safeUpdate);

        // Populate KYC Form if data exists
        if (freshUser.nik) {
          setKycFormData((prev) => ({
            ...prev,
            nik: freshUser.nik || "",
            namaLengkap: freshUser.name || "",
            jenisKelamin: freshUser.gender || "Laki-laki",
            alamatDomisili: freshUser.address || "",
            regional: freshUser.regional || "",
            propinsi: freshUser.provinceId || "",
            kabupaten: freshUser.cityId || "",
            kecamatan: freshUser.districtId || "",
            desa: freshUser.villageId || "",
            kodePos: freshUser.postalCode || "",
            pekerjaan: freshUser.occupation || "",
            namaAhliWaris: freshUser.heir || "",
          }));

          // Set previews from existing URLs
          setPreviews({
            ktp: freshUser.ktpPhoto || "",
            selfie: freshUser.selfiePhoto || "",
          });
        }
      } catch (e) {
        console.warn("Silent sync failed", e);
      }
    };

    if (
      activeTab === "security" ||
      activeTab === "referral" ||
      activeTab === "kyc"
    ) {
      syncUserProfile();
    }
  }, [activeTab]);

  // --- CASCADING DROPDOWNS ---
  // 1. Fetch Provinces when Regional changes
  useEffect(() => {
    if (kycFormData.regional) {
      locationService
        .getProvinces(kycFormData.regional)
        .then(setProvinces)
        .catch(console.error);
      // Do NOT reset children here to allow data population from profile
    } else {
      setProvinces([]);
    }
  }, [kycFormData.regional]);

  // 2. Fetch Cities when Province changes
  useEffect(() => {
    if (kycFormData.propinsi) {
      locationService
        .getChildren(kycFormData.propinsi, "City")
        .then(setCities)
        .catch(console.error);
    } else {
      setCities([]);
    }
  }, [kycFormData.propinsi]);

  // 3. Fetch Districts when City changes
  useEffect(() => {
    if (kycFormData.kabupaten) {
      locationService
        .getChildren(kycFormData.kabupaten, "District")
        .then(setDistricts)
        .catch(console.error);
    } else {
      setDistricts([]);
    }
  }, [kycFormData.kabupaten]);

  // 4. Fetch Villages when District changes
  useEffect(() => {
    if (kycFormData.kecamatan) {
      locationService
        .getChildren(kycFormData.kecamatan, "Village")
        .then(setVillages)
        .catch(console.error);
    } else {
      setVillages([]);
    }
  }, [kycFormData.kecamatan]);

  // --- HANDLERS ---

  const handleOpenPinSetup = () => {
    setPinError("");
    setShowPinModal(true);
  };

  const handlePinSuccess = async (newPin?: string, oldPin?: string) => {
    if (newPin) {
      try {
        setPinError("");
        await userService.setPin(newPin, oldPin);
        onUpdateUser({ transactionPin: "SET", pinResetStatus: undefined });
        setShowPinModal(false);
        showToast("PIN Transaksi Berhasil Disimpan!", "success");
      } catch (error: any) {
        const errMsg = error.response?.data?.message || "Gagal menyimpan PIN.";
        setPinError(errMsg);
      }
    }
  };

  const toggleNotif = async (key: keyof typeof notifState) => {
    const newState = { ...notifState, [key]: !notifState[key] };
    setNotifState(newState);
    try {
      await userService.updatePreferences({ notifications: newState });
      onUpdateUser({
        preferences: { ...user.preferences, notifications: newState },
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleThemeToggle = async () => {
    const newTheme = isDarkMode ? "light" : "dark";
    if (onToggleTheme) onToggleTheme();
    try {
      await userService.updatePreferences({ theme: newTheme });
      onUpdateUser({ preferences: { ...user.preferences, theme: newTheme } });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updated = await userService.updateProfile(profileData);
      onUpdateUser({
        ...updated,
        balance: user.balance,
        savings: user.savings,
      });
      showToast("Data profil berhasil disimpan!", "success");
    } catch (error: any) {
      showToast(
        error.response?.data?.message || "Gagal update profil",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passData.new) return showToast("Masukkan password baru.", "error");
    if (passData.new !== passData.confirm)
      return showToast("Konfirmasi password tidak cocok!", "error");
    if (!passData.current)
      return showToast("Masukkan password lama untuk verifikasi.", "error");

    setIsLoading(true);
    try {
      await userService.changePassword(passData.current, passData.new);
      showToast("Password berhasil diubah!", "success");
      setPassData({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      showToast(
        error.response?.data?.message || "Gagal ubah password",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReferral = async () => {
    setIsLoading(true);
    try {
      const res = await userService.generateReferral();
      onUpdateUser({
        referralCode: res.referralCode,
        referralStats: { totalInvited: 0, totalEarnings: 0, history: [] },
      });
      showToast(`Kode Referral Dibuat: ${res.referralCode}`, "success");
    } catch (error: any) {
      showToast("Gagal membuat referral code", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- KYC HANDLERS ---

  const handleKycFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "ktpFile" | "fotoSelfie",
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setKycFormData((prev) => ({ ...prev, [field]: file }));

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      if (field === "ktpFile") {
        setPreviews((prev) => ({ ...prev, ktp: previewUrl }));
      } else {
        setPreviews((prev) => ({ ...prev, selfie: previewUrl }));
      }
    }
  };

  const submitKycData = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation
    if (kycFormData.nik.length !== 16)
      return showToast("NIK harus 16 digit.", "error");
    if (!kycFormData.ktpFile)
      return showToast("Wajib upload foto KTP.", "error");

    setIsLoading(true);
    try {
      // Prepare Data for API (Map frontend keys to backend expectations)
      const payload = {
        nik: kycFormData.nik,
        name: kycFormData.namaLengkap,
        gender: kycFormData.jenisKelamin,
        occupation: kycFormData.pekerjaan,
        heir: kycFormData.namaAhliWaris,
        street: kycFormData.alamatDomisili,
        regional: kycFormData.regional,
        provinceId: kycFormData.propinsi,
        cityId: kycFormData.kabupaten,
        districtId: kycFormData.kecamatan,
        villageId: kycFormData.desa,
        postalCode: kycFormData.kodePos,
      };

      // 1. Submit Data (Mock/Real)
      await api.post("/auth/onboarding/kyc", payload);

      // 2. Request OTP
      await api.post("/auth/kyc/request-otp");

      showToast("Data KYC diterima. Kode OTP telah dikirim.", "success");
      setKycStep("otp");
    } catch (error: any) {
      showToast(
        error.response?.data?.message || "Gagal mengirim data KYC.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const verifyKycOtp = async () => {
    if (kycOtp.length < 6) return showToast("Masukkan 6 digit OTP", "error");

    setIsLoading(true);
    try {
      // Verify OTP & Create Bills
      await api.post("/auth/kyc/verify-otp", { otp: kycOtp });

      showToast("Verifikasi Sukses! Akses Dompet Dibuka.", "success");

      // Refresh Profile to update status
      const freshUser = await authService.getProfile();
      onUpdateUser(freshUser);

      // Redirect to Wallet
      setTimeout(() => {
        window.location.hash = "#/wallet"; // Simple navigation hack or use router context if available
        // In this structure, reloading or changing active tab in App might be needed.
        // We'll rely on global user state update to trigger UI changes.
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      // DO NOT RESET FORM DATA ON OTP ERROR
      showToast(error.response?.data?.message || "OTP Salah.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBankAccount = async () => {
    if (!bankName || !bankAccountNumber || !bankAccountHolder) {
      return showToast("Lengkapi semua field rekening bank", "error");
    }
    setIsLoading(true);
    try {
      await userService.updateBankAccount(bankName, bankAccountNumber, bankAccountHolder);
      onUpdateUser({ bankName, bankAccountNumber, bankAccountHolder });
      showToast("Rekening bank berhasil disimpan", "success");
    } catch (error: any) {
      showToast(
        error.response?.data?.message || "Gagal simpan rekening bank",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResign = async () => {
    if (!resignReason) return showToast("Pilih alasan berhenti", "error");
    if (!bankAccountNumber) {
      return showToast(
        "Lengkapi rekening bank Anda dulu sebelum mengajukan berhenti (lihat di atas).",
        "error",
      );
    }
    if (
      !window.confirm(
        "Apakah Anda yakin ingin mengajukan permohonan berhenti? Tindakan ini tidak dapat dibatalkan.",
      )
    )
      return;

    setIsLoading(true);
    try {
      await userService.requestResignation(resignReason, resignDescription);
      showToast(
        "Permohonan berhenti berhasil dikirim. Menunggu persetujuan General Manager.",
        "success",
      );
      setShowResignModal(false);
    } catch (error: any) {
      showToast(
        error.response?.data?.message || "Gagal mengirim permohonan",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
        Pengaturan Aplikasi
      </h2>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="md:w-64 space-y-2">
          <button
            onClick={() => setActiveTab("general")}
            className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition ${activeTab === "general" ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-sm border border-emerald-100 dark:border-emerald-900" : "text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-slate-800/50"}`}
          >
            <div
              className={`p-2 rounded-lg mr-3 ${activeTab === "general" ? "bg-emerald-100 dark:bg-emerald-900/50" : "bg-gray-100 dark:bg-slate-700"}`}
            >
              <Globe className="w-5 h-5" />
            </div>{" "}
            Umum & Tampilan
          </button>
          {/* KYC TAB BUTTON */}
          {!isInternalUser && (
            <button
              onClick={() => setActiveTab("kyc")}
              className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition ${activeTab === "kyc" ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-sm border border-emerald-100 dark:border-emerald-900" : "text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-slate-800/50"}`}
            >
              <div
                className={`p-2 rounded-lg mr-3 ${activeTab === "kyc" ? "bg-blue-100 dark:bg-blue-900/50" : "bg-gray-100 dark:bg-slate-700"}`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>{" "}
              Verifikasi KYC
            </button>
          )}
          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition ${activeTab === "security" ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-sm border border-emerald-100 dark:border-emerald-900" : "text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-slate-800/50"}`}
          >
            <div
              className={`p-2 rounded-lg mr-3 ${activeTab === "security" ? "bg-emerald-100 dark:bg-emerald-900/50" : "bg-gray-100 dark:bg-slate-700"}`}
            >
              <Lock className="w-5 h-5" />
            </div>{" "}
            Keamanan & PIN
          </button>
          {!isInternalUser && (
            <button
              onClick={() => setActiveTab("referral")}
              className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition ${activeTab === "referral" ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-sm border border-emerald-100 dark:border-emerald-900" : "text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-slate-800/50"}`}
            >
              <div
                className={`p-2 rounded-lg mr-3 ${activeTab === "referral" ? "bg-yellow-100 text-yellow-600" : "bg-gray-100 dark:bg-slate-700"}`}
              >
                <Gift className="w-5 h-5" />
              </div>{" "}
              Kode Referral
            </button>
          )}
          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition ${activeTab === "notifications" ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-sm border border-emerald-100 dark:border-emerald-900" : "text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-slate-800/50"}`}
          >
            <div
              className={`p-2 rounded-lg mr-3 ${activeTab === "notifications" ? "bg-emerald-100 dark:bg-emerald-900/50" : "bg-gray-100 dark:bg-slate-700"}`}
            >
              <Bell className="w-5 h-5" />
            </div>{" "}
            Notifikasi
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition ${activeTab === "profile" ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-sm border border-emerald-100 dark:border-emerald-900" : "text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-slate-800/50"}`}
          >
            <div
              className={`p-2 rounded-lg mr-3 ${activeTab === "profile" ? "bg-emerald-100 dark:bg-emerald-900/50" : "bg-gray-100 dark:bg-slate-700"}`}
            >
              <UserIcon className="w-5 h-5" />
            </div>{" "}
            Edit Data Diri
          </button>
          <button
            onClick={() => setActiveTab("membership")}
            className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition ${activeTab === "membership" ? "bg-white dark:bg-slate-800 text-red-600 shadow-sm border border-red-100 dark:border-red-900" : "text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-slate-800/50"}`}
          >
            <div
              className={`p-2 rounded-lg mr-3 ${activeTab === "membership" ? "bg-red-100 dark:bg-red-900/50" : "bg-gray-100 dark:bg-slate-700"}`}
            >
              <LogOut className="w-5 h-5" />
            </div>{" "}
            Keanggotaan
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 md:p-8 transition-colors duration-300">
          {/* --- GENERAL TAB --- */}
          {activeTab === "general" && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">
                  Tampilan Aplikasi
                </h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600">
                  <div className="flex items-center">
                    {isDarkMode ? (
                      <Moon className="w-6 h-6 text-indigo-400 mr-4" />
                    ) : (
                      <Sun className="w-6 h-6 text-orange-500 mr-4" />
                    )}
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">
                        Mode Gelap
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Simpan preferensi tampilan di database.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleThemeToggle}
                    className="text-emerald-600 dark:text-emerald-400 transition-transform duration-200 hover:scale-110"
                  >
                    {isDarkMode ? (
                      <ToggleRight className="w-10 h-10" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- KYC TAB (CUSTOM) --- */}
          {activeTab === "kyc" && (
            <div className="animate-fade-in">
              <header className="mb-8 text-center">
                <h1 className="text-3xl font-extrabold text-blue-900 dark:text-blue-400">
                  KYC ANGGOTA KMP-ADNG
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Lengkapi profil untuk bergabung dengan Koperasi Digital
                </p>
              </header>

              {kycStep === "entry" ? (
                <form
                  onSubmit={submitKycData}
                  className="space-y-6 bg-white dark:bg-slate-800 p-1 md:p-6 rounded-lg"
                >
                  {/* Data Pribadi Utama */}
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nomor NIK / KTP (16 Digit)
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          maxLength={16}
                          required
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                          placeholder="320xxxxxxxxxxxxx"
                          value={kycFormData.nik}
                          onChange={(e) =>
                            setKycFormData({
                              ...kycFormData,
                              nik: e.target.value.replace(/\D/g, ""),
                            })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nama Lengkap (Sesuai KTP)
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white uppercase"
                        value={kycFormData.namaLengkap}
                        onChange={(e) =>
                          setKycFormData({
                            ...kycFormData,
                            namaLengkap: e.target.value,
                          })
                        }
                      />
                    </div>
                  </section>

                  <section>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Jenis Kelamin
                    </label>
                    <div className="flex gap-4 mt-1">
                      <label className="flex items-center cursor-pointer dark:text-white">
                        <input
                          type="radio"
                          name="gender"
                          value="Laki-laki"
                          className="mr-2"
                          checked={kycFormData.jenisKelamin === "Laki-laki"}
                          onChange={() =>
                            setKycFormData({
                              ...kycFormData,
                              jenisKelamin: "Laki-laki",
                            })
                          }
                        />{" "}
                        Laki-laki
                      </label>
                      <label className="flex items-center cursor-pointer dark:text-white">
                        <input
                          type="radio"
                          name="gender"
                          value="Perempuan"
                          className="mr-2"
                          checked={kycFormData.jenisKelamin === "Perempuan"}
                          onChange={() =>
                            setKycFormData({
                              ...kycFormData,
                              jenisKelamin: "Perempuan",
                            })
                          }
                        />{" "}
                        Perempuan
                      </label>
                    </div>
                  </section>

                  {/* Alamat & Lokasi */}
                  <section className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Alamat Domisili (Untuk Pengantaran)
                      </label>
                      <textarea
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                        rows={2}
                        value={kycFormData.alamatDomisili}
                        onChange={(e) =>
                          setKycFormData({
                            ...kycFormData,
                            alamatDomisili: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Regional */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">
                          Regional
                        </label>
                        <select
                          className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                          value={kycFormData.regional}
                          onChange={(e) =>
                            setKycFormData({
                              ...kycFormData,
                              regional: e.target.value,
                              propinsi: "",
                              kabupaten: "",
                              kecamatan: "",
                              desa: "",
                            })
                          }
                        >
                          <option value="">-- Pilih Regional --</option>
                          {regions.map((r) => (
                            <option key={r.code} value={r.code}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Provinsi */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">
                          Provinsi
                        </label>
                        <select
                          className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                          value={kycFormData.propinsi}
                          onChange={(e) =>
                            setKycFormData({
                              ...kycFormData,
                              propinsi: e.target.value,
                              kabupaten: "",
                              kecamatan: "",
                              desa: "",
                            })
                          }
                          disabled={!kycFormData.regional}
                        >
                          <option value="">-- Pilih Provinsi --</option>
                          {provinces.map((p) => (
                            <option key={p.code} value={p.code}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Kota/Kab */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">
                          Kabupaten/Kota
                        </label>
                        <select
                          className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                          value={kycFormData.kabupaten}
                          onChange={(e) =>
                            setKycFormData({
                              ...kycFormData,
                              kabupaten: e.target.value,
                              kecamatan: "",
                              desa: "",
                            })
                          }
                          disabled={!kycFormData.propinsi}
                        >
                          <option value="">-- Pilih Kota/Kab --</option>
                          {cities.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Kecamatan */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">
                          Kecamatan
                        </label>
                        <select
                          className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                          value={kycFormData.kecamatan}
                          onChange={(e) =>
                            setKycFormData({
                              ...kycFormData,
                              kecamatan: e.target.value,
                              desa: "",
                            })
                          }
                          disabled={!kycFormData.kabupaten}
                        >
                          <option value="">-- Pilih Kecamatan --</option>
                          {districts.map((d) => (
                            <option key={d.code} value={d.code}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Desa */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">
                          Desa/Kelurahan
                        </label>
                        <select
                          required
                          className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                          onChange={(e) =>
                            setKycFormData({
                              ...kycFormData,
                              desa: e.target.value,
                            })
                          }
                          value={kycFormData.desa}
                          disabled={!kycFormData.kecamatan}
                        >
                          <option value="">-- Pilih Desa --</option>
                          {villages.map((v) => (
                            <option key={v.code} value={v.code}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Kode Pos (Otomatis)
                      </label>
                      <input
                        readOnly
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-slate-500 cursor-not-allowed"
                        value={kycFormData.kodePos}
                      />
                    </div>
                  </section>

                  {/* Pekerjaan */}
                  <section>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Pekerjaan
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <select
                        required
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                        value={kycFormData.pekerjaan}
                        onChange={(e) =>
                          setKycFormData({
                            ...kycFormData,
                            pekerjaan: e.target.value,
                          })
                        }
                      >
                        <option value="">-- Pilih Pekerjaan --</option>
                        <option value="Petani">Petani / Peternakan</option>
                        <option value="Pedagang">
                          Pedagang Kecil / Bisnis Sendiri
                        </option>
                        <option value="PNS">PNS / TNI - Polri</option>
                        <option value="Wiraswasta">Wiraswasta (UKM)</option>
                        <option value="Pelajar">Pelajar / Mahasiswa</option>
                        <option value="Profesional">
                          Profesional (Guru, Dokter, dll)
                        </option>
                        <option value="PMI">PMI / Diaspora</option>
                      </select>
                    </div>
                  </section>

                  {/* Uploads */}
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 p-4 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-slate-700 relative overflow-hidden group">
                      {previews.ktp ? (
                        <div className="relative w-full h-48">
                          <img
                            src={previews.ktp}
                            alt="KTP Preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white font-bold">
                              Ganti Foto KTP
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8">
                          <CreditCard className="mx-auto mb-2 w-10 h-10 text-gray-400" />
                          <label className="block text-sm font-medium text-red-600 mb-1 cursor-pointer">
                            Upload KTP (Wajib)
                          </label>
                          <p className="text-xs text-gray-500">
                            Format: JPG, PNG (Max 2MB)
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        required={!previews.ktp}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        accept="image/*"
                        onChange={(e) => handleKycFileChange(e, "ktpFile")}
                      />
                    </div>

                    <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 p-4 rounded-lg text-center hover:bg-gray-50 dark:hover:bg-slate-700 relative overflow-hidden group">
                      {previews.selfie ? (
                        <div className="relative w-full h-48">
                          <img
                            src={previews.selfie}
                            alt="Selfie Preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white font-bold">
                              Ganti Foto Selfie
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8">
                          <Camera className="mx-auto mb-2 w-10 h-10 text-gray-400" />
                          <label className="block text-sm font-medium text-blue-600 mb-1 cursor-pointer">
                            Foto Selfie (Opsional)
                          </label>
                          <p className="text-xs text-gray-500">
                            Format: JPG, PNG (Max 2MB)
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        accept="image/*"
                        onChange={(e) => handleKycFileChange(e, "fotoSelfie")}
                      />
                    </div>
                  </section>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nama Ahli Waris
                    </label>
                    <input
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 dark:text-white"
                      placeholder="Nama anggota keluarga"
                      value={kycFormData.namaAhliWaris}
                      onChange={(e) =>
                        setKycFormData({
                          ...kycFormData,
                          namaAhliWaris: e.target.value,
                        })
                      }
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-700 text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition shadow-lg flex items-center justify-center disabled:opacity-70"
                  >
                    {isLoading
                      ? "Mengirim Data..."
                      : "Kirim Data KYC & Minta Kode OTP"}
                  </button>
                </form>
              ) : (
                // STEP 2: OTP
                <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-slate-800 rounded-lg shadow-xl text-center border border-gray-100 dark:border-slate-700">
                  <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-white">
                    Verifikasi OTP
                  </h2>
                  <p className="mb-4 text-gray-600 dark:text-gray-300">
                    Kode OTP telah dikirim sebagai persetujuan bergabung dengan{" "}
                    <strong>KMP-ADNG</strong>.
                  </p>

                  <input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg mb-6 text-center tracking-[0.5em] text-2xl font-bold bg-white dark:bg-slate-700 dark:text-white"
                    value={kycOtp}
                    onChange={(e) =>
                      setKycOtp(e.target.value.replace(/\D/g, ""))
                    }
                  />

                  <button
                    onClick={verifyKycOtp}
                    disabled={isLoading || kycOtp.length < 6}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 w-full font-bold shadow-md disabled:bg-gray-400"
                  >
                    {isLoading
                      ? "Memverifikasi..."
                      : "Konfirmasi & Setuju Bergabung"}
                  </button>

                  <button
                    onClick={() => setKycStep("entry")}
                    className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Kembali ke Form
                  </button>
                </div>
              )}
            </div>
          )}

          {/* --- NOTIFICATIONS TAB --- */}
          {activeTab === "notifications" && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">
                Pengaturan Notifikasi
              </h3>
              <div className="space-y-4">
                {Object.keys(notifState).map((key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 border-b border-gray-50 dark:border-slate-700 last:border-0"
                  >
                    <span className="capitalize text-slate-700 dark:text-gray-300 font-medium">
                      {key === "all"
                        ? "Semua Notifikasi"
                        : key === "promo"
                          ? "Info Promo & Diskon"
                          : key}
                    </span>
                    <button
                      onClick={() => toggleNotif(key as any)}
                      className={`transition-colors ${notifState[key as keyof typeof notifState] ? "text-emerald-600" : "text-gray-400"}`}
                    >
                      {notifState[key as keyof typeof notifState] ? (
                        <ToggleRight className="w-8 h-8" />
                      ) : (
                        <ToggleLeft className="w-8 h-8" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- PROFILE EDIT TAB --- */}
          {activeTab === "profile" && (
            <div className="animate-fade-in">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">
                Edit Data Pribadi
              </h3>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    No. Handphone
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                  />
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Alamat Lengkap
                  </label>
                  <textarea
                    rows={2}
                    className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={profileData.address}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        address: e.target.value,
                      })
                    }
                    placeholder="Jl..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">
                    Ahli Waris
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={profileData.heir}
                    onChange={(e) =>
                      setProfileData({ ...profileData, heir: e.target.value })
                    }
                    placeholder="Nama Ahli Waris"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 mt-4 shadow-lg disabled:opacity-70"
                >
                  {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </form>
            </div>
          )}

          {/* --- SECURITY TAB --- */}
          {activeTab === "security" && (
            <div className="space-y-8 animate-fade-in max-w-lg">
              {/* PIN CONFIGURATION */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2 mb-4 flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2 text-emerald-600" /> PIN
                  Transaksi
                </h3>

                {user.transactionPin ? (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center mb-4">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <p className="font-bold text-green-800">PIN Aktif</p>
                      <p className="text-sm text-green-700">
                        Akun Anda terlindungi.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                    <div>
                      <p className="font-bold text-red-800">PIN Belum Diatur</p>
                      <p className="text-sm text-red-700">
                        Buat PIN untuk keamanan transaksi.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleOpenPinSetup}
                  className="w-full bg-slate-800 dark:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-900 dark:hover:bg-emerald-700 flex items-center justify-between"
                >
                  <span>
                    {user.transactionPin
                      ? "Ganti PIN Transaksi"
                      : "Buat PIN Baru"}
                  </span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* PASSWORD CHANGE */}
              <div className="pt-6 border-t border-gray-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2 mb-4">
                  Ubah Kata Sandi
                </h3>
                <form onSubmit={handleSavePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password Lama
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? "text" : "password"}
                        required
                        className="w-full pl-4 pr-10 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                        value={passData.current}
                        onChange={(e) =>
                          setPassData({ ...passData, current: e.target.value })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showCurrentPass ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? "text" : "password"}
                        required
                        className="w-full pl-4 pr-10 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                        value={passData.new}
                        onChange={(e) =>
                          setPassData({ ...passData, new: e.target.value })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Konfirmasi Password Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? "text" : "password"}
                        required
                        className="w-full pl-4 pr-10 py-2 border border-gray-300 dark:border-slate-600 rounded-lg outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                        value={passData.confirm}
                        onChange={(e) =>
                          setPassData({ ...passData, confirm: e.target.value })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showConfirmPass ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-bold hover:bg-slate-300 flex items-center disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />{" "}
                    {isLoading ? "Menyimpan..." : "Simpan Password"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* --- MEMBERSHIP TAB --- */}
          {activeTab === "membership" && (
            <div className="animate-fade-in space-y-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-2">
                Status Keanggotaan
              </h3>

              {/* --- BANK ACCOUNT SECTION --- */}
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
                <h4 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" /> Rekening Bank
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Wajib diisi sebelum mengajukan berhenti -- dana ekuitas Anda
                  akan dikirim ke rekening ini.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nama Bank
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white"
                      placeholder="mis. BCA, BRI, Mandiri"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nomor Rekening
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white"
                      placeholder="1234567890"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nama Pemilik Rekening
                    </label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white"
                      placeholder="Sesuai buku tabungan"
                      value={bankAccountHolder}
                      onChange={(e) => setBankAccountHolder(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  onClick={handleSaveBankAccount}
                  disabled={isLoading}
                  className="mt-4 bg-slate-800 dark:bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:opacity-90 flex items-center disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />{" "}
                  {isLoading ? "Menyimpan..." : "Simpan Rekening"}
                </button>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                <h4 className="font-bold text-red-800 dark:text-red-400 mb-2 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" /> Zona Bahaya
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  Mengajukan permohonan berhenti akan menonaktifkan akun Anda
                  secara permanen setelah disetujui General Manager. Seluruh
                  dana ekuitas (simpanan + saldo dompet) akan dikirim ke
                  rekening bank yang Anda daftarkan di atas.
                </p>
                <button
                  onClick={() => setShowResignModal(true)}
                  className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-600/30"
                >
                  Ajukan Permohonan Berhenti
                </button>
              </div>
            </div>
          )}

          {/* REFERRAL TAB */}
          {activeTab === "referral" && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2">
                Program Referral
              </h3>
              {user.referralCode ? (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl p-6 text-center">
                  <Gift className="w-12 h-12 mx-auto mb-2 text-yellow-300" />
                  <h4 className="text-xl font-bold mb-1">
                    Kode Referral Aktif!
                  </h4>
                  <span className="text-2xl font-mono font-bold tracking-widest bg-white/20 px-4 py-2 rounded">
                    {user.referralCode}
                  </span>
                  <p className="text-sm mt-4 text-emerald-100">
                    Bagikan kode ini untuk mendapatkan bonus Rp 30.000 per
                    anggota baru.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="mb-4 text-gray-600 dark:text-gray-400">
                    Anda belum memiliki kode referral. Buat sekarang untuk mulai
                    mendapatkan komisi.
                  </p>
                  <button
                    onClick={handleGenerateReferral}
                    disabled={isLoading}
                    className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg disabled:bg-gray-300"
                  >
                    {isLoading ? "Memproses..." : "Buat Kode Referral Saya"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- PIN MODAL --- */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSuccess}
        isSettingUp={true}
        title={user.transactionPin ? "Ganti PIN Transaksi" : "Buat PIN Baru"}
        requireOldPin={!!user.transactionPin}
        externalError={pinError}
      />

      {/* --- RESIGNATION MODAL --- */}
      {showResignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-red-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold">Permohonan Berhenti</h3>
              <button
                onClick={() => setShowResignModal(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alasan Berhenti
                </label>
                <select
                  className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white"
                  value={resignReason}
                  onChange={(e) => setResignReason(e.target.value)}
                >
                  <option value="">-- Pilih Alasan --</option>
                  <option value="pindah_domisili">Pindah Domisili</option>
                  <option value="kebutuhan_ekonomi">Kebutuhan Ekonomi</option>
                  <option value="tidak_puas">Tidak Puas dengan Layanan</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Keterangan Tambahan
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 dark:text-white"
                  rows={3}
                  placeholder="Jelaskan alasan Anda lebih detail..."
                  value={resignDescription}
                  onChange={(e) => setResignDescription(e.target.value)}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setShowResignModal(false)}
                  className="flex-1 py-3 border border-gray-300 dark:border-slate-600 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  onClick={handleResign}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-600/30 disabled:opacity-70"
                >
                  {isLoading ? "Mengirim..." : "Kirim Permohonan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
