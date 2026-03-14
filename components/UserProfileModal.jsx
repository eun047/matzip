"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const DIETARY_OPTIONS = ["채식주의", "비건", "할랄"];
const ALLERGY_OPTIONS = ["돼지고기", "소고기", "해산물", "유제품"];

export default function UserProfileModal({ onClose }) {
  const [dietary, setDietary] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [profileId, setProfileId] = useState(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data } = await supabase.from("user_profile").select("*").single();
    if (data) {
      setProfileId(data.id);
      setDietary(data.dietary || []);
      setAllergies(data.allergies || []);
    }
  };

  const toggleItem = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const saveProfile = async () => {
    if (profileId) {
      await supabase
        .from("user_profile")
        .update({
          dietary,
          allergies,
        })
        .eq("id", profileId);
    } else {
      await supabase.from("user_profile").insert({
        dietary,
        allergies,
      });
    }

    setToast(true);
    setTimeout(() => {
      setToast(false);
      onClose();
    }, 1500);
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
          ✅ 저장 완료!
        </div>
      )}

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "24px",
            width: "320px",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          }}
        >
          {/* 헤더 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "20px",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FF5B35"
              strokeWidth="2"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            <h3 style={{ fontWeight: "700", fontSize: "16px" }}>
              내 식사 정보
            </h3>
          </div>

          {/* 식이 제한 */}
          <p
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#8E8E9A",
              marginBottom: "10px",
            }}
          >
            식이 제한
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "20px",
            }}
          >
            {DIETARY_OPTIONS.map((item) => (
              <div
                key={item}
                onClick={() => toggleItem(dietary, setDietary, item)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                  background: dietary.includes(item) ? "#FF5B35" : "#F7F8FA",
                  color: dietary.includes(item) ? "white" : "#1A1A2E",
                  border: dietary.includes(item)
                    ? "none"
                    : "1.5px solid #EBEBF0",
                  transition: "all 0.15s",
                }}
              >
                {item}
              </div>
            ))}
          </div>

          {/* 알레르기 */}
          <p
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#8E8E9A",
              marginBottom: "10px",
            }}
          >
            알레르기
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "24px",
            }}
          >
            {ALLERGY_OPTIONS.map((item) => (
              <div
                key={item}
                onClick={() => toggleItem(allergies, setAllergies, item)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                  background: allergies.includes(item) ? "#FF5B35" : "#F7F8FA",
                  color: allergies.includes(item) ? "white" : "#1A1A2E",
                  border: allergies.includes(item)
                    ? "none"
                    : "1.5px solid #EBEBF0",
                  transition: "all 0.15s",
                }}
              >
                {item}
              </div>
            ))}
          </div>

          {/* 버튼 */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "11px",
                border: "1.5px solid #EBEBF0",
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
              onClick={saveProfile}
              style={{
                flex: 1,
                padding: "11px",
                border: "none",
                borderRadius: "10px",
                background: "#FF5B35",
                color: "white",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
