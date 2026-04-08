import { toast } from "sonner";
import {
  getSections,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  type Section,
  type CreateSectionDto,
  type UpdateSectionDto,
} from "@/lib/api/section";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Package,
} from "lucide-react";

interface SectionManagementProps {
  isTourActive?: boolean;
}

export function SectionManagement({ isTourActive = false }: SectionManagementProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateSectionDto>({
    code: "",
    name: "",
    displayOrder: 1,
    description: "",
    active: true,
  });

  useEffect(() => {
    loadSections();
  }, []);

  // 부모(상품관리) 투어에서 모달 열기/닫기 이벤트 수신
  useEffect(() => {
    const openHandler = () => {
      setFormData({ code: "", name: "", displayOrder: sections.length + 1, description: "", active: true });
      setIsCreateDialogOpen(true);
    };
    const closeHandler = () => setIsCreateDialogOpen(false);
    window.addEventListener("openSectionDialog", openHandler);
    window.addEventListener("closeSectionDialog", closeHandler);
    return () => {
      window.removeEventListener("openSectionDialog", openHandler);
      window.removeEventListener("closeSectionDialog", closeHandler);
    };
  }, [sections.length]);

  const loadSections = async () => {
    const response = await getSections();
    if (response.success && response.data) {
      setSections(response.data);
    } else {
      toast.error(response.message);
    }
  };

  const handleCreate = async () => {
    // 유효성 검사
    if (!formData.code.trim()) {
      toast.error("섹션 코드를 입력해주세요.");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("섹션 이름을 입력해주세요.");
      return;
    }

    const response = await createSection(formData);
    if (response.success) {
      toast.success(response.message);
      setIsCreateDialogOpen(false);
      resetForm();
      loadSections();
    } else {
      toast.error(response.message);
    }
  };

  const handleEdit = async () => {
    if (!selectedSection) return;

    const dto: UpdateSectionDto = {
      code: formData.code,
      name: formData.name,
      displayOrder: formData.displayOrder,
      description: formData.description,
      active: formData.active,
    };

    const response = await updateSection(selectedSection.id, dto);
    if (response.success) {
      toast.success(response.message);
      setIsEditDialogOpen(false);
      setSelectedSection(null);
      resetForm();
      loadSections();
    } else {
      toast.error(response.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedSection) return;

    const response = await deleteSection(selectedSection.id);
    if (response.success) {
      toast.success(response.message);
      setIsDeleteDialogOpen(false);
      setSelectedSection(null);
      loadSections();
    } else {
      toast.error(response.message);
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      displayOrder: sections.length + 1,
      description: "",
      active: true,
    });
  };

  const openEditDialog = (section: Section) => {
    setSelectedSection(section);
    setFormData({
      code: section.code,
      name: section.name,
      displayOrder: section.displayOrder,
      description: section.description,
      active: section.active,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (section: Section) => {
    setSelectedSection(section);
    setIsDeleteDialogOpen(true);
  };

  const toggleActive = async (section: Section) => {
    const dto: UpdateSectionDto = {
      active: !section.active,
    };
    const response = await updateSection(section.id, dto);
    if (response.success) {
      toast.success("활성화 상태가 변경되었습니다.");
      loadSections();
    } else {
      toast.error(response.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">섹션 관리</h2>
          <p className="text-sm text-muted-foreground mt-1">
            상품 섹션을 관리합니다
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }} data-tour="sec-add-btn">
            <Plus className="h-4 w-4 mr-2" />
            섹션 추가
          </Button>
        </div>
      </div>

      {/* Section List */}
      <div className="bg-card rounded-lg border" data-tour="sec-table">
        <div className="divide-y">
          {sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
              <p className="text-muted-foreground">등록된 섹션이 없습니다.</p>
            </div>
          ) : (
            sections.map((section) => (
              <div
                key={section.id}
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{section.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {section.code}
                      </Badge>
                      {!section.active && (
                        <Badge variant="destructive" className="text-xs">
                          비활성
                        </Badge>
                      )}
                    </div>
                    {section.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {section.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      표시 순서: {section.displayOrder}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={section.active}
                    onCheckedChange={() => toggleActive(section)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(section)}>
                        <Edit className="h-4 w-4 mr-2" />
                        수정
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(section)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} modal={!isTourActive} onOpenChange={(open) => { if (isTourActive && !open) return; setIsCreateDialogOpen(open); }}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => { if (isTourActive) e.preventDefault(); }} onEscapeKeyDown={(e) => { if (isTourActive) e.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle>섹션 추가</DialogTitle>
            <DialogDescription>
              새로운 섹션을 추가합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4" data-tour="sec-dialog-form">
            <div className="space-y-2">
              <Label htmlFor="code">섹션 코드 *</Label>
              <Input
                id="code"
                placeholder="예: RECOMMEND"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">섹션 이름 *</Label>
              <Input
                id="name"
                placeholder="예: 추천"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayOrder">표시 순서</Label>
              <Input
                id="displayOrder"
                type="number"
                min="1"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                placeholder="섹션 설명을 입력하세요"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">활성화 상태</Label>
              <div className="border rounded-md p-3 bg-muted/30 flex items-center gap-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active" className="cursor-pointer">
                  {formData.active ? "활성" : "비활성"}
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreate}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>섹션 수정</DialogTitle>
            <DialogDescription>
              섹션 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-code">섹션 코드 *</Label>
              <Input
                id="edit-code"
                placeholder="예: RECOMMEND"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">섹션 이름 *</Label>
              <Input
                id="edit-name"
                placeholder="예: 추천"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-displayOrder">표시 순서</Label>
              <Input
                id="edit-displayOrder"
                type="number"
                min="1"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">설명</Label>
              <Textarea
                id="edit-description"
                placeholder="섹션 설명을 입력하세요"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">활성화 상태</Label>
              <div className="border rounded-md p-3 bg-muted/30 flex items-center gap-2">
                <Switch
                  id="edit-active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="edit-active" className="cursor-pointer">
                  {formData.active ? "활성" : "비활성"}
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleEdit}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>섹션 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{selectedSection?.name}</strong> 섹션을 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}