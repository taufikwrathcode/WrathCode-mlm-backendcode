import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "your-app-password",
  },
});

// ================== REGISTRATION EMAIL ==================
export const sendRegistrationEmail = async (user) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@mlmnetwork.com",
      to: user.email,
      subject: "🎉 Welcome to MLM Network - Your Referral Code Inside!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: white; padding: 30px; }
            .referral-box { background: #e7f3ff; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; }
            .referral-code { font-size: 24px; font-weight: bold; color: #007bff; }
            .button { background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to MLM Network</h1>
            </div>
            
            <div class="content">
              <p>Dear <strong>${user.name}</strong>,</p>
              
              <p>Welcome to MLM Network! We're thrilled to have you on board.</p>
              
              <div class="referral-box">
                <h3>Your Unique Referral Code:</h3>
                <p class="referral-code">${user.referral}</p>
                <p style="color: #666;">Share this code with your friends and family to earn commissions!</p>
              </div>
              
              <h3>Quick Start Guide:</h3>
              <ol>
                <li>Complete your <strong>KYC Verification</strong></li>
                <li>Choose a <strong>Plan</strong> (Binary, Unilevel, or Matrix)</li>
                <li>Make <strong>Payment</strong></li>
                <li>Start <strong>Earning</strong></li>
              </ol>
              
              <p style="text-align: center;">
                <a href="${process.env.APP_URL || "https://yourapp.com"}/dashboard" class="button">Go to Dashboard</a>
              </p>
              
              <h3>Need Help?</h3>
              <p>Contact our support team at <strong>support@mlmnetwork.com</strong></p>
              
              <p>Best regards,<br><strong>MLM Network Team</strong></p>
            </div>
            
            <div class="footer">
              <p>&copy; 2024 MLM Network. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Registration email sent to ${user.email}`);
  } catch (error) {
    console.error(" Registration email error:", error);
  }
};

// ================== KYC APPROVAL EMAIL ==================
export const sendKYCApprovalEmail = async (user) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@mlmnetwork.com",
      to: user.email,
      subject: "✅ Your KYC is Approved! Ready to Buy Plans",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: white; padding: 30px; }
            .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
            .plans { margin: 20px 0; }
            .plan-card { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .button { background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ KYC Verification Complete!</h1>
            </div>
            
            <div class="content">
              <p>Dear <strong>${user.name}</strong>,</p>
              
              <div class="success-box">
                <h3>🎉 Your KYC has been Approved!</h3>
                <p>You can now purchase plans and start earning with MLM Network.</p>
              </div>
              
              <h3>📋 Available Plans:</h3>
              <div class="plans">
                <div class="plan-card">
                  <strong>💰 Binary Plan - ₹1,499</strong>
                  <p>Two-leg structure with unlimited depth</p>
                </div>
                <div class="plan-card">
                  <strong>💰 Unilevel Plan - ₹999</strong>
                  <p>Single line structure with breadth earnings</p>
                </div>
                <div class="plan-card">
                  <strong>💰 Matrix Plan - ₹2,499</strong>
                  <p>Structured matrix earning system</p>
                </div>
              </div>
              
              <h3>💳 Payment Methods:</h3>
              <ul>
                <li>💵 Wallet (Instant)</li>
                <li>🏦 Razorpay (UPI/Bank)</li>
                <li>🏢 Offline (Cheque/Cash)</li>
              </ul>
              
              <p style="text-align: center;">
                <a href="${process.env.APP_URL || "https://yourapp.com"}/plans" class="button">Buy a Plan Now</a>
              </p>
              
              <p>Best regards,<br><strong>MLM Network Team</strong></p>
            </div>
            
            <div class="footer">
              <p>&copy; 2024 MLM Network. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ KYC approval email sent to ${user.email}`);
  } catch (error) {
    console.error("❌ KYC approval email error:", error);
  }
};

