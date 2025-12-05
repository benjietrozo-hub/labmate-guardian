import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Package, Boxes, ClipboardList, Users, Wrench } from "lucide-react";

const modules = [
  {
    title: "Incident Reports",
    description: "Track equipment issues and incidents",
    icon: AlertCircle,
    url: "/incidents",
    color: "from-red-500 to-orange-500",
  },
  {
    title: "Lost & Found",
    description: "Manage found items and claims",
    icon: Package,
    url: "/lost-found",
    color: "from-yellow-500 to-amber-500",
  },
  {
    title: "Inventory Equipment",
    description: "Track lab equipment catalog",
    icon: Boxes,
    url: "/inventory",
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Borrow Items",
    description: "Manage equipment borrowing",
    icon: ClipboardList,
    url: "/borrow",
    color: "from-green-500 to-emerald-500",
  },
  {
    title: "Visitor Logs",
    description: "Record visitor information",
    icon: Users,
    url: "/visitors",
    color: "from-purple-500 to-violet-500",
  },
  {
    title: "Repair & Maintenance",
    description: "Track repair requests and status",
    icon: Wrench,
    url: "/repairs",
    color: "from-pink-500 to-rose-500",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Select a module to get started
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Card
            key={module.title}
            className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
            onClick={() => navigate(module.url)}
          >
            <CardHeader>
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${module.color} flex items-center justify-center mb-2`}>
                <module.icon className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl">{module.title}</CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-primary font-medium">
                View Details →
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
