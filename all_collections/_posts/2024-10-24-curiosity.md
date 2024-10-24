---
layout: post
title: Curiosity
date: 2024.10.24
categories: [thl, ctf, AD, experto]
---

![image](/assets/images/curiosity/0.png)

En esta ocasión voy a resolver una máquina **Windows - AD** creada por **tk0b4k** de dificultad **experto** para la plataforma de [The Hackers Labs](https://thehackerslabs.com/).

### **Escaneo de la red**

El primer paso es identificar qué dispositivos están activos en la red. Utilizamos `arp-scan` para hacer un escaneo de ARP y descubrimos un host:

```bash
❯ sudo arp-scan -I enp0s10 --localnet
192.168.56.8    08:00:27:35:b5:ff       (Unknown)
```

### **Escaneo de puertos**

Usamos `rustscan` para hacer un escaneo rápido y encontramos varios puertos abiertos:

```bash
❯ rustscan -a 192.168.56.8 -b 500
Open 192.168.56.8:53
Open 192.168.56.8:88
Open 192.168.56.8:135
Open 192.168.56.8:139
Open 192.168.56.8:389
Open 192.168.56.8:445
Open 192.168.56.8:464
Open 192.168.56.8:593
Open 192.168.56.8:636
Open 192.168.56.8:3268
Open 192.168.56.8:3269
Open 192.168.56.8:5985
Open 192.168.56.8:9389
Open 192.168.56.8:47001
Open 192.168.56.8:49666
Open 192.168.56.8:49667
Open 192.168.56.8:49669
Open 192.168.56.8:49670
Open 192.168.56.8:49671
Open 192.168.56.8:49681
Open 192.168.56.8:49691
Open 192.168.56.8:49699
Open 192.168.56.8:49700
Open 192.168.56.8:49664
Open 192.168.56.8:49665
```

Ahora vamos a ver en que servicios hay funcionando en esos puertos y veremos las versiones que usan con `nmap`:

```bash
❯ nmap -sCV -p53,88,135,139,389,445,464,593,636,3268,3269,5985,9389,47001,49666,49667,49669,49670,49671,49681,49691,49699,49700,49664,49665 -v 192.168.56.8
PORT      STATE SERVICE       VERSION
53/tcp    open  domain        Simple DNS Plus
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2024-10-18 20:11:37Z)
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: hackme.thl, Site: Default-First-Site-Name)
|_ssl-date: 2024-10-18T20:12:39+00:00; -1s from scanner time.
| ssl-cert: Subject: commonName=DC.hackme.thl
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC.hackme.thl
| Issuer: commonName=hackme-DC-CA
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2024-10-16T13:11:58
| Not valid after:  2025-10-16T13:11:58
| MD5:   a449e115ec01929125da6f70f12a9d03
|_SHA-1: 6a4eaa911dc484ea666951013f338e4840a84d91
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: hackme.thl, Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC.hackme.thl
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC.hackme.thl
| Issuer: commonName=hackme-DC-CA
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2024-10-16T13:11:58
| Not valid after:  2025-10-16T13:11:58
| MD5:   a449e115ec01929125da6f70f12a9d03
|_SHA-1: 6a4eaa911dc484ea666951013f338e4840a84d91
|_ssl-date: 2024-10-18T20:12:39+00:00; -1s from scanner time.
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: hackme.thl, Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC.hackme.thl
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC.hackme.thl
| Issuer: commonName=hackme-DC-CA
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2024-10-16T13:11:58
| Not valid after:  2025-10-16T13:11:58
| MD5:   a449e115ec01929125da6f70f12a9d03
|_SHA-1: 6a4eaa911dc484ea666951013f338e4840a84d91
|_ssl-date: 2024-10-18T20:12:39+00:00; -1s from scanner time.
3269/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: hackme.thl, Site: Default-First-Site-Name)
|_ssl-date: 2024-10-18T20:12:39+00:00; -1s from scanner time.
| ssl-cert: Subject: commonName=DC.hackme.thl
| Subject Alternative Name: othername: 1.3.6.1.4.1.311.25.1::<unsupported>, DNS:DC.hackme.thl
| Issuer: commonName=hackme-DC-CA
| Public Key type: rsa
| Public Key bits: 2048
| Signature Algorithm: sha256WithRSAEncryption
| Not valid before: 2024-10-16T13:11:58
| Not valid after:  2025-10-16T13:11:58
| MD5:   a449e115ec01929125da6f70f12a9d03
|_SHA-1: 6a4eaa911dc484ea666951013f338e4840a84d91
5985/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
9389/tcp  open  mc-nmf        .NET Message Framing
47001/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
49664/tcp open  msrpc         Microsoft Windows RPC
49665/tcp open  msrpc         Microsoft Windows RPC
49666/tcp open  msrpc         Microsoft Windows RPC
49667/tcp open  msrpc         Microsoft Windows RPC
49669/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
49670/tcp open  msrpc         Microsoft Windows RPC
49671/tcp open  msrpc         Microsoft Windows RPC
49681/tcp open  msrpc         Microsoft Windows RPC
49691/tcp open  msrpc         Microsoft Windows RPC
49699/tcp open  msrpc         Microsoft Windows RPC
49700/tcp open  msrpc         Microsoft Windows RPC
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-security-mode: 
|   311: 
|_    Message signing enabled and required
|_clock-skew: mean: -1s, deviation: 0s, median: -1s
| smb2-time: 
|   date: 2024-10-18T20:12:31
|_  start_date: 2024-10-18T20:02:11
| nbstat: NetBIOS name: DC, NetBIOS user: <unknown>, NetBIOS MAC: 08002735b5ff (Oracle VirtualBox virtual NIC)
| Names:
|   DC<00>               Flags: <unique><active>
|   HACKME<00>           Flags: <group><active>
|   HACKME<1c>           Flags: <group><active>
|   DC<20>               Flags: <unique><active>
|_  HACKME<1b>           Flags: <unique><active>
```

Añadimos los nombres del **Domain Controller** y del **Dominio** al fichero `/etc/host`:

```bash
❯ echo '192.168.56.8 DC.hackme.thl hackme.thl' | sudo tee -a /etc/hosts
192.168.56.8 DC.hackme.thl hackme.thl
```

### Enumeración de Kerberos

Empezamos usando **kerbrute** ([https://github.com/ropnop/kerbrute](https://github.com/ropnop/kerbrute)) para enumerar los posibles usuarios del dominio.

![image](/assets/images/curiosity/1.png)

Encontramos varios usuarios del dominio. Intentamos sin exito obtener la password de los usuarios con la herramienta **kerbrute** con la wordlist **rockyou.**

### Responder

Usamos **Responder** una herramienta popular para la explotación de protocolos de red en entornos Windows, con el fin de interceptar y capturar posibles credenciales en tránsito. 

Ejecutamos, como root, **Responder** en modo pasivo para monitorear el tráfico de la red, con el comando `Responder -I enp0s10 -Pdv`:

![image](/assets/images/curiosity/2.png)

Obtenemos un hash del usuario de dominio **hackme\jdoe**, lo guardamos en un fichero llamado **jdoe.hash** para intentar romperlo.

![image](/assets/images/curiosity/3.png)

Para obtener la password he generado un script en python que me guarde en un fichero llamado **filtered_passwords.txt** todas las contraseñas de todos las wordlist de ***Seclists/Passwords*** que cumplan las políticas de contraseñas de Active Directory. Después usando **hashcat** en el modo 5600(NTLMv2) obtenemos la password de **hackme\jdoe**:

![image](/assets/images/curiosity/4.png)

### Servicio smb

Ahora que contamos con credenciales válidas del dominio, procederemos a explorar lo que podemos obtener del servicio Samba:

```bash
❯ enum4linux-ng -A 192.168.56.8 -u 'jdoe' -p '$**Redacted**'

....
'1120':
  username: osama
  name: (null)
  acb: '0x00000210'
  description: n()**Redacted**
....

....
[+] Found policy:
Domain password information:
  Password history length: 24
  Minimum password length: 7
  Maximum password age: 41 days 23 hours 53 minutes
  Password properties:
  - DOMAIN_PASSWORD_COMPLEX: true
....
```

Entre otras cosas, obtenemos unas credenciales del usuario **osama** y confirmamos que se están usando las políticas de complejidad de las contraseñas.

### Intrusión inicial

Nos conectamos con el usuario **jdoe** a la máquina victima y obtenemos la flag de **user.txt**:

![image](/assets/images/curiosity/5.png)

### Enumeración del dominio

Usamos la herramienta **bloodhound-python** ([https://github.com/dirkjanm/BloodHound.py](https://github.com/dirkjanm/BloodHound.py)) para enumerar el dominio usando las credenciales de **osama** (también se puede con el usuario **jdoe**):

![image](/assets/images/curiosity/6.png)

Importamos los datos a **Bloodhound**. Como podemos ver el usuario **jdoe** pertenece al grupo **it admins**.

![image](/assets/images/curiosity/7.png)

Si investigamos lo que puede hacer el grupo **it admins** vemos que los usuarios pertenecientes a dicho grupo pueden cambiar la contraseña del usuario **dba_adm.**

![image](/assets/images/curiosity/8.png)

### Movimiento lateral al usuario dba_adm

Para cambiar la contraseña del usuario **dba_adm** he usado **rpcclient**. Nos conectamos usando las credenciales del usuario **jdoe** y usamos el modulo **setuserinfo2** para modificar la contraseña del usuario:

![image](/assets/images/curiosity/9.png)

Ahora podemos conectarnos como **dba_adm**:

![image](/assets/images/curiosity/10.png)

### Sqlexpress

Usamos **sqlcmd** para conectarnos localmente al servidor **sqlexpress**. Usamos el parametro **-Q** para hacer una consulta, en este caso, le pedimos que nos de los nombres de las bases de datos que hay. 

![image](/assets/images/curiosity/11.png)

Ahora le pedimos que nos muestre las tablas que hay dentro se la base de datos **CredentialsDB**:

![image](/assets/images/curiosity/12.png)

Y para terminar le pedimos todos los datos de la tabla **Credentials**:

![image](/assets/images/curiosity/13.png)

Guardamos el hash en nuestro equipo:

![image](/assets/images/curiosity/14.png)

Y usando **hashcat** en el modo 0 (MD5) y con la wordlist creada anteriormente obtenemos la clave del usuario **sqlsvc**:

![image](/assets/images/curiosity/15.png)

### Usuario sqlsvc

Volvemos a **Bloodhound** y vemos que el usuario pertenece al grupo **GMSA_USERS** y este grupo a su vez puede leer la contraseña GMSA (ReadGMSAPassword) del usuario **GMSA_SVC$**.

![image](/assets/images/curiosity/16.png)

### GMSA

Usando la herramienta **nxc** y el módulo **ldap** podemos obtener el hash del usuario **GMSA_SVC$**:

![image](/assets/images/curiosity/17.png)

Volvemos a **Bloodhound** y vemos que el usuario puede **AllowedToAct** sobre el controlador de dominio, esto quiere decir que nos permite actuar en nombre de otro usuario.

![image](/assets/images/curiosity/18.png)

### Escalada a administrator

Obtenemos el TGT del usuario **GMSA_SVC$:**

![image](/assets/images/curiosity/19.png)

Exportamos el ticket y comprobamos que está bien con **klist**. Después solo nos queda usar el comando **getST** para obtener el **TGT** de administrador:

![image](/assets/images/curiosity/20.png)

Ya solo nos queda exportar el TGT de administrador y conectarnos con **psexec** para obtener una shell como **NT Authority\System**

![image](/assets/images/curiosity/21.png)
