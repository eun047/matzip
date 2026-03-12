"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const COLORS = [
  { label: "빨강", value: "red" },
  { label: "노랑", value: "yellow" },
  { label: "파랑", value: "blue" },
  { label: "초록", value: "green" },
  { label: "보라", value: "purple" },
];

export default function SaveModal({ place, onClose, onSaved }) {
  const [lists, setLists] = useState([]);
  const [newListName, setNewListName] = useState("");
  const [selectedColor, setSelectedColor] = useState("red");

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    const { data } = await supabase
      .from("lists")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setLists(data);
  };

  const createList = async () => {
    if (!newListName) return;
    const { data } = await supabase
      .from("lists")
      .insert({ title: newListName })
      .select()
      .single();
    if (data) {
      setLists([data, ...lists]);
      setNewListName("");
    }
  };

  const saveToList = async (listId) => {
    const { data: placeData } = await supabase
      .from("places")
      .insert({
        name: place.place_name,
        address: place.address_name,
        lat: parseFloat(place.y),
        lng: parseFloat(place.x),
        category: place.category_group_name || "기타",
        marker_color: selectedColor,
      })
      .select()
      .single();

    if (placeData) {
      const list = lists.find((l) => l.id === listId);
      const updatedIds = [...(list.place_ids || []), placeData.id];
      await supabase
        .from("lists")
        .update({ place_ids: updatedIds })
        .eq("id", listId);

      alert(`${place.place_name} 저장 완료!`);
      onSaved();
      onClose();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "white",
          padding: "24px",
          borderRadius: "12px",
          width: "300px",
        }}
      >
        <h3>📁 폴더에 저장</h3>
        <p style={{ fontSize: "14px", color: "gray" }}>{place.place_name}</p>

        {/* 색깔 선택 */}
        <p style={{ marginTop: "16px", fontWeight: "bold" }}>
          🎨 마커 색깔 선택
        </p>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {COLORS.map((color) => (
            <div
              key={color.value}
              onClick={() => setSelectedColor(color.value)}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: color.value,
                cursor: "pointer",
                border:
                  selectedColor === color.value
                    ? "3px solid black"
                    : "3px solid transparent",
              }}
            />
          ))}
        </div>

        {/* 새 폴더 만들기 */}
        <div style={{ display: "flex", gap: "8px", margin: "16px 0" }}>
          <input
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="새 폴더 이름"
            style={{ flex: 1, padding: "8px" }}
          />
          <button onClick={createList}>추가</button>
        </div>

        {/* 폴더 목록 */}
        {lists.length === 0 && (
          <p style={{ color: "gray", fontSize: "14px" }}>
            폴더가 없어요. 먼저 만들어주세요!
          </p>
        )}
        {lists.map((list) => (
          <div
            key={list.id}
            onClick={() => saveToList(list.id)}
            style={{
              padding: "12px",
              marginBottom: "8px",
              border: "1px solid #eee",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            📁 {list.title} ({list.place_ids?.length || 0}개)
          </div>
        ))}

        <button
          onClick={onClose}
          style={{ width: "100%", marginTop: "16px", padding: "8px" }}
        >
          닫기
        </button>
      </div>
    </div>
  );
}
