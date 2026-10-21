import { useState } from "react";
import { View } from "react-native";
import { Button, Row } from "../common/UI";

export function CalendarYearPicker({
  year,
  onChange,
}: {
  year: number;
  onChange: (year: number) => void;
}) {
  const [choosingYear, setChoosingYear] = useState(false);
  const [yearStart, setYearStart] = useState(() => Math.floor(year / 12) * 12);
  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Button
          title="«"
          accessibilityLabel="Попередній рік"
          disabled={year <= 1000}
          onPress={() => onChange(year - 1)}
        />
        <Button
          title={String(year)}
          accessibilityLabel="Вибрати рік"
          selected={choosingYear}
          onPress={() => {
            setYearStart(Math.floor(year / 12) * 12);
            setChoosingYear((v) => !v);
          }}
        />
        <Button
          title="»"
          accessibilityLabel="Наступний рік"
          disabled={year >= 9999}
          onPress={() => onChange(year + 1)}
        />
      </View>
      {choosingYear ? (
        <View style={{ gap: 12 }}>
          <Row>
            <Button
              title="‹ 12 років"
              disabled={yearStart <= 1000}
              onPress={() => setYearStart((v) => Math.max(1000, v - 12))}
            />
            <Button
              title="12 років ›"
              disabled={yearStart + 12 > 9999}
              onPress={() => setYearStart((v) => v + 12)}
            />
          </Row>
          <Row>
            {Array.from({ length: 12 }, (_, i) => yearStart + i)
              .filter((y) => y >= 1000 && y <= 9999)
              .map((y) => (
                <Button
                  key={y}
                  title={String(y)}
                  selected={year === y}
                  onPress={() => {
                    onChange(y);
                    setChoosingYear(false);
                  }}
                />
              ))}
          </Row>
        </View>
      ) : null}
    </View>
  );
}
