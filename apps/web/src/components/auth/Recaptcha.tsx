'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

declare global {
  interface Window {
    grecaptcha?: {
      render: (el: HTMLElement, options: { sitekey: string; theme?: string }) => number;
      getResponse: (widgetId: number) => string;
      reset: (widgetId: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

export interface RecaptchaRef {
  getToken: () => string;
  reset: () => void;
}

export const Recaptcha = forwardRef<RecaptchaRef>(function Recaptcha(_, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  useImperativeHandle(ref, () => ({
    getToken: () => {
      if (widgetId.current === null || !window.grecaptcha) return '';
      return window.grecaptcha.getResponse(widgetId.current);
    },
    reset: () => {
      if (widgetId.current !== null && window.grecaptcha) {
        window.grecaptcha.reset(widgetId.current);
      }
    },
  }));

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    function render() {
      if (!containerRef.current || !window.grecaptcha || widgetId.current !== null) return;
      widgetId.current = window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey!,
        theme: 'light',
      });
    }

    window.onRecaptchaLoad = render;

    if (window.grecaptcha) {
      render();
    } else if (!document.querySelector('script[src*="recaptcha"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [siteKey]);

  if (!siteKey) return null;

  return <div ref={containerRef} className="flex justify-center" />;
});
