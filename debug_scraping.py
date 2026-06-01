import urllib.request
from bs4 import BeautifulSoup
import json

url = "http://www.cenais.gob.cu/rednacional/heli/lastlocal.html"
url2 = "http://www.cenais.gob.cu/"

print("Checking lastlocal.html...")
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read()
    print("lastlocal.html snippet:")
    print(html[:1500])
except Exception as e:
    print(e)
    
print("\nChecking homepage...")
try:
    req = urllib.request.Request(url2, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read()
    soup = BeautifulSoup(html, 'html.parser')
    tables = soup.find_all('table')
    print(f"Tables found on homepage: {len(tables)}")
    # Imprimir la primera tabla solo en caso de que contenga sismos recientes
    if tables:
        print(tables[0].get_text()[:500])
except Exception as e:
    print(e)
