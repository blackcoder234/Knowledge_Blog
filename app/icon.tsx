import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d0d0d", // Match site background
          borderRadius: "20%", // Soft square for favicon
          color: "#ffffff",
        }}
      >
        {/* Concept C: The Unified Path (Ribbon Evolution) 
             Represents: "Knowledge makes life easy" - Complexity simplified into one elegant path.
         */}
        <svg
          width="300"
          height="300"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M30 15 V 60 L 70 20 H 85 L 45 60 L 85 90 H 70 L 30 60 V 85 h -12 V 15 h 12 Z"
            fill="white"
          />
          {/* Subtle fold line for depth */}
          <path d="M30 60 L 45 60" stroke="#0d0d0d" strokeWidth="2" />
        </svg>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}
