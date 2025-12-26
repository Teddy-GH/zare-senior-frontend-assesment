import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, TrendingUp, Users, FolderKanban, CheckCircle2 } from "lucide-react";

const stats = [
  {
    title: "Active Projects",
    value: "12",
    change: "+2 this month",
    icon: FolderKanban,
    color: "text-primary",
  },
  {
    title: "Team Members",
    value: "24",
    change: "+3 this quarter",
    icon: Users,
    color: "text-accent",
  },
  {
    title: "Tasks Completed",
    value: "156",
    change: "+12% from last week",
    icon: CheckCircle2,
    color: "text-green-600",
  },
  {
    title: "Success Rate",
    value: "94%",
    change: "+5% increase",
    icon: TrendingUp,
    color: "text-orange-600",
  },
];

const recentProjects = [
  { name: "Mobile App Redesign", status: "In Progress", progress: 75, team: 5 },
  { name: "API Migration", status: "Planning", progress: 20, team: 3 },
  { name: "Website Refresh", status: "In Progress", progress: 60, team: 4 },
  { name: "Analytics Dashboard", status: "Review", progress: 90, team: 2 },
];

export default function Overview() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-2">
          Track your team's progress and key metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentProjects.map((project) => (
              <div
                key={project.name}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{project.name}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-muted-foreground">{project.status}</span>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{project.team} members</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground w-10 text-right">
                    {project.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
