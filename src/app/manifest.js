export default function manifest() {
  return {
    name: "YouWorship — Christian Songs, Lyrics, Audio & Videos",
    short_name: "YouWorship",
    description: "Discover thousands of Telugu, English, and Hindi Christian worship songs with lyrics, audio, and videos.",
    start_url: "/",
    display: "standalone",
    background_color: "#070707",
    theme_color: "#D4A32A",
    icons: [
      {
        src: "/youworship-logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/youworship-logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
