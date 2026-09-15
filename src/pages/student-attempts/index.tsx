import React from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Inbox, Award, BadgePercent, CheckCircle2, Calendar } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import InitialsAvatar from "@/components/InitialsAvatar";
import { formatDate } from "@/utils/format";
import { translate } from "@/utils/translation";
import { ROUTES } from "@/config/routes";
import { createStudentAttemptsQueryOptions } from "@/utils/queryOptions";
import AttemptCard from "./AttemptCard";
import AttemptDetailDialog from "./AttemptDetailDialog";

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center gap-3 py-20">
    <Inbox className="size-9 text-grey-500" strokeWidth={1.4} />
    <p className="text-sm text-grey-800">{message}</p>
  </div>
);

/** Supervisor-only: a student's profile stats and their exam attempts, opened from the search page. */
const StudentAttemptsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const fromSearch = (location.state as { from?: string } | null)?.from ?? "";

  const [selectedAttemptId, setSelectedAttemptId] = React.useState<
    string | null
  >(null);

  const { data, isLoading, isError, refetch } = useQuery(
    createStudentAttemptsQueryOptions(id ?? ""),
  );

  const t = {
    breadcrumbRoot: translate("students.attempts.breadcrumb-root"),
    joined: translate("students.attempts.joined"),
    title: translate("students.attempts.title"),
    summary: (passed: number, failed: number) =>
      translate("students.attempts.summary", [passed, failed]),
    totalAttempts: translate("students.attempts.stats.total"),
    averageScore: translate("students.attempts.stats.average"),
    passRate: translate("students.attempts.stats.pass-rate"),
    empty: translate("students.attempts.empty"),
    error: translate("students.attempts.error"),
    retry: translate("students.search.retry"),
  };

  const attempts = data?.attempts ?? [];
  const completedAttempts = attempts.filter(
    (attempt) => attempt.exam_state === "completed",
  );
  const passedAttempts = completedAttempts.filter(
    (attempt) => attempt.status === "pass",
  );
  const failedCount = completedAttempts.length - passedAttempts.length;
  const averageScore = completedAttempts.length
    ? Math.round(
      completedAttempts.reduce((sum, attempt) => sum + attempt.score, 0) /
      completedAttempts.length,
    )
    : 0;
  const passRate = completedAttempts.length
    ? Math.round((passedAttempts.length / completedAttempts.length) * 100)
    : 0;

  const selectedAttempt =
    attempts.find((attempt) => attempt.id === selectedAttemptId) ?? null;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`${ROUTES.students}${fromSearch}`}>
                {t.breadcrumbRoot}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {data
                ? `${data.student.first_name} ${data.student.last_name}`
                : "…"}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : isError || !data ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <p className="text-sm text-grey-800">{t.error}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t.retry}
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex animate-[fadeIn_0.25s_ease-out] flex-col gap-3 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <InitialsAvatar
                firstName={data.student.first_name}
                lastName={data.student.last_name}
                className="size-14 text-lg"
              />
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-tertiary">
                  {data.student.first_name} {data.student.last_name}
                </p>
                <p className="truncate text-sm text-grey-800">{data.student.email}</p>
              </div>
            </div>

            <p className="flex items-center gap-1.5 text-xs text-grey-800">
              <Calendar className="size-3.5" />
              {t.joined}{" "}
              <span className="font-bold text-grey-900">{formatDate(data.student.created_at)}</span>
            </p>
          </div>

          <div className="mb-4 grid animate-[fadeIn_0.25s_ease-out] grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-4 text-center">
              <Award className="size-6 text-primary" />
              <p className="text-2xl font-bold text-tertiary">
                {attempts.length}
              </p>
              <p className="text-xs text-grey-800">{t.totalAttempts}</p>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-4 text-center">
              <BadgePercent className="size-6 text-tertiary" />
              <p className="text-2xl font-bold text-tertiary">
                {averageScore}%
              </p>
              <p className="text-xs text-grey-800">{t.averageScore}</p>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-4 text-center">
              <CheckCircle2 className="size-6 text-correct" />
              <p className="text-2xl font-bold text-tertiary">{passRate}%</p>
              <p className="text-xs text-grey-800">{t.passRate}</p>
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-bold text-tertiary">{t.title}</h2>
            {completedAttempts.length > 0 && (
              <p className="text-xs text-grey-800">
                {t.summary(passedAttempts.length, failedCount)}
              </p>
            )}
          </div>

          {attempts.length === 0 ? (
            <EmptyState message={t.empty} />
          ) : (
            <div className="animate-[fadeIn_0.25s_ease-out] divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              {attempts.map((attempt) => (
                <AttemptCard
                  key={attempt.id}
                  attempt={attempt}
                  onSelect={setSelectedAttemptId}
                />
              ))}
            </div>
          )}
        </>
      )}

      {selectedAttempt && (
        <AttemptDetailDialog
          attempt={selectedAttempt}
          onOpenChange={(open) => !open && setSelectedAttemptId(null)}
        />
      )}
    </div>
  );
};

export default StudentAttemptsPage;
