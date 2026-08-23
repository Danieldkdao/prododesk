import {
  FileTextIcon,
  Globe2Icon,
  IdCardIcon,
  UserRoundIcon,
} from "lucide-react";

type UserProfileToolOutput = {
  name: string;
  description: string;
  timeZone: string;
  userId: string;
};

const isUserProfileToolOutput = (
  output: unknown,
): output is UserProfileToolOutput =>
  typeof output === "object" &&
  output !== null &&
  "name" in output &&
  typeof output.name === "string" &&
  "description" in output &&
  typeof output.description === "string" &&
  "timeZone" in output &&
  typeof output.timeZone === "string" &&
  "userId" in output &&
  typeof output.userId === "string";

export const ReadUserProfileToolOutput = ({
  output,
}: {
  output: unknown;
}) => {
  if (!isUserProfileToolOutput(output)) {
    return <span>{JSON.stringify(output)}</span>;
  }

  const description = output.description.trim();

  return (
    <div className="flex w-full max-w-xl flex-col overflow-hidden border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center gap-3 bg-muted/40 p-3">
        <div className="flex size-10 shrink-0 items-center justify-center border bg-background">
          <UserRoundIcon className="size-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{output.name}</p>
          <p className="text-sm text-muted-foreground">User profile</p>
        </div>
      </div>

      <dl className="grid gap-3 border-t p-3 text-sm sm:grid-cols-2">
        <div className="flex min-w-0 items-start gap-2">
          <IdCardIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Name
            </dt>
            <dd className="truncate text-foreground">{output.name}</dd>
          </div>
        </div>

        <div className="flex min-w-0 items-start gap-2">
          <Globe2Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Time zone
            </dt>
            <dd className="truncate text-foreground">{output.timeZone}</dd>
          </div>
        </div>

        <div className="flex min-w-0 items-start gap-2 sm:col-span-2">
          <FileTextIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              About
            </dt>
            <dd
              className={
                description ? "text-foreground" : "italic text-muted-foreground"
              }
            >
              {description || "No profile description provided"}
            </dd>
          </div>
        </div>
      </dl>
    </div>
  );
};
