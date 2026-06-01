"""
bot_service.py — SER Telegram Bot
Incluye:
  · Registro completo en el bot (nombre, teléfono, edad, sexo, email, contraseña)
  · Inicio de sesión para usuarios registrados en la web
  · Bot recuerda al usuario (saludo personalizado, perfil, cierre de sesión)
  · Botón "Visitar Nuestra Web" funcional (abre el navegador)
  · Reacciones con emojis en publicaciones
  · Encuesta por publicación
  · Envío de video adjunto
"""

import logging
import os
import re
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, MessageHandler, filters,
    ContextTypes, CallbackQueryHandler, ConversationHandler,
)
from backend.database import database
from backend.models import UserInDB, UserRole, ChatLog, Reaction, PostSurvey
from backend.services.ai_service import generate_response
from backend.utils import get_password_hash, verify_password
from datetime import datetime
from bson import ObjectId

# ─── Configuración ─────────────────────────────────────────────────────────────
logger = logging.getLogger(__name__)

PROJECT_ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
UPLOAD_DIR   = os.path.join(PROJECT_ROOT, "uploads")
WEB_URL      = os.getenv("WEB_URL", "http://localhost:3000")

def _is_public_url(url: str) -> bool:
    """Telegram only accepts publicly accessible HTTPS/HTTP URLs (not localhost)."""
    if not url:
        return False
    import urllib.parse
    parsed = urllib.parse.urlparse(url)
    host = parsed.hostname or ""
    return (
        parsed.scheme in ("http", "https")
        and host not in ("localhost", "127.0.0.1", "0.0.0.0", "::1")
        and not host.startswith("192.168.")
        and not host.startswith("10.")
    )

# Emojis
REACTION_EMOJIS = ["👍", "❤️", "😮", "😢", "🔥", "🌍"]
SURVEY_EMOJIS   = ["😍", "🙂", "😐", "😕", "😠"]
SURVEY_LABELS   = ["Excelente", "Bueno", "Regular", "Malo", "Muy malo"]

# ─── Estados de conversación ────────────────────────────────────────────────────
WAITING_FOR_IA = 0                                  # IA
(REG_NAME, REG_PHONE, REG_AGE, REG_SEX,             # Registro
 REG_EMAIL, REG_PASS, REG_CONFIRM) = range(10, 17)
(LOGIN_EMAIL, LOGIN_PASS) = range(20, 22)           # Login


# ─── Helpers ───────────────────────────────────────────────────────────────────

def _tg_id(user_id: int) -> str:
    return str(user_id)

def _video_path(video_url: str) -> str | None:
    if not video_url or not video_url.startswith("/static/"):
        return None
    path = os.path.join(UPLOAD_DIR, video_url.replace("/static/", "", 1))
    return path if os.path.exists(path) else None

def _fmt_post(post: dict) -> str:
    icon   = "📰" if post["type"] == "news" else "⚠️" if post["type"] == "alert" else "📚"
    date   = post["created_at"]
    ds     = date.strftime("%d/%m/%Y") if isinstance(date, datetime) else str(date)[:10]
    body   = post["content"][:700] + ("…" if len(post["content"]) > 700 else "")
    msg    = f"{icon} *{post['title']}*\n📅 {ds}\n\n{body}"
    if post.get("tags"):
        msg += f"\n\n🏷️ {', '.join(post['tags'])}"
    extras = []
    if post.get("video_url"): extras.append("🎬 Video")
    if post.get("audio_url"): extras.append("🎵 Audio")
    if post.get("file_url"):  extras.append("📄 Archivo")
    if post.get("link_url"):  extras.append(f"🔗 {post.get('link_title') or post['link_url'][:40]}")
    if extras:
        msg += f"\n\n_Multimedia: {', '.join(extras)}_"
    return msg

def _post_actions(post_id: str, back_cb: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("😊 Reaccionar", callback_data=f"rp_{post_id}"),
         InlineKeyboardButton("📝 Encuesta",   callback_data=f"sp_{post_id}")],
        [InlineKeyboardButton("🔙 Volver",         callback_data=back_cb)],
        [InlineKeyboardButton("🏠 Menú Principal", callback_data="menu")],
    ])

