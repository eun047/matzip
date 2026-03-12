"use client";

import { useState } from "react";

const COLORS = [
  { value: "red", label: "빨강" },
  { value: "yellow", label: "노랑" },
  { value: "blue", label: "파랑" },
  { value: "green", label: "초록" },
  { value: "purple", label: "보라" },
];

export default function EditModal({ type, data, onClose, onSave }) {
  return (
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
          width: "280px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        }}
      >
        {type === "color" && (
          <ColorEdit data={data} onClose={onClose} onSave={onSave} />
        )}
        {type === "folder" && (
          <FolderEdit data={data} onClose={onClose} onSave={onSave} />
        )}
        {type === "delete" && (
          <DeleteConfirm
            data={data}
            onClose={onClose}
            onSave={onSave}
            message={
              <>
                <span style={{ fontWeight: "600", color: "#1A1A2E" }}>
                  {data.name}
                </span>
                을 삭제할까요?
              </>
            }
          />
        )}
        {type === "deleteFolder" && (
          <DeleteConfirm
            data={data}
            onClose={onClose}
            onSave={onSave}
            message={
              <>
                <span style={{ fontWeight: "600", color: "#1A1A2E" }}>
                  "{data.title}"
                </span>{" "}
                폴더와 안에 있는 맛집들이 모두 삭제돼요.
              </>
            }
          />
        )}
      </div>
    </div>
  );
}

function ColorEdit({ data, onClose, onSave }) {
  const [selected, setSelected] = useState(data.marker_color || "red");

  return (
    <div>
      <h3 style={{ fontWeight: "700", fontSize: "16px", marginBottom: "4px" }}>
        마커 색깔 변경
      </h3>
      <p style={{ fontSize: "13px", color: "#8E8E9A", marginBottom: "20px" }}>
        {data.name}
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        {COLORS.map((color) => (
          <div
            key={color.value}
            onClick={() => setSelected(color.value)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: color.value,
                border:
                  selected === color.value
                    ? "3px solid #1A1A2E"
                    : "3px solid transparent",
                transition: "border 0.2s",
              }}
            />
            <span style={{ fontSize: "10px", color: "#8E8E9A" }}>
              {color.label}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={onClose} style={cancelBtnStyle}>
          취소
        </button>
        <button onClick={() => onSave(selected)} style={saveBtnStyle}>
          저장
        </button>
      </div>
    </div>
  );
}

function FolderEdit({ data, onClose, onSave }) {
  const [name, setName] = useState(data.title);

  return (
    <div>
      <h3 style={{ fontWeight: "700", fontSize: "16px", marginBottom: "20px" }}>
        폴더 이름 수정
      </h3>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSave(name)}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "1.5px solid #EBEBF0",
          borderRadius: "10px",
          fontSize: "14px",
          outline: "none",
          marginBottom: "16px",
          boxSizing: "border-box",
        }}
        autoFocus
      />
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={onClose} style={cancelBtnStyle}>
          취소
        </button>
        <button onClick={() => onSave(name)} style={saveBtnStyle}>
          저장
        </button>
      </div>
    </div>
  );
}

function DeleteConfirm({ onClose, onSave, message }) {
  return (
    <div>
      <h3 style={{ fontWeight: "700", fontSize: "16px", marginBottom: "8px" }}>
        삭제
      </h3>
      <p style={{ fontSize: "13px", color: "#8E8E9A", marginBottom: "24px" }}>
        {message}
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={onClose} style={cancelBtnStyle}>
          취소
        </button>
        <button
          onClick={() => onSave("delete")}
          style={{ ...saveBtnStyle, background: "#ef4444" }}
        >
          삭제
        </button>
      </div>
    </div>
  );
}

const cancelBtnStyle = {
  flex: 1,
  padding: "10px",
  border: "1px solid #EBEBF0",
  borderRadius: "10px",
  background: "white",
  cursor: "pointer",
  fontSize: "14px",
  color: "#8E8E9A",
};

const saveBtnStyle = {
  flex: 1,
  padding: "10px",
  border: "none",
  borderRadius: "10px",
  background: "#FF5B35",
  color: "white",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
};
