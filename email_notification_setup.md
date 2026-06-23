# ✉️ Supabase Email Notification & Custom SMTP Setup Guide

This guide explains how to configure custom professional emails (to avoid spam) and how to set up automatic, motivational email notifications whenever someone registers for a competition.

---

## Part 1: 🛡️ Custom SMTP Setup (So emails don't go to spam)

By default, Supabase sends authentication emails from `noreply@mail.supabase.co`. These emails have strict rate limits and often end up in the **Spam** folder. To fix this, you should connect your own custom domain email (e.g. `info@catalyst-smart-classroom.me`) using an SMTP provider like **Resend** (Recommended & Free), **SendGrid**, or **Brevo**.

### Step 1: Set up Resend (Recommended)
1. Go to [Resend.com](https://resend.com) and create a free account.
2. Go to **Domains** -> Click **Add Domain** -> Add your domain `catalyst-smart-classroom.me`.
3. Add the provided **MX**, **TXT (SPF/DKIM)**, and **DMARC** records to your domain provider's DNS panel (Vercel, Cloudflare, or GoDaddy). This is crucial to ensure emails are authenticated and never land in Spam.
4. Go to **API Keys** -> Create a new API Key and copy it.

### Step 2: Configure SMTP in Supabase
1. Go to your **Supabase Dashboard** -> **Project Settings** -> **Auth**.
2. Scroll down to the **SMTP Provider** section.
3. Toggle **Enable Custom SMTP** to **ON**.
4. Enter the following details (for Resend):
   - **Sender Email**: `challenges@catalyst-smart-classroom.me` (or any address on your verified domain)
   - **Sender Name**: `Catalyst Challenges`
   - **SMTP Host**: `smtp.resend.com`
   - **SMTP Port**: `465` (or `587` with STARTTLS)
   - **SMTP Username**: `resend`
   - **SMTP Password**: *(Your Resend API Key)*
5. Click **Save**. Now, all authentication emails (Sign-up confirmations, password resets) will come from your domain and go straight to the Inbox.

---

## Part 2: 🚀 Send Automatic Competition Registration Emails (Serverless & Free)

Since your project is a static site hosted on Vercel, you don't need a Node.js server to send transactional emails. We can configure a **Supabase Database Webhook** that automatically calls **Resend**'s API whenever a new row is inserted into the `registrations` table.

### Step 1: Write the Email Notification Function (SQL)
Copy and run the following script in the **SQL Editor** of your Supabase dashboard. This sets up an automated database trigger that fires a HTTP request to Resend whenever a new registration is recorded:

```sql
-- Create a function to send a registration email via Resend's REST API
CREATE OR REPLACE FUNCTION public.send_registration_email()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email TEXT;
  v_user_name TEXT;
  v_comp_title TEXT;
  v_resend_api_key TEXT := 're_your_api_key_here'; -- Replace with your Resend API Key
BEGIN
  -- 1. Fetch user email and full name
  SELECT email, full_name INTO v_user_email, v_user_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- 2. Fetch competition title
  SELECT title INTO v_comp_title
  FROM public.competitions
  WHERE id = NEW.competition_id;

  -- 3. Send HTTP POST request to Resend
  IF v_user_email IS NOT NULL AND v_comp_title IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'https://api.resend.com/emails',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || v_resend_api_key,
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'from', 'Catalyst Challenges <challenges@catalyst-smart-classroom.me>',
        'to', ARRAY[v_user_email],
        'subject', '🔥 Registration Confirmed: ' || v_comp_title || '!',
        'html', '<div style="font-family: sans-serif; max-width: 600px; padding: 20px; line-height: 1.6; color: #1e293b;">' ||
                '<div style="text-align: center; margin-bottom: 20px;">' ||
                '  <span style="font-size: 40px;">🏆</span>' ||
                '  <h1 style="color: #4f46e5; margin-top: 10px;">You are officially in!</h1>' ||
                '</div>' ||
                '<p>Hi <strong>' || COALESCE(v_user_name, 'Participant') || '</strong>,</p>' ||
                '<p>Congratulations! You have successfully registered for the <strong>' || v_comp_title || '</strong> on Smart Classroom.</p>' ||
                '<div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0; border-radius: 4px;">' ||
                '  <p style="margin: 0; font-weight: bold; color: #4f46e5;">💡 A message of encouragement for you:</p>' ||
                '  <p style="margin: 5px 0 0 0; font-style: italic; color: #475569;">' ||
                '    "Every great researcher and engineer started exactly where you are today. The courage to compete, design, and share your ideas is your first step toward changing the status quo. Push your boundaries, stay curious, and make us proud!"' ||
                '  </p>' ||
                '</div>' ||
                '<p><strong>What is next?</strong></p>' ||
                '<ul>' ||
                '  <li>Go to your <strong>Dashboard</strong> to download your digital badge.</li>' ||
                '  <li>Share it on Facebook or LinkedIn to show the world that you are participating.</li>' ||
                '  <li>Upload your project proposal PDF before the deadline.</li>' ||
                '</ul>' ||
                '<div style="text-align: center; margin-top: 30px;">' ||
                '  <a href="https://www.catalyst-smart-classroom.me/competition.html#/dashboard" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Go to My Dashboard</a>' ||
                '</div>' ||
                '<p style="margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center;">' ||
                '  Powered by Smart Classroom. If you did not register for this event, please disregard this email.' ||
                '</p>' ||
                '</div>'
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger that fires on new registration inserts
CREATE OR REPLACE TRIGGER tr_on_new_registration
  AFTER INSERT ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.send_registration_email();
```

*Note: The `net` schema is part of Supabase's `pg_net` extension. Make sure the `pg_net` extension is enabled in **Database** -> **Extensions** in your Supabase panel (it is enabled by default in all new projects).*
