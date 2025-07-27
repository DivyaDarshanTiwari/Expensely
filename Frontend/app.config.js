import "dotenv/config";

export default ({ config }) => {
  return {
    ...config,
    expo: {
      owner: "vilsium",
      android: {
        package: "com.vilsium.expenselyexpo"
      },
      extra: {
        eas: {
          projectId: "6d9d48a7-9f2b-4ec8-a289-0cf50de66997",
        },
        Basic_URL: process.env.Basic_URL,
        Group_URL: process.env.Group_URL,
        User_URL: process.env.User_URL,
        OCR_URL: process.env.OCR_URL,
      },
      plugins: ["expo-secure-store", "expo-router"],
    },
  };
};
