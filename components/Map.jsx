"use client";

import { useEffect, useRef } from "react";

export default function Map() {
  const mapRef = useRef(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      console.log("카카오 스크립트 로드 완료!");
      window.kakao.maps.load(() => {
        console.log("카카오맵 초기화 완료!");
        const map = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(37.5665, 126.978),
          level: 5,
        });
      });
    };

    script.onerror = () => {
      console.log("카카오 스크립트 로드 실패!");
    };
  }, []);

  return <div ref={mapRef} style={{ width: "100%", height: "100vh" }} />;
}
