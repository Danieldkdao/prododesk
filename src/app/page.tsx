import { LightDarkImage } from "@/components/light-dark-image";
import { LinkButton } from "@/components/link-button";
import { Footer } from "@/components/public/footer";
import { Header } from "@/components/public/header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth/helpers";
import { cn } from "@/lib/utils";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  FileTextIcon,
  FolderKanbanIcon,
  MilestoneIcon,
  SparklesIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { Suspense } from "react";

const features = [
  {
    icon: SlidersHorizontalIcon,
    feature: "Flexible task views",
    text: "Filter and organize tasks by status, priority, project, and date so the right work stays easy to find.",
  },
  {
    icon: FolderKanbanIcon,
    feature: "Areas and projects",
    text: "Separate ongoing responsibilities from focused projects while keeping related tasks and outcomes connected.",
  },
  {
    icon: MilestoneIcon,
    feature: "Milestone tracking",
    text: "Break larger outcomes into clear milestones and see what needs to happen next without losing the bigger picture.",
  },
  {
    icon: FileTextIcon,
    feature: "Connected documents",
    text: "Keep plans, notes, and supporting information alongside the projects they help move forward.",
  },
  {
    icon: CalendarDaysIcon,
    feature: "Calendar planning",
    text: "See scheduled and due work together so you can understand what is coming and adjust before the day gets crowded.",
  },
  {
    icon: SparklesIcon,
    feature: "ProdoDesk AI",
    text: "Ask for help creating, updating, and organizing work without manually moving through every screen.",
  },
];

const mainFeatures = [
  {
    title: "Plan a day you can actually finish",
    description:
      "Tell ProdoDesk how much time and energy you have, then turn your priorities and deadlines into a calm, realistic daily plan.",
    lightImageSrc: "/images/day-plan-image-light.png",
    darkImageSrc: "/images/day-plan-image-dark.png",
    alt: "ProdoDesk daily plan draft",
    reverse: false,
  },
  {
    title: "Let AI organize your task inbox",
    description:
      "Review practical suggestions for each unsorted task, then place it in the right project, milestone, priority, or date with a quick decision.",
    lightImageSrc: "/images/triage-flow-image-light.png",
    darkImageSrc: "/images/triage-flow-image-dark.png",
    alt: "ProdoDesk AI task triage",
    reverse: true,
  },
  {
    title: "Keep every project in one workspace",
    description:
      "Connect tasks, milestones, documents, dates, and progress so you always know where a project stands and what should happen next.",
    lightImageSrc: "/images/workspace-image-light.png",
    darkImageSrc: "/images/workspace-image-dark.png",
    alt: "ProdoDesk project workspace",
    reverse: false,
  },
];

const HomePage = () => {
  return (
    <div className="w-full flex flex-col gap-32 overflow-auto">
      <Header />
      <div className="flex py-10 px-6 flex-col gap-32 mx-auto max-w-7xl">
        <div className="w-full flex flex-col gap-8">
          <div className="flex flex-col gap-6 items-center">
            <h1 className="text-4xl md:text-5xl font-bold text-center max-w-200">
              Turn scattered work into a day you can actually finish.
            </h1>
            <p className="text-lg text-muted-foreground text-center max-w-175">
              ProdoDesk brings your tasks, projects, milestones, documents, and
              calendar together with AI that helps you decide what to do next.
            </p>
            <div className="flex items-center gap-2">
              <Suspense fallback={<Skeleton className="w-52 h-11" />}>
                <GetStartedButton />
              </Suspense>
            </div>
          </div>
          <div className="w-full max-w-7xl mx-auto relative h-80 md:h-100 rounded-lg overflow-hidden">
            <LightDarkImage
              lightImageSrc="/images/dashboard-image-light.png"
              darkImageSrc="/images/dashboard-image-dark.png"
              fill
              className="object-cover"
              alt="ProdoDesk productivity dashboard"
            />
          </div>
        </div>
        <div className="flex flex-col w-full gap-32">
          {mainFeatures.map((feature) => (
            <div
              key={feature.alt}
              className="w-full grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div
                className={cn(
                  "flex flex-col gap-2 items-center justify-center h-full w-full",
                  feature.reverse && "md:order-2",
                )}
              >
                <h2 className="text-3xl md:text-4xl font-semibold text-center">
                  {feature.title}
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground text-center max-w-150">
                  {feature.description}
                </p>
              </div>
              <div
                className={cn(
                  "relative h-80 w-full overflow-hidden rounded-lg border border-border bg-card md:h-100",
                  feature.reverse && "md:order-1",
                )}
              >
                <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
                  <div className="size-4 rounded-full bg-destructive" />
                  <div className="size-4 rounded-full bg-yellow-500" />
                  <div className="size-4 rounded-full bg-primary" />
                </div>

                <div className="absolute inset-x-3 bottom-3 top-11">
                  <LightDarkImage
                    lightImageSrc={feature.lightImageSrc}
                    darkImageSrc={feature.darkImageSrc}
                    fill
                    className="object-contain"
                    alt={feature.alt}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-6 items-center w-full">
          <h2 className="text-3xl font-semibold text-center max-w-200">
            Other features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardContent className="flex flex-col gap-2">
                  <div className="size-12 rounded-md bg-primary/30 flex items-center justify-center mt-2">
                    <feature.icon className="size-6" />
                  </div>
                  <span className="text-xl font-medium">{feature.feature}</span>
                  <p className="text-base text-muted-foreground">
                    {feature.text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

const GetStartedButton = async () => {
  const { userId } = await getCurrentUser();
  const href = userId ? "/dashboard" : "/sign-in";

  return (
    <LinkButton href={href} className="w-72 h-11">
      {userId ? "Continue to dashboard" : "Get started"}
      <ArrowRightIcon />
    </LinkButton>
  );
};

export default HomePage;
