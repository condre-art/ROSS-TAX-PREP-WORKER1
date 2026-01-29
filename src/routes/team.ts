// src/routes/team.ts
// Meet the Team API endpoint

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  role: string;
  region: string;
  phone: string;
  email: string;
  photo?: string;
  bio?: string;
  credentials?: string[];
  active: boolean;
}

// Static team data - can be moved to D1 database later
const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "andreaa-channel",
    name: "Andreaa Chan'nel",
    title: "Owner | Resolution Manager",
    role: "owner",
    region: "Crowley, LA",
    phone: "254-394-7438",
    email: "Info@RossTaxPrep.com",
    photo: "/assets/andreaa.png",
    bio: "Started doing taxes at 17 back in 2017. Author + Illustrator of 'How-To' Tax Pro Textbook. Built tax software supporting IRS e-file workflow and transmission processes.",
    credentials: ["PTIN", "EFIN", "ETIN"],
    active: true,
  },
  {
    id: "zavya-brown",
    name: "Zavya Brown, MBA",
    title: "Lead Tax Associate",
    role: "lead",
    region: "Central Texas Area",
    phone: "512-489-6749",
    email: "Info@RossTaxPrep.com",
    photo: "/assets/zavya.png",
    bio: "MBA graduate with expertise in individual and business tax preparation.",
    credentials: ["PTIN"],
    active: true,
  },
  {
    id: "sharleana-mathes",
    name: "Sharleana Mathes",
    title: "Tax Associate | Experience Manager",
    role: "associate",
    region: "Central Texas Region",
    phone: "512-489-6749",
    email: "Manager@RossTaxPrep.com",
    photo: "/assets/sharleana.png",
    bio: "Dedicated to providing exceptional client experience and accurate tax preparation.",
    credentials: ["PTIN"],
    active: true,
  },
  {
    id: "paul-okpulor",
    name: "Paul C. Okpulor",
    title: "Tax Associate",
    role: "associate",
    region: "Dallas Region",
    phone: "512-489-6749",
    email: "Info@RossTaxPrep.com",
    photo: "/assets/paul.png",
    bio: "Serving the Dallas region with professional tax preparation services.",
    credentials: ["PTIN"],
    active: true,
  },
];

/**
 * GET /api/team - List all active team members
 */
export async function handleListTeam(req: Request, env: any): Promise<Response> {
  const url = new URL(req.url);
  const region = url.searchParams.get("region");
  const role = url.searchParams.get("role");

  let members = TEAM_MEMBERS.filter((m) => m.active);

  // Filter by region if specified
  if (region) {
    members = members.filter((m) =>
      m.region.toLowerCase().includes(region.toLowerCase())
    );
  }

  // Filter by role if specified
  if (role) {
    members = members.filter((m) => m.role === role);
  }

  return new Response(JSON.stringify(members), {
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * GET /api/team/:id - Get a specific team member
 */
export async function handleGetTeamMember(
  req: Request,
  env: any,
  id: string
): Promise<Response> {
  const member = TEAM_MEMBERS.find((m) => m.id === id && m.active);

  if (!member) {
    return new Response(JSON.stringify({ error: "Team member not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(member), {
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * GET /api/team/regions - List all regions with team members
 */
export async function handleListRegions(req: Request, env: any): Promise<Response> {
  const regions = [...new Set(TEAM_MEMBERS.filter((m) => m.active).map((m) => m.region))];

  return new Response(JSON.stringify(regions), {
    headers: { "Content-Type": "application/json" },
  });
}
