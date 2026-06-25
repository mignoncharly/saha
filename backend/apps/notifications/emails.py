"""Branded HTML email templates for SAHA Transport & Logistics (STL).

Emails are built with table-based layout and inline styles so they render
consistently across email clients (Gmail, Outlook, Apple Mail, Yahoo, ...).
Each builder returns a ``(subject, text_body, html_body)`` tuple; the plain-text
body is the fallback for clients that don't render HTML.
"""
from django.conf import settings

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
    return f"""\
<!DOCTYPE html>
<html lang="fr">
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
      <td align="right" style="font-family:Arial,Helvetica,sans-serif;color:#9DB2CE;font-size:12px;">Europe &#8594; Cameroun</td>
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
      Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur&nbsp;:<br>
      <a href="{button_url}" target="_blank" style="color:{BLUE};word-break:break-all;">{button_url}</a>
    </p>
    {after_html}
  </td></tr>

  <!-- footer -->
  <tr><td style="background:{LIGHT};padding:24px 32px;border-top:1px solid {BORDER};font-family:Arial,Helvetica,sans-serif;">
    <p style="margin:0 0 6px 0;font-size:13px;color:{NAVY};font-weight:bold;">SAHA Transport &amp; Logistics</p>
    <p style="margin:0 0 10px 0;font-size:12px;line-height:1.6;color:{MUTED};">
      Transport de colis et fret de l'Europe vers le Cameroun (Douala, Yaound&eacute;, Bafoussam).
    </p>
    <p style="margin:0;font-size:12px;color:{MUTED};">
      <a href="{whatsapp}" style="color:{BLUE};text-decoration:none;">WhatsApp&nbsp;{WHATSAPP_NUMBER}</a>
      &nbsp;&bull;&nbsp;
      <a href="mailto:{SUPPORT_EMAIL}" style="color:{BLUE};text-decoration:none;">{SUPPORT_EMAIL}</a>
      &nbsp;&bull;&nbsp;
      <a href="{site}" style="color:{BLUE};text-decoration:none;">{site.replace('https://','')}</a>
    </p>
    <p style="margin:14px 0 0 0;font-size:11px;color:#9AA5B1;">&copy; {year} SAHA Transport &amp; Logistics. Tous droits r&eacute;serv&eacute;s.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""


def build_verification_email(verify_url):
    subject = "Vérifiez votre adresse email — SAHA Transport & Logistics"
    text = (
        "Bonjour,\n\n"
        "Bienvenue chez SAHA Transport & Logistics !\n\n"
        "Veuillez confirmer votre adresse email en cliquant sur ce lien :\n"
        f"{verify_url}\n\n"
        "Ce lien est valable 24 heures.\n\n"
        "Si vous n'avez pas créé de compte, ignorez ce message.\n\n"
        "L'équipe SAHA Transport & Logistics"
    )
    intro = (
        "Bonjour,<br><br>"
        "Bienvenue chez <strong>SAHA Transport &amp; Logistics</strong>&nbsp;! "
        "Il ne reste qu'une étape&nbsp;: confirmez votre adresse email pour "
        "sécuriser votre compte et suivre vos expéditions."
    )
    after = (
        f"<p style='font-size:12px;color:{MUTED};margin:16px 0 0 0;'>"
        "Ce lien est valable 24&nbsp;heures. Si vous n'avez pas créé de compte, "
        "vous pouvez ignorer ce message.</p>"
    )
    html = _layout(
        preheader="Confirmez votre adresse email pour activer votre compte SAHA.",
        heading="Confirmez votre adresse email",
        intro_html=intro,
        button_label="Vérifier mon email",
        button_url=verify_url,
        after_html=after,
    )
    return subject, text, html


def build_password_reset_email(reset_url):
    subject = "Réinitialisation de votre mot de passe — SAHA Transport & Logistics"
    text = (
        "Bonjour,\n\n"
        "Vous avez demandé la réinitialisation de votre mot de passe.\n"
        "Cliquez sur ce lien pour en choisir un nouveau :\n"
        f"{reset_url}\n\n"
        "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message ; "
        "votre mot de passe restera inchangé.\n\n"
        "L'équipe SAHA Transport & Logistics"
    )
    intro = (
        "Bonjour,<br><br>"
        "Vous avez demandé la réinitialisation de votre mot de passe. "
        "Cliquez sur le bouton ci-dessous pour en choisir un nouveau."
    )
    after = (
        f"<p style='font-size:12px;color:{MUTED};margin:16px 0 0 0;'>"
        "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message&nbsp;: "
        "votre mot de passe restera inchangé.</p>"
    )
    html = _layout(
        preheader="Réinitialisez le mot de passe de votre compte SAHA.",
        heading="Réinitialisez votre mot de passe",
        intro_html=intro,
        button_label="Choisir un nouveau mot de passe",
        button_url=reset_url,
        after_html=after,
    )
    return subject, text, html
