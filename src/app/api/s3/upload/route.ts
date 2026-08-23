import { getCurrentUser } from "@/lib/auth/helpers";
import { GENERAL_ERROR_MESSAGE, UNAUTHED_ERROR_MESSAGE } from "@/lib/constants";
import { getUploadPresignedUrl } from "@/services/tigris/presigns";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
  const { key }: { key: string } = await request.json();

  const { userId } = await getCurrentUser();
  if (!userId) {
    return NextResponse.json(
      {
        error: true,
        message: UNAUTHED_ERROR_MESSAGE,
      },
      { status: 401 },
    );
  }

  const presignedUrl = await getUploadPresignedUrl(key);
  if (!presignedUrl) {
    return NextResponse.json({
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    });
  }

  return NextResponse.json({
    error: false,
    message: "Presigned URL generated successfully!",
    data: { url: presignedUrl },
  });
};
