"use client";

import { useState, useRef } from "react";
import {
  updateTeacherProfile, updateTeacherUserInfo, uploadProfilePicture, removeProfilePicture,
} from "@/lib/actions/teacher-profile";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Camera, Loader2, Save, Trash2, Plus, X, Linkedin, Globe, Twitter, Youtube,
  GraduationCap, BookOpen, Award, Languages, User, Mail, Phone, Star, Eye
} from "lucide-react";

const SUBJECTS = [
  "Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Further Mathematics",
  "Economics", "Government", "History", "Geography", "Computer Science", "ICT",
  "French", "Arabic", "Literature", "Civic Education", "Social Studies",
  "Basic Science", "Basic Technology", "Physical Education", "Fine Arts", "Music",
  "Business Studies", "Accounting", "Commerce", "Health Science", "Religious Studies",
  "Agricultural Science", "Home Economics", "Technical Drawing", "Spanish", "Portuguese",
  "German", "Mandarin", "Swahili", "Yoruba", "Igbo", "Hausa", "Creative Writing", "Coding & Robotics",
];

const GRADES = ["K1", "K2", "K3", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "G12", "Undergraduate", "Postgraduate"];

const STYLES = ["Interactive & Discussion-Based", "Lecture & Structured", "Project-Based Learning", "Flipped Classroom", "Socratic Method", "Blended / Hybrid", "Montessori", "Gamified Learning", "Hands-On Practical"];

