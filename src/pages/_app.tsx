import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useState, useEffect, useMemo, useCallback } from "react";
import "../styles/nprogress.css";
import NProgress from "nprogress";
import dynamic from "next/dynamic";
import Head from "next/head";

// Lazy load LoadingSpinner với tối ưu hóa
const LoadingSpinner = dynamic(() => import("../components/LoadingSpinner"), {
  ssr: false,
  loading: () => null
});

// Tối ưu hóa hiệu suất bằng cách sử dụng memo và lazy loading
export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Theo dõi thời gian tải trang
  const [loadStartTime, setLoadStartTime] = useState(0);

  // Tối ưu hóa hiệu suất bằng cách giới hạn số lần hiển thị loading spinner
  const [showSpinner, setShowSpinner] = useState(false);

  // Cấu hình NProgress một lần duy nhất với useMemo
  useMemo(() => {
    NProgress.configure({
      showSpinner: false,
      minimum: 0.1,
      trickleSpeed: 200,
      easing: 'ease',
      speed: 300
    });
  }, []);

  // Tối ưu hóa event handlers với useCallback
  const handleStart = useCallback(() => {
    setLoadStartTime(Date.now());

    // Chỉ hiển thị spinner nếu tải trang mất hơn 300ms
    const timeout = setTimeout(() => {
      setShowSpinner(true);
    }, 300);

    setLoading(true);
    NProgress.start();

    return timeout;
  }, []);

  const handleComplete = useCallback(() => {
    setLoading(false);
    setShowSpinner(false);
    NProgress.done();
  }, []);

  useEffect(() => {
    let loadingTimeout: NodeJS.Timeout;

    const onStart = () => {
      loadingTimeout = handleStart();
    };

    const onComplete = () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      handleComplete();
    };

    router.events.on("routeChangeStart", onStart);
    router.events.on("routeChangeComplete", onComplete);
    router.events.on("routeChangeError", onComplete);

    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      router.events.off("routeChangeStart", onStart);
      router.events.off("routeChangeComplete", onComplete);
      router.events.off("routeChangeError", onComplete);
    };
  }, [router, handleStart, handleComplete]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#1890ff" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="preconnect" href="https://ptud-web-1.onrender.com" />
        <link rel="dns-prefetch" href="https://ptud-web-1.onrender.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      {loading && showSpinner && <LoadingSpinner size="medium" />}
      <Component {...pageProps} />
    </>
  );
}
