"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadStudentPhoto, generateStudentIdNumber } from "@/lib/actions/profile";
import { Camera, Loader2, CreditCard, Download, Printer } from "lucide-react";
import IDCard from "@/components/id-card";

export default function StudentProfileClient({ student }: { student: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [photoPreview, setPhotoPreview] = useState(student.profilePicture || student.user.image || "");
  const [showIdCard, setShowIdCard] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { setMessage("Photo must be under 4MB"); return; }
    if (!file.type.startsWith("image/")) { setMessage("Please upload an image file"); return; }

    setLoading("photo");
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPhotoPreview(base64);
      const r = await uploadStudentPhoto(base64);
      if (r.error) setMessage(r.error);
      else { setMessage("✅ Photo uploaded!"); router.refresh(); }
      setLoading("");
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateId = async () => {
    setLoading("id");
    const r = await generateStudentIdNumber();
    if (r.error) setMessage(r.error);
    else { setMessage(`✅ Student ID: ${r.idNumber}`); router.refresh(); }
    setLoading("");
  };

  const subjects = student.enrollments?.map((e: any) => e.class?.subject?.name || e.class?.name).filter(Boolean) || [];

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-xl text-sm flex items-center justify-between ${message.includes("Error") || message.includes("must") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          <span>{message}</span>
          <button onClick={() => setMessage("")} className="opacity-60">✕</button>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Profile Info & Photo Upload */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-bold mb-4">📷 Profile Photo</h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                {photoPreview ? (
                  <img src={photoPreview} alt="" className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-200" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-400">
                    {student.user.name?.charAt(0)}
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center cursor-pointer hover:bg-brand-700 transition">
                  {loading === "photo" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={loading === "photo"} />
                </label>
              </div>
              <div>
                <h4 className="text-sm font-semibold">{student.user.name}</h4>
                <p className="text-xs text-gray-500">{student.user.email}</p>
                <p className="text-[10px] text-gray-400">{student.gradeLevel} · {student.school.name}</p>
                {!photoPreview && (
                  <p className="text-[10px] text-amber-600 mt-1">⚠️ Upload a photo to complete your ID card</p>
                )}
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-3">
              Your photo will appear on your student ID card. Use a clear, front-facing photo. Max 4MB.
            </p>
          </div>

          {/* Student details */}
          <div className="card">
            <h3 className="text-sm font-bold mb-3">📋 My Details</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Full Name</span>
                <span className="font-medium">{student.user.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{student.user.email}</span>
              </div>
              {student.user.phone && (
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">Phone</span>
                  <span className="font-medium">{student.user.phone}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Grade</span>
                <span className="font-medium">{student.gradeLevel}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">School</span>
                <span className="font-medium">{student.school.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Country</span>
                <span className="font-medium">{student.user.countryCode}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Student ID</span>
                <span className="font-bold text-brand-600">{student.idNumber || "Not generated"}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">Subjects</span>
                <span className="font-medium text-right max-w-[200px]">{subjects.join(", ") || "None enrolled"}</span>
              </div>
            </div>

            {!student.idNumber && (
              <button onClick={handleGenerateId} disabled={loading === "id"} className="btn-primary text-xs w-full mt-4">
                {loading === "id" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CreditCard className="w-3 h-3 mr-1" />}
                Generate My Student ID Number
              </button>
            )}
          </div>
        </div>

        {/* Right: ID Card */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold">🪪 Student ID Card</h3>
              {!showIdCard && (
                <button onClick={() => setShowIdCard(true)} className="text-xs px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 font-medium hover:bg-brand-100">
                  Preview Card
                </button>
              )}
            </div>

            {!photoPreview && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <Camera className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-amber-700 font-medium">Upload a photo first</p>
                <p className="text-[10px] text-amber-600 mt-1">Your photo is needed to generate your ID card</p>
              </div>
            )}

            {photoPreview && (showIdCard || student.idNumber) && (
              <IDCard
                type="STUDENT"
                name={student.user.name}
                photo={photoPreview}
                idNumber={student.idNumber}
                schoolName={student.school.name}
                schoolLogo={student.school.logo}
                grade={student.gradeLevel}
                subjects={subjects}
                email={student.user.email}
                countryCode={student.user.countryCode}
                enrolledDate={new Date(student.enrolledAt).toLocaleDateString()}
                primaryColor={student.school.primaryColor}
              />
            )}

            {photoPreview && !student.idNumber && (
              <p className="text-[10px] text-gray-400 text-center mt-2">Generate your Student ID number above to complete the card</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
