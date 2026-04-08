import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/channel-context";
import { ShopHeader } from "@/components/shop-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, Eye, Gift } from "lucide-react";
import { getEvents } from "@/lib/api/event";
import type { EventPost } from "@/data/dto/community.dto";

type Language = "ko" | "en";

interface ShopEventsProps {
  language: Language;
}

export function ShopEvents({ language }: ShopEventsProps) {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const response = await getEvents();
      if (response.success && response.data) {
        // ()
        setEvents(response.data.filter(event => event.isActive));
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "ko" ? "ko-KR" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const isNew = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const isOngoing = (post: EventPost) => {
    if (!post.eventEndDate) return true;
    const endDate = new Date(post.eventEndDate);
    const now = new Date();
    // 
    endDate.setHours(23, 59, 59, 999);
    return endDate >= now;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ShopHeader language={language} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === "ko" ? "쇼핑 홈으로" : "Back to Shop"}
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl mb-2">
                {language === "ko" ? "이벤트" : "Events"}
              </h1>
              <p className="text-muted-foreground">
                {language === "ko" 
                  ? "진행 중인 다양한 이벤트를 확인하세요" 
                  : "Check out our ongoing events and promotions"}
              </p>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-12 text-center text-muted-foreground">
            {language === "ko" ? "이벤트 로딩 중" : "Loading events"}
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-12 text-center text-muted-foreground">
            {language === "ko" ? "진행 중인 이벤트가 없습니다" : "No ongoing events"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card
                key={event.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                {/* Event Image Placeholder */}
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Gift className="h-16 w-16 text-white/80" />
                  </div>
                  {isNew(event.createdAt) && (
                    <Badge 
                      variant="destructive" 
                      className="absolute top-4 right-4"
                    >
                      NEW
                    </Badge>
                  )}
                  {!isOngoing(event) && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Badge variant="secondary" className="text-base px-4 py-2">
                        {language === "ko" ? "종료" : "Ended"}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Event Info */}
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    {isOngoing(event) ? (
                      <Badge className="bg-green-500">
                        {language === "ko" ? "진행중" : "Ongoing"}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {language === "ko" ? "종료" : "Ended"}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg mb-3 line-clamp-2 min-h-[3.5rem]">
                    {event.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(event.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{event.views}</span>
                    </div>
                  </div>
                  {event.eventEndDate && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        {language === "ko" ? "이벤트 종료일" : "End Date"}:{" "}
                        {formatDate(event.eventEndDate)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default ShopEvents;
