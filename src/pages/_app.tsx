import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useState, useEffect, useMemo } from "react";
import "../styles/nprogress.css";
import NProgress from "nprogress";
import dynamic from "next/dynamic";
import Head from "next/head";

// Lazy load LoadingSpinner để giảm kích thước bundle ban đầu
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

  // Cấu hình NProgress một lần duy nhất
  useMemo(() => {
    NProgress.configure({
      showSpinner: false,
      minimum: 0.1,
      trickleSpeed: 200,
      easing: 'ease',
      speed: 300
    });
  }, []);

  useEffect(() => {
    let loadingTimeout: NodeJS.Timeout;

    const handleStart = () => {
      // Ghi lại thời điểm bắt đầu tải
      setLoadStartTime(Date.now());

      // Chỉ hiển thị spinner nếu tải trang mất hơn 300ms
      loadingTimeout = setTimeout(() => {
        setShowSpinner(true);
      }, 300);

      setLoading(true);
      NProgress.start();
    };

    const handleComplete = () => {
      clearTimeout(loadingTimeout);

      // Tính toán thời gian tải
      const loadTime = Date.now() - loadStartTime;
      console.log(`Page loaded in ${loadTime}ms`);

      setLoading(false);
      setShowSpinner(false);
      NProgress.done();
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      clearTimeout(loadingTimeout);
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router, loadStartTime]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      {loading && showSpinner && <LoadingSpinner size="medium" />}
      <Component {...pageProps} />
    </>
  );
}
