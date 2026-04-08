import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getApiBaseUrl } from '@/lib/config';

export function ApiTest() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testApiUrls = [
    'https://winnticket.store/api/menu/menuListAll',
    'https://api.winnticket.store/api/menu/menuListAll',
    'https://www.winnticket.store/api/menu/menuListAll',
  ];

  const testUrl = async (url: string) => {
    setLoading(true);
    setResult(`테스트 중: ${url}\n`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });

      const data = await response.json();
      
      setResult(prev => prev + `\n✅ 성공!\nStatus: ${response.status}\nURL: ${url}\n응답: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(prev => prev + `\n❌ 실패\nURL: ${url}\n에러: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentConfig = () => {
    const apiBaseUrl = getApiBaseUrl();
    const isLocalhost = window.location.hostname === 'localhost';
    
    return `
현재 설정:
- Hostname: ${window.location.hostname}
- API Base URL: ${apiBaseUrl}
- Is Localhost: ${isLocalhost}
- Window Origin: ${window.location.origin}
    `.trim();
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>🔍 API 주소 테스트</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gray-100 rounded">
            <pre className="text-sm whitespace-pre-wrap">{getCurrentConfig()}</pre>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold">가능한 API 주소들을 테스트:</h3>
            {testApiUrls.map((url) => (
              <Button
                key={url}
                onClick={() => testUrl(url)}
                disabled={loading}
                variant="outline"
                className="w-full justify-start"
              >
                {url}
              </Button>
            ))}
          </div>

          {result && (
            <div className="p-4 bg-black text-green-400 rounded font-mono text-sm whitespace-pre-wrap">
              {result}
            </div>
          )}

          <div className="text-sm text-gray-600 space-y-2">
            <p>💡 <strong>확인 방법:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>위 버튼들을 순서대로 클릭해보세요</li>
              <li>✅ 성공한 URL이 실제 백엔드 API 주소입니다</li>
              <li>브라우저 개발자도구 &gt; Network 탭에서도 확인 가능</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ApiTest;
