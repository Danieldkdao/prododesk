import { envServer } from "@/data/env/server";
import { sendEmail } from "..";

const APP_NAME = "Prododesk";
type SendVerificationOtpProps = {
  email: string;
  type: "sign-in" | "change-email" | "email-verification" | "forget-password";
  otp: string;
};

const emailContentByType: Record<
  SendVerificationOtpProps["type"],
  {
    subject: string;
    heading: string;
    description: string;
    instruction: string;
  }
> = {
  "sign-in": {
    subject: `Your ${APP_NAME} sign-in code`,
    heading: "Use this code to sign in",
    description: `Enter the verification code below to finish signing in to your ${APP_NAME} account.`,
    instruction: "Paste this code into the sign-in screen to continue.",
  },
  "change-email": {
    subject: `Confirm your new ${APP_NAME} email`,
    heading: "Confirm your new email",
    description: `Use the verification code below to confirm this email address for your ${APP_NAME} account.`,
    instruction: "Enter this code to complete your email change.",
  },
  "email-verification": {
    subject: `Verify your email for ${APP_NAME}`,
    heading: "Verify your email",
    description: `Welcome to ${APP_NAME}. Enter the verification code below to activate your account.`,
    instruction: "Type this code into the verification form to finish setup.",
  },
  "forget-password": {
    subject: `Your ${APP_NAME} password reset code`,
    heading: "Reset your password",
    description: `Use the verification code below to continue resetting your ${APP_NAME} password.`,
    instruction: "Enter this code on the password reset screen to proceed.",
  },
};

export const sendVerificationOtp = async ({
  email,
  type,
  otp,
}: SendVerificationOtpProps) => {
  const { description, heading, instruction, subject } =
    emailContentByType[type];
  const text = [
    `${heading} - Synapse`,
    "",
    description,
    "",
    `Verification code: ${otp}`,
    instruction,
    "",
    "If you did not request this email, you can safely ignore it.",
  ].join("\n");

  const html = `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>

    <body
      style="
        margin: 0;
        padding: 0;
        background-color: #f8fafc;
        color: #111827;
        font-family: Outfit, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI',
          Arial, sans-serif;
        letter-spacing: -0.015em;
      "
    >
      <div
        style="
          background-color: #f8fafc;
          margin: 0;
          padding: 32px 16px;
          width: 100%;
          box-sizing: border-box;
        "
      >
        <div
          style="
            max-width: 560px;
            margin: 0 auto;
            width: 100%;
            box-sizing: border-box;
          "
        >
          <div style="padding: 32px 32px 20px 32px; text-align: center">
            <h1
              style="
                margin: 0;
                color: #111827;
                font-family: Outfit, 'Times New Roman', serif;
                font-size: 32px;
                line-height: 1.15;
                font-weight: 700;
                letter-spacing: -0.03em;
              "
            >
              ${heading}
            </h1>

            <p
              style="
                margin: 14px 0 0 0;
                color: #64748b;
                font-size: 16px;
                line-height: 1.6;
              "
            >
              ${instruction}
            </p>
          </div>

          <div style="padding: 12px 32px 28px 32px">
            <div
              style="
                color: #4f46e5;
                font-size: 40px;
                line-height: 1;
                font-weight: 800;
                letter-spacing: 0.18em;
                font-family: Outfit, Inter, -apple-system, BlinkMacSystemFont,
                  'Segoe UI', Arial, sans-serif;
                text-align: center;
              "
            >
              ${otp}
            </div>
          </div>

          <div style="padding: 0 32px 32px 32px">
            <p
              style="
                margin: 0;
                color: #334155;
                font-size: 15px;
                line-height: 1.7;
                text-align: center;
              "
            >
              This code will expire in
              <strong>15 minutes</strong>. Do not share this code with anyone.
            </p>

            <p
              style="
                margin: 16px 0 0 0;
                color: #64748b;
                font-size: 14px;
                line-height: 1.7;
                text-align: center;
              "
            >
              If you did not request this code, you can safely ignore this email.
            </p>
          </div>

          <div style="padding: 0 32px">
            <div
              style="
                height: 1px;
                background-color: #e2e8f0;
                line-height: 1px;
                font-size: 1px;
              "
            >
              &nbsp;
            </div>
          </div>

          <div style="padding: 24px 32px 32px 32px; text-align: center">
            <p
              style="
                margin: 0;
                color: #94a3b8;
                font-size: 13px;
                line-height: 1.6;
              "
            >
              Sent by ${APP_NAME}
            </p>

            <p
              style="
                margin: 8px 0 0 0;
                color: #94a3b8;
                font-size: 12px;
                line-height: 1.6;
              "
            >
              This is an automated message. Please do not reply.
            </p>

            <p
              style="
                margin: 8px 0 0 0;
                color: #94a3b8;
                font-size: 12px;
                line-height: 1.6;
              "
            >
              © 2026 ${APP_NAME}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </body>
  </html>`;

  await sendEmail({
    from: envServer.SENDER_EMAIL,
    to: email,
    subject,
    html,
    text,
  });
};
