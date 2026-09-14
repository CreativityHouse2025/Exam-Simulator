import { saveAttempt, submitAttempt } from "./attempt.service";
import type { SaveAttemptInProgress, SaveAttemptCompleted } from "@shared/attempt.schema";

/**
 * Abstraction over persisting attempt progress to the backend. useSessionReducer depends on
 * this interface rather than saveAttempt/submitAttempt directly, so it can swap in a no-op
 * implementation for supervisor preview sessions without branching inside syncProgress/
 * submitExam/saveBreakOffer themselves.
 */
export interface AttemptPersistence {
  save(
    id: string,
    args: Omit<SaveAttemptInProgress, "exam_state">,
  ): Promise<void>;
  submit(
    id: string,
    args: Omit<SaveAttemptCompleted, "exam_state">,
  ): Promise<void>;
}

/** Default strategy — writes through to the real attempt API. */
export const remoteAttemptPersistence: AttemptPersistence = {
  save: saveAttempt,
  submit: submitAttempt,
};

/** Preview strategy — resolves immediately, never touches the network. */
export const noopAttemptPersistence: AttemptPersistence = {
  save: async () => {},
  submit: async () => {},
};
