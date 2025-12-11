import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Package, 
  AlertCircle, 
  CheckCircle,
  BarChart3,
  Target,
  Award,
  Lightbulb
} from "lucide-react";
import NavHeader from "@/components/NavHeader";
import NotificationProfile from "@/components/NotificationProfile";
import { useWebSocket } from "@/hooks/useWebSocket";
import { format } from "date-fns";

interface UserStats {
  total_reservations: number;
  approved_reservations: number;
  pending_reservations: number;
  cancelled_reservations: number;
  avg_reservation_duration: number;
  favorite_equipment: Array<{ name: string; count: number }>;
  upcoming_reservations: Array<{
    id: string;
    equipment_name: string;
    reservation_date: string;
    start_time: string;
    end_time: string;
    status: string;
  }>;
  usage_patterns: {
    preferred_time_slots: Array<{ hour: number; count: number }>;
    preferred_days: Array<{ day: string; count: number }>;
    monthly_trends: Array<{ month: string; count: number }>;
  };
  recommendations: Array<{
    type: 'equipment' | 'time' | 'efficiency';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export default function UserAnalytics() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  const currentUser = typeof window !== "undefined" ? 
    JSON.parse(localStorage.getItem("user") || "{}") : null;

  const { notifications, unreadCount, markAllAsRead, loadMoreNotifications, hasMoreNotifications, totalNotifications, removeNotification, clearAllNotifications } = useWebSocket(
    currentUser?.id || "", 
    currentUser?.role || "student"
  );

  useEffect(() => {
    fetchUserAnalytics();
  }, [dateRange]);

  const fetchUserAnalytics = async () => {
    if (!currentUser?.id) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({ 
        date_range: dateRange,
        user_id: currentUser.id 
      });
      
      const response = await fetch(`http://localhost/labmate-guardian-main/api/analytics.php?type=user_analytics&${params}`);
      const data = await response.json();
      
      if (data.success) {
        setUserStats(data.stats);
      } else {
        toast.error("Failed to load analytics data");
      }
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'equipment': return <Package className="w-4 h-4" />;
      case 'time': return <Clock className="w-4 h-4" />;
      case 'efficiency': return <Target className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getRecommendationColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentUser) {
    return <div className="text-center py-8">Please log in to view your analytics</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader 
        title="My Analytics" 
        subtitle="View your usage statistics and analytics"
        showBackButton={true}
        showHomeButton={true}
      >
        <NotificationProfile 
          notifications={notifications}
          unreadCount={unreadCount}
          currentUser={currentUser}
          markAllAsRead={markAllAsRead}
          loadMoreNotifications={loadMoreNotifications}
          hasMoreNotifications={hasMoreNotifications}
          totalNotifications={totalNotifications}
          removeNotification={removeNotification}
          clearAllNotifications={clearAllNotifications}
        />
      </NavHeader>
      
      <div className="container mx-auto p-6 pt-20">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Usage Analytics</h1>
          
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
            
            <Button onClick={fetchUserAnalytics} variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading your analytics...</div>
        ) : userStats ? (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Reservations</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.total_reservations}</div>
                  <p className="text-xs text-muted-foreground">
                    {userStats.approved_reservations} approved
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {userStats.total_reservations > 0 
                      ? Math.round((userStats.approved_reservations / userStats.total_reservations) * 100) 
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {userStats.pending_reservations} pending
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.avg_reservation_duration}h</div>
                  <p className="text-xs text-muted-foreground">Per reservation</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Achievement</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {userStats.total_reservations >= 10 ? "Expert" : 
                     userStats.total_reservations >= 5 ? "Regular" : 
                     userStats.total_reservations >= 1 ? "Beginner" : "New"}
                  </div>
                  <p className="text-xs text-muted-foreground">User level</p>
                </CardContent>
              </Card>
            </div>

            {/* Personalized Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Personalized Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userStats.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="mt-1">
                        {getRecommendationIcon(rec.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{rec.title}</h4>
                          <Badge className={getRecommendationColor(rec.priority)}>
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Reservations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Reservations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userStats.upcoming_reservations.length > 0 ? (
                    userStats.upcoming_reservations.map((reservation) => (
                      <div key={reservation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{reservation.equipment_name}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(reservation.reservation_date), 'MMM d, yyyy')} • 
                            {reservation.start_time} - {reservation.end_time}
                          </p>
                        </div>
                        <Badge className={
                          reservation.status === 'approved' ? 'bg-green-100 text-green-800' :
                          reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {reservation.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No upcoming reservations
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Usage Patterns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Favorite Equipment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userStats.favorite_equipment.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="font-medium">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(item.count / Math.max(...userStats.favorite_equipment.map(e => e.count))) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preferred Time Slots</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userStats.usage_patterns.preferred_time_slots.map((slot, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="font-medium">{slot.hour}:00 - {slot.hour + 1}:00</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${(slot.count / Math.max(...userStats.usage_patterns.preferred_time_slots.map(s => s.count))) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{slot.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
