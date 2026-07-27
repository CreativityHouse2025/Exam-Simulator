import { cn } from "@/components/ui/utils";

type InitialsAvatarProps = {
  firstName: string;
  lastName: string;
  className?: string;
};

/** Circular initials avatar with the primary-to-secondary gradient used on the profile page. */
const InitialsAvatar = ({ firstName, lastName, className }: InitialsAvatarProps) => {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary font-bold text-white",
        className,
      )}
    >
      {initials}
    </span>
  );
};

export default InitialsAvatar;