def back_menu():
    return InlineKeyboardMarkup([[InlineKeyboardButton("🏠 Menú Principal", callback_data="menu")]])

async def _linked_user(tg_user_id: int):
    return await database.users.find_one({"telegram_id": _tg_id(tg_user_id)})


# ─── Teclado principal (dinámico según sesión) ─────────────────────────────────

def build_main_keyboard(logged_in: bool = False) -> InlineKeyboardMarkup:
    sismo  = InlineKeyboardButton("🌋 Últimos Sismos", callback_data="latest_earthquakes")
    consej = InlineKeyboardButton("⚠️ Consejos",       callback_data="important_advises")
    notic  = InlineKeyboardButton("📰 Noticias",        callback_data="last_news")
    ia_btn = InlineKeyboardButton("❓ Consultar IA",    callback_data="consulta_ia")

    if logged_in:
        acc1 = InlineKeyboardButton("👤 Mi Perfil",     callback_data="my_profile")
        acc2 = InlineKeyboardButton("🚪 Cerrar Sesión", callback_data="bot_logout")
    else:
        acc1 = InlineKeyboardButton("📝 Registrarse",    callback_data="registro")
        acc2 = InlineKeyboardButton("🔑 Iniciar Sesión", callback_data="login")

    rows = []
    # Solo añadir botón web si la URL es pública (Telegram rechaza localhost)
    if _is_public_url(WEB_URL):
        rows.append([InlineKeyboardButton("🌐 Visitar Nuestra Web", url=WEB_URL)])
    rows += [[sismo, consej], [notic, ia_btn], [acc1, acc2]]
    return InlineKeyboardMarkup(rows)


# ─── /start ────────────────────────────────────────────────────────────────────

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    tg_user = update.effective_user
    chat_id = update.effective_chat.id

    # Registrar suscriptor para broadcast
    await database.telegram_subscribers.update_one(
        {"chat_id": chat_id},
        {"$set": {"user_id": tg_user.id, "username": tg_user.username, "is_active": True}},
        upsert=True,
    )

    # ¿Usuario ya vinculado?
    linked = await _linked_user(tg_user.id)
    logged_in = linked is not None

    if logged_in:
        name = linked.get("full_name") or linked.get("email", "").split("@")[0]
        welcome = (
            f"👋 ¡Bienvenido/a de vuelta, *{name}*! 🌎⚡️\n\n"
            "_\"Tu aliado confiable en prevención y monitoreo sísmico en Cuba\"_\n\n"
            "📍 ¿Qué deseas hacer hoy?"
        )
    else:
        welcome = (
            "¡Bienvenido/a a *SER Ante los Sismos*! 🌎⚡️\n\n"
            "_\"Tu aliado confiable en prevención y monitoreo sísmico en Cuba\"_\n\n"
            "🔔 *¿Qué ofrecemos?*\n"
            "• Alertas tempranas de actividad sísmica\n"
            "• Información verificada del CENAIS\n"
            "• Recomendaciones de protección civil\n"
            "• Reportes en tiempo real\n\n"
            "📞 *Emergencias:* Defensa Civil · 104 · 105\n\n"
            "🔬 ¡Pregúntale a nuestra IA cualquier duda! 👇\n\n"
            "🌐 Visita nuestra Página en: http://localhost:3000 🌐"
        )

    keyboard = build_main_keyboard(logged_in)

    if update.message:
        await update.message.reply_text(welcome, parse_mode="Markdown", reply_markup=keyboard)
    elif update.callback_query:
        await update.callback_query.edit_message_text(welcome, parse_mode="Markdown", reply_markup=keyboard)

    # Limpiar datos de conversación
    context.user_data.clear()
    return ConversationHandler.END


# ─── Menú de contenido ─────────────────────────────────────────────────────────

