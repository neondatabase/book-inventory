export default {
  logging: {
    fetches: {
      fullUrl: !(process.env.NODE_ENV === "production"),
    },
  },
};
