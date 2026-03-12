"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import SaveModal from "./SaveModal";
import EditModal from "./EditModal";

const getMarkerImageUrl = (color) => {
  const colorMap = {
    red: "#FF5B35",
    yellow: "#FFC107",
    blue: "#2196F3",
    green: "#4CAF50",
    purple: "#9C27B0",
  };
  const hex = colorMap[color] || colorMap.red;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
      <path d="M15 0C6.716 0 0 6.716 0 15c0 10 15 25 15 25S30 25 30 15C30 6.716 23.284 0 15 0z" fill="${hex}"/>
      <circle cx="15" cy="15" r="6" fill="white"/>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export default function Sidebar({ map }) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [lists, setLists] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [openFolder, setOpenFolder] = useState(null);
  const [activeTab, setActiveTab] = useState("map");
  const [editModal, setEditModal] = useState(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!map) return;
    loadSavedPlaces();
    loadLists();
  }, [map]);

  const loadSavedPlaces = async () => {
    const { data } = await supabase
      .from("places")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setSavedPlaces(data);
      showMarkers(data);
    }
  };

  const loadLists = async () => {
    const { data } = await supabase
      .from("lists")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setLists(data);
  };

  const showMarkers = (places) => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    const newMarkers = places.map((place) => {
      const markerImage = new window.kakao.maps.MarkerImage(
        getMarkerImageUrl(place.marker_color || "red"),
        new window.kakao.maps.Size(30, 40),
      );
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(place.lat, place.lng),
        map: map,
        image: markerImage,
      });
      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:6px 10px;font-size:13px;font-weight:600">${place.name}</div>`,
      });
      window.kakao.maps.event.addListener(marker, "click", () => {
        infowindow.open(map, marker);
      });
      return marker;
    });
    markersRef.current = newMarkers;
  };

  const handleFolderClick = (list) => {
    if (openFolder === list.id) {
      setOpenFolder(null);
      showMarkers(savedPlaces);
    } else {
      setOpenFolder(list.id);
      const folderPlaces = savedPlaces.filter((p) =>
        list.place_ids?.includes(p.id),
      );
      showMarkers(folderPlaces);
    }
  };

  const handlePlaceClick = (place) => {
    map.panTo(new window.kakao.maps.LatLng(place.lat, place.lng));
    const parentList = lists.find((l) => l.place_ids?.includes(place.id));
    if (parentList) {
      showMarkers(
        savedPlaces.filter((p) => parentList.place_ids?.includes(p.id)),
      );
    } else {
      showMarkers([place]);
    }
  };

  const deletePlace = (place) => {
    setEditModal({ type: "delete", data: place });
  };

  const deleteFolder = (list) => {
    setEditModal({ type: "deleteFolder", data: list });
  };

  const handleEditSave = async (value) => {
    if (editModal.type === "color") {
      await supabase
        .from("places")
        .update({ marker_color: value })
        .eq("id", editModal.data.id);
      loadSavedPlaces();
    } else if (editModal.type === "folder") {
      await supabase
        .from("lists")
        .update({ title: value })
        .eq("id", editModal.data.id);
      loadLists();
    } else if (editModal.type === "delete") {
      const parentList = lists.find((l) =>
        l.place_ids?.includes(editModal.data.id),
      );
      if (parentList) {
        const updatedIds = parentList.place_ids.filter(
          (id) => id !== editModal.data.id,
        );
        await supabase
          .from("lists")
          .update({ place_ids: updatedIds })
          .eq("id", parentList.id);
      }
      await supabase.from("places").delete().eq("id", editModal.data.id);
      loadSavedPlaces();
      loadLists();
    } else if (editModal.type === "deleteFolder") {
      if (editModal.data.place_ids?.length > 0) {
        await supabase
          .from("places")
          .delete()
          .in("id", editModal.data.place_ids);
      }
      await supabase.from("lists").delete().eq("id", editModal.data.id);
      loadSavedPlaces();
      loadLists();
    }
    setEditModal(null);
  };

  const searchPlaces = () => {
    if (!keyword || !map) return;
    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(keyword, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) setResults(data);
    });
  };

  const showSearchMarker = (place) => {
    if (!map) return;
    const marker = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(place.y, place.x),
      map: map,
    });
    const infowindow = new window.kakao.maps.InfoWindow({
      content: `<div style="padding:6px 10px;font-size:13px">${place.place_name}</div>`,
    });
    window.kakao.maps.event.addListener(marker, "click", () =>
      infowindow.open(map, marker),
    );
    map.panTo(new window.kakao.maps.LatLng(place.y, place.x));
  };

  const unlistedPlaces = savedPlaces.filter(
    (place) => !lists.some((list) => list.place_ids?.includes(place.id)),
  );

  return (
    <div
      style={{
        width: "320px",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--white)",
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          padding: "24px 20px 0",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <span
            style={{
              fontWeight: "700",
              fontSize: "22px",
              color: "var(--primary)",
            }}
          >
            matzip
          </span>
        </div>

        {/* 검색창 */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <span
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-secondary)",
              fontSize: "14px",
            }}
          >
            🔍
          </span>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchPlaces()}
            placeholder="장소 검색..."
            style={{
              width: "100%",
              padding: "10px 12px 10px 36px",
              border: "1.5px solid var(--border)",
              borderRadius: "10px",
              fontSize: "14px",
              outline: "none",
              background: "var(--bg)",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* 탭 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            paddingBottom: "8px",
          }}
        >
          {[
            { id: "map", label: "지도 보기", icon: "📍" },
            { id: "saved", label: "저장한 맛집", icon: "❤️" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                border: "none",
                borderRadius: "12px",
                background: activeTab === tab.id ? "var(--bg)" : "transparent",
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
                transition: "background 0.2s",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span style={{ fontSize: "18px" }}>{tab.icon}</span>
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: activeTab === tab.id ? "600" : "400",
                    color:
                      activeTab === tab.id
                        ? "var(--text)"
                        : "var(--text-secondary)",
                  }}
                >
                  {tab.label}
                </span>
              </div>
              {tab.id === "saved" && savedPlaces.length > 0 && (
                <span
                  style={{
                    background: "var(--primary)",
                    color: "white",
                    borderRadius: "20px",
                    padding: "2px 8px",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  {savedPlaces.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        {/* 검색 결과 - 지도보기 탭에서만 */}
        {activeTab === "map" && results.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              검색 결과 {results.length}개
            </p>
            {results.map((place) => (
              <div
                key={place.id}
                style={{
                  padding: "12px",
                  marginBottom: "8px",
                  background: "var(--bg)",
                  borderRadius: "10px",
                }}
              >
                <p
                  style={{
                    fontWeight: "600",
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  {place.place_name}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    marginBottom: "8px",
                  }}
                >
                  {place.address_name}
                </p>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => setSelectedPlace(place)}
                    style={primaryBtnStyle}
                  >
                    + 저장
                  </button>
                  <button
                    onClick={() => showSearchMarker(place)}
                    style={secondaryBtnStyle}
                  >
                    지도보기
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 지도 보기 탭 */}
        {activeTab === "map" && results.length === 0 && (
          <div>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                marginBottom: "12px",
                fontWeight: "600",
              }}
            >
              추천 맛집
            </p>
            <div
              style={{
                background: "var(--bg)",
                borderRadius: "12px",
                padding: "24px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "24px", marginBottom: "8px" }}>✨</p>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                맛집을 저장하면
                <br />
                AI가 맞춤 추천을 해드려요!
              </p>
            </div>
          </div>
        )}

        {/* 저장한 맛집 탭 */}
        {activeTab === "saved" && (
          <div>
            {savedPlaces.length === 0 && (
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  textAlign: "center",
                  marginTop: "40px",
                }}
              >
                아직 저장한 맛집이 없어요!
              </p>
            )}

            {/* 폴더에 없는 맛집 */}
            {unlistedPlaces.map((place) => (
              <PlaceItem
                key={place.id}
                place={place}
                onClick={handlePlaceClick}
                onColorChange={(p) => setEditModal({ type: "color", data: p })}
                onDelete={deletePlace}
              />
            ))}

            {/* 폴더 목록 */}
            {lists.map((list) => (
              <div key={list.id} style={{ marginBottom: "8px" }}>
                <div
                  onClick={() => handleFolderClick(list)}
                  style={{
                    padding: "12px 14px",
                    background: "var(--bg)",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    marginBottom: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#8E8E9A"
                      strokeWidth="2"
                    >
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <span style={{ fontWeight: "600", fontSize: "14px" }}>
                      {list.title}
                    </span>
                    <span
                      style={{
                        background: "var(--primary)",
                        color: "white",
                        borderRadius: "20px",
                        padding: "1px 8px",
                        fontSize: "11px",
                        fontWeight: "600",
                      }}
                    >
                      {list.place_ids?.length || 0}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    {/* 이름 수정 버튼 */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditModal({ type: "folder", data: list });
                      }}
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "6px",
                        background: "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#e8e8f0")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#8E8E9A"
                        strokeWidth="2.5"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </div>
                    {/* 삭제 버튼 */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFolder(list);
                      }}
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "6px",
                        background: "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#fee2e2")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2.5"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                      </svg>
                    </div>
                    <span
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "12px",
                      }}
                    >
                      {openFolder === list.id ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {openFolder === list.id && (
                  <div style={{ paddingLeft: "8px" }}>
                    {savedPlaces
                      .filter((place) => list.place_ids?.includes(place.id))
                      .map((place) => (
                        <PlaceItem
                          key={place.id}
                          place={place}
                          onClick={handlePlaceClick}
                          onColorChange={(p) =>
                            setEditModal({ type: "color", data: p })
                          }
                          onDelete={deletePlace}
                        />
                      ))}
                    {!list.place_ids?.length && (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                          padding: "8px",
                        }}
                      >
                        저장된 맛집이 없어요
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 저장 모달 */}
      {selectedPlace && (
        <SaveModal
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onSaved={() => {
            loadSavedPlaces();
            loadLists();
            setSelectedPlace(null);
          }}
        />
      )}

      {/* 편집 모달 */}
      {editModal && (
        <EditModal
          type={editModal.type}
          data={editModal.data}
          onClose={() => setEditModal(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}

function PlaceItem({ place, onClick, onColorChange, onDelete }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "10px 12px",
        marginBottom: "6px",
        background: hovered ? "#f0f0f5" : "var(--bg)",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        transition: "background 0.15s",
      }}
    >
      <div
        onClick={() => onColorChange(place)}
        title="색깔 변경"
        style={{
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          background: place.marker_color || "red",
          flexShrink: 0,
          cursor: "pointer",
          border: "2px solid rgba(0,0,0,0.1)",
        }}
      />
      <div
        onClick={() => onClick(place)}
        style={{ flex: 1, cursor: "pointer" }}
      >
        <p style={{ fontWeight: "600", fontSize: "13px", marginBottom: "2px" }}>
          {place.name}
        </p>
        <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
          {place.address}
        </p>
      </div>
      {hovered && (
        <div
          onClick={() => onDelete(place)}
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "6px",
            background: "#fee2e2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2.5"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </div>
      )}
    </div>
  );
}

const primaryBtnStyle = {
  padding: "6px 12px",
  background: "var(--primary)",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: "600",
  cursor: "pointer",
};

const secondaryBtnStyle = {
  padding: "6px 12px",
  background: "var(--white)",
  color: "var(--text)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  fontSize: "12px",
  cursor: "pointer",
};
