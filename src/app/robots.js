export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/*?tab=",
        "/*?view=",
        "/*?redirect=",
        "/*?playlistId=",
      ],
    },
    sitemap: "https://youworship.world/sitemap.xml",
  };
}

