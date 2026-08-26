import { getCurrentUser } from "@/lib/auth/helpers";
import { UNAUTHED_ERROR_MESSAGE } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const { fileName, keyPrefix }: { fileName: string; keyPrefix: string } =
    await req.json();

  const { userId } = await getCurrentUser();
  if (!userId)
    return NextResponse.json(
      {
        error: true,
        message: UNAUTHED_ERROR_MESSAGE,
      },
      { status: 401 },
    );

  const key = `${userId}/${keyPrefix.replace(/\/+$/, "")}/${crypto.randomUUID()}-${fileName}`;

  return NextResponse.json({
    error: false,
    message: "Key generated successfully!",
    data: {
      key,
    },
  });
};
