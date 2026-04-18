import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message, subject: subjectFromBody } = body;

    // Validate input
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 },
      );
    }

    // Get EmailJS configuration from environment variables
    // Use private key for server-side API calls (accessToken)
    // Also need public key (user_id) for some EmailJS API versions
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId =
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "template_ubdyky8";
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !privateKey) {
      console.error("EmailJS configuration missing:", {
        hasServiceId: !!serviceId,
        hasTemplateId: !!templateId,
        hasPrivateKey: !!privateKey,
        hasPublicKey: !!publicKey,
      });
      return NextResponse.json(
        { error: "Email service is not configured." },
        { status: 500 },
      );
    }

    // Prepare template parameters - ensure all values are strings
    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    ).replace(/\/$/, "");

    const nameTrim = String(name?.trim() || "");
    /** Forms only collect name + email + message; subject defaults for EmailJS {{title}} / {{subject}}. */
    const subjectLine = String(
      subjectFromBody?.trim() || "Contact Form Submission",
    );
    const nameInitial = nameTrim ? nameTrim.charAt(0).toUpperCase() : "?";
    const templateParams = {
      name: nameTrim,
      name_initial: nameInitial,
      email: String(email?.trim() || ""),
      subject: subjectLine,
      /** Alias for EmailJS subject lines like `Contact Us: {{title}}` */
      title: subjectLine,
      message: String(message?.trim() || ""),
      from_name: nameTrim,
      from_email: String(email?.trim() || ""),
      time: new Date().toLocaleString(),
      site_url: siteUrl,
    };

    console.log("Sending email via EmailJS REST API");
    console.log("Service ID:", serviceId);
    console.log("Template ID:", templateId);
    console.log("Template params:", templateParams);

    // EmailJS REST API endpoint - use JSON format with accessToken
    const emailjsUrl = "https://api.emailjs.com/api/v1.0/email/send";

    const requestBody: {
      service_id: string;
      template_id: string;
      accessToken: string;
      user_id?: string;
      template_params: typeof templateParams;
    } = {
      service_id: serviceId,
      template_id: templateId,
      accessToken: privateKey,
      template_params: templateParams,
    };

    // Add user_id (public key) if available - some EmailJS API versions require it
    if (publicKey && publicKey.trim()) {
      requestBody.user_id = publicKey.trim();
    }

    // Send email via EmailJS REST API
    const response = await fetch(emailjsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log("EmailJS response status:", response.status);
    console.log("EmailJS response text:", responseText);

    if (!response.ok) {
      console.error("EmailJS API error:", responseText);
      let errorMessage = "Failed to send email";
      try {
        const error = JSON.parse(responseText);
        errorMessage = error.message || error.text || errorMessage;
      } catch {
        errorMessage = responseText || errorMessage;
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status },
      );
    }

    console.log("Email sent successfully!");
    return NextResponse.json(
      { message: "Your message has been sent successfully!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending email:", error);
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while sending your message.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
