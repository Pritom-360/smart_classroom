# ✉️ Supabase Professional HTML Email Templates

These templates are designed to match the premium dark/light branding of **Catalyst Smart Classroom**. You can copy-paste these directly into your **Supabase Dashboard** -> **Authentication** -> **Email Templates** page.

---

## 1. Confirm Sign Up
* **Template name**: Confirm signup
* **Subject**: `🏆 Welcome to Catalyst! Confirm your account`
* **Body (HTML)**:
```html
<div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px; line-height: 1.6; color: #0f172a; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; padding: 12px; background-color: #eef2ff; border-radius: 12px; margin-bottom: 12px;">
      <span style="font-size: 32px;">🎓</span>
    </div>
    <h1 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800; tracking-tight: -0.025em;">Confirm Your Account</h1>
    <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Welcome to Catalyst Smart Classroom Competitions</p>
  </div>
  
  <p style="font-size: 15px; margin-bottom: 20px;">Hello,</p>
  <p style="font-size: 15px; margin-bottom: 24px;">Thank you for registering! To start participating in our premier academic challenges, download your digital participant badge, and collaborate on projects, please confirm your email address below.</p>
  
  <div style="text-align: center; margin-bottom: 28px;">
    <a href="{{ .ConfirmationURL }}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); transition: all 0.2s ease;">Confirm My Email</a>
  </div>
  
  <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
    <p style="margin: 0; font-size: 12px; color: #475569; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Verify manually</p>
    <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; word-break: break-all; font-family: monospace;">{{ .ConfirmationURL }}</p>
  </div>
  
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
    This is an automated notification from Catalyst Smart Classroom. If you did not sign up for an account, you can safely ignore this email.
  </p>
</div>
```

---

## 2. Invite User
* **Template name**: Invite user
* **Subject**: `✉️ You have been invited to join Catalyst Challenges`
* **Body (HTML)**:
```html
<div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px; line-height: 1.6; color: #0f172a; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; padding: 12px; background-color: #eef2ff; border-radius: 12px; margin-bottom: 12px;">
      <span style="font-size: 32px;">✨</span>
    </div>
    <h1 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800;">You are Invited!</h1>
    <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Join Catalyst Smart Classroom Challenges</p>
  </div>
  
  <p style="font-size: 15px; margin-bottom: 20px;">Hello,</p>
  <p style="font-size: 15px; margin-bottom: 24px;">You have been invited to register an account and join the academic competition dashboard on Catalyst Smart Classroom. Accept your invitation to set your password and get started.</p>
  
  <div style="text-align: center; margin-bottom: 28px;">
    <a href="{{ .ConfirmationURL }}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); transition: all 0.2s ease;">Accept Invitation</a>
  </div>
  
  <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
    <p style="margin: 0; font-size: 12px; color: #475569; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Accept link</p>
    <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b; word-break: break-all; font-family: monospace;">{{ .ConfirmationURL }}</p>
  </div>
  
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
    Catalyst Smart Classroom. If you did not expect an invitation, you can safely ignore this email.
  </p>
</div>
```

---

## 3. Magic Link or OTP
* **Template name**: Magic link / OTP
* **Subject**: `⚡ Your Catalyst One-Time Sign-In Link`
* **Body (HTML)**:
```html
<div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px; line-height: 1.6; color: #0f172a; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; padding: 12px; background-color: #eef2ff; border-radius: 12px; margin-bottom: 12px;">
      <span style="font-size: 32px;">🔑</span>
    </div>
    <h1 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800;">One-Time Access</h1>
    <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Sign in securely to your Catalyst account</p>
  </div>
  
  <p style="font-size: 15px; margin-bottom: 20px;">Hello,</p>
  <p style="font-size: 15px; margin-bottom: 24px;">Use the button below to sign in directly without typing your password. Alternatively, you can enter the verification token code if prompted.</p>
  
  <div style="text-align: center; margin-bottom: 24px;">
    <a href="{{ .ConfirmationURL }}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); transition: all 0.2s ease;">Sign In to Catalyst</a>
  </div>

  <div style="text-align: center; margin-bottom: 28px;">
    <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Or enter this OTP code:</p>
    <div style="display: inline-block; padding: 8px 16px; background-color: #f1f5f9; border-radius: 6px; font-family: monospace; font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #0f172a; margin-top: 6px;">
      {{ .Token }}
    </div>
  </div>
  
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
    For security, this link and code will expire shortly. If you did not request this sign-in, you can safely ignore this email.
  </p>
</div>
```

