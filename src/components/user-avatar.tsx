import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export const UserAvatar = ({
  name,
  image,
  className,
  textClassName,
}: {
  name: string;
  image?: string | undefined | null;
  className?: string;
  textClassName?: string;
}) => {
  return (
    <Avatar className={className}>
      <AvatarImage src={image ?? undefined} />
      <AvatarFallback className={textClassName}>
        {name
          .split(" ")
          .slice(0, 2)
          .map((word) => (word.length ? word[0] : ""))
          .join("")}
      </AvatarFallback>
    </Avatar>
  );
};
