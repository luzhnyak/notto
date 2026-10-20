import { SelectField, TagPicker } from "./CatalogPicker";
import { EventDatePicker } from "./EventDatePicker";
import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { router, useNavigation } from "expo-router";
import { usePreventRemove } from "@react-navigation/native";
import { Note, NoteInput } from "../../src/domain/entities";
import { useServices } from "../../src/services/context";
import { useAppStore } from "../../src/store/useAppStore";
import { useLoad } from "../../src/hooks/useLoad";
import { validateDate, message } from "../../src/utils/values";
import { Button, Heading, Input, Label, LoadState, Screen } from "../common/UI";
export function NoteForm({ note }: { note?: Note }) {
  const services = useServices();
  const changed = useAppStore((s) => s.changed);
  const navigation = useNavigation();
  const catalog = useLoad(
    async () => ({
      types: await services.types.list(),
      emotions: await services.emotions.list(),
      tags: await services.tags.list(),
    }),
    { types: [], emotions: [], tags: [] } as {
      types: Note["type"][];
      emotions: NonNullable<Note["emotion"]>[];
      tags: Note["tags"];
    },
  );
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<NoteInput>({
    defaultValues: note
      ? {
          title: note.title,
          content: note.content,
          noteTypeId: note.noteTypeId,
          emotionId: note.emotionId,
          eventDate: note.eventDate,
          tagIds: note.tags.map((t) => t.id),
        }
      : {
          title: "",
          content: "",
          noteTypeId: 0,
          emotionId: null,
          eventDate: null,
          tagIds: [],
        },
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<number>();
  const [tagName, setTagName] = useState("");
  const values = watch();
  useEffect(() => {
    if (!note && catalog.data.types.length && !values.noteTypeId)
      setValue("noteTypeId", catalog.data.types[0].id);
  }, [catalog.data.types, note, values.noteTypeId, setValue]);
  useEffect(() => {
    if (saved) {
      if (!note && savedId)
        router.replace({ pathname: "/notes/[id]", params: { id: savedId } });
      else router.back();
    }
  }, [saved, note, savedId]);
  usePreventRemove((isDirty || saving) && !saved, ({ data }) => {
    if (saving) {
      Alert.alert("Збереження", "Зачекайте завершення збереження.");
      return;
    }
    Alert.alert("Вийти без збереження?", "Введені зміни буде втрачено.", [
      { text: "Залишитися", style: "cancel" },
      {
        text: "Вийти",
        style: "destructive",
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });
  const submit = handleSubmit(async (input) => {
    if (saving) return;
    setSaving(true);
    try {
      const id = await services.notes.save(input, note?.id);
      setSavedId(id);
      changed();
      reset(input);
      setSaved(true);
    } catch (e) {
      Alert.alert("Не вдалося зберегти", message(e));
    } finally {
      setSaving(false);
    }
  });
  async function addTag() {
    try {
      const id = await services.tags.save(tagName);
      setValue("tagIds", [...new Set([...values.tagIds, id])], {
        shouldDirty: true,
      });
      setTagName("");
      changed();
      catalog.reload();
    } catch (e) {
      Alert.alert("Тег", message(e));
    }
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen>
        <Heading>{note ? "Збережіть важливе" : "Нова нотатка"}</Heading>
        <LoadState
          loading={catalog.loading}
          error={catalog.error}
          retry={catalog.reload}
        />
        <Label>Заголовок *</Label>
        <Controller
          control={control}
          name="title"
          rules={{
            validate: (v) => v.trim().length > 0 || "Введіть заголовок",
          }}
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              placeholder="Про що цей запис?"
              accessibilityLabel="Заголовок"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
        {errors.title && <Label>{errors.title.message}</Label>}
        <Label>Текст</Label>
        <Controller
          control={control}
          name="content"
          render={({ field: { value, onChange } }) => (
            <Input
              multiline
              textAlignVertical="top"
              style={{ minHeight: 180 }}
              placeholder="Думки, події, корисні деталі…"
              accessibilityLabel="Текст нотатки"
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        <Label>Тип нотатки</Label>
        <SelectField
          label="Тип нотатки"
          placeholder="Оберіть тип"
          options={catalog.data.types.map((v) => ({
            id: v.id,
            label: v.name,
            color: v.color,
          }))}
          value={values.noteTypeId || null}
          onChange={(id) => {
            if (id !== null) setValue("noteTypeId", id, { shouldDirty: true });
          }}
        />
        <Label>Дата події · необов’язково</Label>
        <Controller
          control={control}
          name="eventDate"
          rules={{
            validate: (v) => {
              try {
                if (v) validateDate(v);
                return true;
              } catch {
                return "Вкажіть коректну дату РРРР-ММ-ДД";
              }
            },
          }}
          render={({ field: { value, onChange } }) => (
            <EventDatePicker value={value} onChange={onChange} />
          )}
        />
        {errors.eventDate && <Label>{errors.eventDate.message}</Label>}
        <Label>Емоція</Label>
        <SelectField
          label="Емоція"
          placeholder="Без емоції"
          clearLabel="Без емоції"
          options={catalog.data.emotions.map((v) => ({
            id: v.id,
            label: `${v.icon} ${v.name}`,
          }))}
          value={values.emotionId}
          onChange={(id) => setValue("emotionId", id, { shouldDirty: true })}
        />
        <Label>Теги</Label>
        <TagPicker
          options={catalog.data.tags.map((v) => ({ id: v.id, label: v.name }))}
          value={values.tagIds}
          onChange={(ids) => setValue("tagIds", ids, { shouldDirty: true })}
        />
        <Input
          placeholder="Новий тег"
          value={tagName}
          onChangeText={setTagName}
        />
        <Button
          title="Додати тег"
          onPress={() => void addTag()}
          disabled={!tagName.trim() || saving}
        />
        <Label muted>
          Фотографії, документи та посилання можна додати на екрані збереженої
          нотатки.
        </Label>
        <Button
          title={saving ? "Збереження…" : "Зберегти нотатку"}
          selected
          disabled={
            saving || catalog.loading || !!catalog.error || !values.noteTypeId
          }
          onPress={() => void submit()}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}
