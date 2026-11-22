import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { buildMonthGrid, formatLong, formatMonthTitle, monthOf, todayISO, WEEKDAYS } from '@/lib/dates';
import { colors, fonts } from '@/lib/theme';
import { Body, Sheet } from './ui';

export type CalendarMarks = Record<string, string[]>;

export function MonthGrid({
  year,
  month,
  selected,
  onSelect,
  marks,
  compact = false,
}: {
  year: number;
  month: number;
  selected?: string | null;
  onSelect?: (iso: string) => void;
  marks?: CalendarMarks;
  compact?: boolean;
}) {
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const today = todayISO();

  return (
    <View style={{ paddingHorizontal: compact ? 4 : 12 }}>
      <View style={{ flexDirection: 'row' }}>
        {WEEKDAYS.map((label, index) => (
          <View key={`${label}-${index}`} style={{ width: '14.2857%', alignItems: 'center', paddingVertical: 6 }}>
            <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.faint }}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((cell, index) => {
          if (!cell.iso) {
            return <View key={`empty-${index}`} style={{ width: '14.2857%', height: compact ? 42 : 48 }} />;
          }
          const isSelected = selected === cell.iso;
          const isToday = today === cell.iso;
          const dots = marks?.[cell.iso] ?? [];
          return (
            <Pressable
              key={cell.iso}
              onPress={() => onSelect?.(cell.iso as string)}
              style={{ width: '14.2857%', height: compact ? 42 : 48, alignItems: 'center', justifyContent: 'center' }}
            >
              <View
                style={{
                  width: 33,
                  height: 33,
                  borderRadius: 17,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isSelected ? colors.pink : 'transparent',
                  borderWidth: isToday && !isSelected ? 1 : 0,
                  borderColor: colors.pinkDark,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 14,
                    color: isSelected ? colors.ink : colors.ink,
                  }}
                >
                  {cell.day}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 3, height: 5, marginTop: 2 }}>
                {dots.slice(0, 3).map((color, dotIndex) => (
                  <View
                    key={`${cell.iso}-dot-${dotIndex}`}
                    style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color }}
                  />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function MonthNavigator({
  year,
  month,
  onChange,
}: {
  year: number;
  month: number;
  onChange: (next: { year: number; month: number }) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 }}>
      <Pressable
        accessibilityLabel="Mes anterior"
        onPress={() => onChange(month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 })}
        style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
      >
        <ChevronLeft size={22} color={colors.ink} />
      </Pressable>
      <Text style={{ fontFamily: fonts.display, fontSize: 25, color: colors.ink, textTransform: 'capitalize' }}>
        {formatMonthTitle(year, month)}
      </Text>
      <Pressable
        accessibilityLabel="Mes siguiente"
        onPress={() => onChange(month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 })}
        style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
      >
        <ChevronRight size={22} color={colors.ink} />
      </Pressable>
    </View>
  );
}

export function DateField({
  value,
  onChange,
  label = 'Fecha',
  clearable = true,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
  label?: string;
  clearable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const initial = monthOf(value);
  const [view, setView] = useState(initial);

  const openPicker = () => {
    setView(monthOf(value));
    setOpen(true);
  };

  return (
    <>
      <Pressable
        onPress={openPicker}
        style={({ pressed }) => ({
          height: 48,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.card,
          paddingHorizontal: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          opacity: pressed ? 0.75 : 1,
        })}
      >
        <CalendarDays size={17} color={colors.muted} />
        <Text
          numberOfLines={1}
          style={{ flex: 1, fontFamily: fonts.body, fontSize: 14, color: value ? colors.ink : colors.faint }}
        >
          {value ? formatLong(value) : 'Sin fecha'}
        </Text>
        {value && clearable ? (
          <Pressable
            accessibilityLabel="Quitar fecha"
            onPress={(event) => {
              event.stopPropagation();
              onChange(null);
            }}
            style={{ padding: 4 }}
            hitSlop={8}
          >
            <X size={16} color={colors.faint} />
          </Pressable>
        ) : null}
      </Pressable>

      <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
        <MonthNavigator year={view.year} month={view.month} onChange={setView} />
        <MonthGrid
          year={view.year}
          month={view.month}
          selected={value}
          onSelect={(iso) => {
            onChange(iso);
            setOpen(false);
          }}
        />
        <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingTop: 12 }}>
          <Pressable
            onPress={() => {
              onChange(todayISO());
              setOpen(false);
            }}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.line,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Body size={14}>Hoy</Body>
          </Pressable>
          {clearable ? (
            <Pressable
              onPress={() => {
                onChange(null);
                setOpen(false);
              }}
              style={{
                flex: 1,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.line,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Body size={14}>Quitar fecha</Body>
            </Pressable>
          ) : null}
        </View>
      </Sheet>
    </>
  );
}
