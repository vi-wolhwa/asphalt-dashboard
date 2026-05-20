import { useState, useEffect } from 'react';

/**
 * 커스텀 헤더가 필요한 이미지 URL을 fetch → blob URL로 변환하는 훅.
 * ngrok 무료 버전의 확인 페이지를 우회하기 위해
 * `ngrok-skip-browser-warning` 헤더를 포함한다.
 */
export function useImageWithHeaders(url: string | null | undefined): {
  blobUrl: string | null;
  loading: boolean;
  error: boolean;
} {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) {
      setBlobUrl(null);
      setError(false);
      return;
    }

    let revoked = false;
    let objectUrl: string | null = null;

    setLoading(true);
    setError(false);

    fetch(url, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const contentType = res.headers.get('content-type') ?? '';
        // ngrok이 HTML을 반환하는 경우 감지
        if (contentType.includes('text/html')) {
          throw new Error('이미지가 아닌 HTML 응답');
        }
        return res.blob();
      })
      .then((blob) => {
        if (revoked) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!revoked) setError(true);
      })
      .finally(() => {
        if (!revoked) setLoading(false);
      });

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return { blobUrl, loading, error };
}