// ================== PLAN ACTIVATION EMAIL ==================
export const sendPlanActivationEmail = async (
  user,
  plan,
  amount,
  referralCode,
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@mlmnetwork.com",
      to: user.email,
      subject: `🚀 Your ${plan} Plan is ACTIVE! Start Earning Now`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: white; padding: 30px; }
            .activation-box { background: #e7f3ff; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; }
            .details { background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
            .referral-code { font-size: 22px; font-weight: bold; color: #007bff; background: #fff; padding: 10px; border-radius: 5px; }
            .button { background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 ${plan} Plan Activated!</h1>
            </div>
            
            <div class="content">
              <p>Dear <strong>${user.name}</strong>,</p>
              
              <div class="activation-box">
                <h3>✅ Congratulations!</h3>
                <p>Your <strong>${plan}</strong> plan has been activated successfully!</p>
              </div>
              
              <h3>📊 Plan Details:</h3>
              <div class="details">
                <div class="detail-row">
                  <span><strong>Plan Name:</strong></span>
                  <span>${plan}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Amount:</strong></span>
                  <span>₹${amount}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Status:</strong></span>
                  <span style="color: #28a745;">✅ ACTIVE</span>
                </div>
                <div class="detail-row">
                  <span><strong>Activation Date:</strong></span>
                  <span>${new Date().toLocaleDateString()}</span>
                </div>
              </div>
              
              <h3>🔑 Your Referral Code (Share & Earn):</h3>
              <div style="text-align: center; background: #f8f9fa; padding: 20px; border-radius: 5px;">
                <p class="referral-code">${referralCode}</p>
                <p style="color: #666; font-size: 14px;">Share this code with friends to earn commissions!</p>
              </div>
              
              <h3>💡 Next Steps:</h3>
              <ol>
                <li>Refer friends using your referral code</li>
                <li>Earn commissions from their purchases</li>
                <li>Upgrade to higher plans for more earnings</li>
              </ol>
              
              <p style="text-align: center;">
                <a href="${process.env.APP_URL || "https://yourapp.com"}/dashboard" class="button">View Dashboard</a>
              </p>
              
              <p>Best regards,<br><strong>MLM Network Team</strong></p>
            </div>
            
            <div class="footer">
              <p>&copy; 2024 MLM Network. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Plan activation email sent to ${user.email}`);
  } catch (error) {
    console.error("❌ Plan activation email error:", error);
  }
};

// ================== PAYMENT REJECTION EMAIL ==================
export const sendPaymentRejectionEmail = async (user, plan, reason) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@mlmnetwork.com",
      to: user.email,
      subject: `⚠️ Your ${plan} Plan Payment - Needs Action`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: white; padding: 30px; }
            .warning-box { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; }
            .button { background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Payment Rejection Notice</h1>
            </div>
            
            <div class="content">
              <p>Dear <strong>${user.name}</strong>,</p>
              
              <div class="warning-box">
                <h3>❌ Your ${plan} Plan Payment Was Rejected</h3>
                <p><strong>Reason:</strong> ${reason}</p>
              </div>
              
              <h3>What Now?</h3>
              <ol>
                <li>Review the rejection reason above</li>
                <li>Prepare correct payment proof</li>
                <li>Submit payment again</li>
              </ol>
              
              <h3>💰 Plan Details:</h3>
              <ul>
                <li><strong>Plan:</strong> ${plan}</li>
                <li><strong>Try Payment Again</strong></li>
              </ul>
              
              <p>If you have questions, please contact our support team.</p>
              
              <p style="text-align: center;">
                <a href="${process.env.APP_URL || "https://yourapp.com"}/support" class="button">Contact Support</a>
              </p>
              
              <p>Best regards,<br><strong>MLM Network Team</strong></p>
            </div>
            
            <div class="footer">
              <p>&copy; 2024 MLM Network. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Payment rejection email sent to ${user.email}`);
  } catch (error) {
    console.error("❌ Payment rejection email error:", error);
  }
};

// ================== OFFLINE PAYMENT INITIALIZATION EMAIL ==================
export const sendOfflinePaymentEmail = async (
  user,
  plan,
  amount,
  referenceId,
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@mlmnetwork.com",
      to: user.email,
      subject: `📋 Your ${plan} Plan - Offline Payment Instructions (Ref: ${referenceId})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { background: #ff9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: white; padding: 30px; }
            .instruction-box { background: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; }
            .reference-id { font-size: 24px; font-weight: bold; color: #ff9800; background: white; padding: 15px; border-radius: 5px; text-align: center; }
            .payment-details { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
            .button { background: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .payment-option { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 15px 0; }
            .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Offline Payment Instructions</h1>
            </div>
            
            <div class="content">
              <p>Dear <strong>${user.name}</strong>,</p>
              
              <div class="instruction-box">
                <h3>⚠️ Important: Save this Reference ID</h3>
                <p class="reference-id">${referenceId}</p>
                <p style="color: #666; text-align: center;">Use this ID for all payment communications</p>
              </div>
              
              <h3>💰 Payment Details:</h3>
              <div class="payment-details">
                <div class="detail-row">
                  <span><strong>Plan:</strong></span>
                  <span>${plan}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Amount:</strong></span>
                  <span><strong>₹${amount}</strong></span>
                </div>
                <div class="detail-row">
                  <span><strong>Reference ID:</strong></span>
                  <span><strong>${referenceId}</strong></span>
                </div>
              </div>
              
              <h3>📍 Payment Methods:</h3>
              
              <div class="payment-option">
                <h4>💵 Option 1: Cash at Office</h4>
                <p>📱 Contact: <strong>${process.env.OFFICE_PHONE}</strong></p>
                <p>📍 Address: <strong>${process.env.OFFICE_ADDRESS}</strong></p>
                <p>Bring this Reference ID: <strong>${referenceId}</strong></p>
              </div>
              
              <div class="payment-option">
                <h4>🏦 Option 2: Cheque Transfer</h4>
                <p>Make cheque in favor of: <strong>MLM Network India Pvt Ltd</strong></p>
                <p>📍 Send to: <strong>${process.env.OFFICE_ADDRESS}</strong></p>
                <p>Write Reference ID on cheque: <strong>${referenceId}</strong></p>
              </div>
              
              <h3>✅ Next Steps:</h3>
              <ol>
                <li>Complete payment using one of the methods above</li>
                <li>Keep your payment proof (receipt/screenshot)</li>
                <li>Contact admin with Reference ID and payment proof</li>
                <li>Admin will verify and activate your plan</li>
                <li>You'll receive confirmation email with Referral Code</li>
              </ol>
              
              <h3>📞 Need Help?</h3>
              <p>Contact us at: <strong>${process.env.ADMIN_EMAIL}</strong></p>
              <p>Phone: <strong>${process.env.OFFICE_PHONE}</strong></p>
              
              <p>Best regards,<br><strong>MLM Network Team</strong></p>
            </div>
            
            <div class="footer">
              <p>&copy; 2024 MLM Network. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Offline payment email sent to ${user.email}`);
  } catch (error) {
    console.error("❌ Offline payment email error:", error);
  }
};

