// In-memory storage for team members
let teamMembers = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Product Manager",
    email: "sarah.j@company.com",
    initials: "SJ",
    projects: 8,
    status: "Active",
    avatar: "bg-primary",
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Lead Developer",
    email: "michael.c@company.com",
    initials: "MC",
    projects: 12,
    status: "Active",
    avatar: "bg-accent",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "UX Designer",
    email: "emily.r@company.com",
    initials: "ER",
    projects: 6,
    status: "Active",
    avatar: "bg-green-600",
  },
  {
    id: 4,
    name: "David Kim",
    role: "Backend Developer",
    email: "david.k@company.com",
    initials: "DK",
    projects: 10,
    status: "Active",
    avatar: "bg-orange-600",
  },
  {
    id: 5,
    name: "Lisa Anderson",
    role: "QA Engineer",
    email: "lisa.a@company.com",
    initials: "LA",
    projects: 9,
    status: "Active",
    avatar: "bg-purple-600",
  },
  {
    id: 6,
    name: "James Wilson",
    role: "Frontend Developer",
    email: "james.w@company.com",
    initials: "JW",
    projects: 7,
    status: "Active",
    avatar: "bg-blue-600",
  },
  {
    id: 7,
    name: "Maria Garcia",
    role: "Product Designer",
    email: "maria.g@company.com",
    initials: "MG",
    projects: 5,
    status: "Active",
    avatar: "bg-pink-600",
  },
  {
    id: 8,
    name: "Thomas Brown",
    role: "DevOps Engineer",
    email: "thomas.b@company.com",
    initials: "TB",
    projects: 11,
    status: "Active",
    avatar: "bg-indigo-600",
  },
];

let nextId = Math.max(...teamMembers.map(m => m.id)) + 1;

export function getTeamMembers() {
  return teamMembers;
}

export function getTeamMemberById(id) {
  return teamMembers.find(m => m.id === id);
}

export function createTeamMember(memberData) {
  const newMember = {
    id: nextId++,
    ...memberData,
  };
  teamMembers.push(newMember);
  return newMember;
}

export function updateTeamMember(id, updates) {
  const index = teamMembers.findIndex(m => m.id === id);
  if (index === -1) {
    return null;
  }
  
  teamMembers[index] = {
    ...teamMembers[index],
    ...updates,
    id, // Ensure ID cannot be changed
  };
  
  return teamMembers[index];
}

export function deleteTeamMember(id) {
  const index = teamMembers.findIndex(m => m.id === id);
  if (index === -1) {
    return false;
  }
  
  teamMembers.splice(index, 1);
  return true;
}

