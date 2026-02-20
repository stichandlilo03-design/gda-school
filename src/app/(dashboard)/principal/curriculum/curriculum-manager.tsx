"use client";

import { useState } from "react";
import { addGradeLevel, removeGradeLevel, addSubjectToGrade, removeSubjectFromGrade } from "@/lib/actions/school";
import { useRouter } from "next/navigation";
import { Plus, Trash2, BookOpen, Loader2, ChevronDown, ChevronUp, GraduationCap } from "lucide-react";
import { getEducationSystem } from "@/lib/education-systems";

const COMMON_SUBJECTS = [
  { name: "Mathematics", code: "MATH" }, { name: "English Language", code: "ENG" },
  { name: "Basic Science", code: "SCI" }, { name: "Social Studies", code: "SOC" },
  { name: "Computer Studies / ICT", code: "ICT" }, { name: "Creative Arts", code: "ART" },
  { name: "Physical & Health Education", code: "PHE" }, { name: "Civic Education", code: "CIV" },
  { name: "Religious Studies", code: "REL" }, { name: "French", code: "FRN" },
  { name: "Physics", code: "PHY" }, { name: "Chemistry", code: "CHM" },
  { name: "Biology", code: "BIO" }, { name: "History", code: "HIS" },
  { name: "Geography", code: "GEO" }, { name: "Economics", code: "ECO" },
  { name: "Business Studies", code: "BUS" }, { name: "Literature in English", code: "LIT" },
  { name: "Agricultural Science", code: "AGR" }, { name: "Technical Drawing", code: "TDR" },
  { name: "Home Economics", code: "HEC" }, { name: "Local Language", code: "LOC" },
];