export default function ProfileEditor({ teacher, user }: { teacher: any; user: any }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"profile" | "subjects" | "qualifications" | "preview">("profile");

  // Profile fields
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [headline, setHeadline] = useState(teacher.headline || "");
  const [bio, setBio] = useState(teacher.bio || "");
  const [style, setStyle] = useState(teacher.teachingStyle || "");
  const [experience, setExperience] = useState(teacher.yearsExperience);
  const [linkedin, setLinkedin] = useState(teacher.linkedinUrl || "");
  const [twitter, setTwitter] = useState(teacher.twitterUrl || "");
  const [website, setWebsite] = useState(teacher.websiteUrl || "");
  const [videoUrl, setVideoUrl] = useState(teacher.introVideoUrl || "");
  const [profilePic, setProfilePic] = useState(teacher.profilePicture || user.image || "");

  // Arrays
  const [subjects, setSubjects] = useState<string[]>((teacher.subjects as string[]) || []);
  const [grades, setGrades] = useState<string[]>((teacher.preferredGrades as string[]) || []);
  const [qualifications, setQualifications] = useState<string[]>(((teacher.qualifications as string[]) || []).filter(Boolean));
  const [languages, setLanguages] = useState<string[]>(((teacher.languages as string[]) || []).filter(Boolean));
  const [achievements, setAchievements] = useState<string[]>(((teacher.achievements as string[]) || []).filter(Boolean));
  const [newQual, setNewQual] = useState("");
  const [newLang, setNewLang] = useState("");
  const [newAch, setNewAch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");

  const filteredSubjects = SUBJECTS.filter((s) => s.toLowerCase().includes(subjectSearch.toLowerCase()) && !subjects.includes(s));

  // Photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setMessage("Error: Image too large (max 5MB)"); return; }

    setLoading("photo");
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const result = await uploadProfilePicture(base64);
      if (result.error) setMessage("Error: " + result.error);
      else { setProfilePic(result.url!); setMessage("Photo updated!"); }
      router.refresh();
      setLoading("");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    if (!confirm("Remove your profile picture?")) return;
    setLoading("rmphoto");
    await removeProfilePicture();
    setProfilePic("");
    router.refresh();
    setLoading("");
  };

  // Save profile
  const handleSaveProfile = async () => {
    setLoading("save");
    await updateTeacherUserInfo({ name, phone: phone || undefined });
    await updateTeacherProfile({
      bio, headline, teachingStyle: style, yearsExperience: experience,
      linkedinUrl: linkedin || undefined, twitterUrl: twitter || undefined,
      websiteUrl: website || undefined, introVideoUrl: videoUrl || undefined,
      qualifications, languages, achievements, subjects, preferredGrades: grades,
    });
    setMessage("Profile saved!");
    router.refresh();
    setLoading("");
  };

  const addItem = (list: string[], setList: (v: string[]) => void, item: string, setInput: (v: string) => void) => {
    if (item.trim() && !list.includes(item.trim())) { setList([...list, item.trim()]); setInput(""); }
  };

  const removeItem = (list: string[], setList: (v: string[]) => void, idx: number) => {
    setList(list.filter((_, i) => i !== idx));
  };

  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {message && (
        <div className={`p-3 rounded-lg text-sm flex justify-between ${message.includes("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          <span>{message}</span><button onClick={() => setMessage("")}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {[
          { key: "profile", label: "📝 Profile & Links" },
          { key: "subjects", label: "📚 Subjects & Grades" },
          { key: "qualifications", label: "🎓 Qualifications" },
          { key: "preview", label: "👁 Student Preview" },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`text-xs px-4 py-2.5 rounded-lg font-medium ${tab === t.key ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* =================== PROFILE TAB =================== */}
      {tab === "profile" && (
        <div className="space-y-6">
          {/* Photo section */}
          <div className="card">
            <h3 className="section-title mb-4 flex items-center gap-2"><Camera className="w-4 h-4" /> Profile Picture</h3>
            <div className="flex items-center gap-6">
              <div className="relative">
                {profilePic ? (
                  <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-brand-200 shadow-lg">
                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center border-4 border-brand-200 shadow-lg">
                    <span className="text-3xl font-bold text-white">{initials}</span>
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={loading === "photo"}
                  className="absolute -bottom-2 -right-2 w-9 h-9 bg-brand-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-brand-700"
                >
                  {loading === "photo" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">This photo will be visible to students, principals, and on your teacher card.</p>
                <p className="text-xs text-gray-500 mt-1">Recommended: Square photo, at least 200×200px, max 5MB.</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => fileRef.current?.click()} className="text-xs px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 font-medium">Upload Photo</button>
                  {profilePic && (
                    <button onClick={handleRemovePhoto} disabled={loading === "rmphoto"} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600">
                      {loading === "rmphoto" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Remove"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Basic info */}
          <div className="card space-y-4">
            <h3 className="section-title flex items-center gap-2"><User className="w-4 h-4" /> Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Full Name *</label><input className="input-field" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><label className="label">Phone</label><input className="input-field" placeholder="+234..." value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div className="col-span-2"><label className="label">Headline <span className="text-gray-400">(e.g. "Passionate Math & Physics Educator")</span></label><input className="input-field" placeholder="A short tagline about you" value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={120} /><p className="text-[10px] text-gray-400 mt-0.5">{headline.length}/120</p></div>
              <div className="col-span-2"><label className="label">Bio</label><textarea className="input-field min-h-[120px]" placeholder="Tell students about yourself, your teaching philosophy, experience..." value={bio} onChange={(e) => setBio(e.target.value)} maxLength={2000} /><p className="text-[10px] text-gray-400 mt-0.5">{bio.length}/2000</p></div>
              <div><label className="label">Teaching Style</label>
                <select className="input-field" value={style} onChange={(e) => setStyle(e.target.value)}>
                  <option value="">Select style</option>
                  {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="label">Years of Experience</label><input type="number" className="input-field" min={0} max={50} value={experience} onChange={(e) => setExperience(parseInt(e.target.value) || 0)} /></div>
            </div>
          </div>

          {/* Social links */}
          <div className="card space-y-4">
            <h3 className="section-title flex items-center gap-2"><Globe className="w-4 h-4" /> Social & Links</h3>
            <p className="text-xs text-gray-500">These links will appear on your public profile visible to students.</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0"><Linkedin className="w-5 h-5" /></div>
                <input className="input-field flex-1" placeholder="https://linkedin.com/in/yourname" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0"><Twitter className="w-5 h-5" /></div>
                <input className="input-field flex-1" placeholder="https://twitter.com/yourhandle" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center flex-shrink-0"><Globe className="w-5 h-5" /></div>
                <input className="input-field flex-1" placeholder="https://yourwebsite.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0"><Youtube className="w-5 h-5" /></div>
                <input className="input-field flex-1" placeholder="YouTube intro video URL (optional)" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Languages */}
          <div className="card space-y-3">
            <h3 className="section-title flex items-center gap-2"><Languages className="w-4 h-4" /> Languages I Speak</h3>
            <div className="flex flex-wrap gap-2">
              {languages.map((l, i) => (
                <span key={i} className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full">
                  {l} <button onClick={() => removeItem(languages, setLanguages, i)} className="text-purple-400 hover:text-purple-600"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input-field flex-1" placeholder="e.g. English, Yoruba, French" value={newLang}
                onChange={(e) => setNewLang(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem(languages, setLanguages, newLang, setNewLang)} />
              <button onClick={() => addItem(languages, setLanguages, newLang, setNewLang)} className="btn-ghost text-xs"><Plus className="w-3 h-3" /></button>
            </div>
          </div>
        </div>
      )}

      {/* =================== SUBJECTS TAB =================== */}
      {tab === "subjects" && (
        <div className="space-y-6">
          <div className="card space-y-4">
            <h3 className="section-title flex items-center gap-2"><BookOpen className="w-4 h-4" /> Subjects I Teach</h3>
            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {subjects.length === 0 && <p className="text-xs text-gray-400">No subjects selected yet</p>}
              {subjects.map((s, i) => (
                <span key={s} className="flex items-center gap-1 text-xs bg-brand-100 text-brand-700 px-3 py-1.5 rounded-full font-medium">
                  {s} <button onClick={() => removeItem(subjects, setSubjects, i)} className="text-brand-400 hover:text-brand-600"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="relative">
              <input className="input-field" placeholder="Search subjects..." value={subjectSearch} onChange={(e) => setSubjectSearch(e.target.value)} />
              {subjectSearch && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg mt-1 max-h-[200px] overflow-y-auto z-10">
                  {filteredSubjects.length === 0 ? (
                    <p className="text-xs text-gray-400 p-3">No matching subjects</p>
                  ) : (
                    filteredSubjects.map((s) => (
                      <button key={s} onClick={() => { setSubjects([...subjects, s]); setSubjectSearch(""); }}
                        className="w-full text-left text-xs px-3 py-2 hover:bg-brand-50 text-gray-700">{s}</button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="card space-y-4">
            <h3 className="section-title flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Grade Levels I Teach</h3>
            <div className="flex flex-wrap gap-2">
              {GRADES.map((g) => (
                <button key={g} onClick={() => setGrades(grades.includes(g) ? grades.filter((x) => x !== g) : [...grades, g])}
                  className={`text-xs px-3 py-2 rounded-lg font-medium transition-all ${grades.includes(g) ? "bg-emerald-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================== QUALIFICATIONS TAB =================== */}
      {tab === "qualifications" && (
        <div className="space-y-6">
          <div className="card space-y-3">
            <h3 className="section-title flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Qualifications & Degrees</h3>
            <div className="space-y-2">
              {qualifications.map((q, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <GraduationCap className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <span className="text-sm text-gray-800 flex-1">{q}</span>
                  <button onClick={() => removeItem(qualifications, setQualifications, i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input-field flex-1" placeholder="e.g. B.Ed Mathematics, M.Sc Physics, TRCN Certificate" value={newQual}
                onChange={(e) => setNewQual(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem(qualifications, setQualifications, newQual, setNewQual)} />
              <button onClick={() => addItem(qualifications, setQualifications, newQual, setNewQual)} className="btn-primary text-xs"><Plus className="w-3 h-3 mr-1" /> Add</button>
            </div>
          </div>

          <div className="card space-y-3">
            <h3 className="section-title flex items-center gap-2"><Award className="w-4 h-4" /> Achievements & Awards</h3>
            <div className="space-y-2">
              {achievements.map((a, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span className="text-sm text-gray-800 flex-1">{a}</span>
                  <button onClick={() => removeItem(achievements, setAchievements, i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input-field flex-1" placeholder="e.g. Best Teacher Award 2023, Published Researcher" value={newAch}
                onChange={(e) => setNewAch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem(achievements, setAchievements, newAch, setNewAch)} />
              <button onClick={() => addItem(achievements, setAchievements, newAch, setNewAch)} className="btn-primary text-xs"><Plus className="w-3 h-3 mr-1" /> Add</button>
            </div>
          </div>
        </div>
      )}

      {/* =================== PREVIEW TAB =================== */}
      {tab === "preview" && (
        <div className="space-y-6">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-center gap-2">
            <Eye className="w-4 h-4" /> This is how students see your profile when browsing classes.
          </div>

          {/* Profile card preview */}
          <div className="card max-w-lg mx-auto">
            <div className="flex flex-col items-center text-center pb-6 border-b border-gray-100">
              {profilePic ? (
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-brand-200 shadow-lg mb-3">
                  <img src={profilePic} alt={name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center border-4 border-brand-200 shadow-lg mb-3">
                  <span className="text-2xl font-bold text-white">{initials}</span>
                </div>
              )}
              <h3 className="text-lg font-bold text-gray-900">{name}</h3>
              {headline && <p className="text-sm text-brand-600 font-medium mt-0.5">{headline}</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span>{experience} years exp</span>
                {style && <span>• {style}</span>}
              </div>
              {teacher.schools?.[0] && <p className="text-xs text-gray-400 mt-1">{teacher.schools[0].school.name}</p>}

              {/* Social links */}
              <div className="flex items-center gap-2 mt-3">
                {linkedin && <a href={linkedin} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center hover:bg-blue-200"><Linkedin className="w-4 h-4" /></a>}
                {twitter && <a href={twitter} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center hover:bg-sky-200"><Twitter className="w-4 h-4" /></a>}
                {website && <a href={website} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200"><Globe className="w-4 h-4" /></a>}
              </div>

              {/* Rating */}
              {teacher.rating > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`w-4 h-4 ${s <= teacher.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} />)}
                  <span className="text-xs text-gray-500 ml-1">{teacher.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {bio && <div className="py-4 border-b border-gray-100"><p className="text-sm text-gray-700 leading-relaxed">{bio}</p></div>}

            {subjects.length > 0 && (
              <div className="py-4 border-b border-gray-100">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Subjects</p>
                <div className="flex flex-wrap gap-1.5">
                  {subjects.map((s) => <span key={s} className="text-xs bg-brand-100 text-brand-700 px-2.5 py-1 rounded-full font-medium">{s}</span>)}
                </div>
              </div>
            )}

            {grades.length > 0 && (
              <div className="py-4 border-b border-gray-100">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Grades</p>
                <div className="flex flex-wrap gap-1.5">
                  {grades.map((g) => <span key={g} className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">{g}</span>)}
                </div>
              </div>
            )}

            {qualifications.length > 0 && (
              <div className="py-4 border-b border-gray-100">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Qualifications</p>
                <div className="space-y-1">{qualifications.map((q, i) => <p key={i} className="text-xs text-gray-600 flex items-center gap-1.5"><GraduationCap className="w-3 h-3 text-purple-500" /> {q}</p>)}</div>
              </div>
            )}

            {achievements.length > 0 && (
              <div className="py-4 border-b border-gray-100">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Achievements</p>
                <div className="space-y-1">{achievements.map((a, i) => <p key={i} className="text-xs text-gray-600 flex items-center gap-1.5"><Award className="w-3 h-3 text-amber-500" /> {a}</p>)}</div>
              </div>
            )}

            {languages.length > 0 && (
              <div className="py-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Languages</p>
                <div className="flex flex-wrap gap-1.5">
                  {languages.map((l) => <span key={l} className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full">{l}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save button (sticky) */}
      {tab !== "preview" && (
        <div className="sticky bottom-4 flex justify-end">
          <button onClick={handleSaveProfile} disabled={loading === "save"} className="btn-primary px-8 py-3 shadow-lg text-sm">
            {loading === "save" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Profile
          </button>
        </div>
      )}
    </div>
  );
}
