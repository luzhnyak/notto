import { useLocalSearchParams } from "expo-router";
import { NoteForm } from "../../../components/forms/NoteForm";
import { Screen, LoadState, EmptyState } from "../../../components/common/UI";
import { useServices } from "../../../src/services/context";
import { useLoad } from "../../../src/hooks/useLoad";
import { Note } from "../../../src/domain/entities";
export default function Edit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const services = useServices();
  const state = useLoad(
    () => services.notes.get(Number(id)),
    null as Note | null,
    id,
  );
  if (!state.data && (state.loading || state.error))
    return (
      <Screen>
        <LoadState
          loading={state.loading}
          error={state.error}
          retry={state.reload}
        />
      </Screen>
    );
  return state.data && state.data.status !== "deleted" ? (
    <NoteForm key={id} note={state.data} />
  ) : (
    <Screen>
      <EmptyState
        title="Нотатка недоступна"
        description="Спочатку відновіть її з кошика."
      />
    </Screen>
  );
}
