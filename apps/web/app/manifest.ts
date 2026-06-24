import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MultiPlus Academy LMS & Website",
    short_name: "MultiPlus",
    description: "Plataforma Educacional Premium de Língua Inglesa - MultiPlus Academy",
    start_url: "/",
    display: "standalone",
    background_color: "#0A2E5D",
    theme_color: "#C89B3C",
    icons: [
      {
        src: "https://res.cloudinary.com/deeki0eou/image/upload/v1780311906/logo-com-fundo-branco_rt0kng.jpg",
        sizes: "192x192",
        type: "image/jpeg",
      }
    ],
  };
}
