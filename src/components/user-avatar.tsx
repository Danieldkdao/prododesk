import { generateFileUrl } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export const UserAvatar = ({
  name,
  image,
  className,
  profileImageKey,
  textClassName,
}: {
  name: string;
  image?: string | undefined | null;
  profileImageKey?: string | undefined | null;
  className?: string;
  textClassName?: string;
}) => {
  const imageUrl = profileImageKey ? generateFileUrl(profileImageKey) : image;

  return (
    <Avatar className={className}>
      <AvatarImage src={imageUrl ?? undefined} />
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
