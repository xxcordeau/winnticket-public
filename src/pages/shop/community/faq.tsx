import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/channel-context";
import { ShopHeader } from "@/components/shop-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Search } from "lucide-react";
import { getFAQs, getFAQById } from "@/lib/api/faq";
import { getFaqCategories, type FaqCategoryItem } from "@/lib/api/faq-category";
import type { FaqPost } from "@/data/dto/community.dto";

type Language = "ko" | "en";

interface ShopFAQProps {
  language: Language;
}

export function ShopFAQ({ language }: ShopFAQProps) {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState<FaqPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<FaqCategoryItem[]>([]);
  const [expandedFaqId, setExpandedFaqId] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const response = await getFAQs();
      if (response.success && response.data) {
        // isActive true 
        const activeFAQs = response.data.filter(faq => faq.isActive !== false);
        setFaqs(activeFAQs);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      const response = await getFaqCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    };
    loadCategories();
  }, []);

  // FAQ 
  const handleAccordionChange = async (value: string) => {
    setExpandedFaqId(value);
    
    // API 
    if (value) {
      const currentFaq = faqs.find(f => f.id === value);
      if (currentFaq) {
        try {
          const response = await getFAQById(value);
          if (response.success && response.data) {
            // FAQ 
            setFaqs(prevFaqs => 
              prevFaqs.map(f => 
                f.id === value ? response.data : f
              )
            );
          }
        } catch (error) {
        }
      }
    }
  };

  // FAQ
  const filteredFAQs = faqs.filter((faq) => {
    // '' : ( + )
    // : 
    const matchesCategory = 
      selectedCategory === "ALL" || 
      faq.category === selectedCategory;
    
    const question = faq.question || faq.title;
    const answer = faq.answer || faq.content;
    const matchesSearch =
      searchQuery === "" ||
      question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl mb-2">
                {language === "ko" ? "자주 묻는 질문" : "FAQ"}
              </h1>
              <p className="text-muted-foreground">
                {language === "ko" 
                  ? "궁금하신 내용을 빠르게 찾아보세요" 
                  : "Find answers to frequently asked questions"}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={language === "ko" ? "질문 검색..." : "Search questions..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("ALL")}
            className="whitespace-nowrap"
          >
            {language === "ko" ? "전체" : "All"}
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap"
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              {language === "ko" 
                ? "로딩 중..." 
                : "Loading..."}
            </div>
          ) : filteredFAQs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {language === "ko" 
                ? "검색 결과가 없습니다" 
                : "No results found"}
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-2" onValueChange={handleAccordionChange}>
              {filteredFAQs.map((faq, index) => (
                <AccordionItem 
                  key={faq.id} 
                  value={faq.id}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-start gap-3 text-left">
                      <Badge variant="outline" className="mt-1 flex-shrink-0">
                        Q{index + 1}
                      </Badge>
                      <span>{faq.question || faq.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-12 pt-2">
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert
                        [&_p]:my-2 [&_p]:leading-6
                        [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6
                        [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6
                        [&_li]:my-1"
                      dangerouslySetInnerHTML={{ __html: faq.answer || faq.content }}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {/* Contact */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg mb-2">
            {language === "ko" ? "찾으시는 답변이 없으신가요?" : "Can't find what you're looking for?"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {language === "ko" 
              ? "1:1 문의하기를 통해 문의해주시면 빠르게 답변드리겠습니다." 
              : "Contact us directly and we'll get back to you as soon as possible."}
          </p>
          <Button onClick={() => navigate("/inquiries")}>
            {language === "ko" ? "1:1 문의하기" : "Contact Us"}
          </Button>
        </div>
      </div>
    </div>
  );
}
export default ShopFAQ;