---

## 4. Change Email Address
* **Template name**: Change email address
* **Subject**: `📧 Verify your new email address for Catalyst`
* **Body (HTML)**:
```html
<div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px; line-height: 1.6; color: #0f172a; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; padding: 12px; background-color: #eef2ff; border-radius: 12px; margin-bottom: 12px;">
      <span style="font-size: 32px;">🔄</span>
    </div>
    <h1 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800;">Verify New Email</h1>
    <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Update your Catalyst account profile</p>
  </div>
  
  <p style="font-size: 15px; margin-bottom: 20px;">Hello,</p>
  <p style="font-size: 15px; margin-bottom: 24px;">We received a request to change the primary email address for your Catalyst Smart Classroom account. To complete this update, please click the verification button below.</p>
  
  <div style="text-align: center; margin-bottom: 28px;">
    <a href="{{ .ConfirmationURL }}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); transition: all 0.2s ease;">Verify New Email</a>
  </div>
  
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
    If you did not request an email update, please secure your account credentials immediately.
  </p>
</div>
```

---

## 5. Reset Password
* **Template name**: Reset password
* **Subject**: `🔒 Reset your Catalyst password`
* **Body (HTML)**:
```html
<div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px; line-height: 1.6; color: #0f172a; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; padding: 12px; background-color: #eef2ff; border-radius: 12px; margin-bottom: 12px;">
      <span style="font-size: 32px;">🔒</span>
    </div>
    <h1 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800;">Password Reset</h1>
    <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Recover your Catalyst account credentials</p>
  </div>
  
  <p style="font-size: 15px; margin-bottom: 20px;">Hello,</p>
  <p style="font-size: 15px; margin-bottom: 24px;">We received a request to reset the password for your Catalyst Smart Classroom account. Click the button below to select a new secure password.</p>
  
  <div style="text-align: center; margin-bottom: 28px;">
    <a href="{{ .ConfirmationURL }}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); transition: all 0.2s ease;">Reset Password</a>
  </div>
  
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
    If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
  </p>
</div>
```

---

## 6. Reauthentication
* **Template name**: Reauthentication
* **Subject**: `🛡️ Verification code for account safety`
* **Body (HTML)**:
```html
<div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px; line-height: 1.6; color: #0f172a; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; padding: 12px; background-color: #eef2ff; border-radius: 12px; margin-bottom: 12px;">
      <span style="font-size: 32px;">🛡️</span>
    </div>
    <h1 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800;">Verify Your Identity</h1>
    <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Confirming a sensitive account action</p>
  </div>
  
  <p style="font-size: 15px; margin-bottom: 20px;">Hello,</p>
  <p style="font-size: 15px; margin-bottom: 24px;">Please enter the one-time verification token code below to complete the requested action on your Catalyst account.</p>
  
  <div style="text-align: center; margin-bottom: 28px;">
    <div style="display: inline-block; padding: 12px 24px; background-color: #f1f5f9; border-radius: 8px; font-family: monospace; font-size: 24px; font-weight: bold; letter-spacing: 3px; color: #4f46e5; border: 1px solid #cbd5e1;">
      {{ .Token }}
    </div>
  </div>
  
  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
    For your security, never share this code with anyone. If you did not trigger this request, please change your password immediately.
  </p>
</div>
```
