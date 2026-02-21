import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Ensure required environment variables are present
const REGION = process.env.AWS_REGION || "us-east-1";

// Create SES service object.
const sesClient = new SESClient({
    region: REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    }
});

/**
 * Sends an email notification using AWS SES.
 * @param toAddresses An array of recipient email addresses.
 * @param subject The subject line of the email.
 * @param htmlBody The HTML body of the email.
 * @param textBody The plain text body of the email (optional).
 */
export const sendEmailNotification = async (
    toAddresses: string[],
    subject: string,
    htmlBody: string,
    textBody?: string
) => {
    // Basic validation
    if (!toAddresses || toAddresses.length === 0) {
        console.warn("No recipient addresses provided for email notification.");
        return;
    }

    // In many SES sandboxes, you can only send from verified identities.
    // Replace this with your verified SES sender email
    const senderEmail = process.env.SES_SENDER_EMAIL || process.env.EMAIL_USER;

    if (!senderEmail) {
        console.warn("No SES_SENDER_EMAIL configured. Cannot send email.");
        return;
    }

    try {
        const command = new SendEmailCommand({
            Destination: {
                ToAddresses: toAddresses,
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: htmlBody,
                    },
                    ...(textBody && {
                        Text: {
                            Charset: "UTF-8",
                            Data: textBody,
                        }
                    })
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: subject,
                },
            },
            Source: senderEmail,
        });

        const response = await sesClient.send(command);
        console.log(`Email sent successfully: ${response.MessageId}`);
        return response;
    } catch (error) {
        console.error("Error sending email via SES:", error);
        // We log the error but don't throw to avoid crashing the webhook/cron
        return null; // Return null on failure
    }
};
