import Constants from "expo-constants";

const isExpoGo =
  Constants.appOwnership === "expo" || Constants.executionEnvironment === "storeClient";

let googleMobileAdsModule: any | null = null;

if (!isExpoGo) {
  try {
    googleMobileAdsModule = require("react-native-google-mobile-ads");
  } catch (error) {
    console.warn("Google Mobile Ads module is unavailable in this runtime.", error);
  }
}

export const isGoogleMobileAdsAvailable = Boolean(googleMobileAdsModule);
export const googleMobileAds = googleMobileAdsModule;
