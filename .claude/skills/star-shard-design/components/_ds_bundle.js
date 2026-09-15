/* @ds-bundle: {"namespace":"StarShardDS","components":[{"name":"Button","sourcePath":"components/general/Button/Button.jsx"},{"name":"Input","sourcePath":"components/general/Input/Input.jsx"},{"name":"ShardCard","sourcePath":"components/general/ShardCard/ShardCard.jsx"},{"name":"TarotCard","sourcePath":"components/general/TarotCard/TarotCard.jsx"},{"name":"Taskbar","sourcePath":"components/general/Taskbar/Taskbar.jsx"},{"name":"Window","sourcePath":"components/general/Window/Window.jsx"}],"builtBy":"cc-design-sync-v2"} */
"use strict";
var StarShardDS = (() => {
  var require_react_shim = (() => {
    var mod = { exports: {} };
    var R = window.React;
    function np(p, k) {
      var o = {};
      for (var x in p) if (x !== "children") o[x] = p[x];
      if (k !== void 0) o.key = k;
      return o;
    }
    function jsx(t, p, k) {
      var c = p && p.children;
      return c === void 0 ? R.createElement(t, np(p, k)) : R.createElement(t, np(p, k), c);
    }
    function jsxs(t, p, k) {
      return R.createElement.apply(R, [t, np(p, k)].concat(p.children));
    }
    mod.exports = R;
    mod.exports.jsx = jsx;
    mod.exports.jsxs = jsxs;
    mod.exports.jsxDEV = function(t, p, k, s) { return (s ? jsxs : jsx)(t, p, k); };
    mod.exports.Fragment = R.Fragment;
    return mod.exports;
  })();
  var jsx = require_react_shim.jsx;
  var jsxs = require_react_shim.jsxs;
  var useState = require_react_shim.useState;
  var useId = require_react_shim.useId;

  // Window — a bordered content panel. The v1 Windows-95 title bar
  // (gradient fill, minimize/close controls) is retired along with the
  // rest of that direction; this is a plain parchment-bordered box with
  // an optional Cormorant Garamond title line. No window chrome, because
  // the live product has none — every screen is full-bleed.
  function Window({ title, icon, children, style }) {
    return /* @__PURE__ */ jsxs(
      "div",
      {
        style: {
          background: "radial-gradient(120% 60% at 50% 0%, var(--bg-top,#1E1706) 0%, var(--bg-mid,#0F0B03) 55%, var(--bg-bottom,#080502) 100%)",
          border: "1px solid rgba(240,216,154,.2)",
          borderRadius: 0,
          color: "var(--ink,#F2EAD6)",
          ...style
        },
        children: [
          title && /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                padding: "16px 20px 8px",
                fontFamily: "'Cormorant Garamond',serif",
                fontWeight: 600,
                fontSize: "24px",
                color: "var(--ink,#F2EAD6)"
              },
              children: (icon ? icon + " " : "") + title
            }
          ),
          /* @__PURE__ */ jsx("div", { style: { padding: "20px" }, children })
        ]
      }
    );
  }

  // Button — the real onboarding-form button pattern. No bevel, no
  // press-translate. Armed/primary state reads as a filled parchment
  // glow; amber is deliberately NOT used here — amber is reserved for
  // "tonight," never for a generic UI action.
  var VARIANT_STYLE = {
    primary: { background: "rgba(240,216,154,.12)", border: "1px solid #F0D89A", color: "#F0D89A" },
    secondary: { background: "none", border: "1px solid rgba(240,216,154,.35)", color: "#F0D89A" },
    tertiary: { background: "none", border: "none", color: "#9A8A5E" }
  };
  function Button({ variant = "primary", type = "button", disabled, onClick, children, style, ...rest }) {
    const [hover, setHover] = useState(false);
    const v = VARIANT_STYLE[variant] || VARIANT_STYLE.primary;
    return /* @__PURE__ */ jsx(
      "button",
      {
        type,
        disabled,
        onClick,
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => setHover(false),
        style: {
          minHeight: "44px",
          padding: "13px 26px",
          fontFamily: "'Varela Round',sans-serif",
          fontSize: "12.5px",
          borderRadius: 0,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.4 : 1,
          transition: "all .35s ease",
          ...v,
          ...(hover && !disabled ? { color: "#FFFDF5" } : {}),
          ...style
        },
        ...rest,
        children
      }
    );
  }

  // Input — the real bottom-border pattern from the live onboarding
  // forms (Star Shard v4's birth-date fields, Manzil's birth screen).
  // Label is lowercase, small, muted — the calm-pass law explicitly
  // bans uppercase/letterspaced labels, which is what the retired
  // Pixelify-eyebrow style used.
  function Input({ label, id, hint, style, ...rest }) {
    const auto = useId();
    const inputId = id || auto;
    return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "8px" }, children: [
      label && /* @__PURE__ */ jsx(
        "label",
        {
          htmlFor: inputId,
          style: {
            fontFamily: "'Varela Round',sans-serif",
            fontSize: "11px",
            color: "#9A8A5E"
          },
          children: label
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: inputId,
          style: {
            background: "none",
            border: "none",
            borderBottom: "1px solid rgba(240,216,154,.3)",
            borderRadius: 0,
            padding: "8px 2px",
            minHeight: "44px",
            width: "100%",
            boxSizing: "border-box",
            fontFamily: "'Varela Round',sans-serif",
            fontSize: "17px",
            color: "#F2EAD6",
            outline: "none",
            ...style
          },
          ...rest
        }
      ),
      hint && /* @__PURE__ */ jsx("div", { style: { fontSize: "11px", color: "#9A8A5E" }, children: hint })
    ] });
  }

  // TabBar (exported as Taskbar for continuity with the existing
  // manifest/prop shape) — the real interaction law: exactly three
  // destinations, navigation only, never actions. Active item reads in
  // parchment; inactive in muted ink. This replaces the v1 desktop
  // taskbar concept, which doesn't exist in a phone-first single-page app.
  function Taskbar({ start, children, trailing }) {
    return /* @__PURE__ */ jsxs(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          gap: "8px",
          padding: "14px 16px",
          background: "#040302",
          borderTop: "1px solid rgba(240,216,154,.15)",
          fontFamily: "'Varela Round',sans-serif",
          fontSize: "12px",
          color: "#9A8A5E"
        },
        children: [start, children, trailing]
      }
    );
  }

  // ShardCard — a reading/finding panel: eyebrow, title, body. The old
  // kind="house"|"mirror"|"moon"|"hearth" enum belonged to the retired
  // four-shard system and is dropped rather than carried forward
  // guessed at — pass your own eyebrow string instead.
  function ShardCard({ eyebrow, title, body, revealed = true, onReveal, style }) {
    return /* @__PURE__ */ jsxs(
      "div",
      {
        onClick: revealed ? void 0 : onReveal,
        style: {
          background: "none",
          border: "1px solid rgba(240,216,154,.2)",
          borderRadius: 0,
          padding: "20px",
          cursor: revealed ? "default" : "pointer",
          minHeight: "44px",
          ...style
        },
        children: [
          eyebrow && /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                fontFamily: "'Varela Round',sans-serif",
                fontSize: "11px",
                color: "#9A8A5E",
                marginBottom: "8px"
              },
              children: revealed ? eyebrow : "tap to reveal"
            }
          ),
          /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                fontFamily: "'Cormorant Garamond',serif",
                fontWeight: 600,
                fontSize: "22px",
                color: "#F2EAD6",
                marginBottom: body ? "8px" : 0
              },
              children: revealed ? title : "···"
            }
          ),
          revealed && body && /* @__PURE__ */ jsx(
            "div",
            {
              style: { fontFamily: "'Varela Round',sans-serif", fontSize: "13.5px", color: "#D8C89C", lineHeight: 1.6 },
              children: body
            }
          )
        ]
      }
    );
  }

  // StationCard (exported as TarotCard for continuity) — one of the 28
  // lunar mansions, as it actually renders in the Sigil/Manzil surfaces:
  // a plain numeral 1-28 (not a roman-numeral tarot conceit), the
  // mansion's epithet, and commissioned art with a plain ☾ placeholder.
  // No foil/rare treatment or card-context color inversion — both were
  // retired along with TarotCard's tarot framing.
  function TarotCard({ numeral = 1, name = "", epithet = "", art, faceDown = false, width = 216, onFlip, style }) {
    const base = {
      width,
      aspectRatio: "3 / 4",
      background: "radial-gradient(90% 120% at 50% 30%, #120D06 0%, #0A0603 55%, #050302 100%)",
      border: "1px solid rgba(240,216,154,.2)",
      borderRadius: "6px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      padding: "16px 14px",
      cursor: onFlip ? "pointer" : "default",
      color: "#F2EAD6",
      ...style
    };
    if (faceDown) {
      return /* @__PURE__ */ jsxs(
        "div",
        {
          onClick: onFlip,
          style: { ...base, alignItems: "center", justifyContent: "center" },
          children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: width * 0.3, color: "#9A8A5E" }, children: "☾" }),
            /* @__PURE__ */ jsx("div", { style: { fontFamily: "'Varela Round',sans-serif", fontSize: "11px", color: "#9A8A5E" }, children: "tap to turn" })
          ]
        }
      );
    }
    return /* @__PURE__ */ jsxs(
      "div",
      {
        onClick: onFlip,
        style: base,
        children: [
          /* @__PURE__ */ jsxs("div", { style: { fontFamily: "'Varela Round',sans-serif", fontSize: "11px", color: "#9A8A5E" }, children: [
            "mansion ",
            numeral,
            " of 28"
          ] }),
          /* @__PURE__ */ jsx("div", { style: { fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, fontSize: "19px", lineHeight: 1.15 }, children: name }),
          epithet && /* @__PURE__ */ jsx("div", { style: { fontSize: "11px", color: "#F0D89A" }, children: epithet }),
          /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                flex: 1,
                minHeight: 0,
                margin: "6px 0",
                border: "1px solid rgba(240,216,154,.15)",
                background: "rgba(240,216,154,.03)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden"
              },
              children: art ? /* @__PURE__ */ jsx("img", { src: art, alt: "", style: { width: "100%", height: "100%", objectFit: "cover" } }) : /* @__PURE__ */ jsx("span", { style: { fontSize: 32, color: "#9A8A5E" }, children: "☾" })
            }
          )
        ]
      }
    );
  }

  return { Window, Button, Input, Taskbar, ShardCard, TarotCard };
})();
window.StarShardDS = StarShardDS;
