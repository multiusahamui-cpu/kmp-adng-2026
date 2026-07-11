import React from "react";
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useCoordinatorLogic } from "../hooks/useCoordinatorLogic";

interface Props {
  user: any;
  data: any;
  onChange: (newData: any) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const CoordinatorForm: React.FC<Props> = ({
  user,
  data,
  onChange,
  onSubmit,
  isSubmitting,
}) => {
  const {
    areaStatus,
    areaName,
    areaCode,
    occupiedBy,
    isLoading,
    checkEligibility,
  } = useCoordinatorLogic(user, data.level);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-fade-in space-y-6">
      <header className="border-b pb-2">
        <h3 className="font-bold text-lg text-yellow-800">
          Formulir Kordinator Wilayah (Tunggal)
        </h3>
      </header>

      {/* Info Box */}
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex gap-3 text-sm text-yellow-800">
        <AlertTriangle className="shrink-0" />
        <p>
          Satu wilayah hanya boleh memiliki <b>Satu Kordinator</b>. Pastikan
          wilayah Anda masih kosong.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Level Selection */}
        <div>
          <label className="text-sm font-medium">Tingkat Wilayah</label>
          <select
            className="w-full mt-1 px-4 py-2 border rounded-lg bg-white"
            value={data.level}
            onChange={(e) => onChange({ ...data, level: e.target.value })}
          >
            {[
              "Regional",
              "Provinsi",
              "Kota/Kabupaten",
              "Kecamatan",
              "Desa/Kelurahan",
            ].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <p
            className={`text-[11px] mt-1 font-bold ${checkEligibility ? "text-green-600" : "text-red-600"}`}
          >
            {checkEligibility
              ? "✓ Memenuhi Syarat Referral"
              : "⨯ Belum Memenuhi Syarat Referral"}
          </p>
        </div>

        {/* Read-only Area Name */}
        <div>
          <label className="text-sm font-medium">Nama & Kode Wilayah</label>
          <div className="mt-1 px-4 py-2 bg-gray-50 border rounded-lg text-gray-600 text-sm">
            {isLoading
              ? "Mengecek..."
              : `${areaName || "Tidak ditemukan"} (${areaCode || "-"})`}
          </div>
        </div>
      </div>

      {/* Area Status Feedback */}
      {!isLoading && areaCode && (
        <div
          className={`p-3 rounded-lg flex items-center gap-2 text-sm font-bold ${areaStatus === "available" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
        >
          {areaStatus === "available" ? (
            <>
              <CheckCircle size={16} /> Wilayah tersedia untuk Anda!
            </>
          ) : (
            <>
              <XCircle size={16} /> Diisi oleh: {occupiedBy}
            </>
          )}
        </div>
      )}

      {/* Development Plan */}
      {areaStatus === "available" && (
        <>
          <div>
            <label className="text-sm font-medium">Rencana Pengembangan</label>
            <textarea
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
              rows={3}
              placeholder="Jelaskan strategi Anda..."
              value={data.description}
              onChange={(e) =>
                onChange({ ...data, description: e.target.value })
              }
            />
          </div>

          <button
            onClick={onSubmit}
            disabled={isSubmitting || !data.description.trim()}
            className="w-full bg-yellow-600 text-white py-3 rounded-xl font-bold hover:bg-yellow-700 disabled:bg-gray-300 transition-all flex justify-center items-center"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : checkEligibility ? (
              "Terima Promosi Langsung"
            ) : (
              "Ajukan ke Admin"
            )}
          </button>
        </>
      )}
    </div>
  );
};
