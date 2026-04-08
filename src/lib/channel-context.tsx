/**
 * Channel Context
 * 쇼핑몰에서 현재 채널 정보를 전역으로 관리하고,
 * 모든 네비게이션에 자동으로 채널 파라미터를 유지합니다.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate as useRouterNavigate } from 'react-router';
import { setSessionChannel, clearSessionChannel, getBenepiaSession } from './api/benepia';
import { getPublicChannelByCode } from './api/channel';

interface ChannelContextType {
  currentChannel: string | null;
  channelLogoUrl: string | null;
  setCurrentChannel: (channel: string | null) => void;
  navigate: (to: string | number, options?: { replace?: boolean; state?: any }) => void;
}

const ChannelContext = createContext<ChannelContextType | undefined>(undefined);

/**
 * 파비콘을 동적으로 변경하는 함수
 */
function updateFavicon(faviconUrl: string) {
  // 
  const existingFavicon = document.querySelector('link[rel="icon"]');
  if (existingFavicon) {
    existingFavicon.remove();
  }

  // 
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = faviconUrl;
  document.head.appendChild(link);
  
}

/**
 * 채널 정보를 가져와서 파비콘과 타이틀을 업데이트하는 함수
 */
async function loadChannelInfo(channelCode: string, setLogoUrl: (url: string | null) => void) {
  try {
    const response = await getPublicChannelByCode(channelCode);
    
    if (response.success && response.data) {
      const channelData = response.data;
      
      // 
      if (channelData.faviconUrl) {
        updateFavicon(channelData.faviconUrl);
      }
      
      // 
      if (channelData.name) {
        document.title = `${channelData.name} - 티켓몰`;
      }
      
      // URL 
      if (channelData.logoUrl) {
        setLogoUrl(channelData.logoUrl);
      }
      
    }
  } catch (error) {
  }
}