async def latest_earthquakes(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    eqs = await database.earthquakes.find().sort("time", -1).limit(5).to_list(5)
    if not eqs:
        await q.edit_message_text("No hay datos recientes de sismos.", reply_markup=back_menu())
        return
    msg = "🌋 *Últimos Sismos Detectados:*\n\n"
    for eq in eqs:
        msg += f"📍 {eq['location']}\n📉 Mag: {eq['magnitude']} | Prof: {eq['depth']} km\n🕒 {eq['time']}\n\n"
    await q.edit_message_text(msg, parse_mode="Markdown", reply_markup=back_menu())


async def important_advises(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    posts = await database.posts.find({"type": "educational"}).sort("created_at", -1).limit(3).to_list(3)
    if not posts:
        fb = ("⚠️ *Medidas Básicas ante un Sismo:*\n\n"
              "1. *Agacharse* — bajo una mesa resistente.\n"
              "2. *Cubrirse* — protege cabeza y cuello.\n"
              "3. *Sujetarse* — hasta que pase el temblor.")
        await q.edit_message_text(fb, parse_mode="Markdown", reply_markup=back_menu())
        return
    msg = "📚 *Consejos y Publicaciones Educativas:*\n\n"
    kb  = []
    for i, p in enumerate(posts, 1):
        t = p["title"][:50] + "…" if len(p["title"]) > 50 else p["title"]
        msg += f"*{i}.* {t}\n"
        kb.append([InlineKeyboardButton(f"📖 Ver #{i}", callback_data=f"vp_{str(p['_id'])}")])
    kb.append([InlineKeyboardButton("🏠 Menú Principal", callback_data="menu")])
    await q.edit_message_text(msg, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(kb))


async def last_news(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    posts = await database.posts.find({"type": "news"}).sort("created_at", -1).limit(3).to_list(3)
    if not posts:
        await q.edit_message_text("No hay noticias recientes.", reply_markup=back_menu())
        return
    msg = "📰 *Últimas Noticias:*\n\n"
    kb  = []
    for i, p in enumerate(posts, 1):
        t = p["title"][:50] + "…" if len(p["title"]) > 50 else p["title"]
        msg += f"*{i}.* {t}\n"
        kb.append([InlineKeyboardButton(f"📰 Ver #{i}", callback_data=f"vp_{str(p['_id'])}")])
    kb.append([InlineKeyboardButton("🏠 Menú Principal", callback_data="menu")])
    await q.edit_message_text(msg, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(kb))


async def view_post(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    post_id = q.data[3:]
    try:
        post = await database.posts.find_one({"_id": ObjectId(post_id)})
    except Exception:
        await q.edit_message_text("⚠️ No se pudo cargar la publicación.", reply_markup=back_menu())
        return
    if not post:
        await q.edit_message_text("⚠️ Publicación no encontrada.", reply_markup=back_menu())
        return
    back_cb = "last_news" if post["type"] == "news" else "important_advises"
    await q.edit_message_text(_fmt_post(post), parse_mode="Markdown",
                               reply_markup=_post_actions(post_id, back_cb))
    # Enviar video si existe
    if post.get("video_url"):
        vp = _video_path(post["video_url"])
        if vp:
            try:
                with open(vp, "rb") as vf:
                    await context.bot.send_video(
                        chat_id=q.message.chat_id,
                        video=vf,
                        caption=f"🎬 *{post['title']}*",
                        parse_mode="Markdown",
                        supports_streaming=True,
                    )
            except Exception as e:
                logger.warning(f"No se pudo enviar el video: {e}")
                await context.bot.send_message(
                    chat_id=q.message.chat_id,
                    text="🎬 _Este post incluye un video disponible en la web._",
                    parse_mode="Markdown",
                )
        elif not post["video_url"].startswith("/static/"):
            await context.bot.send_message(chat_id=q.message.chat_id,
                                           text=f"🎬 Video: {post['video_url']}")


# ─── Reacciones ────────────────────────────────────────────────────────────────

async def show_reaction_palette(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    post_id = q.data[3:]
    uid = _tg_id(q.from_user.id)
    existing = await database.reactions.find_one({"post_id": post_id, "user_id": uid})
    cur = existing["emoji"] if existing else None
    reactions = await database.reactions.find({"post_id": post_id}).to_list(1000)
    counts = {}
    for r in reactions:
        e = r.get("emoji", "")
        counts[e] = counts.get(e, 0) + 1
    msg = "😊 *Elige tu reacción:*\n\n"
    for e in REACTION_EMOJIS:
        msg += f"{e} {counts.get(e,0)}{'✅' if e == cur else ''}  "
    r1 = [InlineKeyboardButton(e, callback_data=f"rx_{post_id}_{i}") for i, e in enumerate(REACTION_EMOJIS[:3])]
    r2 = [InlineKeyboardButton(e, callback_data=f"rx_{post_id}_{i+3}") for i, e in enumerate(REACTION_EMOJIS[3:])]
    await q.edit_message_text(msg, parse_mode="Markdown",
                               reply_markup=InlineKeyboardMarkup([r1, r2,
                               [InlineKeyboardButton("❌ Cancelar", callback_data=f"vp_{post_id}")]]))


async def handle_reaction(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    rest = q.data[3:]
    last = rest.rfind("_")
    post_id, idx = rest[:last], int(rest[last+1:])
    emoji = REACTION_EMOJIS[idx]
    uid   = _tg_id(q.from_user.id)
    existing = await database.reactions.find_one({"post_id": post_id, "user_id": uid})
    if existing:
        if existing["emoji"] == emoji:
            await database.reactions.delete_one({"_id": existing["_id"]})
            status_msg = f"Reacción {emoji} eliminada."
        else:
            await database.reactions.update_one({"_id": existing["_id"]}, {"$set": {"emoji": emoji}})
            status_msg = f"Reacción cambiada a {emoji} ✅"
    else:
        await database.reactions.insert_one(Reaction(post_id=post_id, user_id=uid, emoji=emoji).model_dump())
        status_msg = f"Reacción registrada: {emoji} ✅"
    reactions = await database.reactions.find({"post_id": post_id}).to_list(1000)
    counts = {}
    for r in reactions:
        e = r.get("emoji",""); counts[e] = counts.get(e,0)+1
    msg = f"{status_msg}\n\n*Reacciones actuales:*\n"
    for e in REACTION_EMOJIS:
        msg += f"{e} {counts.get(e,0)}  "
    await q.edit_message_text(msg, parse_mode="Markdown",
                               reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Volver al post", callback_data=f"vp_{post_id}")]]))


# ─── Encuestas ─────────────────────────────────────────────────────────────────

async def start_survey(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    post_id = q.data[3:]
    uid = _tg_id(q.from_user.id)
    if await database.post_surveys.find_one({"post_id": post_id, "user_id": uid}):
        await q.edit_message_text(
            "✅ Ya respondiste la encuesta de esta publicación.",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Volver al post", callback_data=f"vp_{post_id}")]]))
        return
    msg = "📝 *Encuesta de la Publicación*\n\n¿Cómo calificarías esta información?\n\n"
    for e, l in zip(SURVEY_EMOJIS, SURVEY_LABELS):
        msg += f"{e} — {l}\n"
    row = [InlineKeyboardButton(e, callback_data=f"sv_{post_id}_{i}") for i, e in enumerate(SURVEY_EMOJIS)]
    await q.edit_message_text(msg, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup([
        row,
        [InlineKeyboardButton("⏭️ Omitir", callback_data=f"sv_{post_id}_skip")],
        [InlineKeyboardButton("❌ Cancelar", callback_data=f"vp_{post_id}")],
    ]))


async def handle_survey_vote(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    rest = q.data[3:]
    last = rest.rfind("_")
    post_id, vote = rest[:last], rest[last+1:]
    uid = _tg_id(q.from_user.id)
    if await database.post_surveys.find_one({"post_id": post_id, "user_id": uid}):
        await q.edit_message_text("✅ Ya respondiste esta encuesta.",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Volver", callback_data=f"vp_{post_id}")]]))
        return
    emoji_rating = None if vote == "skip" else SURVEY_EMOJIS[int(vote)]
    await database.post_surveys.insert_one(
        PostSurvey(post_id=post_id, user_id=uid, emoji_rating=emoji_rating).model_dump())
    rt = f"Tu calificación: {emoji_rating}" if emoji_rating else "Sin calificación"
    await q.edit_message_text(
        f"✅ *¡Gracias por responder la encuesta!*\n\n{rt}\n\n_Puedes agregar comentarios en la web._",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Volver al post", callback_data=f"vp_{post_id}")]]))


# ─── Perfil y sesión ────────────────────────────────────────────────────────────

async def my_profile(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    linked = await _linked_user(q.from_user.id)
    if not linked:
        await q.edit_message_text("⚠️ No tienes cuenta vinculada. Usa *Registrarse* o *Iniciar Sesión*.",
                                   parse_mode="Markdown", reply_markup=back_menu())
        return
    sex_label = "Masculino" if linked.get("sex") == "M" else "Femenino" if linked.get("sex") == "F" else "—"
    msg = (
        "👤 *Tu Perfil en SER*\n\n"
        f"📛 *Nombre:* {linked.get('full_name') or '—'}\n"
        f"📧 *Email:* {linked.get('email','—')}\n"
        f"📱 *Teléfono:* {linked.get('phone') or '—'}\n"
        f"🎂 *Edad:* {linked.get('age') or '—'}\n"
        f"⚧️ *Sexo:* {sex_label}\n"
    )
    if linked.get("location"):
        msg += f"📍 *Ubicación:* {linked['location']}\n"
    if linked.get("bio"):
        msg += f"📝 *Bio:* {linked['bio']}\n"

    profile_btns = []
    if _is_public_url(WEB_URL):
        profile_btns.append([InlineKeyboardButton("🌐 Editar perfil en la web", url=WEB_URL)])
    profile_btns.append([InlineKeyboardButton("🏠 Menú Principal", callback_data="menu")])
    await q.edit_message_text(msg, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(profile_btns))


async def bot_logout(update: Update, context: ContextTypes.DEFAULT_TYPE):
    q = update.callback_query
    await q.answer()
    tg_id = _tg_id(q.from_user.id)
    await database.users.update_one({"telegram_id": tg_id}, {"$unset": {"telegram_id": ""}})
    await q.edit_message_text(
        "✅ *Sesión cerrada correctamente.*\n\n"
        "Puedes volver a iniciar sesión cuando quieras.",
        parse_mode="Markdown",
        reply_markup=back_menu())


# ─── REGISTRO en el bot ─────────────────────────────────────────────────────────

async def reg_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    q = update.callback_query
    await q.answer()
    # ¿Ya vinculado?
    if await _linked_user(q.from_user.id):
        await q.edit_message_text("✅ Ya tienes una cuenta vinculada. Usa *Mi Perfil* para verla.",
                                   parse_mode="Markdown", reply_markup=back_menu())
        return ConversationHandler.END
    context.user_data["reg"] = {}
    await q.edit_message_text(
        "📝 *Registro en SER — Paso 1/6*\n\n"
        "¿Cuál es tu *nombre completo*?\n"
        "_Ejemplo: María García López_\n\n"
        "Escribe /cancelar para salir.",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("❌ Cancelar", callback_data="menu")]]))
    return REG_NAME


async def reg_got_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    name = update.message.text.strip()
    if len(name) < 2:
        await update.message.reply_text("❌ El nombre es demasiado corto. Intenta de nuevo.")
        return REG_NAME
    context.user_data["reg"]["full_name"] = name
    await update.message.reply_text(
        f"✅ Nombre: *{name}*\n\n"
        "📝 *Paso 2/6* — ¿Cuál es tu *número de teléfono*?\n"
        "_Ejemplo: +5358123456_",
        parse_mode="Markdown")
    return REG_PHONE


async def reg_got_phone(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    phone = update.message.text.strip()
    if len(phone) < 7:
        await update.message.reply_text("❌ Número de teléfono inválido. Intenta de nuevo.")
        return REG_PHONE
    context.user_data["reg"]["phone"] = phone
    await update.message.reply_text(
        f"✅ Teléfono: *{phone}*\n\n"
        "📝 *Paso 3/6* — ¿Cuál es tu *edad*?\n"
        "_Escribe solo el número, ejemplo: 28_",
        parse_mode="Markdown")
    return REG_AGE


async def reg_got_age(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    txt = update.message.text.strip()
    try:
        age = int(txt)
        if age < 1 or age > 120:
            raise ValueError
    except ValueError:
        await update.message.reply_text("❌ Edad inválida. Escribe un número entre 1 y 120.")
        return REG_AGE
    context.user_data["reg"]["age"] = age
    await update.message.reply_text(
        f"✅ Edad: *{age}*\n\n"
        "📝 *Paso 4/6* — ¿Cuál es tu *sexo*?",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup([[
            InlineKeyboardButton("👨 Masculino", callback_data="reg_sex_M"),
            InlineKeyboardButton("👩 Femenino",  callback_data="reg_sex_F"),
        ]]))
    return REG_SEX


async def reg_got_sex(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    q = update.callback_query
    await q.answer()
    sex = q.data[-1]   # "M" o "F"
    context.user_data["reg"]["sex"] = sex
    label = "Masculino" if sex == "M" else "Femenino"
    await q.edit_message_text(
        f"✅ Sexo: *{label}*\n\n"
        "📝 *Paso 5/6* — ¿Cuál es tu *correo electrónico*?\n"
        "_Ejemplo: nombre@correo.com_",
        parse_mode="Markdown")
    return REG_EMAIL


async def reg_got_email(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    email = update.message.text.strip().lower()
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        await update.message.reply_text("❌ Correo inválido. Escribe un email válido.")
        return REG_EMAIL
    # Verificar si ya existe
    existing = await database.users.find_one({"email": email})
    if existing:
        await update.message.reply_text(
            "❌ Este correo ya está registrado.\n"
            "Usa *Iniciar Sesión* para vincularlo a tu Telegram.",
            parse_mode="Markdown")
        return ConversationHandler.END
    context.user_data["reg"]["email"] = email
    await update.message.reply_text(
        f"✅ Email: *{email}*\n\n"
        "📝 *Paso 6/6* — Crea una *contraseña*\n"
        "_Mínimo 6 caracteres._\n\n"
        "⚠️ _Nota: por seguridad, borra el mensaje con tu contraseña después de enviarlo._",
        parse_mode="Markdown")
    return REG_PASS


async def reg_got_pass(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    password = update.message.text.strip()
    if len(password) < 6:
        await update.message.reply_text("❌ La contraseña debe tener al menos 6 caracteres.")
        return REG_PASS
    rd = context.user_data["reg"]
    # Crear usuario
    tg_id = _tg_id(update.effective_user.id)
    user_in_db = UserInDB(
        email=rd["email"],
        full_name=rd["full_name"],
        phone=rd["phone"],
        age=rd["age"],
        sex=rd["sex"],
        telegram_id=tg_id,
        role=UserRole.USER,
        hashed_password=get_password_hash(password),
    )
    await database.users.insert_one(user_in_db.model_dump())
    context.user_data.clear()
    sex_label = "Masculino" if user_in_db.sex == "M" else "Femenino"
    await update.message.reply_text(
        f"🎉 *¡Registro exitoso!*\n\n"
        f"📛 Nombre: {user_in_db.full_name}\n"
        f"📧 Email: {user_in_db.email}\n"
        f"📱 Teléfono: {user_in_db.phone}\n"
        f"🎂 Edad: {user_in_db.age}\n"
        f"⚧️ Sexo: {sex_label}\n\n"
        "Tu cuenta ha sido creada y vinculada a Telegram. 🔗\n"
        "Usa /start para ir al menú principal.",
        parse_mode="Markdown")
    return ConversationHandler.END


# ─── INICIO DE SESIÓN en el bot ─────────────────────────────────────────────────

async def login_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    q = update.callback_query
    await q.answer()
    if await _linked_user(q.from_user.id):
        await q.edit_message_text("✅ Ya tienes sesión iniciada. Usa *Mi Perfil* para verla.",
                                   parse_mode="Markdown", reply_markup=back_menu())
        return ConversationHandler.END
    context.user_data["login"] = {}
    await q.edit_message_text(
        "🔑 *Iniciar Sesión en SER — Paso 1/2*\n\n"
        "Escribe tu *correo electrónico* registrado:\n\n"
        "_Escribe /cancelar para salir._",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("❌ Cancelar", callback_data="menu")]]))
    return LOGIN_EMAIL


async def login_got_email(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    email = update.message.text.strip().lower()
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        await update.message.reply_text("❌ Correo inválido. Intenta de nuevo.")
        return LOGIN_EMAIL
    context.user_data["login"]["email"] = email
    await update.message.reply_text(
        "🔑 *Paso 2/2* — Escribe tu *contraseña*:\n\n"
        "⚠️ _Borra el mensaje después de enviarlo._",
        parse_mode="Markdown")
    return LOGIN_PASS


async def login_got_pass(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    password = update.message.text.strip()
    email = context.user_data["login"].get("email", "")
    user = await database.users.find_one({"email": email})
    if not user or not verify_password(password, user["hashed_password"]):
        await update.message.reply_text(
            "❌ *Credenciales incorrectas.*\n"
            "Verifica tu email y contraseña, o usa /start para intentar de nuevo.",
            parse_mode="Markdown")
        context.user_data.clear()
        return ConversationHandler.END
    # Vincular telegram_id
    tg_id = _tg_id(update.effective_user.id)
    await database.users.update_one({"email": email}, {"$set": {"telegram_id": tg_id}})
    context.user_data.clear()
    name = user.get("full_name") or email.split("@")[0]
    await update.message.reply_text(
        f"✅ *¡Sesión iniciada!*\n\n"
        f"Bienvenido/a de vuelta, *{name}*. 🎉\n"
        "Tu cuenta ha sido vinculada a este chat de Telegram.\n\n"
        "Usa /start para ir al menú principal.",
        parse_mode="Markdown")
    return ConversationHandler.END


# ─── Consulta IA ───────────────────────────────────────────────────────────────

async def consulta_ia_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    q = update.callback_query
    await q.answer()
    await q.edit_message_text(
        "🤖 *Asistente IA — SER Bot*\n\n"
        "Escribe tu pregunta sobre sismos, seguridad o temas relacionados.\n\n"
        "_Ejemplo: ¿Qué debo hacer si ocurre un terremoto?_",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("❌ Cancelar", callback_data="menu")]]))
    return WAITING_FOR_IA


async def consulta_ia_respond(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    q_text = update.message.text
    tg_id  = str(update.effective_user.id)
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
    user_data = await database.users.find_one({"telegram_id": tg_id})
    user_obj = (UserInDB(**user_data) if user_data
                else UserInDB(email=f"{tg_id}@telegram.com",
                              full_name=update.effective_user.first_name or "Usuario"))
    response = await generate_response(user_obj, q_text)
    await update.message.reply_text(
        f"🤖 *SER Bot responde:*\n\n{response}\n\n_Usa /start para volver al menú._",
        parse_mode="Markdown")
    await database.chat_logs.insert_one(
        ChatLog(user_id=tg_id, question=q_text, answer=response).model_dump())
    return ConversationHandler.END


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data.clear()
    await update.message.reply_text("Operación cancelada. Usa /start para volver al menú.")
    return ConversationHandler.END


# ─── Aplicación ────────────────────────────────────────────────────────────────

application = None


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Manejador global de errores para evitar crashes silenciosos."""
    from telegram.error import TimedOut, NetworkError, BadRequest
    err = context.error
    if isinstance(err, TimedOut):
        logger.warning("Telegram request timed out (se reintentará automáticamente).")
    elif isinstance(err, NetworkError):
        logger.warning(f"Error de red con Telegram: {err}")
    elif isinstance(err, BadRequest):
        logger.error(f"BadRequest de Telegram: {err}")
        if update and hasattr(update, "effective_chat"):
            try:
                await context.bot.send_message(
                    chat_id=update.effective_chat.id,
                    text="⚠️ Ocurrió un error al procesar tu solicitud. Usa /start para reiniciar."
                )
            except Exception:
                pass
    else:
        logger.error(f"Error inesperado en el bot: {err}", exc_info=context.error)


async def start_bot():
    global application
    token = os.getenv("TELEGRAM_TOKEN")
    if not token:
        logger.error("No TELEGRAM_TOKEN found.")
        return

    from telegram.request import HTTPXRequest
    application = (
        Application.builder()
        .token(token)
        .request(HTTPXRequest(connect_timeout=10, read_timeout=30, write_timeout=30))
        .build()
    )

    # Registrar manejador de errores global
    application.add_error_handler(error_handler)

    # ── ConversationHandler: IA ──
    ia_conv = ConversationHandler(
        entry_points=[CallbackQueryHandler(consulta_ia_start, pattern="^consulta_ia$")],
        states={WAITING_FOR_IA: [MessageHandler(filters.TEXT & ~filters.COMMAND, consulta_ia_respond)]},
        fallbacks=[CommandHandler("cancelar", cancel), CommandHandler("start", start),
                   CallbackQueryHandler(start, pattern="^menu$")],
        per_message=False,
    )

    # ── ConversationHandler: Registro ──
    reg_conv = ConversationHandler(
        entry_points=[CallbackQueryHandler(reg_start, pattern="^registro$")],
        states={
            REG_NAME:  [MessageHandler(filters.TEXT & ~filters.COMMAND, reg_got_name)],
            REG_PHONE: [MessageHandler(filters.TEXT & ~filters.COMMAND, reg_got_phone)],
            REG_AGE:   [MessageHandler(filters.TEXT & ~filters.COMMAND, reg_got_age)],
            REG_SEX:   [CallbackQueryHandler(reg_got_sex, pattern="^reg_sex_(M|F)$")],
            REG_EMAIL: [MessageHandler(filters.TEXT & ~filters.COMMAND, reg_got_email)],
            REG_PASS:  [MessageHandler(filters.TEXT & ~filters.COMMAND, reg_got_pass)],
        },
        fallbacks=[CommandHandler("cancelar", cancel), CommandHandler("start", start),
                   CallbackQueryHandler(start, pattern="^menu$")],
        per_message=False,
    )

    # ── ConversationHandler: Login ──
    login_conv = ConversationHandler(
        entry_points=[CallbackQueryHandler(login_start, pattern="^login$")],
        states={
            LOGIN_EMAIL: [MessageHandler(filters.TEXT & ~filters.COMMAND, login_got_email)],
            LOGIN_PASS:  [MessageHandler(filters.TEXT & ~filters.COMMAND, login_got_pass)],
        },
        fallbacks=[CommandHandler("cancelar", cancel), CommandHandler("start", start),
                   CallbackQueryHandler(start, pattern="^menu$")],
        per_message=False,
    )

    application.add_handler(CommandHandler("start", start))
    application.add_handler(ia_conv)
    application.add_handler(reg_conv)
    application.add_handler(login_conv)

    # Callbacks de menú
    application.add_handler(CallbackQueryHandler(start,              pattern="^menu$"))
    application.add_handler(CallbackQueryHandler(latest_earthquakes, pattern="^latest_earthquakes$"))
    application.add_handler(CallbackQueryHandler(important_advises,  pattern="^important_advises$"))
    application.add_handler(CallbackQueryHandler(last_news,          pattern="^last_news$"))
    application.add_handler(CallbackQueryHandler(my_profile,         pattern="^my_profile$"))
    application.add_handler(CallbackQueryHandler(bot_logout,         pattern="^bot_logout$"))

    # Posts, reacciones, encuestas
    application.add_handler(CallbackQueryHandler(view_post,             pattern=r"^vp_[0-9a-f]{24}$"))
    application.add_handler(CallbackQueryHandler(show_reaction_palette, pattern=r"^rp_[0-9a-f]{24}$"))
    application.add_handler(CallbackQueryHandler(handle_reaction,       pattern=r"^rx_[0-9a-f]{24}_\d+$"))
    application.add_handler(CallbackQueryHandler(start_survey,          pattern=r"^sp_[0-9a-f]{24}$"))
    application.add_handler(CallbackQueryHandler(handle_survey_vote,    pattern=r"^sv_[0-9a-f]{24}_(skip|\d+)$"))

    await application.initialize()
    await application.start()
    await application.updater.start_polling()
    logger.info("Telegram Bot started successfully.")


async def stop_bot():
    global application
    if application:
        await application.updater.stop()
        await application.stop()
        await application.shutdown()
        logger.info("Telegram Bot stopped.")


async def broadcast_message(text: str):
    global application
    if not application:
        logger.error("Cannot broadcast: Bot not running.")
        return
    try:
        subscribers = await database.telegram_subscribers.find({"is_active": True}).to_list(10000)
        ok = 0
        for sub in subscribers:
            try:
                await application.bot.send_message(chat_id=sub["chat_id"], text=text, parse_mode="Markdown")
                ok += 1
            except Exception as e:
                logger.error(f"Broadcast failed for {sub['chat_id']}: {e}")
        logger.info(f"Broadcast: {ok}/{len(subscribers)}")
    except Exception as e:
        logger.error(f"Broadcast error: {e}")