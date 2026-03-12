"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Sidebar({ map }) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);

  const searchPlaces = () => {
    if (!keyword) return;
    if (!map) {
      alert("지도가 아직 로딩 중이에요!");
      return;
    }

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(keyword, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        setResults(data);
      }
    });
  };

  const savePlace = async (place) => {
    const { error } = await supabase.from("places").insert({
      name: place.place_name,
      address: place.address_name,
      lat: parseFloat(place.y),
      lng: parseFloat(place.x),
      category: place.category_group_name || "기타",
    });

    if (error) {
      alert("저장 실패!");
      console.log(error);
    } else {
      alert(`${place.place_name} 저장 완료!`);
    }
  };

  return (
    <div
      style={{
        width: "300px",
        height: "100vh",
        overflowY: "auto",
        padding: "16px",
        background: "white",
      }}
    >
      <h2>🍽 맛집 지도</h2>
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && searchPlaces()}
        placeholder="장소 검색..."
        style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
      />
      <button
        onClick={searchPlaces}
        style={{ width: "100%", padding: "8px", marginBottom: "16px" }}
      >
        검색
      </button>

      {results.map((place) => (
        <div
          key={place.id}
          style={{ padding: "8px", borderBottom: "1px solid #eee" }}
        >
          <p style={{ fontWeight: "bold" }}>{place.place_name}</p>
          <p style={{ fontSize: "12px", color: "gray" }}>
            {place.address_name}
          </p>
          <button onClick={() => savePlace(place)}>저장</button>
        </div>
      ))}
    </div>
  );
}
