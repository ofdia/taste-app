import { Platform } from "react-native";

const ANDROID_BANNER_UNIT_ID = "ca-app-pub-5629756854824345/8904058076";
const IOS_BANNER_UNIT_ID = "";
const ANDROID_TEST_BANNER_UNIT_ID = "ca-app-pub-3940256099942544/6300978111";
const IOS_TEST_BANNER_UNIT_ID = "ca-app-pub-3940256099942544/2934735716";

export const bannerAdUnitId =
  __DEV__
    ? Platform.select({
        android: ANDROID_TEST_BANNER_UNIT_ID,
        ios: IOS_TEST_BANNER_UNIT_ID,
        default: "",
      }) ?? ""
    : Platform.select({
        android: ANDROID_BANNER_UNIT_ID || ANDROID_TEST_BANNER_UNIT_ID,
        ios: IOS_BANNER_UNIT_ID || IOS_TEST_BANNER_UNIT_ID,
        default: "",
      }) ?? "";

export const areAdsSupported = Platform.OS === "android" || Platform.OS === "ios";