export function ChannelProvider({ children }: { children: React.ReactNode }) {
  const [searchParams] = useSearchParams();
  const routerNavigate = useRouterNavigate();
  const [currentChannel, setCurrentChannel] = useState<string | null>(null);
  const [channelLogoUrl, setChannelLogoUrl] = useState<string | null>(null);
  const [sessionInitialized, setSessionInitialized] = useState(false);

  // : iframe → API → URL → DEFAULT
  useEffect(() => {
    if (sessionInitialized) return;

    const initSession = async () => {
      
      // iframe 
      const isIframe = window.self !== window.top;
      
      // iframe → 
      if (isIframe) {
        try {
          const benepiaResponse = await getBenepiaSession();
          if (benepiaResponse.success && benepiaResponse.data?.channelCode) {
            const benepiaChannel = benepiaResponse.data.channelCode;
            
            // BENE DEFAULT 
            if (benepiaChannel !== 'DEFAULT') {
              setCurrentChannel(benepiaChannel);
              await loadChannelInfo(benepiaChannel, setChannelLogoUrl);
              setSessionChannel(benepiaChannel);
              sessionStorage.setItem('current_channel', benepiaChannel);
              sessionStorage.setItem('benepia_channel', benepiaChannel);
              setSessionInitialized(true);
              return;
            }
          }
        } catch (error) {
        }
      }
      
      // iframe → URL 
      const channelFromUrl = new URLSearchParams(window.location.search).get('channel');
      
      if (channelFromUrl) {
        setCurrentChannel(channelFromUrl);
        await loadChannelInfo(channelFromUrl, setChannelLogoUrl);
        setSessionChannel(channelFromUrl);
        sessionStorage.setItem('current_channel', channelFromUrl);
        sessionStorage.setItem('benepia_channel', channelFromUrl);
      } else {
        setCurrentChannel(null);
        await loadChannelInfo('DEFAULT', setChannelLogoUrl);
        clearSessionChannel();
        sessionStorage.setItem('current_channel', 'DEFAULT');
      }
      
      setSessionInitialized(true);
    };

    initSession();
  }, [sessionInitialized]);

  // URL 
  useEffect(() => {
    // 
    if (!sessionInitialized) return;

    const channelFromUrl = searchParams.get('channel');
    const benepiaChannel = sessionStorage.getItem('benepia_channel');
    
    if (channelFromUrl) {
      // URL - 
      if (channelFromUrl !== currentChannel) {
        setCurrentChannel(channelFromUrl);
        loadChannelInfo(channelFromUrl, setChannelLogoUrl);
        setSessionChannel(channelFromUrl);
        sessionStorage.setItem('current_channel', channelFromUrl);
      }
    } else {
      // URL 
      // , DEFAULT
      if (benepiaChannel && benepiaChannel !== 'DEFAULT') {
        if (currentChannel !== benepiaChannel) {
          setCurrentChannel(benepiaChannel);
          loadChannelInfo(benepiaChannel, setChannelLogoUrl);
          setSessionChannel(benepiaChannel);
          sessionStorage.setItem('current_channel', benepiaChannel);
        }
      } else {
        // DEFAULT
        if (currentChannel !== null) {
          setCurrentChannel(null);
          loadChannelInfo('DEFAULT', setChannelLogoUrl); // DEFAULT 
          clearSessionChannel();
          sessionStorage.setItem('current_channel', 'DEFAULT');
        }
      }
    }
  }, [searchParams, sessionInitialized, currentChannel]);

  // navigate 
  const navigate = useCallback((to: string | number, options?: { replace?: boolean; state?: any }) => {
    // (/) 
    if (typeof to === 'number') {
      routerNavigate(to);
      return;
    }
    
    let finalUrl = to;

    // URL 
    if (!to.startsWith('http') && !to.startsWith('//')) {
      // 
      const hasChannelParam = to.includes('channel=');
      
      // , URL 
      if (currentChannel && !hasChannelParam) {
        const separator = to.includes('?') ? '&' : '?';
        finalUrl = `${to}${separator}channel=${currentChannel}`;
      }
    }

    routerNavigate(finalUrl, options);
  }, [currentChannel, routerNavigate]);

  return (
    <ChannelContext.Provider value={{ currentChannel, channelLogoUrl, setCurrentChannel, navigate }}>
      {children}
    </ChannelContext.Provider>
  );
}

/**
 * 채널 컨텍스트를 사용하는 훅
 * navigate 함수는 자동으로 현재 채널 파라미터를 포함합니다.
 */
export function useChannel() {
  const context = useContext(ChannelContext);
  if (context === undefined) {
    throw new Error('useChannel must be used within a ChannelProvider');
  }
  return context;
}

/**
 * 채널 인식 navigate 함수만 사용하는 훅
 * 기존 useNavigate를 대체합니다.
 * ⚠️ ChannelProvider가 없는 경우 기본 react-router의 useNavigate를 반환합니다.
 */
export function useNavigate() {
  const context = useContext(ChannelContext);
  if (context === undefined) {
    // ChannelProvider react-router navigate 
    return useRouterNavigate();
  }
  return context.navigate;
}

/**
 * 개발자 도구: 현재 채널 상태 확인
 * 콘솔에서 window.checkChannel() 로 호출 가능
 */
export function checkChannelStatus() {
  const sessionChannel = typeof sessionStorage !== 'undefined' 
    ? sessionStorage.getItem('benepia_channel')
    : null;
  const currentChannel = typeof sessionStorage !== 'undefined'
    ? sessionStorage.getItem('current_channel')
    : null;
  
  
  return {
    currentChannel: currentChannel || 'DEFAULT',
    benepiaSession: sessionChannel,
    urlParam: new URLSearchParams(window.location.search).get('channel')
  };
}

// 
if (typeof window !== 'undefined') {
  (window as any).checkChannel = checkChannelStatus;
  
  // 
}