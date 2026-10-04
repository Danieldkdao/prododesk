type SaveResult = { error: boolean; message: string };

export const createBoardStore = <
  T extends { id: string },
  P extends keyof T,
  M,
>(
  initialTasks: T[],
  property: P,
  initialMetadata: M,
  onError: (error: unknown) => void,
  onIdle: () => void,
) => {
  let confirmed = new Map(initialTasks.map((task) => [task.id, task]));
  const overrides = new Map<string, { value: T[P]; revision: number }>();
  const revisions = new Map<string, number>();
  const queues = new Map<string, Promise<void>>();
  const listeners = new Set<() => void>();
  let metadata = initialMetadata;
  let snapshot = { tasks: initialTasks, metadata };

  const publish = () => {
    const tasks = [...confirmed.values()].map((task) => {
      const override = overrides.get(task.id);
      return override ? { ...task, [property]: override.value } : task;
    });
    snapshot = { tasks, metadata };
    listeners.forEach((listener) => listener());
  };

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setMetadata: (update: (current: M) => M) => {
      metadata = update(metadata);
      publish();
    },
    replaceSnapshot: (tasks: T[], nextMetadata: M) => {
      if (queues.size > 0) return false;
      confirmed = new Map(tasks.map((task) => [task.id, task]));
      metadata = nextMetadata;
      publish();
      return true;
    },
    appendPage: (tasks: T[]) => {
      for (const task of tasks) {
        if (!overrides.has(task.id)) confirmed.set(task.id, task);
      }
      publish();
    },
    move: <V extends T[P]>(
      taskId: string,
      value: V,
      save: (taskId: string, value: V) => Promise<SaveResult>,
    ) => {
      if (!confirmed.has(taskId)) return Promise.resolve();
      const revision = (revisions.get(taskId) ?? 0) + 1;
      revisions.set(taskId, revision);
      overrides.set(taskId, { value, revision });
      publish();

      const previous = queues.get(taskId) ?? Promise.resolve();
      const next = previous.then(async () => {
        try {
          const result = await save(taskId, value);
          if (result.error) throw new Error(result.message);
          const task = confirmed.get(taskId);
          if (task) confirmed.set(taskId, { ...task, [property]: value });
        } catch (error) {
          onError(error);
        } finally {
          if (overrides.get(taskId)?.revision === revision) {
            overrides.delete(taskId);
          }
          publish();
        }
      });
      queues.set(taskId, next);
      void next.finally(() => {
        if (queues.get(taskId) !== next) return;
        queues.delete(taskId);
        if (queues.size === 0) onIdle();
      });
      return next;
    },
  };
};
