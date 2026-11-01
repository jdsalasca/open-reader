# Publicar en `open-reader.eridu.top`

Pasos para el servidor `atopnuc` (ver `server/README.md` del workspace). Un sitio
nuevo **no toca el puerto 80 ni el contenedor de otro sitio**: usa un puerto
libre en loopback y se agrega al túnel de Cloudflare.

## 1. Publicar

El servidor es un NUC modesto: `docker build` se queda colgado en el paso de
`vite build` (transforma los módulos y no termina). Lo que funciona es compilar
en la máquina de desarrollo y montar el `dist` ya construido:

```bash
npm run build
scp -r dist atopnuc@192.168.1.100:/home/atopnuc/sitios/open-reader/
ssh atopnuc@192.168.1.100 'chmod -R a+rX ~/sitios/open-reader/dist'
```

`chmod` es obligatorio: `scp` crea el directorio con permisos `700` y nginx
(que corre como otro usuario) devuelve 403.

El contenedor ya está creado y sirve ese directorio por bind mount:

```bash
sudo docker run -d --name open-reader --restart unless-stopped \
  -p 127.0.0.1:5177:80 \
  -v /home/atopnuc/sitios/open-reader/dist:/usr/share/nginx/html:ro \
  -v /home/atopnuc/sitios/open-reader/deploy/nginx.conf:/etc/nginx/conf.d/default.conf:ro \
  nginx:1.27-alpine
```

Para actualizar basta repetir el `scp` y el `chmod`; nginx sirve los archivos
nuevos sin reiniciar (los nombres llevan hash).

## 2. Ingress del túnel

Ya está puesto (regla #5) con `deploy/add-ingress.py`, que hace copia de
seguridad, es idempotente y se niega a tocar el archivo si no encuentra la regla
final `http_status:404`. Si hay que rehacerlo:

```bash
python3 deploy/add-ingress.py
cloudflared tunnel ingress validate
cloudflared tunnel ingress rule https://open-reader.eridu.top
sudo systemctl restart cloudflared
```

## 3. DNS (una sola vez)

```bash
cloudflared tunnel route dns 04706903-924c-4364-b06e-aec258973960 open-reader.eridu.top
```

## 4. Comprobar

```bash
curl -sI https://open-reader.eridu.top | head -12
```

Debe responder `200` y traer la cabecera `content-security-policy` del
`deploy/nginx.conf`. Sin esa cabecera el lector no debe considerarse terminado:
un EPUB con scripts podría ejecutar código en el origen del sitio.

La CSP permite `static.cloudflareinsights.com` en `script-src` porque Cloudflare
inyecta su beacon en el HTML proxificado; `connect-src` sigue en `'self'`, así
que la app no puede enviar nada afuera.

## Actualizar

```bash
npm run build
scp -r dist atopnuc@192.168.1.100:/home/atopnuc/sitios/open-reader/
ssh atopnuc@192.168.1.100 'chmod -R a+rX ~/sitios/open-reader/dist'
```
