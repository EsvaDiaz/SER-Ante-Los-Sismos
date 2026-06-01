import os
import aiohttp
from backend.models import UserInDB
from backend.database import database

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_GENERATE_URL = f"{OLLAMA_BASE_URL}/api/generate"
OLLAMA_TAGS_URL = f"{OLLAMA_BASE_URL}/api/tags"

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "ser-llama")
USE_LOCAL_AI = os.getenv("USE_LOCAL_AI", "true").lower() == "true"

def build_prompt(user: UserInDB, question: str, eq_text: str, news_text: str) -> str:
    return f"""SYSTEM PROMPT:
You are 'SER Bot', an expert Seismologist and Civil Defense Assistant for Cuba.
Your goal is to provide accurate, calm, and actionable advice about seismic activity, safety measures, and earthquake history.

USER PROFILE:
- Name: {user.full_name or 'Citizen'}

INSTRUCTIONS:
1. Tone: Professional, reassuring, and educational. Avoid alarmism.
2. Local Relevance: Mention specific Cuban entities like CENAIS when relevant.
3. Language: Response MUST be in Spanish (Español). Keep it concise (3-5 paragraphs max).
4. Current Events: When asked about recent earthquakes, use ONLY the REAL-TIME DATA below. Do not hallucinate seismic events.

REAL-TIME DATA:
>> ÚLTIMOS SISMOS REPORTADOS:
{eq_text or "Sin actividad reciente registrada."}

>> ÚLTIMAS NOTICIAS:
{news_text or "Sin noticias publicadas."}

USER QUESTION:
"{question}"

RESPONSE:"""


async def generate_response(user: UserInDB, question: str) -> str:
    if not USE_LOCAL_AI:
        return "⚠️ El servicio de IA local está deshabilitado."
        
    # Gather real-time context
    try:
        eqs_cursor = database.earthquakes.find().sort("time", -1).limit(3)
        recent_eqs = await eqs_cursor.to_list(length=3)
        eq_text = "\n".join([
            f"- {eq['time']} | Mag {eq['magnitude']} | {eq['location']} | Prof. {eq['depth']}km"
            for eq in recent_eqs
        ])
        news_cursor = database.posts.find().sort("created_at", -1).limit(2)
        recent_news = await news_cursor.to_list(length=2)
        news_text = "\n".join([f"- [{news['type'].upper()}] {news['title']}" for news in recent_news])
    except Exception:
        eq_text = ""
        news_text = ""

    prompt = build_prompt(user, question, eq_text, news_text)

    try:
        async with aiohttp.ClientSession() as session:
            payload = {"model": OLLAMA_MODEL, "prompt": prompt, "stream": False}
            async with session.post(
                OLLAMA_GENERATE_URL,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=120)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("response", "Error al extraer la respuesta del modelo.")
                elif response.status == 404:
                    return (
                        f"⚠️ El modelo '{OLLAMA_MODEL}' no está instalado en Ollama.\n"
                        "Por favor crea el Modelfile y corre `ollama create ser-llama -f Modelfile`."
                    )
                else:
                    error_body = await response.text()
                    print(f"Ollama HTTP {response.status}: {error_body}")
                    return f"⚠️ El modelo '{OLLAMA_MODEL}' devolvió un error (código {response.status})."

    except aiohttp.ClientConnectorError:
        print("Ollama no está corriendo o no es alcanzable.")
        return (
            "⚠️ No se pudo conectar con Ollama.\n\n"
            "Asegúrate de que Ollama esté en ejecución:\n"
            "  `ollama serve`"
        )
    except Exception as e:
        print(f"Error inesperado en IA local: {e}")
        return "⚠️ Ocurrió un error inesperado al procesar tu consulta. Intenta de nuevo."