export const emptyForm = {
  name: "",
  email: "",
  gender: "Male",
  department: "AIML",
  cgpa: 7.8,
  tenth_percentage: 82,
  twelfth_percentage: 78,
  backlogs: 0,
  attendance_percentage: 88,
  aptitude_score: 72,
  coding_score: 68,
  communication_score: 70,
  technical_score: 71,
  dsa_score: 64,
  number_of_projects: 2,
  number_of_internships: 1,
  number_of_certifications: 2,
  leetcode_problems: 85,
  programming_languages: ["Python"],
  cloud_skills: [],
  database_skills: ["SQL"],
  tools: ["Git"],
  target_career: "",
  question: "",
};

export const demoForm = {
  name: "Aarav Sharma",
  email: "aarav.sharma@college.edu",
  gender: "Male",
  department: "AIML",
  cgpa: 8.4,
  tenth_percentage: 91,
  twelfth_percentage: 88,
  backlogs: 0,
  attendance_percentage: 93,
  aptitude_score: 81,
  coding_score: 84,
  communication_score: 76,
  technical_score: 80,
  dsa_score: 79,
  number_of_projects: 4,
  number_of_internships: 2,
  number_of_certifications: 3,
  leetcode_problems: 180,
  programming_languages: ["Python", "JavaScript", "SQL"],
  cloud_skills: ["AWS", "Docker"],
  database_skills: ["SQL", "PostgreSQL"],
  tools: ["Git", "Linux", "REST APIs", "Machine Learning"],
  target_career: "Machine Learning Engineer",
  question: "",
};

export const languageOptions = ["Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "Go"];
export const cloudOptions = ["AWS", "Azure", "GCP", "Docker", "Kubernetes"];
export const databaseOptions = ["SQL", "PostgreSQL", "MySQL", "MongoDB"];
export const toolOptions = [
  "Git",
  "Linux",
  "CI/CD",
  "Terraform",
  "React",
  "Node.js",
  "REST APIs",
  "Machine Learning",
  "Deep Learning",
  "NLP",
  "Data Analysis",
  "Data Visualization",
];

export const careerOptions = [
  "Software Developer",
  "Backend Developer",
  "Frontend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "AI Engineer",
  "Cloud Engineer",
  "DevOps Engineer",
  "Cybersecurity Analyst",
  "Database Engineer",
];

export function statusColor(status) {
  if (status === "High") return { text: "text-emerald-300", bar: "#34d399", bg: "bg-emerald-500/15" };
  if (status === "Medium") return { text: "text-amber-300", bar: "#fbbf24", bg: "bg-amber-500/15" };
  return { text: "text-rose-300", bar: "#f43f5e", bg: "bg-rose-500/15" };
}

export const scoreBenchmarks = {
  default: { coding: 75, dsa: 70, aptitude: 70, communication: 72, technical: 74, cgpa: 75 },
  "Machine Learning Engineer": { coding: 82, dsa: 78, aptitude: 76, communication: 70, technical: 84, cgpa: 80 },
  "Data Scientist": { coding: 76, dsa: 68, aptitude: 82, communication: 78, technical: 80, cgpa: 80 },
  "Frontend Developer": { coding: 80, dsa: 65, aptitude: 68, communication: 80, technical: 76, cgpa: 72 },
  "DevOps Engineer": { coding: 74, dsa: 62, aptitude: 70, communication: 68, technical: 84, cgpa: 72 },
};

export function toPayload(form) {
  return {
    ...form,
    cgpa: Number(form.cgpa),
    tenth_percentage: Number(form.tenth_percentage),
    twelfth_percentage: Number(form.twelfth_percentage),
    backlogs: Number(form.backlogs),
    attendance_percentage: Number(form.attendance_percentage),
    aptitude_score: Number(form.aptitude_score),
    coding_score: Number(form.coding_score),
    communication_score: Number(form.communication_score),
    technical_score: Number(form.technical_score),
    dsa_score: Number(form.dsa_score),
    number_of_projects: Number(form.number_of_projects),
    number_of_internships: Number(form.number_of_internships),
    number_of_certifications: Number(form.number_of_certifications),
    leetcode_problems: Number(form.leetcode_problems),
    email: form.email || null,
    name: form.name || null,
    target_career: form.target_career || null,
    question: form.question || null,
  };
}
