import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppTheme, Colors } from "@/constants/theme";
import { bannerAdUnitId, areAdsSupported } from "@/constants/ads";
import { googleMobileAds, isGoogleMobileAdsAvailable } from "@/services/google-mobile-ads";

type AdBannerProps = {
  palette: (typeof Colors)["light"];
};

export function AdBanner({ palette }: AdBannerProps) {
  const [hasFailed, setHasFailed] = useState(false);
  const BannerAd = googleMobileAds?.BannerAd;
  const BannerAdSize = googleMobileAds?.BannerAdSize;

  if (
    !areAdsSupported ||
    !isGoogleMobileAdsAvailable ||
    !bannerAdUnitId ||
    hasFailed ||
    !BannerAd ||
    !BannerAdSize
  ) {
    return null;
  }

  return (
    <View style={[styles.shell, { borderColor: palette.border, backgroundColor: palette.card }]}>
      <BannerAd
        unitId={bannerAdUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => setHasFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: "center",
    borderRadius: AppTheme.radius.md,
    borderWidth: AppTheme.borderWidth.soft,
    marginTop: AppTheme.spacing.lg,
    overflow: "hidden",
    paddingVertical: AppTheme.spacing.sm,
  },
});
