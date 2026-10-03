import React from "react";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { translate } from "@/utils/translation";
import { ROUTES } from "@/config/routes";

type StudentBreadcrumbProps = {
  /** The search page's query string, carried forward so "Students" returns to the same results. */
  fromSearch: string;
  studentId: string;
  studentName: string;
  /** Present on the attempts page — the track being read, which makes the name a link. */
  trackName?: string;
};

/** Students › Name › Track. The only way back out of the supervisor's student pages. */
const StudentBreadcrumb: React.FC<StudentBreadcrumbProps> = ({
  fromSearch,
  studentId,
  studentName,
  trackName,
}) => (
  <Breadcrumb className="mb-4">
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink asChild>
          <Link
            to={`${ROUTES.students}${fromSearch}`}
            className="hover:text-secondary"
          >
            {translate("students.attempts.breadcrumb-root")}
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>

      <BreadcrumbSeparator className="rtl:rotate-180" />

      <BreadcrumbItem>
        {trackName ? (
          <BreadcrumbLink asChild>
            <Link
              to={ROUTES.student.to(studentId)}
              state={{ from: fromSearch }}
              className="hover:text-secondary"
            >
              {studentName}
            </Link>
          </BreadcrumbLink>
        ) : (
          <BreadcrumbPage className="font-semibold text-tertiary">
            {studentName}
          </BreadcrumbPage>
        )}
      </BreadcrumbItem>

      {trackName && (
        <>
          <BreadcrumbSeparator className="rtl:rotate-180" />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-semibold text-tertiary">
              {trackName}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </>
      )}
    </BreadcrumbList>
  </Breadcrumb>
);

export default StudentBreadcrumb;
