import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NoticePost } from "@/data/dto/community.dto";
import { authStore } from "@/data/auth";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Save, 
  X, 
  Bold, 
  Italic, 
  List, 
  ListOrdered,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Quote,
  Code,
  Minus
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { getNoticeById, createNotice, updateNotice } from "@/lib/api/notice";

type Language = "ko" | "en";

interface NoticeEditorProps {
  language: Language;
}

export function NoticeEditor({ language }: NoticeEditorProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = id && id !== "new";
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      getNoticeById(id).then(response => {
        if (response.success && response.data) {
          setTitle(response.data.title);
          setContent(response.data.content);
          if (editorRef.current) {
            editorRef.current.innerHTML = response.data.content;
          }
        }
      });
    }
  }, [id, isEditMode]);

  const handleSave = async () => {
    const currentContent = editorRef.current?.innerHTML || "";
    
    if (!title.trim() || !currentContent.trim()) {
      toast.error(language === "ko" ? "제목과 내용을 입력해주세요" : "Please enter title and content");
      return;
    }

    setLoading(true);
    const currentUser = authStore.getCurrentUser();

    if (isEditMode) {
      // 
      const updatedPost: NoticePost = {
        id: id,
        type: "NOTICE",
        title,
        content: currentContent,
        authorId: currentUser?.id || "unknown",
        authorName: currentUser?.name || "Unknown",
        createdAt: new Date().toISOString(),
        views: 0,
        isActive: true,
      };
      const response = await updateNotice(updatedPost);
      if (response.success) {
        toast.success(language === "ko" ? "공지사항이 수정되었습니다" : "Notice updated successfully");
        navigate("/admin/community");
      } else {
        toast.error(language === "ko" ? "공지사항 수정에 실패했습니다" : "Failed to update notice");
      }
      setLoading(false);
    } else {
      // 
      const newPost: NoticePost = {
        id: `post-${Date.now()}`,
        type: "NOTICE",
        title,
        content: currentContent,
        authorId: currentUser?.id || "unknown",
        authorName: currentUser?.name || "Unknown",
        createdAt: new Date().toISOString(),
        views: 0,
        isActive: true,
      };
      const response = await createNotice(newPost);
      if (response.success) {
        toast.success(language === "ko" ? "공지사항이 등록되었습니다" : "Notice created successfully");
        navigate("/admin/community");
      } else {
        toast.error(language === "ko" ? "공지사항 등록에 실패했습니다" : "Failed to create notice");
      }
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/community");
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  // 
  const savedRangeRef = useRef<Range | null>(null);

  const handleImageButtonClick = () => {
    // 
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
    fileInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error(language === "ko" ? "이미지 크기는 5MB 이하여야 합니다." : "Image size must be under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;

      const img = document.createElement('img');
      img.src = imageUrl;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.borderRadius = '8px';
      img.style.margin = '16px 0';
      img.style.display = 'block';

      // 
      const savedRange = savedRangeRef.current;
      if (savedRange && editorRef.current?.contains(savedRange.startContainer)) {
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(savedRange);

        savedRange.deleteContents();
        savedRange.insertNode(img);

        // 
        const br = document.createElement('br');
        if (img.nextSibling) {
          img.parentNode?.insertBefore(br, img.nextSibling);
        } else {
          img.parentNode?.appendChild(br);
        }

        // 
        const newRange = document.createRange();
        newRange.setStartAfter(br);
        newRange.setEndAfter(br);
        selection?.removeAllRanges();
        selection?.addRange(newRange);
      } else {
        // 
        editorRef.current?.appendChild(img);
        const br = document.createElement('br');
        editorRef.current?.appendChild(br);
      }

      savedRangeRef.current = null;
      editorRef.current?.focus();
    };
    reader.readAsDataURL(file);

    // input 
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const insertHeading = (level: number) => {
    execCommand('formatBlock', `<h${level}>`);
  };

  const insertLink = () => {
    const url = prompt(language === "ko" ? '링크 URL을 입력하세요:' : 'Enter link URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertHorizontalLine = () => {
    execCommand('insertHorizontalRule');
  };

  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative w-full h-full overflow-auto">
      {/* 뒤로가기 버튼 */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === "ko" ? "커뮤니티 관리" : "Community Management"}
        </Button>
      </div>

      <PageHeader
        title={isEditMode 
          ? (language === "ko" ? "공지사항 수정" : "Edit Notice")
          : (language === "ko" ? "공지사항 작성" : "Write Notice")
        }
        subtitle={language === "ko" 
          ? "공지사항 내용을 입력하세요" 
          : "Enter notice content"
        }
        language={language}
      />

      {/* Form Container */}
      <div className="bg-card relative rounded-[8px] flex-1 flex flex-col w-full">
        <div aria-hidden="true" className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[8px]" />
        
        <div className="box-border content-stretch flex flex-col gap-[24px] items-start p-[24px] flex-1 overflow-auto">
          {/* 제목 */}
          <div className="w-full space-y-2">
            <Label className="text-[13px]">
              {language === "ko" ? "제목" : "Title"}
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={language === "ko" ? "제목을 입력하세요" : "Enter title"}
              className="h-[40px]"
            />
          </div>

          {/* 에디터 영역 */}
          <div className="w-full space-y-2 flex-1 flex flex-col">
            <Label className="text-[13px]">
              {language === "ko" ? "내용" : "Content"}
            </Label>
            
            {/* 툴바 */}
            <div className="overflow-x-auto border rounded-t-lg bg-muted/30">
              <div className="flex items-center gap-0.5 p-1.5 min-w-max">
                <Button variant="ghost" size="sm" onClick={() => execCommand('undo')} title={language === "ko" ? "실행 취소" : "Undo"} className="h-7 w-7 p-0 flex-shrink-0">
                  <Undo className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => execCommand('redo')} title={language === "ko" ? "다시 실행" : "Redo"} className="h-7 w-7 p-0 flex-shrink-0">
                  <Redo className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-5 mx-1" />

                <Button variant="ghost" size="sm" onClick={() => insertHeading(1)} title={language === "ko" ? "제목 1" : "Heading 1"} className="h-7 w-7 p-0 flex-shrink-0">
                  <Heading1 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => insertHeading(2)} title={language === "ko" ? "제목 2" : "Heading 2"} className="h-7 w-7 p-0 flex-shrink-0">
                  <Heading2 className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-5 mx-1" />

                <Button variant="ghost" size="sm" onClick={() => execCommand('bold')} title={language === "ko" ? "굵게" : "Bold"} className="h-7 w-7 p-0 flex-shrink-0">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => execCommand('italic')} title={language === "ko" ? "기울임" : "Italic"} className="h-7 w-7 p-0 flex-shrink-0">
                  <Italic className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-5 mx-1" />

                <Button variant="ghost" size="sm" onClick={() => execCommand('justifyLeft')} title={language === "ko" ? "왼쪽 정렬" : "Align Left"} className="h-7 w-7 p-0 flex-shrink-0">
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => execCommand('justifyCenter')} title={language === "ko" ? "가운데 정렬" : "Align Center"} className="h-7 w-7 p-0 flex-shrink-0">
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => execCommand('justifyRight')} title={language === "ko" ? "오른쪽 정렬" : "Align Right"} className="h-7 w-7 p-0 flex-shrink-0">
                  <AlignRight className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-5 mx-1" />

                <Button variant="ghost" size="sm" onClick={() => execCommand('insertUnorderedList')} title={language === "ko" ? "글머리 기호" : "Bullet List"} className="h-7 w-7 p-0 flex-shrink-0">
                  <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => execCommand('insertOrderedList')} title={language === "ko" ? "번호 매기기" : "Numbered List"} className="h-7 w-7 p-0 flex-shrink-0">
                  <ListOrdered className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-5 mx-1" />

                <Button variant="ghost" size="sm" onClick={() => execCommand('formatBlock', '<blockquote>')} title={language === "ko" ? "인용" : "Quote"} className="h-7 w-7 p-0 flex-shrink-0">
                  <Quote className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => execCommand('formatBlock', '<pre>')} title={language === "ko" ? "코드" : "Code"} className="h-7 w-7 p-0 flex-shrink-0">
                  <Code className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-5 mx-1" />

                <Button variant="ghost" size="sm" onClick={insertLink} title={language === "ko" ? "링크 삽입" : "Insert Link"} className="h-7 w-7 p-0 flex-shrink-0">
                  <LinkIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={insertHorizontalLine} title={language === "ko" ? "구분선" : "Horizontal Line"} className="h-7 w-7 p-0 flex-shrink-0">
                  <Minus className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-5 mx-1" />

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <Button variant="ghost" size="sm" onClick={handleImageButtonClick} title={language === "ko" ? "이미지 삽입" : "Insert Image"} className="h-7 px-2 flex-shrink-0 gap-1">
                  <ImageIcon className="h-4 w-4" />
                  <span className="text-xs">{language === "ko" ? "이미지" : "Image"}</span>
                </Button>
              </div>
            </div>

            {/* 에디터 */}
            <div
              ref={editorRef}
              contentEditable
              onInput={handleContentChange}
              className="flex-1 min-h-[400px] p-4 sm:p-8 border border-t-0 rounded-b-lg outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 overflow-auto
                prose prose-slate max-w-none
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
              data-placeholder={language === "ko" 
                ? "여기를 클릭하여 내용을 작성하세요...\n\n블로그처럼 자유롭게 텍스트를 입력하고, 위 툴바의 '이미지' 버튼을 클릭하여 원하는 위치에 이미지를 삽입할 수 있습니다."
                : "Click here to write content...\n\nType freely like a blog, and click the 'Image' button in the toolbar above to insert images at the desired location."
              }
              suppressContentEditableWarning
            />
            
            <p className="text-[12px] text-muted-foreground">
              {language === "ko" 
                ? "* 텍스트를 선택하고 툴바 버튼을 클릭하여 서식을 적용하세요" 
                : "* Select text and click toolbar buttons to apply formatting"}
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 w-full pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              {language === "ko" ? "취소" : "Cancel"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {loading 
                ? (language === "ko" ? "저장 중..." : "Saving...") 
                : (language === "ko" ? "저장" : "Save")
              }
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          white-space: pre-wrap;
        }
        
        [contenteditable]:focus:before {
          content: '';
        }
      `}</style>
    </div>
  );
}
export default NoticeEditor;
