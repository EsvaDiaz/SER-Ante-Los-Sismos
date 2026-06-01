import urllib.request
import json
from datetime import datetime

url = "https://www.cenais.gob.cu/lastquake/php/lastweek.php"

print("Checking CENAIS...")
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    response = urllib.request.urlopen(req).read()
    
    try:
        data = json.loads(response)
    except Exception:
        data = json.loads(response.decode('utf-8'))
        
    print(f"Found {len(data)} events in CENAIS.")
    
    for event in data:
        dt = datetime.strptime(event['tiempoutc'], "%Y/%m/%dT%H:%M:%S")
        place = f"{event['distancialocalidad']} km al {event['orientacion']} de {event['nombre']}, {event['provincia']}"
        mag = event['magnitud']
        depth = event['profundidad']
        lat = event['latitud']
        lon = event['longitud']
        
        print(f"[{dt}] {place}")
        print(f"Mag: {mag}, Depth: {depth}km, Lat/Lon: {lat}, {lon}")
        print("---")
except Exception as e:
    print(e)
