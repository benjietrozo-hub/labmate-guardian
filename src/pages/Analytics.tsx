import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { 
  TrendingUp, 
  Users, 
  Package, 
  Clock, 
  Activity, 
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  UserCheck
} from "lucide-react";
import NavHeader from "@/components/NavHeader";
import NotificationProfile from "@/components/NotificationProfile";
import { useWebSocket } from "@/hooks/useWebSocket";
import { format } from "date-fns";

interface OverviewStats {
  total_reservations: number;
  approved_reservations: number;
  pending_reservations: number;
  total_equipment: number;
  equipment_with_reservations: number;
  avg_reservation_duration: number;
  popular_equipment: Array<{ name: string; count: number }>;
  recent_activity: Array<{
    id: string;
    equipment_name: string;
    user_name: string;
    status: string;
    reservation_date: string;
    created_at: string;
  }>;
}

interface EquipmentUsage {
  equipment_name: string;
  category: string;
  reservation_count: number;
  total_quantity: number;
  avg_duration: number;
}

interface PeakTime {
  day_of_week: number;
  hour: number;
  reservation_count: number;
}

interface UserPattern {
  user_name: string;
  email: string;
  reservation_count: number;
  total_quantity: number;
}

interface Trend {
  date: string;
  daily_count: number;
  approved_count: number;
  pending_count: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [activeTab, setActiveTab] = useState("overview");
  
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [equipmentUsage, setEquipmentUsage] = useState<EquipmentUsage[]>([]);
  const [peakTimes, setPeakTimes] = useState<PeakTime[]>([]);
  const [userPatterns, setUserPatterns] = useState<UserPattern[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);

  const { notifications, unreadCount, markAllAsRead } = useWebSocket("admin", "admin");

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, activeTab]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date_range: dateRange });
      
      switch (activeTab) {
        case "overview":
          await fetchOverview(params);
          break;
        case "equipment":
          await fetchEquipmentUsage(params);
          break;
        case "peaks":
          await fetchPeakTimes(params);
          break;
        case "users":
          await fetchUserPatterns(params);
          break;
        case "trends":
          await fetchTrends(params);
          break;
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async (params: URLSearchParams) => {
    params.set('type', 'overview');
    const response = await fetch(`http://localhost/labmate-guardian-main/api/analytics.php?${params}`);
    const data = await response.json();
    setOverviewStats(data.stats);
  };

  const fetchEquipmentUsage = async (params: URLSearchParams) => {
    params.set('type', 'equipment_usage');
    const response = await fetch(`http://localhost/labmate-guardian-main/api/analytics.php?${params}`);
    const data = await response.json();
    setEquipmentUsage(data.usage_data);
  };

  const fetchPeakTimes = async (params: URLSearchParams) => {
    params.set('type', 'peak_times');
    const response = await fetch(`http://localhost/labmate-guardian-main/api/analytics.php?${params}`);
    const data = await response.json();
    setPeakTimes(data.peak_times);
  };

  const fetchUserPatterns = async (params: URLSearchParams) => {
    params.set('type', 'user_patterns');
    const response = await fetch(`http://localhost/labmate-guardian-main/api/analytics.php?${params}`);
    const data = await response.json();
    setUserPatterns(data.user_patterns);
  };

  const fetchTrends = async (params: URLSearchParams) => {
    params.set('type', 'trends');
    const response = await fetch(`http://localhost/labmate-guardian-main/api/analytics.php?${params}`);
    const data = await response.json();
    setTrends(data.trends);
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayOfWeek - 1] || 'Unknown';
  };

  const pieData = overviewStats?.popular_equipment.map(item => ({
    name: item.name,
    value: item.count
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader 
        title="Analytics Dashboard" 
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAllAsRead={markAllAsRead}
        user={{ id: "admin", email: "admin@example.com", role: "admin" }}
      />
      
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Usage Analytics</h1>
          
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
                <SelectItem value="365">1 Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={fetchAnalytics} variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === "overview" && overviewStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Reservations</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overviewStats.total_reservations}</div>
                  <p className="text-xs text-muted-foreground">
                    {overviewStats.approved_reservations} approved
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Equipment Items</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overviewStats.total_equipment}</div>
                  <p className="text-xs text-muted-foreground">
                    {overviewStats.equipment_with_reservations} with reservations
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overviewStats.pending_reservations}</div>
                  <p className="text-xs text-muted-foreground">Awaiting approval</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overviewStats.avg_reservation_duration}h</div>
                  <p className="text-xs text-muted-foreground">Per reservation</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "equipment", label: "Equipment Usage", icon: Package },
              { id: "peaks", label: "Peak Times", icon: Clock },
              { id: "users", label: "User Patterns", icon: UserCheck },
              { id: "trends", label: "Trends", icon: TrendingUp }
            ].map(tab => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2"
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Overview Charts */}
          {activeTab === "overview" && overviewStats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Popular Equipment</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {overviewStats.recent_activity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{activity.equipment_name}</p>
                          <p className="text-sm text-gray-600">{activity.user_name}</p>
                        </div>
                        <Badge className={
                          activity.status === 'approved' ? 'bg-green-100 text-green-800' :
                          activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {activity.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Equipment Usage */}
          {activeTab === "equipment" && (
            <Card>
              <CardHeader>
                <CardTitle>Equipment Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={equipmentUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="equipment_name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="reservation_count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Peak Times */}
          {activeTab === "peaks" && (
            <Card>
              <CardHeader>
                <CardTitle>Peak Reservation Times</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={peakTimes.map(pt => ({
                    ...pt,
                    day_hour: `${getDayName(pt.day_of_week)} ${pt.hour}:00`
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day_hour" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="reservation_count" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* User Patterns */}
          {activeTab === "users" && (
            <Card>
              <CardHeader>
                <CardTitle>Top Users by Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userPatterns.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{user.user_name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{user.reservation_count} reservations</p>
                        <p className="text-sm text-gray-600">{user.total_quantity} items</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trends */}
          {activeTab === "trends" && (
            <Card>
              <CardHeader>
                <CardTitle>Reservation Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="daily_count" stroke="#8884d8" name="Total" />
                    <Line type="monotone" dataKey="approved_count" stroke="#82ca9d" name="Approved" />
                    <Line type="monotone" dataKey="pending_count" stroke="#ffc658" name="Pending" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
