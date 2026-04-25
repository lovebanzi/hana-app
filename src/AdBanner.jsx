import { useState, useEffect } from "react";

export default function AdBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hide = localStorage.getItem("hideAdBanner");
    if (!hide) setShow(true);
  }, []);

  if (!show) return null;

  const close = () => setShow(false);
  const dontShow = () => {
    localStorage.setItem("hideAdBanner", "1");
    setShow(false);
  };
  const goNaver = () => {
    window.open(
      "https://smartstore.naver.com/coolpick_official/products/13053434584?is_retargeting=true&c=260101_p_Naver_product&pid=Naver",
      "_blank"
    );
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: 20, animation: "fadeIn 0.25s ease"
    }}>
      <div style={{
        background: "#fff", borderRadius: 24, maxWidth: 360, width: "100%",
        overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        position: "relative", animation: "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)"
      }}>
        <button onClick={close} style={{
          position: "absolute", top: 12, right: 12, width: 32, height: 32,
          borderRadius: "50%", background: "rgba(0,0,0,0.5)", color: "#fff",
          border: "none", fontSize: 16, cursor: "pointer", zIndex: 2,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>✕</button>

        <div onClick={goNaver} style={{
          background: "linear-gradient(135deg, #03C75A 0%, #00A04A 100%)",
          padding: "40px 20px", textAlign: "center", cursor: "pointer", color: "#fff"
        }}>
          <div style={{ fontSize: 70, marginBottom: 8 }}>🪥</div>
          <div style={{
            background: "rgba(255,255,255,0.25)", display: "inline-block",
            padding: "4px 12px", borderRadius: 20, fontSize: 11,
            fontWeight: 700, marginBottom: 10, letterSpacing: 0.5
          }}>NAVER 추천</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6, lineHeight: 1.3 }}>
            아동을 위한 칫솔
          </div>
          <div style={{ fontSize: 13, opacity: 0.95, marginBottom: 4 }}>
            우리 아이 입에 안전한 칫솔 🌟
          </div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>
            네이버 스마트스토어에서 만나보세요
          </div>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", gap: 8 }}>
          <button onClick={dontShow} style={{
            flex: 1, background: "#f5f5f5", color: "#666", border: "none",
            borderRadius: 12, padding: "12px", fontSize: 13, fontWeight: 700,
            cursor: "pointer"
          }}>그만 보기</button>
          <button onClick={goNaver} style={{
            flex: 2, background: "linear-gradient(135deg, #03C75A, #00A04A)",
            color: "#fff", border: "none", borderRadius: 12, padding: "12px",
            fontSize: 13, fontWeight: 800, cursor: "pointer",
            boxShadow: "0 4px 12px rgba(3,199,90,0.35)"
          }}>네이버에서 보기 →</button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.85) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
