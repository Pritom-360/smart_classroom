# ✉️ Supabase 6-Digit OTP Confirmation & Recovery Email Templates

These templates are designed specifically to display the **6-digit confirmation code (`{{ .Token }}`)** in a large, prominent OTP box. You can copy-paste these directly into your **Supabase Dashboard** -> **Authentication** -> **Email Templates** page.

---

## 1. Confirm Sign Up (Account Verification)
* **Template name**: `Confirm signup`
* **Subject**: `🎓 Your 6-Digit Confirmation Code: {{ .Token }} | Catalyst Competitions`
* **Body (HTML)**:
```html
<div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px; line-height: 1.6; color: #0f172a; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
  
  <!-- Header -->
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; padding: 14px; background-color: #eef2ff; border-radius: 16px; margin-bottom: 12px;">
      <span style="font-size: 32px;">🎓</span>
    </div>
    <h1 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">Confirm Your Account</h1>
    <p style="color: #64748b; font-size: 14px; margin-top: 4px; font-weight: 500;">Welcome to Catalyst Smart Classroom Competitions</p>
  </div>
  
  <p style="font-size: 15px; margin-bottom: 16px; color: #334155;">Hello,</p>
  <p style="font-size: 15px; margin-bottom: 24px; color: #334155;">Thank you for registering! Please enter the <strong>6-digit confirmation code</strong> below into the website to activate your account and start participating in research & robotics challenges:</p>
  
  <!-- Prominent 6-Digit OTP Box -->
  <div style="text-align: center; margin: 28px 0; background-color: #f8fafc; border: 2px dashed #c7d2fe; border-radius: 16px; padding: 24px;">
    <span style="display: block; font-size: 12px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Your 6-Digit Confirmation Code</span>
    <div style="display: inline-block; font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #1e1b4b; background-color: #ffffff; padding: 10px 24px; border-radius: 12px; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      {{ .Token }}
    </div>
    <p style="margin: 12px 0 0 0; font-size: 12px; color: #64748b;">This code is valid for 1 hour. Maximum 3 daily resends allowed.</p>
  </div>
  
  <!-- Fallback Direct Confirmation Button -->
  <div style="text-align: center; margin-bottom: 24px;">
    <p style="font-size: 13px; color: #64748b; margin-bottom: 10px;">Alternatively, you can click the button below to confirm automatically:</p>
    <a href="{{ .ConfirmationURL }}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 13px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.25);">Confirm My Account</a>
  </div>
  
  <!-- Spam / Junk Folder Notice -->
  <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px; border-radius: 8px; margin-bottom: 24px;">
    <p style="margin: 0; font-size: 12px; color: #92400e; font-weight: bold;">🔍 Didn't find this email in your Inbox?</p>
    <p style="margin: 4px 0 0 0; font-size: 12px; color: #b45309; line-height: 1.5;">Please make sure to check your <strong>Spam</strong>, <strong>Junk</strong>, or <strong>Promotions</strong> folder. If you move it to Inbox, future notifications will arrive directly.</p>
  </div>
  
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
    This is an automated security message from Catalyst Smart Classroom. If you did not create an account, please ignore this email.
  </p>
</div>
```

---

## 2. Reset Password (6-Digit Recovery Code)
* **Template name**: `Reset password`
* **Subject**: `🔒 Your 6-Digit Password Reset Code: {{ .Token }} | Catalyst Competitions`
* **Body (HTML)**:
```html
<div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px; line-height: 1.6; color: #0f172a; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
  
  <!-- Header -->
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; padding: 14px; background-color: #eef2ff; border-radius: 16px; margin-bottom: 12px;">
      <span style="font-size: 32px;">🔒</span>
    </div>
    <h1 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">Password Reset Code</h1>
    <p style="color: #64748b; font-size: 14px; margin-top: 4px; font-weight: 500;">Catalyst Smart Classroom Security</p>
  </div>
  
  <p style="font-size: 15px; margin-bottom: 16px; color: #334155;">Hello,</p>
  <p style="font-size: 15px; margin-bottom: 24px; color: #334155;">We received a request to reset your password. Enter the <strong>6-digit recovery code</strong> below on the password reset page to create your new password:</p>
  
  <!-- Prominent 6-Digit OTP Box -->
  <div style="text-align: center; margin: 28px 0; background-color: #f8fafc; border: 2px dashed #c7d2fe; border-radius: 16px; padding: 24px;">
    <span style="display: block; font-size: 12px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">6-Digit Password Reset Code</span>
    <div style="display: inline-block; font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #1e1b4b; background-color: #ffffff; padding: 10px 24px; border-radius: 12px; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      {{ .Token }}
    </div>
    <p style="margin: 12px 0 0 0; font-size: 12px; color: #64748b;">This code expires in 1 hour. Maximum 3 daily resends allowed.</p>
  </div>
  
  <!-- Fallback Button -->
  <div style="text-align: center; margin-bottom: 24px;">
    <p style="font-size: 13px; color: #64748b; margin-bottom: 10px;">Or click the direct recovery link below:</p>
    <a href="{{ .ConfirmationURL }}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 13px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.25);">Reset My Password</a>
  </div>
  
  <!-- Spam / Junk Folder Notice -->
  <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px; border-radius: 8px; margin-bottom: 24px;">
    <p style="margin: 0; font-size: 12px; color: #92400e; font-weight: bold;">🔍 Check your Spam / Junk folder</p>
    <p style="margin: 4px 0 0 0; font-size: 12px; color: #b45309; line-height: 1.5;">If this email arrived in your Spam folder, mark it as "Not Spam" to ensure seamless password recovery.</p>
  </div>
  
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
    If you did not request a password reset, please ignore this email. Your password will remain unchanged.
  </p>
</div>
```