// ================== BANK TRANSFER INITIALIZATION EMAIL ==================
export const sendBankTransferEmail = async (
  user,
  plan,
  amount,
  referenceId,
  bankDetails,
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@mlmnetwork.com",
      to: user.email,
      subject: `🏦 Your ${plan} Plan - Bank Transfer Instructions (Ref: ${referenceId})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { background: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: white; padding: 30px; }
            .reference-id { font-size: 24px; font-weight: bold; color: #1976d2; background: #e3f2fd; padding: 15px; border-radius: 5px; text-align: center; }
            .bank-details { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
            .payment-details { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .button { background: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏦 Bank Transfer Instructions</h1>
            </div>
            
            <div class="content">
              <p>Dear <strong>${user.name}</strong>,</p>
              
              <div class="warning">
                <h3>⚠️ Important: Save this Reference ID</h3>
                <p class="reference-id">${referenceId}</p>
                <p style="color: #666; text-align: center; margin-top: 10px;">Use this ID as payment description</p>
              </div>
              
              <h3>💳 Payment Details:</h3>
              <div class="payment-details">
                <div class="detail-row">
                  <span><strong>Plan:</strong></span>
                  <span>${plan}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Amount:</strong></span>
                  <span><strong>₹${amount}</strong></span>
                </div>
                <div class="detail-row">
                  <span><strong>Reference ID:</strong></span>
                  <span><strong>${referenceId}</strong></span>
                </div>
              </div>
              
              <h3>🏦 Bank Account Details:</h3>
              <div class="bank-details">
                <div class="detail-row">
                  <span><strong>Account Name:</strong></span>
                  <span>${bankDetails.accountName}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Account Number:</strong></span>
                  <span><strong>${bankDetails.accountNumber}</strong></span>
                </div>
                <div class="detail-row">
                  <span><strong>Bank Name:</strong></span>
                  <span>${bankDetails.bankName}</span>
                </div>
                <div class="detail-row">
                  <span><strong>IFSC Code:</strong></span>
                  <span><strong>${bankDetails.ifsc}</strong></span>
                </div>
                <div class="detail-row">
                  <span><strong>UPI ID:</strong></span>
                  <span><strong>${bankDetails.upiId}</strong></span>
                </div>
              </div>
              
              <h3>✅ Transfer Instructions:</h3>
              <ol>
                <li>Use your bank app or visit your bank</li>
                <li>Select "Transfer Funds"</li>
                <li>Enter above bank details</li>
                <li><strong>Use Reference ID as payment description: ${referenceId}</strong></li>
                <li>Complete the transfer</li>
                <li>Keep the transaction receipt</li>
              </ol>
              
              <h3>📋 After Transfer:</h3>
              <ol>
                <li>Note your transaction ID</li>
                <li>Go to your dashboard</li>
                <li>Submit transaction ID for verification</li>
                <li>Admin will verify and activate your plan</li>
              </ol>
              
              <p><strong>💡 Tip:</strong> Use UPI for instant transfer: ${bankDetails.upiId}</p>
              
              <h3>📞 Questions?</h3>
              <p>Email: <strong>${process.env.ADMIN_EMAIL}</strong></p>
              <p>Phone: <strong>${process.env.OFFICE_PHONE}</strong></p>
              
              <p>Best regards,<br><strong>MLM Network Team</strong></p>
            </div>
            
            <div class="footer">
              <p>&copy; 2024 MLM Network. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Bank transfer email sent to ${user.email}`);
  } catch (error) {
    console.error("❌ Bank transfer email error:", error);
  }
};

