// Supabase Edge Function to generate PDF from membership application and send emails
// This function generates a filled PDF and sends it to both BAMAS and the applicant

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FormData {
  applicationType: string;
  fullName: string;
  dateOfBirth: string;
  age: string;
  gender: string;
  nationality: string;
  currentEmployment: string;
  experienceLevel: string;
  legalName: string;
  legalForm: string;
  registrationNumber: string;
  countryOfRegistration: string;
  registeredAddress: string;
  website: string;
  mainActivity: string;
  address: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  linkedIn: string;
  motivation: string;
  willingToContribute: string;
  contributeExplanation: string;
  valuesAlign: string;
  valuesExplanation: string;
  industryReputation: string;
  amCompanyRelationships: string;
  politicalAffiliations: string;
  readArticles: boolean;
  confirmAccuracy: boolean;
  understandApproval: boolean;
  agreeGDPR: boolean;
  signaturePlace: string;
  signatureDate: string;
  signatureName: string;
}

interface MembershipApplicationRequest {
  formData: FormData;
  language: string;
}

// Sanitize text for PDF - remove characters not supported by WinAnsi encoding
function sanitizeForPDF(text: string): string {
  if (!text) return "";
  // Replace Cyrillic and other non-WinAnsi characters with transliteration or remove them
  // WinAnsi supports: ASCII (0x20-0x7E) and Latin-1 Supplement (0xA0-0xFF)
  return text.replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
}

