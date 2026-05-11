const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM || 'CONTIA <no-reply@contia.io>';
const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

let client = null;
function getClient() {
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY no configurada - emails deshabilitados');
    return null;
  }
  if (!client) client = new Resend(apiKey);
  return client;
}

async function sendEmail({ to, subject, html }) {
  const c = getClient();
  if (!c) return { skipped: true };
  try {
    const r = await c.emails.send({ from, to, subject, html });
    return r;
  } catch (e) {
    console.error('[email] error', e.message);
    return { error: e.message };
  }
}

async function notificarAdminNuevoTramite({ tramite, user }) {
  if (!adminEmail) return { skipped: true };
  return sendEmail({
    to: adminEmail,
    subject: `[CONTIA] Nuevo tramite ${tramite.tipo} de ${user.nombre}`,
    html: `<p>Hay un nuevo tramite pendiente de revision.</p>
      <ul>
        <li><b>Tipo:</b> ${tramite.tipo}</li>
        <li><b>Usuario:</b> ${user.nombre} (${user.email})</li>
        <li><b>ID:</b> ${tramite.id}</li>
      </ul>
      <p>Entra al panel admin para revisarlo.</p>`,
  });
}

async function notificarUsuarioAprobado({ tramite, user }) {
  return sendEmail({
    to: user.email,
    subject: `[CONTIA] Tu tramite fue aprobado`,
    html: `<p>Hola ${user.nombre},</p>
      <p>Tu tramite <b>${tramite.tipo}</b> fue revisado y aprobado.</p>
      <p>Ya puedes descargar el documento desde tu panel.</p>`,
  });
}

async function notificarUsuarioDevuelto({ tramite, user, observacion }) {
  return sendEmail({
    to: user.email,
    subject: `[CONTIA] Tu tramite necesita correcciones`,
    html: `<p>Hola ${user.nombre},</p>
      <p>Tu tramite <b>${tramite.tipo}</b> tiene observaciones del profesional revisor:</p>
      <blockquote>${observacion}</blockquote>
      <p>Por favor entra al sistema, corrige los datos y reenvia para nueva revision.</p>`,
  });
}

module.exports = {
  sendEmail,
  notificarAdminNuevoTramite,
  notificarUsuarioAprobado,
  notificarUsuarioDevuelto,
};