// ================== RAZORPAY ORDER NOTIFICATION EMAIL ==================
export const sendRazorpayOrderEmail = async (
  user,
  plan,
  amount,
  orderId,
  paymentMethod,
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || "noreply@mlmnetwork.com",
      to: user.email,
      subject: `💳 Complete Your ${plan} Plan Payment - Order ID: ${orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { background: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: white; padding: 30px; }
            .order-id { font-size: 20px; font-weight: bold; color: #1976d2; background: #e3f2fd; padding: 15px; border-radius: 5px; text-align: center; }
            .payment-summary { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; }
            .method-badge { display: inline-block; background: #4caf50; color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px; }
            .button { background: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💳 Complete Your Payment</h1>
            </div>
            
            <div class="content">
              <p>Dear <strong>${user.name}</strong>,</p>
              
              <p>Your payment request has been initiated. Please complete the payment using the method below:</p>
              
              <h3>📋 Order Details:</h3>
              <div class="payment-summary">
                <div class="detail-row">
                  <span><strong>Order ID:</strong></span>
                  <span class="method-badge">${orderId}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Plan:</strong></span>
                  <span><strong>${plan}</strong></span>
                </div>
                <div class="detail-row">
                  <span><strong>Amount:</strong></span>
                  <span><strong style="color: #d32f2f;">₹${amount}</strong></span>
                </div>
                <div class="detail-row">
                  <span><strong>Payment Method:</strong></span>
                  <span><strong>${paymentMethod.toUpperCase()}</strong></span>
                </div>
              </div>
              
              <h3>🔐 Next Steps:</h3>
              <ol>
                <li>Go to your dashboard</li>
                <li>Click "Continue Payment" button</li>
                <li>You will be redirected to secure payment gateway</li>
                <li>Complete payment using ${paymentMethod}</li>
                <li>Your plan will be automatically activated after successful payment</li>
              </ol>
              
              <p style="text-align: center; margin: 30px 0;">
                <strong>Payment will expire in 30 minutes.</strong>
              </p>
              
              <h3>❓ Having Issues?</h3>
              <ul>
                <li>Ensure your bank account has sufficient balance</li>
                <li>Check your internet connection</li>
                <li>Try a different payment method</li>
                <li>Contact support if payment fails</li>
              </ul>
              
              <h3>📞 Support Information:</h3>
              <p>Email: <strong>${process.env.ADMIN_EMAIL}</strong></p>
              <p>Phone: <strong>${process.env.OFFICE_PHONE}</strong></p>
              
              <p>Best regards,<br><strong>MLM Network Team</strong></p>
            </div>
            
            <div class="footer">
              <p>&copy; 2024 MLM Network. All rights reserved.</p>
              <p>This is an automated email. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Razorpay order email sent to ${user.email}`);
  } catch (error) {
    console.error("❌ Razorpay order email error:", error);
  }
};

// ================== CONTACT FORM EMAIL (Admin) ==================
export const sendContactFormEmail = async (name, email, subject, message) => {
  try {
    const mailOptions = {
      from: email,
      to: process.env.ADMIN_EMAIL || "admin@mlmnetwork.com",
      subject: `Contact Form: ${subject}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Contact email sent from ${email}`);
  } catch (error) {
    console.error("❌ Contact email error:", error);
  }
};
