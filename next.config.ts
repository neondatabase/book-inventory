export default {
  experimental: {
    ppr: true,
  },
  logging: {
    fetches: {
      fullUrl: !(process.env.NODE_ENV === "production"),
    },
  },
};
