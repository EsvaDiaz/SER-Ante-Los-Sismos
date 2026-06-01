import aiohttp
import re
from datetime import datetime
from backend.models import Earthquake, Post, PostType
from backend.database import database

# CENAIS API endpoint para la última semana de sismos en Cuba
CENAIS_LASTWEEK_URL = "https://www.cenais.gob.cu/lastquake/php/lastweek.php"

async def scrape_cenais_news():
    # Placeholder para Scrapping de Noticias
    return []

async def scrape_latest_earthquakes():
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(CENAIS_LASTWEEK_URL) as response:
                if response.status == 200:
                    try:
                        data = await response.json(content_type=None)
                    except Exception:
                        # En caso de que la respuesta sea un texto JSON válido
                        text_data = await response.text()
                        import json
                        data = json.loads(text_data)
                        
                    new_sismos = []
                    
                    for event in data:
                        # Convertir tiempolocal or tiempoutc a datetime para mantener consistencia.
                        dt = datetime.strptime(event['tiempoutc'], "%Y/%m/%dT%H:%M:%S")
                        mag = float(event['magnitud'])
                        
                        # Costruir string de localización
                        place = f"{event['distancialocalidad']} km al {event['orientacion']} de {event['nombre']}, {event['provincia']}"
                        
                        eq = Earthquake(
                            magnitude=mag,
                            location=place, 
                            depth=float(event['profundidad']),
                            time=dt,
                            coordinates=[float(event['latitud']), float(event['longitud'])], # [lat, long]
                            source="CENAIS (Cuba)"
                        )
                        
                        # Guardar en DB si es nuevo
                        existing = await database.earthquakes.find_one({"time": dt})
                        if not existing:
                            await database.earthquakes.insert_one(eq.model_dump())
                            new_sismos.append(eq)
                            
                    return new_sismos
        except Exception as e:
            print(f"Error scraping CENAIS: {e}")
            return []
    return []
