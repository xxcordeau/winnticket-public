import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { FaqPost } from "@/data/dto/community.dto";
import { toast } from "sonner";
import { Search, Plus, X, Settings, Pencil } from "lucide-react";
import { ResponsiveCommunityTable } from "@/components/ui/responsive-community-table";
import { TablePagination } from "@/components/common/table-pagination";
import { getFAQs, createFAQ, updateFAQ, deleteFAQ, getFAQById, updateFAQActive, incrementFaqViewCount } from "@/lib/api/faq";
import { getFaqCategories, createFaqCategory, updateFaqCategory, deleteFaqCategory, type FaqCategoryItem } from "@/lib/api/faq-category";

interface FaqManagementProps {
  language: "ko" | "en";
}

export function FaqManagement({ language }: FaqManagementProps) {
  const [faqs, setFaqs] = useState<FaqPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all"); // 카테고리 필터 추가
  
  // Dialog 상태
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCategoryManageDialogOpen, setIsCategoryManageDialogOpen] = useState(false);
  const [isCategoryAddDialogOpen, setIsCategoryAddDialogOpen] = useState(false);
  const [isCategoryEditDialogOpen, setIsCategoryEditDialogOpen] = useState(false);
  const [isCategoryDeleteDialogOpen, setIsCategoryDeleteDialogOpen] = useState(false);
  
  const [selectedFaq, setSelectedFaq] = useState<FaqPost | null>(null);
  const [faqToDelete, setFaqToDelete] = useState<FaqPost | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ORDER");
  
  // 카테고리 관련 상태
  const [categories, setCategories] = useState<FaqCategoryItem[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<FaqCategoryItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<FaqCategoryItem | null>(null);
  
  const itemsPerPage = 20;

  useEffect(() => {
    loadFaqs();
    loadCategories();
  }, [searchQuery, startDate, endDate]);

  const loadFaqs = async () => {
    // API 파라미터 구성
    const params: { title?: string; begDate?: string; endDate?: string } = {};
    
    if (searchQuery.trim()) {
      params.title = searchQuery.trim();
    }
    
    if (startDate) {
      // YYYY-MM-DD 형식으로 변환
      params.begDate = startDate.toISOString().split('T')[0];
    }
    
    if (endDate) {
      // YYYY-MM-DD 형식으로 변환
      params.endDate = endDate.toISOString().split('T')[0];
    }
    
    const response = await getFAQs(Object.keys(params).length > 0 ? params : undefined);
    if (response.success && response.data) {
      setFaqs(response.data);
    } else {
      setFaqs([]);
    }
  };

  const loadCategories = async () => {
    const response = await getFaqCategories();
    if (response.success && response.data) {
      setCategories(response.data);
    }
  };

  const handleView = async (faq: FaqPost) => {
    setIsDetailDialogOpen(true);
    setSelectedFaq(faq); // 일단 기존 데이터 표시

    // 조회수 증가
    await incrementFaqViewCount(faq.id);

    // API로 상세 정보 조회하여 최신 데이터로 업데이트
    try {
      const response = await getFAQById(faq.id);
      if (response.success && response.data) {
        setSelectedFaq(response.data);
      }
    } catch (error) {
      // 에러 발생해도 기존 데이터는 표시
      console.error('FAQ 상세 조회 실패:', error);
    }
  };

  const handleCreate = () => {
    setQuestion("");
    setAnswer("");
    setSelectedCategory(categories.length > 0 ? categories[0].id : "ORDER");
    setIsCreateDialogOpen(true);
  };

  const handleEdit = async (faq: FaqPost) => {
    // API로 최신 데이터 가져오기
    try {
      const response = await getFAQById(faq.id);
      if (response.success && response.data) {
        const latestFaq = response.data;
        setSelectedFaq(latestFaq);
        setQuestion(latestFaq.question || latestFaq.title);
        setAnswer(latestFaq.answer || latestFaq.content);
        setSelectedCategory(latestFaq.category || "ORDER");
      } else {
        // API 실패 시 기존 데이터 사용
        setSelectedFaq(faq);
        setQuestion(faq.question || faq.title);
        setAnswer(faq.answer || faq.content);
        setSelectedCategory(faq.category || "ORDER");
      }
    } catch (error) {
      // 에러 발생 시 기존 데이터 사용
      console.error('FAQ 조회 실패:', error);
      setSelectedFaq(faq);
      setQuestion(faq.question || faq.title);
      setAnswer(faq.answer || faq.content);
      setSelectedCategory(faq.category || "ORDER");
    }
    setIsEditDialogOpen(true);
  };

  const handleDelete = (faq: FaqPost) => {
    setFaqToDelete(faq);
    setIsDeleteDialogOpen(true);
  };

  const confirmCreate = async () => {
    if (!question.trim() || !answer.trim()) {
      toast.error("질문과 답변을 입력해주세요");
      return;
    }

    const newFaq: Partial<FaqPost> = {
      id: `faq-${Date.now()}`,
      type: "FAQ",
      title: question,        // question을 title로
      content: answer,        // answer를 content로
      question,
      answer,
      category: selectedCategory,
      views: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      authorId: "admin",
      authorName: "관리자",
    };

    const response = await createFAQ(newFaq);
    if (response.success) {
      await loadFaqs();  // await 추가로 확실히 로드
      toast.success("FAQ가 등록되었습니다");
      setIsCreateDialogOpen(false);
      setQuestion("");
      setAnswer("");
    } else {
      toast.error(response.message || "FAQ 등록에 실패했습니다");
    }
  };

  const confirmEdit = async () => {
    if (!selectedFaq || !question.trim() || !answer.trim()) {
      toast.error("질문과 답변을 입력해주세요");
      return;
    }

    const updatedFaq = {
      ...selectedFaq,
      title: question,        // question을 title로
      content: answer,        // answer를 content로
      question,
      answer,
      category: selectedCategory,
      updatedAt: new Date().toISOString(),
    };

    const response = await updateFAQ(updatedFaq);
    if (response.success) {
      await loadFaqs();  // await 추가로 확실히 로드
      toast.success("FAQ가 수정되었습니다");
      setIsEditDialogOpen(false);
      setIsDetailDialogOpen(false);
      setQuestion("");
      setAnswer("");
      setSelectedFaq(null);
    } else {
      toast.error(response.message || "FAQ 수정에 실패했습니다");
    }
  };

  const confirmDelete = async () => {
    if (!faqToDelete) return;

    const response = await deleteFAQ(faqToDelete.id);
    if (response.success) {
      await loadFaqs();  // await 추가로 확실히 로드
      toast.success("FAQ가 삭제되었습니다");
      setIsDeleteDialogOpen(false);
      setIsDetailDialogOpen(false);
      setFaqToDelete(null);
    } else {
      toast.error(response.message || "FAQ 삭제에 실패했습니다");
    }
  };

  const handleToggleActive = async (faq: FaqPost) => {
    const newActiveState = !faq.isActive;
    const response = await updateFAQActive(faq.id, newActiveState);
    
    if (response.success) {
      await loadFaqs();  // await 추가로 확실히 로드
      toast.success(newActiveState ? "활성화되었습니다" : "비활성화되었습니다");
    } else {
      toast.error(response.message || "상태 변경에 실패했습니다");
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentPage(1);
    setSelectedCategoryFilter("all");
  };

  const getFilteredFaqs = () => {
    let filtered = [...faqs];

    // 검색어 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (faq) =>
          (faq.question || faq.title).toLowerCase().includes(query) ||
          (faq.answer || faq.content).toLowerCase().includes(query)
      );
    }

    // 날짜 필터
    if (startDate) {
      filtered = filtered.filter((faq) => {
        const faqDate = new Date(faq.createdAt);
        return faqDate >= startDate;
      });
    }

    if (endDate) {
      filtered = filtered.filter((faq) => {
        const faqDate = new Date(faq.createdAt);
        return faqDate <= endDate;
      });
    }

    // 카테고리 필터
    if (selectedCategoryFilter !== "all") {
      filtered = filtered.filter((faq) => faq.category === selectedCategoryFilter);
    }

    return filtered;
  };

  const filteredFaqs = getFilteredFaqs();
  const totalPages = Math.ceil(filteredFaqs.length / itemsPerPage);
  const paginatedFaqs = filteredFaqs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      {/* 카테고리 필터 버튼 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedCategoryFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setSelectedCategoryFilter("all");
            setCurrentPage(1);
          }}
          className="whitespace-nowrap"
        >
          전체 ({faqs.length})
        </Button>
        {categories.map((category) => {
          const count = faqs.filter(faq => faq.category === category.id).length;
          return (
            <Button
              key={category.id}
              variant={selectedCategoryFilter === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedCategoryFilter(category.id);
                setCurrentPage(1);
              }}
              className="whitespace-nowrap"
            >
              {category.name} ({count})
            </Button>
          );
        })}
      </div>

      {/* 검색 및 액션 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full flex-wrap">
        {/* 검색 */}
        <div className="bg-background box-border content-stretch flex gap-[8px] h-[36px] items-center px-[16px] py-[8px] relative rounded-[6px] w-full sm:w-[300px] focus-within:shadow-[0_0_0_1px_#0c8ce9] transition-shadow">
          <div
            aria-hidden="true"
            className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[6px]"
          />
          <Search className="h-[18px] w-[18px] text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="질문 또는 답변 검색..."
            className="text-[12px] text-muted-foreground placeholder:text-muted-foreground bg-transparent border-none outline-none flex-1"
          />
        </div>

        {/* 날짜 범위 선택기 */}
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          startPlaceholder="시작일"
          endPlaceholder="종료일"
          className="w-full sm:w-auto"
        />

        {/* 액션 버튼 */}
        <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
          {(searchQuery || startDate || endDate || selectedCategoryFilter !== "all") && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="gap-2">
              <X className="h-4 w-4" />
              필터 초기화
            </Button>
          )}
          <Button onClick={handleCreate} className="ml-auto sm:ml-0">
            <Plus className="h-4 w-4 mr-2" />
            작성
          </Button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-card sm:rounded-[8px] border-0 sm:border">
        <ResponsiveCommunityTable
          posts={paginatedFaqs}
          activeTab="faq"
          language={language}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          categories={categories}
          pagination={
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredFaqs.length}
              itemsPerPage={itemsPerPage}
            />
          }
        />
      </div>

      {/* FAQ 상세 Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>FAQ 상세</DialogTitle>
            <DialogDescription>FAQ 상세 정보를 확인하세요</DialogDescription>
          </DialogHeader>
          {!selectedFaq ? (
            <div className="py-12 text-center text-muted-foreground">
              로딩 중...
            </div>
          ) : (
            <div className="space-y-4">
              {/* 제목 영역 */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg">{selectedFaq.question || selectedFaq.title}</h3>
                </div>
              </div>

              {/* 메타 정보 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y">
                <div>
                  <Label className="text-xs text-muted-foreground">카테고리</Label>
                  <p className="text-sm mt-1">
                    {selectedFaq.category 
                      ? categories.find(cat => cat.id === selectedFaq.category)?.name || '카테고리 없음'
                      : '카테고리 없음'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">조회수</Label>
                  <p className="text-sm mt-1">{selectedFaq.views}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">작성일</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedFaq.createdAt).toLocaleString('ko-KR')}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">작성자</Label>
                  <p className="text-sm mt-1">{selectedFaq.authorName || '관리자'}</p>
                </div>
              </div>

              {/* 답변 내용 */}
              <div>
                <Label>답변</Label>
                <p className="mt-2 text-sm whitespace-pre-wrap p-4 bg-muted rounded-md">
                  {selectedFaq.answer || selectedFaq.content}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              닫기
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedFaq) {
                  setFaqToDelete(selectedFaq);
                  setIsDeleteDialogOpen(true);
                }
              }}
              disabled={!selectedFaq}
            >
              삭제
            </Button>
            <Button
              onClick={() => {
                if (selectedFaq) {
                  handleEdit(selectedFaq);
                }
              }}
              disabled={!selectedFaq}
            >
              수정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAQ 생성 Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>FAQ 등록</DialogTitle>
            <DialogDescription>새로운 FAQ를 등록합니다</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>질문</Label>
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="질문을 입력하세요"
                className="mt-2"
              />
            </div>
            <div>
              <Label>답변</Label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="답변을 입력하세요"
                className="mt-2 min-h-[200px]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>카테고리</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCategoryManageDialogOpen(true)}
                  className="h-auto p-1"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    type="button"
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="rounded-full"
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={confirmCreate}>등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAQ 수정 Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>FAQ 수정</DialogTitle>
            <DialogDescription>FAQ 내용을 수정합니다</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>질문</Label>
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="질문을 입력하세요"
                className="mt-2"
              />
            </div>
            <div>
              <Label>답변</Label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="답변을 입력하세요"
                className="mt-2 min-h-[200px]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>카테고리</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCategoryManageDialogOpen(true)}
                  className="h-auto p-1"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    type="button"
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="rounded-full"
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={confirmEdit}>수정</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>FAQ 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 FAQ를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 카테고리 관리 Dialog */}
      <Dialog open={isCategoryManageDialogOpen} onOpenChange={setIsCategoryManageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>카테고리 관리</DialogTitle>
            <DialogDescription>FAQ 카테고리를 관리합니다</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {categories.map((category) => {
              return (
                <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <span>{category.name}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingCategory(category);
                        setNewCategoryName(category.name);
                        setIsCategoryManageDialogOpen(false);
                        setIsCategoryEditDialogOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCategoryToDelete(category);
                        setIsCategoryDeleteDialogOpen(true);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryManageDialogOpen(false)}>
              닫기
            </Button>
            <Button onClick={() => {
              setIsCategoryManageDialogOpen(false);
              setIsCategoryAddDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              카테고리 추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 카테고리 추가 Dialog */}
      <Dialog open={isCategoryAddDialogOpen} onOpenChange={setIsCategoryAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>카테고리 추가</DialogTitle>
            <DialogDescription>새로운 FAQ 카테고리를 추가합니다</DialogDescription>
          </DialogHeader>
          <div>
            <Label>카테고리 이름</Label>
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="예: 결제"
              className="mt-2"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setIsCategoryAddDialogOpen(false);
              setIsCategoryManageDialogOpen(true);
              setNewCategoryName("");
            }}>
              취소
            </Button>
            <Button onClick={async () => {
              if (!newCategoryName.trim()) {
                toast.error("카테고리 이름을 입력해주세요");
                return;
              }

              const response = await createFaqCategory({
                name: newCategoryName.trim(),
              });

              if (response.success) {
                await loadCategories();
                toast.success("카테고리가 추가되었습니다");
                setIsCategoryAddDialogOpen(false);
                setIsCategoryManageDialogOpen(false); // 모든 모달 닫기
                setNewCategoryName("");
              } else {
                toast.error(response.message || "카테고리 추가에 실패했습니다");
              }
            }}>
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 카테고리 수정 Dialog */}
      <Dialog open={isCategoryEditDialogOpen} onOpenChange={setIsCategoryEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>카테고리 수정</DialogTitle>
            <DialogDescription>FAQ 카테고리 이름을 수정합니다</DialogDescription>
          </DialogHeader>
          <div>
            <Label>카테고리 이름</Label>
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="예: 결제"
              className="mt-2"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setIsCategoryEditDialogOpen(false);
              setIsCategoryManageDialogOpen(true);
              setNewCategoryName("");
              setEditingCategory(null);
            }}>
              취소
            </Button>
            <Button onClick={async () => {
              if (!editingCategory) return;
              if (!newCategoryName.trim()) {
                toast.error("카테고리 이름을 입력해주세요");
                return;
              }

              const response = await updateFaqCategory(editingCategory.id, {
                name: newCategoryName.trim(),
              });

              if (response.success) {
                await loadCategories();
                toast.success("카테고리가 수정되었습니다");
                setIsCategoryEditDialogOpen(false);
                setIsCategoryManageDialogOpen(false); // 모든 모달 닫기
                setNewCategoryName("");
                setEditingCategory(null);
              } else {
                toast.error(response.message || "카테고리 수정에 실패했습니다");
              }
            }}>
              수정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 카테고리 삭제 확인 Dialog */}
      <AlertDialog open={isCategoryDeleteDialogOpen} onOpenChange={setIsCategoryDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>카테고리 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>이 카테고리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
                <p className="text-sm text-muted-foreground">
                  ℹ️ 이미 해당 카테고리가 적용된 FAQ는 '전체' 보기에서 확인할 수 있습니다. 필요한 경우 FAQ를 수정하여 다른 카테고리로 재등록해 주세요.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (!categoryToDelete) return;

              const response = await deleteFaqCategory(categoryToDelete.id);
              if (response.success) {
                await loadCategories();
                toast.success("카테고리가 삭제되었습니다");
                setIsCategoryDeleteDialogOpen(false);
                setCategoryToDelete(null);
              } else {
                toast.error(response.message || "카테고리 삭제에 실패했습니다");
              }
            }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}