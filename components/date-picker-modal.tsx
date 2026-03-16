import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { AppTheme, Colors, Fonts } from "@/constants/theme";
import { formatDateInput, getMonthDays } from "@/services/log-date";

const WEEK_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

type DatePickerModalProps = {
  value: string;
  visible: boolean;
  colorScheme: "light" | "dark";
  onClose: () => void;
  onSelect: (date: string) => void;
};

export function DatePickerModal({
  value,
  visible,
  colorScheme,
  onClose,
  onSelect,
}: DatePickerModalProps) {
  const palette = Colors[colorScheme];
  const styles = getStyles(palette);

  const initialDate = value ? new Date(value) : new Date();
  const [cursorDate, setCursorDate] = useState(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    const nextDate = value ? new Date(value) : new Date();
    setCursorDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
  }, [value, visible]);

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(cursorDate);
  const monthDays = useMemo(
    () => getMonthDays(cursorDate.getFullYear(), cursorDate.getMonth()),
    [cursorDate],
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Pressable
              style={styles.navButton}
              onPress={() =>
                setCursorDate(new Date(cursorDate.getFullYear(), cursorDate.getMonth() - 1, 1))
              }
            >
              <Text style={styles.navText}>‹</Text>
            </Pressable>
            <Text style={styles.title}>{monthLabel}</Text>
            <Pressable
              style={styles.navButton}
              onPress={() =>
                setCursorDate(new Date(cursorDate.getFullYear(), cursorDate.getMonth() + 1, 1))
              }
            >
              <Text style={styles.navText}>›</Text>
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEK_DAYS.map((day) => (
              <View key={day} style={styles.weekCell}>
                <Text style={styles.weekLabel}>{day}</Text>
              </View>
            ))}
          </View>

          <View style={styles.grid}>
            {monthDays.map((cell) => {
              if (!cell.day) {
                return <View key={cell.key} style={styles.emptyCell} />;
              }

              const dateString = formatDateInput(
                new Date(cursorDate.getFullYear(), cursorDate.getMonth(), cell.day),
              );
              const isSelected = dateString === value;

              return (
                <Pressable
                  key={cell.key}
                  style={styles.dayCell}
                  onPress={() => {
                    onSelect(dateString);
                    onClose();
                  }}
                >
                  <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}>
                    <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                      {cell.day}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (palette: (typeof Colors)["light"]) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(17, 12, 8, 0.42)",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    sheet: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: palette.card,
      borderRadius: 28,
      padding: 22,
      borderWidth: 1,
      borderColor: palette.border,
      ...AppTheme.shadow,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 18,
    },
    navButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: palette.surface,
    },
    navText: {
      color: palette.tint,
      fontSize: 24,
      fontWeight: "700",
      lineHeight: 24,
    },
    title: {
      color: palette.text,
      fontSize: 24,
      fontWeight: "800",
      fontFamily: Fonts?.rounded,
    },
    weekRow: {
      flexDirection: "row",
      marginBottom: 10,
    },
    weekCell: {
      width: "14.2857%",
      alignItems: "center",
    },
    weekLabel: {
      textAlign: "center",
      color: palette.muted,
      fontSize: 12,
      fontWeight: "700",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    emptyCell: {
      width: "14.2857%",
      aspectRatio: 1,
      padding: 4,
    },
    dayCell: {
      width: "14.2857%",
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 4,
    },
    dayCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    dayCircleSelected: {
      backgroundColor: palette.accent,
    },
    dayText: {
      color: palette.text,
      fontSize: 17,
      fontWeight: "700",
      textAlign: "center",
      lineHeight: 20,
      includeFontPadding: false,
    },
    dayTextSelected: {
      color: "#fff",
    },
  });
