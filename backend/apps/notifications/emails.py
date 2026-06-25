"""Branded HTML email templates for SAHA Transport & Logistics (STL).

Emails are built with table-based layout and inline styles so they render
consistently across email clients (Gmail, Outlook, Apple Mail, Yahoo, ...).
Each builder returns a ``(subject, text_body, html_body)`` tuple; the plain-text
body is the fallback for clients that don't render HTML.
"""
from django.conf import settings
from django.utils.translation import get_language, gettext as _

# Brand palette (mirrors frontend/tailwind.config.ts)
NAVY = "#0A2540"
BLUE = "#0D47A1"
GOLD = "#F9A825"
LIGHT = "#F5F7FA"
TEXT = "#1A1A1A"
MUTED = "#6B7280"
BORDER = "#E5E9F0"

WHATSAPP_NUMBER = "+4917684440384"
SUPPORT_EMAIL = "info@gestionatech.de"


def _whatsapp_link():
    return "https://wa.me/" + WHATSAPP_NUMBER.replace("+", "").replace(" ", "")


def _layout(preheader, heading, intro_html, button_label, button_url, after_html=""):
    """Wrap content in the shared branded shell. Returns the full HTML string."""
    site = settings.FRONTEND_URL.rstrip("/")
    whatsapp = _whatsapp_link()
    year = __import__("datetime").date.today().year
    route_label = _('Europe → Cameroon')
    copy_link_label = _('If the button does not work, copy this link into your browser:')
    company_description = _('Parcel and freight transport from Europe to Cameroon (Douala, Yaoundé, Bafoussam).')
    rights_label = _('All rights reserved.')
    return f"""\
<!DOCTYPE html>
<html lang="{get_language() or 'fr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>{heading}</title>
</head>
<body style="margin:0;padding:0;background:{LIGHT};">
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">{preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{LIGHT};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid {BORDER};box-shadow:0 8px 24px rgba(10,37,64,0.08);">

  <!-- header -->
  <tr><td style="background:{NAVY};padding:28px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-family:Arial,Helvetica,sans-serif;color:#FFFFFF;font-size:22px;font-weight:bold;letter-spacing:1px;">
        SAHA <span style="color:{GOLD};">&#9679;</span>
        <div style="font-size:11px;font-weight:normal;letter-spacing:3px;color:#9DB2CE;margin-top:4px;">TRANSPORT &amp; LOGISTICS</div>
      </td>
      <td align="right" style="font-family:Arial,Helvetica,sans-serif;color:#9DB2CE;font-size:12px;">{route_label}</td>
    </tr></table>
  </td></tr>
  <tr><td style="height:4px;background:{GOLD};font-size:0;line-height:0;">&nbsp;</td></tr>

  <!-- body -->
  <tr><td style="padding:36px 32px 8px 32px;font-family:Arial,Helvetica,sans-serif;">
    <h1 style="margin:0 0 16px 0;font-size:22px;line-height:1.3;color:{NAVY};">{heading}</h1>
    <div style="font-size:15px;line-height:1.6;color:{TEXT};">{intro_html}</div>
  </td></tr>

  <!-- button -->
  <tr><td align="center" style="padding:24px 32px 8px 32px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="border-radius:10px;background:{BLUE};">
        <a href="{button_url}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none;border-radius:10px;">{button_label}</a>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:8px 32px 28px 32px;font-family:Arial,Helvetica,sans-serif;">
    <p style="font-size:12px;line-height:1.6;color:{MUTED};margin:8px 0 0 0;">
      {copy_link_label}<br>
      <a href="{button_url}" target="_blank" style="color:{BLUE};word-break:break-all;">{button_url}</a>
    </p>
    {after_html}
  </td></tr>

  <!-- footer -->
  <tr><td style="background:{LIGHT};padding:24px 32px;border-top:1px solid {BORDER};font-family:Arial,Helvetica,sans-serif;">
    <p style="margin:0 0 6px 0;font-size:13px;color:{NAVY};font-weight:bold;">SAHA Transport &amp; Logistics</p>
    <p style="margin:0 0 10px 0;font-size:12px;line-height:1.6;color:{MUTED};">
      {company_description}
    </p>
    <p style="margin:0;font-size:12px;color:{MUTED};">
      <a href="{whatsapp}" style="color:{BLUE};text-decoration:none;">WhatsApp&nbsp;{WHATSAPP_NUMBER}</a>
      &nbsp;&bull;&nbsp;
      <a href="mailto:{SUPPORT_EMAIL}" style="color:{BLUE};text-decoration:none;">{SUPPORT_EMAIL}</a>
      &nbsp;&bull;&nbsp;
      <a href="{site}" style="color:{BLUE};text-decoration:none;">{site.replace('https://','')}</a>
    </p>
    <p style="margin:14px 0 0 0;font-size:11px;color:#9AA5B1;">&copy; {year} SAHA Transport &amp; Logistics. {rights_label}</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""


def build_verification_email(verify_url):
    subject = _("Verify your email address — SAHA Transport & Logistics")
    text = (
        _("Hello,") + "\n\n"
        + _("Welcome to SAHA Transport & Logistics!") + "\n\n"
        + _("Please confirm your email address by opening this link:") + "\n"
        f"{verify_url}\n\n"
        + _("This link is valid for 24 hours.") + "\n\n"
        + _("If you did not create an account, you can ignore this message.") + "\n\n"
        + _("The SAHA Transport & Logistics team")
    )
    intro = (
        _("Hello,") + "<br><br>"
        + _("Welcome to <strong>SAHA Transport &amp; Logistics</strong>! ")
        + _("One final step: confirm your email address to secure your account and track your shipments.")
    )
    after = (
        f"<p style='font-size:12px;color:{MUTED};margin:16px 0 0 0;'>"
        + _("This link is valid for 24 hours. If you did not create an account, you can ignore this message.")
        + "</p>"
    )
    html = _layout(
        preheader=_("Confirm your email address to activate your SAHA account."),
        heading=_("Confirm your email address"),
        intro_html=intro,
        button_label=_("Verify my email address"),
        button_url=verify_url,
        after_html=after,
    )
    return subject, text, html


def build_password_reset_email(reset_url):
    subject = _("Reset your password — SAHA Transport & Logistics")
    text = (
        _("Hello,") + "\n\n"
        + _("You requested a password reset.") + "\n"
        + _("Open this link to choose a new password:") + "\n"
        f"{reset_url}\n\n"
        + _("If you did not request this, ignore this message; your password will remain unchanged.") + "\n\n"
        + _("The SAHA Transport & Logistics team")
    )
    intro = (
        _("Hello,") + "<br><br>"
        + _("You requested a password reset. Click the button below to choose a new password.")
    )
    after = (
        f"<p style='font-size:12px;color:{MUTED};margin:16px 0 0 0;'>"
        + _("If you did not request this, ignore this message; your password will remain unchanged.")
        + "</p>"
    )
    html = _layout(
        preheader=_("Reset the password for your SAHA account."),
        heading=_("Reset your password"),
        intro_html=intro,
        button_label=_("Choose a new password"),
        button_url=reset_url,
        after_html=after,
    )
    return subject, text, html
