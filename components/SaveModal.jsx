"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const COLORS = [
  { label: "빨강", value: "red", hex: "#FF5B35" },
  { label: "노랑", value: "yellow", hex: "#FFC107" },
  { label: "파랑", value: "blue", hex: "#2196F3" },
  { label: "초록", value: "green", hex: "#4CAF50" },
  { label: "보라", value: "purple", hex: "#9C27B0" },
];

export default function SaveModal({ place, onClose, onSaved }) {
  const [lists, setLists] = useState([]);
  const [selectedColor, setSelectedColor] = useState("red");
  const [selectedListId, setSelectedListId] = useState(null);
  const [toast, setToast] = useState(false);

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [creating, setCreating] = useState(false);

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
    const name = newListName.trim();

    if (!name || creating) return;

    if (lists.some((l) => l.title === name)) {
      alert("같은 이름의 폴더가 이미 있어요!");
      return;
    }

    setCreating(true);

    const { data } = await supabase
      .from("lists")
      .insert({ title: name })
      .select()
      .single();

    if (data) {
      setLists((prev) => [data, ...prev]);
      setNewListName("");
      setShowNewFolder(false);
    }

    setCreating(false);
  };

  const saveToList = async () => {
    if (!selectedListId) return;

    const { data: placeData } = await supabase
      .from("places")
      .insert({
        name: place.place_name,
        address: place.address_name,
        lat: parseFloat(place.y),
        lng: parseFloat(place.x),
        category: place.category_name || place.category_group_name || "기타",
        marker_color: selectedColor,
      })
      .select()
      .single();

    if (placeData) {
      const list = lists.find((l) => l.id === selectedListId);

      const updatedIds = [...(list.place_ids || []), placeData.id];

      await supabase
        .from("lists")
        .update({ place_ids: updatedIds })
        .eq("id", selectedListId);

      setToast(true);

      setTimeout(() => {
        setToast(false);
        onSaved();
        onClose();
      }, 1500);
    }
  };

  return (
    <>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0,0,0,0.75)",
            color: "white",
            padding: "14px 28px",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: "600",
            zIndex: 9999,
          }}
        >
          ✅ {place.place_name} 저장 완료!
        </div>
      )}

      {showNewFolder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              width: "280px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }}
          >
            <h3
              style={{
                fontWeight: "700",
                fontSize: "16px",
                marginBottom: "16px",
              }}
            >
              새 폴더 만들기
            </h3>

            <input
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") createList();
              }}
              placeholder="폴더 이름 입력"
              autoFocus
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1.5px solid #EBEBF0",
                borderRadius: "10px",
                fontSize: "14px",
                marginBottom: "16px",
                boxSizing: "border-box",
              }}
            />

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => {
                  setShowNewFolder(false);
                  setNewListName("");
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "1px solid #EBEBF0",
                  borderRadius: "10px",
                  background: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#8E8E9A",
                }}
              >
                취소
              </button>

              <button
                onClick={createList}
                disabled={creating}
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "none",
                  borderRadius: "10px",
                  background: creating ? "#EBEBF0" : "#FF5B35",
                  color: creating ? "#8E8E9A" : "white",
                  cursor: creating ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                만들기
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
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
            borderRadius: "16px",
            width: "300px",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          }}
        >
          <h3
            style={{ fontWeight: "700", fontSize: "16px", marginBottom: "6px" }}
          >
            폴더에 저장
          </h3>

          <p
            style={{ fontSize: "13px", color: "#8E8E9A", marginBottom: "20px" }}
          >
            {place.place_name}
          </p>

          <p
            style={{
              fontSize: "12px",
              fontWeight: "600",
              marginBottom: "10px",
              color: "#8E8E9A",
            }}
          >
            마커 색깔
          </p>

          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {COLORS.map((color) => (
              <div
                key={color.value}
                onClick={() => setSelectedColor(color.value)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: color.hex,
                    border:
                      selectedColor === color.value
                        ? "3px solid #1A1A2E"
                        : "3px solid transparent",
                  }}
                />
                <span style={{ fontSize: "10px", color: "#8E8E9A" }}>
                  {color.label}
                </span>
              </div>
            ))}
          </div>

          <p
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#8E8E9A",
              marginBottom: "8px",
            }}
          >
            폴더 선택
          </p>

          <div
            style={{
              maxHeight: "200px",
              overflowY: "auto",
              marginBottom: "8px",
            }}
          >
            {lists.map((list) => (
              <div
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                style={{
                  padding: "11px 14px",
                  marginBottom: "6px",
                  border:
                    selectedListId === list.id
                      ? "1.5px solid #FF5B35"
                      : "1.5px solid #EBEBF0",
                  borderRadius: "10px",
                  cursor: "pointer",
                }}
              >
                {list.title}
              </div>
            ))}
          </div>

          <div
            onClick={() => setShowNewFolder(true)}
            style={{
              padding: "11px 14px",
              marginBottom: "16px",
              border: "1.5px dashed #EBEBF0",
              borderRadius: "10px",
              cursor: "pointer",
              textAlign: "center",
              color: "#8E8E9A",
              fontSize: "13px",
            }}
          >
            + 새 폴더
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "11px",
                border: "1.5px solid #EBEBF0",
                borderRadius: "10px",
                background: "white",
              }}
            >
              닫기
            </button>

            <button
              onClick={saveToList}
              disabled={!selectedListId}
              style={{
                flex: 1,
                padding: "11px",
                border: "none",
                borderRadius: "10px",
                background: selectedListId ? "#FF5B35" : "#EBEBF0",
                color: "white",
                fontWeight: "600",
              }}
            >
              추가
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
