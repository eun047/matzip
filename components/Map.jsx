"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar";

export default function Map() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

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
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)" }}>
      {/* 사이드바 */}
      <div
        style={{
          width: isOpen ? "var(--sidebar-width)" : "0",
          minWidth: isOpen ? "var(--sidebar-width)" : "0",
          overflow: isOpen ? "visible" : "hidden",
          transition: "width 0.3s ease, min-width 0.3s ease",
          height: "100vh",
          background: "var(--white)",
          boxShadow: "2px 0 12px rgba(0,0,0,0.06)",
          zIndex: 100,
        }}
      >
        <Sidebar
          map={map}
          onToggle={() => setIsOpen(!isOpen)}
          isOpen={isOpen}
        />
      </div>

      {/* 지도 영역 */}
      <div style={{ flex: 1, position: "relative" }}>
        {/* 접기/펼치기 버튼 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            background: "var(--white)",
            border: "none",
            borderRadius: "10px",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            fontSize: "16px",
          }}
        >
          {isOpen ? "◀" : "▶"}
        </button>

        {/* 확대/축소 버튼 */}
        <div
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <button
            onClick={() => map?.setLevel(map.getLevel() - 1)}
            style={mapBtnStyle}
          >
            +
          </button>
          <button
            onClick={() => map?.setLevel(map.getLevel() + 1)}
            style={mapBtnStyle}
          >
            −
          </button>
        </div>

        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}

const mapBtnStyle = {
  background: "var(--white)",
  border: "none",
  borderRadius: "10px",
  width: "40px",
  height: "40px",
  fontSize: "20px",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
