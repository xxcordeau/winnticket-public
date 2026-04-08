/**
 * 클립보드에 텍스트를 복사합니다.
 * Clipboard API가 차단된 경우 fallback 메서드를 사용합니다.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Fallback: execCommand ( )
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '2em';
    textarea.style.height = '2em';
    textarea.style.padding = '0';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxShadow = 'none';
    textarea.style.background = 'transparent';
    textarea.style.opacity = '0';
    
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    
    if (successful) {
      return true;
    }
  } catch (err) {
    // execCommand Clipboard API 
  }

  // Clipboard API 
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // 
      return false;
    }
  }

  return false;
}