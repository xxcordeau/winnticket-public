import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useNavigate } from "@/lib/channel-context";
import { ShopHeader } from "@/components/shop-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Eye, ChevronUp, ChevronDown, Gift } from "lucide-react";
import { getEventById, getEvents, incrementEventViewCount } from "@/lib/api/event";
import type { EventPost } from "@/data/dto/community.dto";

type Language = "ko" | "en";

interface ShopEventDetailProps {
  language: Language;
}

export function ShopEventDetail({ language }: ShopEventDetailProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventPost | null>(null);
  const [allEvents, setAllEvents] = useState<EventPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      
      // 
      const eventResponse = await getEventById(id);
      if (eventResponse.success && eventResponse.data) {
        setEvent(eventResponse.data);
        
        // API 
        await incrementEventViewCount(id);
      }
      
      // (/ )
      const listResponse = await getEvents();
      if (listResponse.success && listResponse.data) {
        setAllEvents(listResponse.data);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "ko" ? "ko-KR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <ShopHeader language={language} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {language === "ko" ? "로딩 중..." : "Loading..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <ShopHeader language={language} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {language === "ko" ? "이벤트를 찾을 수 없습니다" : "Event not found"}
            </p>
            <Button onClick={() => navigate("/events")} className="mt-4">
              {language === "ko" ? "목록으로" : "Back to List"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = allEvents.findIndex(p => p.id === id);
  const prevEvent = currentIndex > 0 ? allEvents[currentIndex - 1] : null;
  const nextEvent = currentIndex < allEvents.length - 1 ? allEvents[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ShopHeader language={language} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/events")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === "ko" ? "목록으로" : "Back to List"}
        </Button>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
          {/* Event Image */}
          <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <Gift className="h-24 w-24 text-white/80" />
            </div>
            {isNew(event.createdAt) && (
              <Badge 
                variant="destructive" 
                className="absolute top-6 right-6"
              >
                NEW
              </Badge>
            )}
            {!isOngoing(event) && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Badge variant="secondary" className="text-xl px-6 py-3">
                  {language === "ko" ? "종료된 이벤트" : "Event Ended"}
                </Badge>
              </div>
            )}
          </div>

          {/* Header */}
          <div className="p-8 border-b">
            <div className="flex items-center gap-2 mb-3">
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
            <h1 className="text-3xl mb-4">
              {event.title}
            </h1>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(event.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{event.views}</span>
              </div>
              <span>{event.authorName}</span>
            </div>
            {event.eventEndDate && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm">
                  <strong>{language === "ko" ? "이벤트 기간" : "Event Period"}:</strong>{" "}
                  {formatDate(event.createdAt)} ~ {formatDate(event.eventEndDate)}
                </p>
              </div>
            )}
          </div>

          {/* Content */}
          <div 
            className="p-8 prose prose-slate max-w-none dark:prose-invert
              [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:my-6
              [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:my-4
              [&_h3]:text-xl [&_h3]:font-bold [&_h3]:my-3
              [&_p]:my-3 [&_p]:leading-7
              [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6
              [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6
              [&_li]:my-1
              [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4
              [&_pre]:bg-gray-100 [&_pre]:p-4 [&_pre]:rounded [&_pre]:my-4 [&_pre]:overflow-x-auto
              [&_a]:text-blue-600 [&_a]:underline
              [&_hr]:my-8 [&_hr]:border-gray-300
              [&_img]:rounded-lg [&_img]:my-4"
            dangerouslySetInnerHTML={{ __html: event.content }}
          />

          {/* Participate Button */}
          {isOngoing(event) && (
            <div className="p-8 border-t bg-gray-50 dark:bg-gray-900/50">
              <Button 
                size="lg" 
                className="w-full"
                onClick={() => navigate("/")}
              >
                {language === "ko" ? "쇼핑하러 가기" : "Shop Now"}
              </Button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 space-y-2">
          {nextEvent && (
            <button
              onClick={() => navigate(`/events/${nextEvent.id}`)}
              className="w-full p-4 bg-white dark:bg-gray-800 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">
                    {language === "ko" ? "다음 이벤트" : "Next Event"}
                  </div>
                  <div className="truncate">{nextEvent.title}</div>
                </div>
                <ChevronUp className="h-5 w-5 text-muted-foreground ml-2 flex-shrink-0" />
              </div>
            </button>
          )}
          {prevEvent && (
            <button
              onClick={() => navigate(`/events/${prevEvent.id}`)}
              className="w-full p-4 bg-white dark:bg-gray-800 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">
                    {language === "ko" ? "이전 이벤트" : "Previous Event"}
                  </div>
                  <div className="truncate">{prevEvent.title}</div>
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground ml-2 flex-shrink-0" />
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
export default ShopEventDetail;
