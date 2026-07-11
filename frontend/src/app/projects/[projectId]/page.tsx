import Link from "next/link";
import {
  getProject,
  getProjectTasks,
  formatDuration,
  formatDueDate,
  STATUS_COLUMNS,
  type Project,
  type Task,
} from "@/lib/tasksApi";
import { RememberProject } from "@/components/RememberProject";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  let project: Project | null = null;
  let tasks: Task[] = [];
  let failed = false;
  try {
    [project, tasks] = await Promise.all([
      getProject(projectId),
      getProjectTasks(projectId),
    ]);
  } catch {
    failed = true;
  }

  if (failed || !project) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
        <Link
          href="/projects"
          className="w-fit text-sm text-ink-muted transition-colors hover:text-ink"
        >
          ← All projects
        </Link>
        <div className="mt-10 rounded-2xl border border-line bg-surface p-8 text-center">
          <p className="text-sm text-ink">Couldn&rsquo;t load this project.</p>
          <p className="mt-1 text-sm text-ink-muted">
            It may not exist, or the backend is unreachable.
          </p>
        </div>
      </main>
    );
  }

  const byStatus = (status: string) =>
    tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-24 pt-16 sm:px-10 sm:pt-20">
      <RememberProject projectId={project.id} />

      <Link
        href="/projects"
        className="w-fit text-sm text-ink-muted transition-colors hover:text-ink"
      >
        ← All projects
      </Link>

      <div className="mt-6 flex items-center gap-3">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: project.color ?? "#726b60" }}
          aria-hidden
        />
        <h1 className="font-display text-3xl text-ink sm:text-4xl">
          {project.name}
        </h1>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STATUS_COLUMNS.map(({ status, label }) => {
          const columnTasks = byStatus(status);
          return (
            <section key={status} className="flex flex-col">
              <div className="mb-3 flex items-baseline justify-between px-1">
                <h2 className="text-sm font-medium text-ink">{label}</h2>
                <span className="font-mono text-xs text-ink-muted">
                  {columnTasks.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {columnTasks.map((task) => (
                  <TaskCardStatic key={task.id} task={task} />
                ))}
                {columnTasks.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-line/70 px-4 py-6 text-center font-mono text-[11px] text-ink-muted">
                    empty
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

// Read-only card for Phase 4; Phase 5 replaces with an interactive TaskCard.
function TaskCardStatic({ task }: { task: Task }) {
  const doneSubs = task.subTasks.filter((s) => s.done).length;
  const overdue =
    task.dueDate && task.status !== "DONE"
      ? new Date(task.dueDate) < new Date(new Date().toDateString())
      : false;

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <h3 className="text-sm font-medium text-ink">{task.title}</h3>

      {task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {task.tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-ink-muted">
        {task.totalSeconds > 0 && <span>⏱ {formatDuration(task.totalSeconds)}</span>}
        {task.runningSince && <span className="text-clay">● running</span>}
        {task.subTasks.length > 0 && (
          <span>
            ☑ {doneSubs}/{task.subTasks.length}
          </span>
        )}
        {task.dueDate && (
          <span className={overdue ? "text-clay" : ""}>
            ◷ {formatDueDate(task.dueDate)}
          </span>
        )}
        {task.estimateMinutes && <span>~{task.estimateMinutes}m est</span>}
      </div>
    </div>
  );
}
