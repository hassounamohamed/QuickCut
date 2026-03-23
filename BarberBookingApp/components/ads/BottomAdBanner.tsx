import Constants from 'expo-constants';
import { Platform, StyleSheet, View } from 'react-native';
import type { ComponentType } from 'react';

import { useAppColors } from '@/hooks/use-app-colors';

const TEST_BANNER_ANDROID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_BANNER_IOS = 'ca-app-pub-3940256099942544/2934735716';

type AdConfig = {
  admobBannerAndroidIdDev?: string;
  admobBannerIosIdDev?: string;
  admobBannerAndroidIdProd?: string;
  admobBannerIosIdProd?: string;
  admobBannerAndroidId?: string;
  admobBannerIosId?: string;
};

function isGoogleTestBannerId(unitId: string) {
  return unitId === TEST_BANNER_ANDROID || unitId === TEST_BANNER_IOS;
}

type AdsModule = {
  BannerAd: ComponentType<{
    unitId: string;
    size: string;
    requestOptions?: {
      requestNonPersonalizedAdsOnly?: boolean;
    };
  }>;
  BannerAdSize: {
    ANCHORED_ADAPTIVE_BANNER: string;
  };
  TestIds: {
    BANNER: string;
  };
};

function getBannerUnitId(ads: AdsModule) {
  const config = Constants.expoConfig?.extra as
    | AdConfig
    | undefined;

  if (__DEV__) {
    return ads.TestIds.BANNER;
  }

  if (Platform.OS === 'android') {
    const prodId =
      config?.admobBannerAndroidIdProd ||
      process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID_ID ||
      config?.admobBannerAndroidId ||
      '';
    return isGoogleTestBannerId(prodId) ? null : prodId || null;
  }

  const prodId =
    config?.admobBannerIosIdProd ||
    process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS_ID ||
    config?.admobBannerIosId ||
    '';
  return isGoogleTestBannerId(prodId) ? null : prodId || null;
}

function getAdsModule(isExpoGo: boolean) {
  if (isExpoGo) {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-google-mobile-ads') as AdsModule;
  } catch {
    return null;
  }
}

export function BottomAdBanner() {
  const { colors } = useAppColors();
  const isExpoGo = (Constants as any)?.appOwnership === 'expo';
  const ads = getAdsModule(isExpoGo);

  // Expo Go doesn't include this native module. Hide banner to keep runtime stable there.
  if (Platform.OS === 'web' || isExpoGo || !ads) {
    return null;
  }

  const adUnitID = getBannerUnitId(ads);
  if (!adUnitID) {
    return null;
  }

  const { BannerAd, BannerAdSize } = ads;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.divider }]}>
      <BannerAd
        unitId={adUnitID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 2,
  },
});