export default function CurriculumManager({ grades, countryCode }: { grades: any[]; countryCode: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [expandedGrade, setExpandedGrade] = useState<string | null>(null);
  const [newGrade, setNewGrade] = useState("");
  const [addingSubject, setAddingSubject] = useState<string | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", isRequired: true, weeklyPeriods: 4 });

  const eduSystem = getEducationSystem(countryCode);
  const existingGrades = new Set(grades.map((g: any) => g.gradeLevel));

  // Get label for a grade value
  const getLabel = (val: string) => {
    for (const level of eduSystem.levels) {
      const g = level.grades.find(gr => gr.value === val);
      if (g) return g.label;
    }
    return val;
  };

  // Get section for a grade value
  const getSection = (val: string) => {
    for (const level of eduSystem.levels) {
      if (level.grades.find(gr => gr.value === val)) return level.section;
    }
    return "";
  };

  const handleAddGrade = async () => {
    if (!newGrade) return;
    setLoading("grade");
    const result = await addGradeLevel(newGrade);
    if (result.error) alert(result.error);
    else router.refresh();
    setLoading(""); setNewGrade("");
  };

  const handleRemoveGrade = async (gradeId: string) => {
    if (!confirm("Remove this grade level? This will also remove associated subjects.")) return;
    setLoading(gradeId); await removeGradeLevel(gradeId); router.refresh(); setLoading("");
  };

  const handleAddSubject = async (schoolGradeId: string) => {
    if (!subjectForm.name || !subjectForm.code) { alert("Fill in subject name and code"); return; }
    setLoading("subject");
    const result = await addSubjectToGrade(schoolGradeId, subjectForm.name, subjectForm.code, subjectForm.isRequired, subjectForm.weeklyPeriods);
    if (result.error) alert(result.error);
    else { router.refresh(); setAddingSubject(null); setSubjectForm({ name: "", code: "", isRequired: true, weeklyPeriods: 4 }); }
    setLoading("");
  };

  const handleRemoveSubject = async (gsId: string) => {
    if (!confirm("Remove this subject?")) return;
    setLoading(gsId); await removeSubjectFromGrade(gsId); router.refresh(); setLoading("");
  };

  // Group existing grades by section
  const gradesBySection: Record<string, any[]> = {};
  grades.forEach((g: any) => {
    const sec = getSection(g.gradeLevel);
    if (!gradesBySection[sec]) gradesBySection[sec] = [];
    gradesBySection[sec].push(g);
  });

  return (
    <div className="space-y-6">
      {/* Education system info */}
      <div className="card bg-gradient-to-r from-brand-50 to-indigo-50 border-brand-200">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{eduSystem.flag}</span>
          <div>
            <h3 className="font-bold text-gray-800">{eduSystem.country} Education System</h3>
            <p className="text-xs text-gray-500">{eduSystem.systemName} • Starts at age {eduSystem.ageStart}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {eduSystem.levels.map(level => (
            <span key={level.section} className="text-[10px] bg-white px-2 py-1 rounded-lg border text-gray-600">
              {level.section} ({level.grades.length} levels)
            </span>
          ))}
        </div>
      </div>

      {/* Add Grade — grouped by section */}
      <div className="card">
        <h3 className="section-title mb-4">Add Grade Level</h3>
        <div className="flex gap-3">
          <select className="input-field flex-1" value={newGrade} onChange={(e) => setNewGrade(e.target.value)}>
            <option value="">Select level to add</option>
            {eduSystem.levels.map(level => (
              <optgroup key={level.section} label={level.section}>
                {level.grades.filter(g => !existingGrades.has(g.value)).map(g => (
                  <option key={g.value} value={g.value}>{g.label} (Ages {g.ageRange})</option>
                ))}
              </optgroup>
            ))}
          </select>
          <button onClick={handleAddGrade} disabled={!newGrade || loading === "grade"} className="btn-primary px-6">
            {loading === "grade" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> Add</>}
          </button>
        </div>
      </div>

      {/* Grade List — grouped by education section */}
      {grades.length === 0 ? (
        <div className="card text-center py-12">
          <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No grade levels added yet. Add your first level above.</p>
          <p className="text-xs text-gray-400 mt-1">Grades are labeled according to {eduSystem.country}&apos;s education system</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(gradesBySection).map(([section, sectionGrades]) => (
            <div key={section}>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-500" />
                {section}
                <span className="text-[10px] font-normal text-gray-400">({sectionGrades.length} levels)</span>
              </h3>
              <div className="space-y-3">
                {sectionGrades.map((grade: any) => (
                  <div key={grade.id} className="card">
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedGrade(expandedGrade === grade.id ? null : grade.id)}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm">
                          {grade.gradeLevel}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800">{getLabel(grade.gradeLevel)}</h4>
                          <p className="text-xs text-gray-500">{grade.subjects.length} subjects • {section}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleRemoveGrade(grade.id); }} className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {expandedGrade === grade.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    {expandedGrade === grade.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        {grade.subjects.length > 0 ? (
                          <div className="space-y-2 mb-4">
                            {grade.subjects.map((gs: any) => (
                              <div key={gs.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <span className="text-sm font-medium text-gray-800">{gs.subject.name}</span>
                                  <span className="text-xs text-gray-500 ml-2">({gs.subject.code})</span>
                                  {gs.isRequired && <span className="badge-info ml-2 text-[10px]">Required</span>}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-gray-500">{gs.weeklyPeriods} periods/week</span>
                                  <button onClick={() => handleRemoveSubject(gs.id)} className="text-red-400 hover:text-red-600">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 mb-4">No subjects added yet.</p>
                        )}

                        {addingSubject === grade.id ? (
                          <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                            <div className="flex flex-wrap gap-1 mb-2">
                              {COMMON_SUBJECTS.map((s) => (
                                <button key={s.code} type="button" onClick={() => setSubjectForm(p => ({ ...p, name: s.name, code: s.code }))}
                                  className="text-[10px] px-2 py-1 rounded-full bg-white border border-gray-200 hover:bg-brand-50 hover:border-brand-300 transition-colors">
                                  {s.name}
                                </button>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <input className="input-field" placeholder="Subject Name" value={subjectForm.name} onChange={(e) => setSubjectForm(p => ({ ...p, name: e.target.value }))} />
                              <input className="input-field" placeholder="Code (e.g. MATH)" value={subjectForm.code} onChange={(e) => setSubjectForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={subjectForm.isRequired} onChange={(e) => setSubjectForm(p => ({ ...p, isRequired: e.target.checked }))} />
                                Required subject
                              </label>
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-600">Periods/week:</label>
                                <input type="number" className="input-field w-16" min={1} max={10} value={subjectForm.weeklyPeriods} onChange={(e) => setSubjectForm(p => ({ ...p, weeklyPeriods: parseInt(e.target.value) || 1 }))} />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleAddSubject(grade.id)} disabled={loading === "subject"} className="btn-primary text-xs px-4 py-2">
                                {loading === "subject" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add Subject"}
                              </button>
                              <button onClick={() => setAddingSubject(null)} className="btn-ghost text-xs px-4 py-2">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setAddingSubject(grade.id)} className="btn-ghost text-xs border border-dashed border-gray-300 w-full py-2">
                            <Plus className="w-3 h-3 mr-1" /> Add Subject
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
