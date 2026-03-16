import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DatePickerModal } from "@/components/date-picker-modal";
import {
  BROTH_SALTINESS_OPTIONS,
  NOODLE_FIRMNESS_OPTIONS,
  OIL_AMOUNT_OPTIONS,
} from "@/constants/ramen-options";
import { RAMEN_TYPES } from "@/constants/ramen";
import { AppTheme, Colors, Fonts } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { formatDateInput, formatDisplayDate } from "@/services/log-date";
import { saveUserRamenShop, searchRamenShops } from "@/services/shop-search";
import AsyncStorage from "@/services/storage";
import type { FoodLog } from "@/types/food-log";

export default function EditFoodScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const insets = useSafeAreaInsets();
  const palette = Colors[colorScheme];
  const styles = getStyles(palette, insets.top);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [restaurant, setRestaurant] = useState("");
  const [menu, setMenu] = useState("");
  const [ramenType, setRamenType] = useState("");
  const [brothSaltiness, setBrothSaltiness] = useState("");
  const [noodleFirmness, setNoodleFirmness] = useState("");
  const [oilAmount, setOilAmount] = useState("");
  const [rating, setRating] = useState("");
  const [review, setReview] = useState("");
  const [photoUri, setPhotoUri] = useState("");
  const [visitedOn, setVisitedOn] = useState(formatDateInput(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [shopSuggestions, setShopSuggestions] = useState<string[]>([]);
  const [isSearchingShops, setIsSearchingShops] = useState(false);

  useEffect(() => {
    const loadFoodLog = async () => {
      try {
        const savedLogs = await AsyncStorage.getItem("foodLogs");
        const logs: FoodLog[] = savedLogs ? JSON.parse(savedLogs) : [];
        const targetLog = logs.find((log) => log.id === id);

        if (!targetLog) {
          Alert.alert("오류", "수정할 기록을 찾을 수 없습니다.");
          router.back();
          return;
        }

        setRestaurant(targetLog.restaurant || "");
        setMenu(targetLog.menu || "");
        setRamenType(targetLog.ramenType || "");
        setBrothSaltiness(targetLog.brothSaltiness || "");
        setNoodleFirmness(targetLog.noodleFirmness || "");
        setOilAmount(targetLog.oilAmount || "");
        setRating(targetLog.rating || "");
        setReview(targetLog.review || "");
        setPhotoUri(targetLog.photoUri || "");
        setVisitedOn(targetLog.visitedOn || formatDateInput(new Date(targetLog.createdAt)));
      } catch (error) {
        console.error(error);
        Alert.alert("오류", "기록을 불러오는 중 문제가 발생했습니다.");
      }
    };

    if (id) {
      loadFoodLog();
    }
  }, [id]);

  useEffect(() => {
    const keyword = restaurant.trim();

    if (!showResults || !keyword) {
      setShopSuggestions([]);
      setIsSearchingShops(false);
      return;
    }

    let active = true;
    const timeoutId = setTimeout(async () => {
      setIsSearchingShops(true);
      const results = await searchRamenShops(keyword);

      if (!active) {
        return;
      }

      setShopSuggestions(results);
      setIsSearchingShops(false);
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [restaurant, showResults]);

  const handleSelectShop = (shop: string) => {
    setRestaurant(shop);
    setShowResults(false);
    setShopSuggestions([]);
  };

  const pickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("권한 필요", "사진을 추가하려면 사진 라이브러리 접근 권한이 필요합니다.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled) {
        setPhotoUri(result.assets[0]?.uri ?? "");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("오류", "사진을 불러오는 중 문제가 발생했습니다.");
    }
  };

  const updateFoodLog = async () => {
    if (!restaurant.trim() || !menu.trim()) {
      Alert.alert("입력 확인", "가게 이름과 메뉴 이름을 입력해 주세요.");
      return;
    }

    try {
      const savedLogs = await AsyncStorage.getItem("foodLogs");
      const logs: FoodLog[] = savedLogs ? JSON.parse(savedLogs) : [];

      const updatedLogs = logs.map((log) =>
        log.id === id
          ? {
              ...log,
              restaurant: restaurant.trim(),
              menu: menu.trim(),
              ramenType,
              brothSaltiness,
              noodleFirmness,
              oilAmount,
              rating,
              review: review.trim(),
              photoUri: photoUri || undefined,
              visitedOn,
            }
          : log,
      );

      await AsyncStorage.setItem("foodLogs", JSON.stringify(updatedLogs));
      await saveUserRamenShop(restaurant);

      Alert.alert("수정 완료", "라멘 기록이 수정되었습니다.");
      router.push("/explore");
    } catch (error) {
      console.error(error);
      Alert.alert("오류", "수정 중 문제가 발생했습니다.");
    }
  };

  return (
    <>
      <DatePickerModal
        value={visitedOn}
        visible={showDatePicker}
        colorScheme={colorScheme}
        onClose={() => setShowDatePicker(false)}
        onSelect={setVisitedOn}
      />

      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={24}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.kicker}>EDIT ENTRY</Text>
          <Text style={styles.title}>기록 수정</Text>
          <Text style={styles.subtitle}>
            기존 기록을 업데이트하고 옵션 값도 함께 조정할 수 있습니다.
          </Text>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>가게와 메뉴</Text>

            <Text style={styles.inputLabel}>가게 검색</Text>
            <TextInput
              style={styles.input}
              placeholder="가게 이름을 입력해 주세요"
              placeholderTextColor={palette.muted}
              value={restaurant}
              onChangeText={(text) => {
                setRestaurant(text);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
            />

            <Text style={styles.searchHint}>
              자주 입력한 가게 이름과 검색 결과를 아래 추천 목록에서 바로 선택할 수 있습니다.
            </Text>

            {showResults && restaurant.trim().length > 0 ? (
              <View style={styles.searchResultBox}>
                {isSearchingShops ? (
                  <View style={styles.searchResultItem}>
                    <Text style={styles.noResultText}>검색 중...</Text>
                  </View>
                ) : shopSuggestions.length > 0 ? (
                  shopSuggestions.map((shop) => (
                    <Pressable
                      key={shop}
                      style={styles.searchResultItem}
                      onPress={() => handleSelectShop(shop)}
                    >
                      <Text style={styles.searchResultText}>{shop}</Text>
                    </Pressable>
                  ))
                ) : (
                  <View style={styles.searchResultItem}>
                    <Text style={styles.noResultText}>검색 결과가 없습니다.</Text>
                  </View>
                )}
              </View>
            ) : null}

            <Text style={styles.inputLabel}>메뉴 이름</Text>
            <TextInput
              style={styles.input}
              placeholder="먹은 메뉴를 입력해 주세요"
              placeholderTextColor={palette.muted}
              value={menu}
              onChangeText={setMenu}
            />

            <Text style={styles.inputLabel}>방문 날짜</Text>
            <Pressable style={styles.dateField} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateFieldText}>{formatDisplayDate(visitedOn)}</Text>
              <Text style={styles.dateFieldHint}>캘린더 열기</Text>
            </Pressable>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>라멘 타입</Text>
            <View style={styles.optionWrap}>
              {RAMEN_TYPES.map((type) => (
                <Pressable
                  key={type}
                  style={[styles.typeButton, ramenType === type && styles.typeButtonSelected]}
                  onPress={() => setRamenType(type)}
                >
                  <Text
                    style={[styles.typeButtonText, ramenType === type && styles.typeButtonTextSelected]}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>옵션</Text>

            <Text style={styles.optionGroupLabel}>염도</Text>
            <View style={styles.ratingRow}>
              {BROTH_SALTINESS_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={[styles.optionChip, brothSaltiness === option && styles.optionChipSelected]}
                  onPress={() => setBrothSaltiness(option)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      brothSaltiness === option && styles.optionChipTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.optionGroupLabel}>면의 삶기</Text>
            <View style={styles.optionRow}>
              {NOODLE_FIRMNESS_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={[styles.optionChip, noodleFirmness === option && styles.optionChipSelected]}
                  onPress={() => setNoodleFirmness(option)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      noodleFirmness === option && styles.optionChipTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.optionGroupLabel}>기름양</Text>
            <View style={styles.optionRow}>
              {OIL_AMOUNT_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={[styles.optionChip, oilAmount === option && styles.optionChipSelected]}
                  onPress={() => setOilAmount(option)}
                >
                  <Text
                    style={[styles.optionChipText, oilAmount === option && styles.optionChipTextSelected]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>만족도</Text>
            <View style={styles.optionRow}>
              {[1, 2, 3, 4, 5].map((num) => (
                <Pressable
                  key={num}
                  style={[styles.optionButton, rating === String(num) && styles.optionButtonSelected]}
                  onPress={() => setRating(String(num))}
                >
                  <Text style={[styles.optionText, rating === String(num) && styles.optionTextSelected]}>
                    {num}점
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>사진</Text>
            <Pressable style={styles.photoButton} onPress={pickPhoto}>
              <Text style={styles.photoButtonText}>{photoUri ? "사진 다시 선택" : "사진 추가"}</Text>
            </Pressable>

            {photoUri ? (
              <View style={styles.photoPreviewWrap}>
                <Image source={photoUri} style={styles.photoPreview} contentFit="cover" />
                <Pressable style={styles.photoRemoveButton} onPress={() => setPhotoUri("")}>
                  <Text style={styles.photoRemoveButtonText}>사진 제거</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.photoHelperText}>기록과 함께 사진을 저장할 수 있습니다.</Text>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>리뷰</Text>
            <TextInput
              style={styles.reviewInput}
              placeholder="기록을 더 자세하게 남겨 보세요"
              placeholderTextColor={palette.muted}
              value={review}
              onChangeText={setReview}
              multiline
              textAlignVertical="top"
            />
          </View>

          <Pressable style={styles.saveButton} onPress={updateFoodLog}>
            <Text style={styles.saveButtonText}>수정 저장</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const getStyles = (palette: (typeof Colors)["light"], topInset: number) =>
  StyleSheet.create({
    keyboardWrap: { flex: 1 },
    container: {
      padding: AppTheme.spacing.lg,
      paddingTop: topInset + 16,
      paddingBottom: 120,
      backgroundColor: palette.background,
    },
    kicker: {
      color: palette.tint,
      fontSize: 12,
      letterSpacing: 2,
      fontWeight: "800",
      marginBottom: 10,
    },
    title: {
      color: palette.text,
      fontSize: 30,
      fontWeight: "800",
      fontFamily: Fonts?.rounded,
      marginBottom: 8,
    },
    subtitle: {
      color: palette.muted,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 22,
    },
    sectionCard: {
      backgroundColor: palette.card,
      borderRadius: AppTheme.radius.lg,
      padding: AppTheme.spacing.lg,
      borderWidth: 1,
      borderColor: palette.border,
      marginBottom: 14,
      ...AppTheme.shadow,
    },
    sectionTitle: {
      color: palette.text,
      fontSize: 19,
      fontWeight: "800",
      marginBottom: 14,
    },
    inputLabel: {
      color: palette.muted,
      fontSize: 13,
      fontWeight: "700",
      marginBottom: 8,
      marginTop: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: 14,
      paddingVertical: 14,
      marginBottom: 8,
      borderRadius: AppTheme.radius.sm,
      backgroundColor: palette.background,
      color: palette.text,
      fontSize: 15,
    },
    dateField: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: AppTheme.radius.sm,
      backgroundColor: palette.background,
      paddingHorizontal: 14,
      paddingVertical: 14,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dateFieldText: {
      color: palette.text,
      fontSize: 15,
      fontWeight: "700",
    },
    dateFieldHint: {
      color: palette.tint,
      fontSize: 13,
      fontWeight: "700",
    },
    searchHint: {
      color: palette.muted,
      fontSize: 12,
      lineHeight: 18,
      marginBottom: 12,
    },
    searchResultBox: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: AppTheme.radius.sm,
      backgroundColor: palette.background,
      marginTop: -4,
      marginBottom: 12,
      overflow: "hidden",
    },
    searchResultItem: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    searchResultText: {
      fontSize: 15,
      color: palette.text,
    },
    noResultText: {
      fontSize: 15,
      color: palette.muted,
    },
    optionGroupLabel: {
      color: palette.muted,
      fontSize: 13,
      fontWeight: "700",
      marginBottom: 8,
      marginTop: 6,
    },
    optionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    optionWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    ratingRow: {
      flexDirection: "row",
      gap: 8,
    },
    optionChip: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: AppTheme.radius.pill,
      paddingVertical: 11,
      paddingHorizontal: 16,
      backgroundColor: palette.background,
      marginBottom: 6,
    },
    optionChipSelected: {
      backgroundColor: palette.tint,
      borderColor: palette.tint,
    },
    optionChipText: {
      color: palette.text,
      fontSize: 14,
      fontWeight: "600",
    },
    optionChipTextSelected: {
      color: "#fff",
      fontWeight: "800",
    },
    typeButton: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: AppTheme.radius.pill,
      paddingVertical: 11,
      paddingHorizontal: 16,
      backgroundColor: palette.background,
    },
    typeButtonSelected: {
      backgroundColor: palette.tint,
      borderColor: palette.tint,
    },
    typeButtonText: {
      color: palette.text,
      fontSize: 14,
      fontWeight: "600",
    },
    typeButtonTextSelected: {
      color: "#fff",
      fontWeight: "800",
    },
    optionButton: {
      flex: 1,
      minWidth: 0,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: AppTheme.radius.sm,
      paddingVertical: 12,
      paddingHorizontal: 0,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: palette.background,
    },
    optionButtonSelected: {
      backgroundColor: palette.accent,
      borderColor: palette.accent,
    },
    optionText: {
      fontSize: 15,
      color: palette.text,
      fontWeight: "600",
    },
    optionTextSelected: {
      color: "#fff",
      fontWeight: "800",
    },
    photoButton: {
      borderWidth: 1,
      borderColor: palette.tint,
      borderStyle: "dashed",
      borderRadius: AppTheme.radius.md,
      paddingVertical: 16,
      alignItems: "center",
      backgroundColor: palette.surface,
    },
    photoButtonText: {
      color: palette.tint,
      fontSize: 15,
      fontWeight: "800",
    },
    photoPreviewWrap: { marginTop: 14, gap: 12 },
    photoPreview: {
      width: "100%",
      height: 220,
      borderRadius: AppTheme.radius.md,
      backgroundColor: palette.surface,
    },
    photoRemoveButton: {
      alignSelf: "flex-start",
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: AppTheme.radius.pill,
      backgroundColor: palette.surface,
    },
    photoRemoveButtonText: {
      color: palette.danger,
      fontSize: 13,
      fontWeight: "800",
    },
    photoHelperText: {
      marginTop: 12,
      color: palette.muted,
      fontSize: 14,
      lineHeight: 20,
    },
    reviewInput: {
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: AppTheme.radius.sm,
      padding: 14,
      minHeight: 140,
      backgroundColor: palette.background,
      color: palette.text,
      fontSize: 15,
      lineHeight: 22,
    },
    saveButton: {
      backgroundColor: palette.tint,
      paddingVertical: 16,
      borderRadius: AppTheme.radius.pill,
      alignItems: "center",
      marginTop: 6,
      marginBottom: 24,
      ...AppTheme.shadow,
    },
    saveButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "800",
    },
  });
