const nodemailer = require("nodemailer");
require("dotenv").config();

// Check if credentials exist in .env
const hasCredentials = process.env.EMAIL_USER && process.env.EMAIL_PASS;
let transporter = null;

if (hasCredentials) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    secure: (process.env.EMAIL_SECURE === "true"), // true for port 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER.trim(),
      pass: process.env.EMAIL_PASS.trim()
    }
  });
  console.log("Email Notification Service: Configured in SMTP Mode.");
} else {
  console.log("Email Notification Service: Configured in Mock Mode (no credentials provided in .env).");
}

/**
 * Sends an email notification to the student's guardian when the student exits or enters the gate on an approved long leave.
 * 
 * @param {Object} params
 * @param {string} params.studentName Name of the student
 * @param {string} params.studentId ID of the student (e.g. STU001)
 * @param {string} params.guardianName Name of the guardian
 * @param {string} params.guardianEmail Email of the guardian
 * @param {'EXIT' | 'ENTRY'} params.type The event type
 * @param {Object} params.details Log and leave details
 * @param {string} params.details.time Time of the gate pass
 * @param {string} params.details.leaveType Type of leave (e.g. Home Visit, Medical)
 * @param {string} params.details.reason Reason for leave
 * @param {string} [params.details.remarks] Guard's exit or entry remarks
 * @param {string} params.details.fromDate From date of leave
 * @param {string} params.details.toDate To date of leave
 */
async function sendGuardianLeaveAlert({
  studentName,
  studentId,
  guardianName,
  guardianEmail,
  type,
  details
}) {
  if (!guardianEmail || !guardianEmail.trim()) {
    console.warn(`[Notification] Cannot send alert: No guardian email specified for student ${studentName} (${studentId}).`);
    return;
  }

  const isExit = type === "EXIT";
  const actionTitle = isExit ? "Checked OUT (Exit Logged)" : "Checked IN (Return Logged)";
  const subject = `[Hostel Pass] Security Alert: ${studentName} ${isExit ? 'exited' : 'returned to'} the Hostel Gate`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          margin: 0;
          padding: 20px;
          color: #334155;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }
        .header {
          background-color: ${isExit ? '#ea580c' : '#059669'};
          color: #ffffff;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .header p {
          margin: 5px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 20px;
          line-height: 1.5;
        }
        .status-box {
          background-color: ${isExit ? '#fff7ed' : '#ecfdf5'};
          border-left: 4px solid ${isExit ? '#ea580c' : '#059669'};
          padding: 15px 20px;
          border-radius: 0 8px 8px 0;
          margin-bottom: 25px;
        }
        .status-box strong {
          color: ${isExit ? '#c2410c' : '#047857'};
          font-size: 15px;
          display: block;
          margin-bottom: 3px;
        }
        .status-box p {
          margin: 0;
          font-size: 14px;
          color: #475569;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
          font-size: 14px;
        }
        .details-table th, .details-table td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #f1f5f9;
        }
        .details-table th {
          width: 35%;
          color: #64748b;
          font-weight: 600;
          background-color: #f8fafc;
        }
        .details-table td {
          color: #1e293b;
        }
        .footer {
          background-color: #f8fafc;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          margin: 4px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Hostel Gate Pass Notification</h1>
          <p>Hostel Management System Security Portal</p>
        </div>
        <div class="content">
          <p class="greeting">Dear <strong>${guardianName || "Parent/Guardian"}</strong>,</p>
          <p class="greeting">
            This is an automated safety alert regarding your ward, <strong>${studentName}</strong> (ID: ${studentId}).
          </p>
          
          <div class="status-box">
            <strong>Security Action: ${actionTitle}</strong>
            <p>Your ward has successfully ${isExit ? 'checked out of' : 'returned to'} the hostel campus.</p>
          </div>

          <table class="details-table">
            <tr>
              <th>Event Time</th>
              <td>${details.time}</td>
            </tr>
            <tr>
              <th>Leave Reference</th>
              <td>${details.leaveType} (${details.fromDate} to ${details.toDate})</td>
            </tr>
            <tr>
              <th>Reason for Leave</th>
              <td>${details.reason}</td>
            </tr>
            ${details.remarks ? `
            <tr>
              <th>Guard Remarks</th>
              <td>${details.remarks}</td>
            </tr>
            ` : ''}
          </table>

          <p class="greeting" style="font-size: 14px; color: #64748b;">
            This email is triggered automatically for approved travels to ensure student safety and transparent tracking. If you notice any discrepancy or have questions, please contact the hostel warden's administration office.
          </p>
        </div>
        <div class="footer">
          <p>&copy; 2026 Hostel Management System. All rights reserved.</p>
          <p>This is a system-generated security notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Standard Plain Text fallback
  const textContent = `
    Dear ${guardianName || "Parent/Guardian"},
    
    This is an automated safety alert regarding your ward, ${studentName} (ID: ${studentId}).
    
    Security Action: ${actionTitle}
    Your ward has successfully ${isExit ? 'checked out of' : 'returned to'} the hostel campus.
    
    --- Details ---
    Event Time: ${details.time}
    Leave Type: ${details.leaveType}
    Leave Span: ${details.fromDate} to ${details.toDate}
    Reason: ${details.reason}
    ${details.remarks ? `Guard Remarks: ${details.remarks}` : ''}
    
    This email is triggered automatically for approved travels to ensure student safety. If you have questions, please contact the hostel warden.
    
    Regards,
    Hostel Management Security Admin
  `;

  // Executing Email delivery
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"Hostel Safety Alert" <${process.env.EMAIL_USER.trim()}>`,
        to: guardianEmail.trim(),
        subject: subject,
        text: textContent,
        html: htmlContent
      });
      console.log(`[Notification] Live email alert sent to guardian ${guardianEmail} for student ${studentName} (${type}).`);
    } catch (err) {
      console.error(`[Notification] Failed to send email alert to ${guardianEmail}:`, err.message);
    }
  } else {
    // MOCK MODE FALLBACK LOGGING (Extremely detailed to allow testing!)
    console.log(`
========================================================================
[MOCK EMAIL NOTIFICATION - NO SMTP CREDENTIALS IN .env]
------------------------------------------------------------------------
To: ${guardianName} <${guardianEmail}>
Subject: ${subject}
Message Body:
${textContent}
========================================================================
    `);
  }
}

module.exports = {
  sendGuardianLeaveAlert
};