// Generate the PDF document
async function generatePDF(formData: FormData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Embed fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Colors
  const tealColor = rgb(0.06, 0.46, 0.43); // #0f766e
  const grayColor = rgb(0.4, 0.4, 0.4);
  const blackColor = rgb(0, 0, 0);

  // Add first page
  let page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();
  let yPosition = height - 50;

  // Header
  page.drawText("BULGARIAN ADDITIVE MANUFACTURING ASSOCIATION", {
    x: 50,
    y: yPosition,
    size: 12,
    font: fontBold,
    color: tealColor,
  });

  yPosition -= 15;
  page.drawText("BAMAS", {
    x: 50,
    y: yPosition,
    size: 10,
    font: font,
    color: grayColor,
  });

  yPosition -= 30;
  page.drawText("MEMBERSHIP APPLICATION FORM", {
    x: 50,
    y: yPosition,
    size: 16,
    font: fontBold,
    color: blackColor,
  });

  // Helper function to add a section
  const addSection = (title: string, titleBg?: string) => {
    yPosition -= 25;
    if (yPosition < 80) {
      page = pdfDoc.addPage([595, 842]);
      yPosition = height - 50;
    }
    page.drawText(title, {
      x: 50,
      y: yPosition,
      size: 11,
      font: fontBold,
      color: tealColor,
    });
    if (titleBg) {
      yPosition -= 12;
      page.drawText(titleBg, {
        x: 50,
        y: yPosition,
        size: 9,
        font: font,
        color: grayColor,
      });
    }
  };

  // Helper function to add a field
  const addField = (label: string, value: string, labelBg?: string) => {
    yPosition -= 18;
    if (yPosition < 80) {
      page = pdfDoc.addPage([595, 842]);
      yPosition = height - 50;
    }

    page.drawText(`${sanitizeForPDF(label)}:`, {
      x: 50,
      y: yPosition,
      size: 9,
      font: font,
      color: grayColor,
    });

    page.drawText(sanitizeForPDF(value) || "N/A", {
      x: 220,
      y: yPosition,
      size: 9,
      font: font,
      color: blackColor,
    });

    if (labelBg) {
      yPosition -= 10;
      page.drawText(labelBg, {
        x: 50,
        y: yPosition,
        size: 7,
        font: font,
        color: grayColor,
      });
    }
  };

  // Helper to add checkbox field
  const addCheckbox = (label: string, checked: boolean) => {
    yPosition -= 16;
    if (yPosition < 80) {
      page = pdfDoc.addPage([595, 842]);
      yPosition = height - 50;
    }

    const checkMark = checked ? "[X]" : "[ ]";
    page.drawText(checkMark, {
      x: 50,
      y: yPosition,
      size: 10,
      font: fontBold,
      color: checked ? tealColor : grayColor,
    });

    page.drawText(sanitizeForPDF(label), {
      x: 70,
      y: yPosition,
      size: 8,
      font: font,
      color: blackColor,
    });
  };

  // Application Type
  addSection("A. APPLICANT INFORMATION");

  const applicationTypeLabels: Record<string, string> = {
    individual: "Individual Membership",
    company: "Company / Legal Entity",
    academic: "Academic / Research Institution",
    public: "Public Organisation",
    private: "Private Organisation",
    foreign: "Foreign Partner / International Org.",
  };

  addField("Type of Application", applicationTypeLabels[formData.applicationType] || formData.applicationType);

  // Personal or Organization details based on type
  if (formData.applicationType === "individual") {
    addSection("B. PERSONAL DETAILS");
    addField("Full Name", formData.fullName);
    addField("Date of Birth", formData.dateOfBirth);
    addField("Age", formData.age);
    addField("Gender", formData.gender || "Not specified");
    addField("Nationality", formData.nationality);
    addField("Current Employment", formData.currentEmployment);

    const experienceLabels: Record<string, string> = {
      none: "None",
      "1-3": "1-3 years",
      "3-5": "3-5 years",
      "5-10": "5-10 years",
      "10+": "10+ years",
    };
    addField("Experience in AM", experienceLabels[formData.experienceLevel] || "Not specified");
  } else {
    addSection("C. ORGANISATION DETAILS");
    addField("Legal Name", formData.legalName);
    addField("Legal Form", formData.legalForm);
    addField("Registration Number", formData.registrationNumber);
    addField("Country of Registration", formData.countryOfRegistration);
    addField("Registered Address", formData.registeredAddress);
    addField("Website", formData.website);
    addField("Main Activity (AM)", formData.mainActivity?.substring(0, 80) || "N/A");
  }

  // Contact Information
  addSection("D. CONTACT INFORMATION");
  addField("Address", formData.address);
  addField("City", formData.city);
  addField("Country", formData.country);
  addField("Email", formData.email);
  addField("Phone", formData.phone);
  addField("LinkedIn", formData.linkedIn || "Not provided");

  // Motivation
  addSection("E. MOTIVATION AND ALIGNMENT");

  // Wrap motivation text
  const motivationLines = wrapText(formData.motivation || "Not provided", 70);
  yPosition -= 15;
  page.drawText("Motivation for membership:", {
    x: 50,
    y: yPosition,
    size: 9,
    font: font,
    color: grayColor,
  });

  for (const line of motivationLines.slice(0, 4)) {
    yPosition -= 12;
    if (yPosition < 80) {
      page = pdfDoc.addPage([595, 842]);
      yPosition = height - 50;
    }
    page.drawText(sanitizeForPDF(line), {
      x: 50,
      y: yPosition,
      size: 9,
      font: font,
      color: blackColor,
    });
  }

  const contributionLabels: Record<string, string> = {
    yes: "Yes",
    no: "No",
    partially: `Partially: ${formData.contributeExplanation}`,
  };
  addField("Willing to contribute", contributionLabels[formData.willingToContribute] || "Not specified");

  const valuesLabels: Record<string, string> = {
    yes: "Yes",
    no: "No",
    partially: `Partially: ${formData.valuesExplanation}`,
  };
  addField("Values align with BAMAS", valuesLabels[formData.valuesAlign] || "Not specified");

  // Professional Background
  addSection("F. PROFESSIONAL BACKGROUND");

  const reputationLabels: Record<string, string> = {
    no_prior: "No prior experience",
    positive: "Positive",
    negative: "Negative",
    mixed: "Mixed/Neutral",
  };
  addField("Industry Reputation", reputationLabels[formData.industryReputation] || "Not specified");
  addField("AM Company Relationships", formData.amCompanyRelationships?.substring(0, 60) || "None specified");
  addField("Political Affiliations", formData.politicalAffiliations?.substring(0, 60) || "None");

  // Compliance
  addSection("G. COMPLIANCE AND DECLARATIONS");
  addCheckbox("I have read and understood the Articles of Association of BAMAS", formData.readArticles);
  addCheckbox("I confirm that the information provided is true, complete, and accurate", formData.confirmAccuracy);
  addCheckbox("I understand membership is subject to approval by the BAMAS Board", formData.understandApproval);
  addCheckbox("I agree to data processing in accordance with GDPR", formData.agreeGDPR);

  // Signature
  addSection("H. SIGNATURE");
  addField("Place", formData.signaturePlace);
  addField("Date", formData.signatureDate);
  addField("Full Name", formData.signatureName);

  yPosition -= 25;
  page.drawText("Digital Signature: Signed electronically", {
    x: 50,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: tealColor,
  });

  // Footer on last page
  yPosition -= 40;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 0.5,
    color: grayColor,
  });

  yPosition -= 15;
  page.drawText(`Application submitted: ${new Date().toISOString()}`, {
    x: 50,
    y: yPosition,
    size: 8,
    font: font,
    color: grayColor,
  });

  yPosition -= 12;
  page.drawText("BULGARIAN ADDITIVE MANUFACTURING ASSOCIATION (BAMAS) - www.bamas.xyz", {
    x: 50,
    y: yPosition,
    size: 8,
    font: font,
    color: tealColor,
  });

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

