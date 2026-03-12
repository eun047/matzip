"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar";

export default function Map() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=services`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        const kakaoMap = new window.kakao.maps.Map(mapRef.current, {
          center: new window.kakao.maps.LatLng(37.5665, 126.978),
          level: 5,
        });
        setMap(kakaoMap);
      });
    };
  }, []);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar map={map} />
      <div ref={mapRef} style={{ flex: 1, height: "100vh" }} />
    </div>
  );
}
