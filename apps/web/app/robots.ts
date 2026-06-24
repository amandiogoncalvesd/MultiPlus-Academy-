import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL || "https://multiplusacademy.com";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/(aluno)", "/(professor)", "/(admin)", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
