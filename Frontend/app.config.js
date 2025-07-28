import "dotenv/config";

export default ({ config }) => {
  return {
    ...config,
    expo: {
      owner: "divya1611",
      extra: {
        eas: {
          projectId: "13c177f1-ec36-403e-b61f-7b843915ac6a",
        },
        Basic_URL: process.env.Basic_URL,
        Group_URL: process.env.Group_URL,
        User_URL: process.env.User_URL,
        OCR_URL: process.env.OCR_URL,
      },
      android: {
        googleServicesFile: "./google-services.json",
        package: "com.application.expensely",
      },
      ios: {
        googleServicesFile: "./GoogleService-Info.plist",
        bundleIdentifier: "com.mycorp.myapp",
      },
      plugins: [
        "@react-native-firebase/app",
        "@react-native-firebase/auth",
        "@react-native-firebase/crashlytics",
        "expo-secure-store",
        "expo-router",
        [
          "expo-build-properties",
          {
            ios: {
              useFrameworks: "static",
            },
          },
        ],
      ],
    },
  };
};
