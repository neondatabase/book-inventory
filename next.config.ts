export default {
  logging: {
    fetches: {
      fullUrl: !(process.env.NODE_ENV === "production"),
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.gr-assets.com",
        port: "",
      },
    ],
  },
};
