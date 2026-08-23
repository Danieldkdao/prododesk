import { sendEmail } from "..";

export const sendAccountDeletionEmail = async ({
  email,
  url,
}: {
  email: string;
  url: string;
}) => {
  await sendEmail({
    to: email,
    subject: "Confirm your Prododesk account deletion",
    text: [
      "Confirm your account deletion",
      "",
      "You requested to permanently delete your Prododesk account.",
      "Open the link below to confirm:",
      "",
      url,
      "",
      "If you did not request this, please secure your credentials as someone may have gained access to your account.",
    ].join("\n"),
    html: `
      <h1>Confirm account deletion</h1>

      <p>
        You requested to permanently delete your Prododesk account and all
        associated data.
      </p>

      <p>
        <a href="${url}">Delete my account</a>
      </p>

      <p>
        If you did not request this, please secure your credentials as someone may have gained access to your account.
      </p>
    `,
  });
};
