import { ImageResponse } from "next/og";

// Shared social card for the OpenGraph and Twitter file conventions.
//
// Deliberately restrained: brand wordmark, the locked positioning line, and
// nothing else. No product screenshot, no metrics, no logos. The real
// screenshot-led marketing visuals land with the homepage rebuild.
//
// The Operza hexagon mark is near-black with a red segment, so it disappears
// on a deep ground and there is no light variant in the repository. The card
// therefore uses the wordmark plus a brand-blue rule rather than the mark.
//
// Rendered by next/og, which ships with Next.js. No new dependency, and no
// font is fetched at build time: the built-in default face is used.

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const INK = "#05070f";
const BRAND = "#3f63f7";
const RULE = "rgba(255,255,255,0.06)";

/** Evenly spaced hairlines standing in for the industrial grid used on the
 *  site's deep sections. Drawn as elements because Satori does not tile a
 *  repeating background reliably. */
function GridLines() {
  const columns = [];
  for (let x = 100; x < OG_SIZE.width; x += 100) {
    columns.push(
      <div
        key={x}
        style={{
          position: "absolute",
          left: x,
          top: 0,
          width: 1,
          height: OG_SIZE.height,
          backgroundColor: RULE,
        }}
      />,
    );
  }
  for (let y = 100; y < OG_SIZE.height; y += 100) {
    columns.push(
      <div
        key={`r${y}`}
        style={{
          position: "absolute",
          left: 0,
          top: y,
          width: OG_SIZE.width,
          height: 1,
          backgroundColor: RULE,
        }}
      />,
    );
  }
  return (
    <div style={{ display: "flex", position: "absolute", left: 0, top: 0 }}>
      {columns}
    </div>
  );
}

export function renderOgCard() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: INK,
          padding: 80,
          position: "relative",
        }}
      >
        <GridLines />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            position: "relative",
          }}
        >
          <div
            style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: BRAND }}
          />
          <div
            style={{
              fontSize: 34,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: -0.5,
            }}
          >
            Operza
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: 26,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            Manufacturing software for Indian factories
          </div>
          <div
            style={{
              marginTop: 26,
              fontSize: 74,
              lineHeight: 1.08,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: -2,
              maxWidth: 940,
            }}
          >
            Run the factory and the books in one system.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            position: "relative",
          }}
        >
          <div style={{ width: 72, height: 4, backgroundColor: BRAND }} />
          <div style={{ fontSize: 26, color: "rgba(255,255,255,0.65)" }}>
            operza.in
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