// Helper function to wrap text
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length > maxChars) {
      lines.push(currentLine.trim());
      currentLine = word + " ";
    } else {
      currentLine += word + " ";
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return lines;
}

// Base64 encode the PDF for email attachment
function base64Encode(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Create email HTML template
function createEmailHTML(formData: FormData, isAdminCopy: boolean): string {
  const applicantName = formData.fullName || formData.legalName || "Applicant";

  if (isAdminCopy) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Membership Application</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #0f766e;
    }
    h1 {
      color: #0f766e;
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: #fef3c7;
      color: #92400e;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }
    .info-grid {
      display: grid;
      gap: 15px;
      margin: 20px 0;
    }
    .info-item {
      padding: 12px;
      background-color: #f7f7f7;
      border-radius: 6px;
    }
    .info-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }
    .info-value {
      font-weight: 600;
      color: #333;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      font-size: 14px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Membership Application</h1>
      <span class="badge">Pending Review</span>
    </div>
    
    <p>A new membership application has been submitted and requires review by the Board of Directors.</p>
    
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Applicant Name</div>
        <div class="info-value">${applicantName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Application Type</div>
        <div class="info-value">${formData.applicationType}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Email</div>
        <div class="info-value">${formData.email}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Phone</div>
        <div class="info-value">${formData.phone}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Location</div>
        <div class="info-value">${formData.city}, ${formData.country}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Submitted</div>
        <div class="info-value">${new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</div>
      </div>
    </div>
    
    <p><strong>The complete application form is attached as a PDF.</strong></p>
    
    <div class="footer">
      <p>Bulgarian Additive Manufacturing Association (BAMAS)</p>
      <p>www.bamas.xyz | info@bamas.xyz</p>
    </div>
  </div>
</body>
</html>
    `;
  } else {
    // Applicant confirmation email
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Received - BAMAS</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .success-icon {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #0f766e, #14b8a6);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    .success-icon svg {
      width: 30px;
      height: 30px;
      fill: white;
    }
    h1 {
      color: #0f766e;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .subtitle {
      color: #666;
      font-size: 16px;
    }
    .content {
      margin-bottom: 30px;
    }
    .steps {
      background-color: #f0fdfa;
      border-left: 4px solid #0f766e;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .steps h3 {
      margin: 0 0 15px 0;
      color: #0f766e;
    }
    .steps ol {
      margin: 0;
      padding-left: 20px;
    }
    .steps li {
      margin-bottom: 10px;
    }
    .payment-box {
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .payment-box h3 {
      margin: 0 0 10px 0;
      color: #92400e;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #0f766e;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin: 20px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      font-size: 14px;
      color: #666;
      text-align: center;
    }
    .footer a {
      color: #0f766e;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">
        <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
      </div>
      <h1>Application Received!</h1>
      <p class="subtitle">Заявлението Ви е получено успешно!</p>
    </div>
    
    <div class="content">
      <p>Dear ${applicantName},</p>
      
      <p>Thank you for submitting your membership application to the Bulgarian Additive Manufacturing Association (BAMAS). We have successfully received your application.</p>
      
      <div class="steps">
        <h3>Next Steps:</h3>
        <ol>
          <li><strong>Payment:</strong> Please complete the membership fee payment using the bank details provided on the confirmation page.</li>
          <li><strong>Review:</strong> Your application will be reviewed by the BAMAS Board of Directors.</li>
          <li><strong>Decision:</strong> You will be notified of the decision via email.</li>
        </ol>
      </div>
      
      <div class="payment-box">
        <h3>⚠️ Important: Membership Fee Payment</h3>
        <p>Please ensure you complete the membership fee payment to finalize your application. Refer to the confirmation page or the attached PDF for bank details.</p>
      </div>
      
      <p>A copy of your application is attached to this email for your records.</p>
      
      <p>If you have any questions, please don't hesitate to contact us at <a href="mailto:info@bamas.xyz">info@bamas.xyz</a>.</p>
      
      <p>Best regards,<br>The BAMAS Team</p>
    </div>
    
    <div class="footer">
      <p>Bulgarian Additive Manufacturing Association (BAMAS)</p>
      <p><a href="https://bamas.xyz">www.bamas.xyz</a> | <a href="mailto:info@bamas.xyz">info@bamas.xyz</a></p>
    </div>
  </div>
</body>
</html>
    `;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
    const adminEmail = "info@bamas.xyz";

    // Parse request body
    const { formData, language }: MembershipApplicationRequest = await req.json();

    if (!formData || !formData.email) {
      return new Response(
        JSON.stringify({ error: "Form data with email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing membership application for: ${formData.email}`);

    // Generate the PDF
    const pdfBytes = await generatePDF(formData);
    const pdfBase64 = base64Encode(pdfBytes);

    console.log(`PDF generated successfully, size: ${pdfBytes.length} bytes`);

    // Create email content
    const adminEmailHtml = createEmailHTML(formData, true);
    const applicantEmailHtml = createEmailHTML(formData, false);

    const applicantName = formData.fullName || formData.legalName || "Applicant";
    const fileName = `BAMAS_Application_${applicantName.replace(/\s+/g, "_")}_${formData.signatureDate}.pdf`;

    // Send emails using Resend API
    if (resendApiKey) {
      // Send to admin (info@bamas.xyz)
      const adminResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "BAMAS Membership <noreply@bamas.xyz>",
          to: [adminEmail],
          subject: `New Membership Application: ${applicantName}`,
          html: adminEmailHtml,
          attachments: [
            {
              filename: fileName,
              content: pdfBase64,
            },
          ],
        }),
      });

      if (!adminResponse.ok) {
        const error = await adminResponse.text();
        console.error("Failed to send admin email:", error);
        throw new Error(`Failed to send admin email: ${error}`);
      }

      console.log("Admin email sent successfully");

      // Send to applicant
      const applicantResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "BAMAS <noreply@bamas.xyz>",
          to: [formData.email],
          subject: "Application Received - BAMAS Membership",
          html: applicantEmailHtml,
          attachments: [
            {
              filename: fileName,
              content: pdfBase64,
            },
          ],
        }),
      });

      if (!applicantResponse.ok) {
        const error = await applicantResponse.text();
        console.error("Failed to send applicant email:", error);
        // Don't throw here, admin email was sent successfully
      } else {
        console.log("Applicant confirmation email sent successfully");
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Application submitted and emails sent successfully",
          applicant: applicantName,
          email: formData.email,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      // No Resend API key - just log
      console.warn("RESEND_API_KEY not configured. Emails not sent.");
      console.log("Application would be sent to:", adminEmail);
      console.log("Confirmation would be sent to:", formData.email);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Application processed (email service not configured)",
          warning: "Email sending is not configured. Please contact info@bamas.xyz directly.",
          applicant: applicantName,
          email: formData.email,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error processing membership application:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to process membership application",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
