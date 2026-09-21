import React from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/config/routes";
import { translate } from "@/utils/translation";

/**
 * The dashboard's opening move: type a name, land on the search page with that query already run.
 *
 * It navigates rather than searching in place, so the result is one shareable URL and the search
 * page stays the only component that talks to `/api/students`.
 */
const SearchLauncher: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    navigate(
      trimmed
        ? `${ROUTES.students}?q=${encodeURIComponent(trimmed)}`
        : ROUTES.students,
    );
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-grey-800" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={translate("dashboard.supervisor.search-placeholder")}
          aria-label={translate("dashboard.supervisor.search-placeholder")}
          className="h-12 rounded-lg border-transparent bg-white ps-10 text-sm shadow-none focus-visible:border-primary focus-visible:ring-primary/30"
        />
      </div>

      <Button
        type="submit"
        className="h-12 shrink-0 gap-2 bg-primary px-6 font-semibold text-white hover:bg-primary/90"
      >
        <Search className="size-4" />
        {translate("dashboard.supervisor.search-students")}
      </Button>
    </form>
  );
};

export default SearchLauncher;
