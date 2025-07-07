import "dotenv/config";

export default ({ config }) => {
  return {
    ...config,
    extra: {
      Basic_URL: process.env.Basic_URL,
      Group_URL: process.env.Group_URL,
      User_URL: process.env.User_URL,
      OCR_URL: process.env.OCR_URL,
    },
  };
};
