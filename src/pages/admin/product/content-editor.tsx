import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Save, 
  Heading1, 
  Heading2, 
  Heading3,
  Quote,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import {
  getAdminProductDetail,
  updateProductContent,
  updateProductDetailContent
} from "@/lib/api/product";
import type { Product, ProductDetailContentRequest } from "@/data/products";
import { getProduct, updateProduct } from "@/data/products";
import { uploadFile } from "@/lib/api/file";
import { getImageUrl } from "@/lib/utils/image";

export function ProductContentEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [markdown, setMarkdown] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) {
      toast.error("상품 ID가 없습니다.");
      navigate("/admin/products");
      return;
    }

    // 
    const loadProductDetail = async () => {
      setLoading(true);
      try {
        const response = await getAdminProductDetail(id);

        if (response.success && response.data) {
          const detail = response.data;

          // Product DTO 
          const productData: Product = {
            id: detail.id,
            code: detail.code,
            name: detail.name,
            categoryId: detail.categoryId,
            categoryName: detail.categoryName,
            partnerId: detail.partnerId || undefined,
            partnerName: detail.partnerName || undefined,
            productType: detail.productType,
            price: detail.price,
            discountPrice: detail.discountPrice,
            salesStatus: detail.salesStatus as any,
            stock: detail.stock,
            description: detail.description,
            imageUrl: 
              // imageUrls ()
              (Array.isArray(detail.imageUrls) && typeof detail.imageUrls[0] === 'string') 
                ? detail.imageUrls[0]
                : // imageUrl 
                  (typeof detail.imageUrl === 'string' && detail.imageUrl.length > 0)
                  ? detail.imageUrl
                  : // imageUrl 
                    (Array.isArray(detail.imageUrl) && typeof detail.imageUrl[0] === 'string')
                    ? detail.imageUrl[0]
                    : undefined,
            imageUrls:
              // imageUrls 
              Array.isArray(detail.imageUrls) 
                ? detail.imageUrls.filter((url): url is string => typeof url === 'string')
                : // imageUrl 
                  Array.isArray(detail.imageUrl)
                  ? detail.imageUrl.filter((url): url is string => typeof url === 'string')
                  : // imageUrl 
                    (typeof detail.imageUrl === 'string' && detail.imageUrl.length > 0)
                    ? [detail.imageUrl]
                    : [],
            detailContent: (detail.detailContent && typeof detail.detailContent === 'string') ? detail.detailContent : "", // null 
            detailImages: detail.detailImagesList,
            shippingInfo: detail.shippingInfo,
            warrantyInfo: detail.warrantyInfo,
            returnInfo: detail.returnInfo,
            options: [],
            visible: detail.visible !== false,
            displayOrder: detail.displayOrder || 0,
            createdAt:
              detail.createdAt || new Date().toISOString(),
            updatedAt:
              detail.updatedAt || new Date().toISOString(),
          };

          setProduct(productData);

          // - 
          if (detail.detailContent && typeof detail.detailContent === 'string') {
            setMarkdown(detail.detailContent);
          } else {
            setMarkdown(""); // 
          }
        } else {
          // : 
          const localResponse = getProduct(id);
          if (localResponse.success && localResponse.data) {
            setProduct(localResponse.data);
            // detailContent 
            if (localResponse.data.detailContent && typeof localResponse.data.detailContent === 'string') {
              setMarkdown(localResponse.data.detailContent);
            } else {
              setMarkdown(""); // null 
            }
          } else {
            toast.error("상품 정보를 찾을 수 없습니다.");
            navigate("/admin/products");
            return;
          }
        }
      } catch (error) {
        toast.error("상품 정보를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    };

    loadProductDetail();
  }, [id, navigate]);

  // HTML ( )
  useEffect(() => {
    // 1: markdown 
    if (!markdown) {
      return;
    }
    
    if (typeof markdown !== 'string') {
      return;
    }
    
    // 2: editorRef 
    if (!editorRef.current) {
      return;
    }
    
    // 3: textContent 
    try {
      const textContent = editorRef.current.textContent;
      // null trim - 
      const currentContent = (textContent != null) ? String(textContent).trim() : "";
      
      
      // 4: 
      if (!currentContent && markdown.length > 0) {
        
        const htmlContent = renderMarkdown(markdown);
        if (editorRef.current && htmlContent && typeof htmlContent === 'string') {
          editorRef.current.innerHTML = htmlContent;
        }
      } else {
      }
    } catch (error) {
    }
  }, [markdown]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">로딩 중...</p>
      </div>
    );
  }

  if (!product) return null;

  const handleSave = async () => {
    if (!id) return;

    try {
      // URL 
      const imageUrlRegex = /!\[.*?\]\((https?:\/\/[^\)]+)\)/g;
      const imageUrls: string[] = [];
      let match;

      while ((match = imageUrlRegex.exec(markdown)) !== null) {
        imageUrls.push(match[1]);
      }

      // API 
      const detailContentRequest: ProductDetailContentRequest =
        {
          detailContent: markdown,
        };

      const response = await updateProductDetailContent(
        id,
        detailContentRequest,
      );

      if (response.success) {
        // 
        updateProduct({
          ...product,
          detailContent: markdown,
          detailImages: imageUrls,
        });

        toast.success("상품 상세 내용이 저장되었습니다.");
        navigate(`/admin/products/${id}`); // 
      } else {
        toast.error(
          response.message || "상세 내용 저장에 실패했습니다.",
        );
      }
    } catch (error) {
      toast.error("상세 내용 저장 중 오류가 발생했습니다.");
    }
  };

  // ( )
  const handleEditorInput = () => {
    if (!editorRef.current) return;

    // HTML 
    const html = editorRef.current.innerHTML;
    const md = htmlToMarkdown(html);
    setMarkdown(md);
  };

  // HTML 
  const htmlToMarkdown = (html: string): string => {
    // null, undefined, 
    if (!html || typeof html !== 'string') {
      return '';
    }
    
    // 
    let md: string = String(html);

    // H1-H3 
    md = String(md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n# $1\n"));
    md = String(md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n## $1\n"));
    md = String(md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n### $1\n"));

    // , 
    md = String(md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**"));
    md = String(md.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**"));
    md = String(md.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*"));
    md = String(md.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*"));

    // 
    md = String(md.replace(
      /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi,
      "[$2]($1)",
    ));

    // 
    md = String(md.replace(
      /<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi,
      "![$2]($1)",
    ));
    md = String(md.replace(
      /<img[^>]*src="([^"]*)"[^>]*\/?>/gi,
      "![이미지]($1)",
    ));

    // 
    md = String(md.replace(/<li[^>]*>(.*?)<\/li>/gi, "* $1\n"));
    md = String(md.replace(/<ul[^>]*>/gi, "\n"));
    md = String(md.replace(/<\/ul>/gi, "\n"));
    md = String(md.replace(/<ol[^>]*>/gi, "\n"));
    md = String(md.replace(/<\/ol>/gi, "\n"));

    // 
    md = String(md.replace(
      /<blockquote[^>]*>(.*?)<\/blockquote>/gi,
      "\n> $1\n",
    ));

    // 
    md = String(md.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`"));
    md = String(md.replace(
      /<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gi,
      "\n```\n$1\n```\n",
    ));

    // HTML 
    md = String(md.replace(/<div[^>]*>/gi, "\n"));
    md = String(md.replace(/<\/div>/gi, "\n"));
    md = String(md.replace(/<p[^>]*>/gi, ""));
    md = String(md.replace(/<\/p>/gi, "\n"));
    md = String(md.replace(/<br\s*\/?>/gi, "\n"));
    md = String(md.replace(/&nbsp;/gi, " "));

    // HTML 
    md = String(md.replace(/<[^>]*>/g, ""));

    // 
    md = String(md.replace(/\n{3,}/g, "\n\n"));
    
    // trim
    return String(md).trim();
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 30 * 1024 * 1024; // 30MB
    if (file.size > maxSize) {
      toast.error("이미지 크기는 30MB 이하여야 합니다.");
      return;
    }

    setUploading(true);

    try {
      // 
      const response = await uploadFile(file);

      if (response.success && response.data) {
        const imageUrl = response.data.fileUrl; // fileUrl 

        // 
        if (editorRef.current) {
          editorRef.current.focus();

          // 
          const img = document.createElement("img");
          img.src = imageUrl;
          img.alt = "이미지";
          img.style.maxWidth = "100%";
          img.style.width = "100%";
          img.style.height = "auto";
          img.style.borderRadius = "0.5rem";
          img.style.margin = "1rem 0";
          img.style.display = "block";

          // 
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();

            // 
            const br1 = document.createElement("br");
            range.insertNode(br1);

            // 
            range.insertNode(img);

            // 
            const br2 = document.createElement("br");
            range.setStartAfter(img);
            range.insertNode(br2);

            // 
            range.setStartAfter(br2);
            range.setEndAfter(br2);
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            // 
            editorRef.current.appendChild(
              document.createElement("br"),
            );
            editorRef.current.appendChild(img);
            editorRef.current.appendChild(
              document.createElement("br"),
            );
          }

          // 
          handleEditorInput();
        }

        // 
        if (response.code === 'LOCAL_STORAGE') {
          toast.success("이미지가 추가되었습니다 (로컬 저장)");
        } else {
          toast.success("이미지가 업로드되었습니다.");
        }
      } else {
        toast.error(
          response.message || "이미지 업로드에 실패했습니다.",
        );
      }
    } catch (error) {
      toast.error("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);

      // input 
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const execCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();

    // 
    setTimeout(handleEditorInput, 0);
  };

  const insertHeading = (level: number) => {
    execCommand("formatBlock", `h${level}`);
  };

  const insertLink = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      toast.error("텍스트를 먼저 선택해주세요.");
      return;
    }

    const selectedText = selection.toString();
    if (!selectedText) {
      toast.error("링크를 추가할 텍스트를 선택해주세요.");
      return;
    }

    const url = prompt("링크 URL을 입력하세요:", "https://");
    if (url && url !== "https://") {
      // 
      const markdown = `[${selectedText}](${url})`;

      // 
      const range = selection.getRangeAt(0);
      range.deleteContents();

      const link = document.createElement("a");
      link.href = url;
      link.textContent = selectedText;
      link.style.color = "#2563eb";
      link.style.textDecoration = "underline";

      range.insertNode(link);

      // 
      setTimeout(handleEditorInput, 0);
    }
  };

  // HTML 
  const renderMarkdown = (md: string): string => {
    // null, undefined, 
    if (!md || typeof md !== 'string') {
      return '';
    }
    
    
    try {
      // replace 
      let html: string = String(md);

      // 1. ( )
      html = String(html.replace(
        /```([\s\S]*?)```/g,
        '<pre style="background-color: #f3f4f6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0; overflow-x: auto;"><code>$1</code></pre>',
      ));

      // 2. 
      html = String(html.replace(
        /`([^`\n]+)`/g,
        '<code style="background-color: #f3f4f6; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.875rem;">$1</code>',
      ));

      // 3. ( )
      html = String(html.replace(
        /!\[([^\]]*)\]\(([^\)]+)\)/g,
        '<img src="$2" alt="$1" style="max-width: 100%; width: 100%; height: auto; border-radius: 0.5rem; margin: 1rem 0; display: block;" />',
      ));

      // 4. 
      html = String(html.replace(
        /\[([^\]]+)\]\(([^\)]+)\)/g,
        '<a href="$2" style="color: #2563eb; text-decoration: underline;">$1</a>',
      ));

      // 5. ( )
      html = String(html.replace(/^### (.*)$/gim, "<h3>$1</h3>"));
      html = String(html.replace(/^## (.*)$/gim, "<h2>$1</h2>"));
      html = String(html.replace(/^# (.*)$/gim, "<h1>$1</h1>"));

      // 6. (*** , **, *)
      html = String(html.replace(
        /\*\*\*((?:(?!\*\*\*)[\s\S])+?)\*\*\*/g,
        "<strong><em>$1</em></strong>",
      ));
      html = String(html.replace(
        /\*\*((?:(?!\*\*)[\s\S])+?)\*\*/g,
        "<strong>$1</strong>",
      ));
      html = String(html.replace(
        /\*((?:(?!\*)[^\n])+?)\*/g,
        "<em>$1</em>",
      ));

      // 7. 
      html = String(html.replace(
        /^> (.*)$/gim,
        '<blockquote style="border-left: 4px solid #d1d5db; padding-left: 1rem; font-style: italic; margin: 1rem 0; color: #6b7280;">$1</blockquote>',
      ));

      // 8. 
      html = String(html.replace(
        /^\d+\. (.*)$/gim,
        '<li style="margin-left: 2rem; list-style-type: decimal;">$1</li>',
      ));
      html = String(html.replace(
        /^\* (.*)$/gim,
        '<li style="margin-left: 2rem; list-style-type: disc;">$1</li>',
      ));

      // 9. 
      html = String(html.replace(
        /^---$/gim,
        '<hr style="margin: 2rem 0; border: none; border-top: 1px solid #e5e7eb;" />',
      ));

      // 10. ()
      html = String(html.replace(/\n/g, "<br />"));

      return html;
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/products/${id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            상품 상세로
          </Button>
          <div className="flex items-center gap-3">
            {/* ⭐ imageUrl이 문자열이고 비어있지 않을 때만 표시 */}
            {product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.length > 0 && (
              <div className="w-12 h-12 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                <img
                  src={getImageUrl(product.imageUrl)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-lg">{product.name}</h1>
              <p className="text-xs text-muted-foreground">
                마크다운 형식으로 상품 상세 내용 편집
              </p>
            </div>
          </div>
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          저장
        </Button>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b px-6 py-2 sticky top-[57px] z-10">
        <div className="flex items-center gap-1 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertHeading(1)}
            title="제목 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertHeading(2)}
            title="제목 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertHeading(3)}
            title="제목 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>

          <Separator
            orientation="vertical"
            className="h-6 mx-1"
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              execCommand("formatBlock", "blockquote")
            }
            title="인용"
          >
            <Quote className="h-4 w-4" />
          </Button>

          <Separator
            orientation="vertical"
            className="h-6 mx-1"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            title="이미지 업로드"
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4 mr-2" />
            )}
            이미지
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          <div className="relative">
            <div
              ref={editorRef}
              contentEditable
              onInput={handleEditorInput}
              className="min-h-[600px] p-8 bg-white rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/20"
              style={{
                lineHeight: "1.6",
              }}
            />
            {(typeof markdown === 'string' && markdown.length === 0) && (
              <div className="absolute top-8 left-8 text-muted-foreground pointer-events-none text-sm">
                여기를 클릭하여 내용을 입력하세요...
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        [contentEditable] h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 1.5rem 0;
        }
        [contentEditable] h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 1.25rem 0;
        }
        [contentEditable] h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 1rem 0;
        }
        [contentEditable] strong {
          font-weight: bold;
        }
        [contentEditable] em {
          font-style: italic;
        }
        [contentEditable] a {
          color: #2563eb;
          text-decoration: underline;
        }
        [contentEditable] ul, [contentEditable] ol {
          margin-left: 2rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        [contentEditable] li {
          margin: 0.25rem 0;
        }
        [contentEditable] ul {
          list-style-type: disc;
        }
        [contentEditable] ol {
          list-style-type: decimal;
        }
        [contentEditable] blockquote {
          border-left: 4px solid #d1d5db;
          padding-left: 1rem;
          font-style: italic;
          margin: 1rem 0;
          color: #6b7280;
        }
        [contentEditable] code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-family: monospace;
        }
        [contentEditable] pre {
          background-color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          margin: 1rem 0;
          overflow-x: auto;
        }
        [contentEditable] pre code {
          background: none;
          padding: 0;
        }
        [contentEditable] img {
          max-width: 100%;
          width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
          display: block;
        }
      `}</style>
    </div>
  );
}
export default ProductContentEditor;
