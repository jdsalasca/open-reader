# Publicar en `open-library.eridu.top`

Pasos para el servidor `atopnuc` (ver `server/README.md` del workspace). Un sitio
nuevo **no toca el puerto 80 ni el contenedor de otro sitio**: usa un puerto
libre en loopback y se agrega al túnel de Cloudflare.

## 1. Construir y levantar el contenedor

```bash
ssh atopnuc@192.168.1.100
git clone https://github.com/jdsalasca/open-reader.git ~/sitios/open-reader
cd ~/sitios/open-reader
docker build -t open-reader .
docker run -d --name open-reader --restart unless-stopped \
  -p 127.0.0.1:5177:80 open-reader
curl -I http://127.0.0.1:5177
```

El puerto `5177` estaba libre según el runbook del servidor. Si ya se ocupó, elige
otro y ajusta el ingress.

## 2. Ingress del túnel

Edita `/home/atopnuc/.cloudflared/config.yml` y agrega, **antes** de
`http_status: 404`:

```yaml
  - hostname: open-library.eridu.top
    service: http://localhost:5177
```

Valida antes de reiniciar:

```bash
cloudflared tunnel ingress validate
cloudflared tunnel ingress rule https://open-library.eridu.top
sudo systemctl restart cloudflared
```

## 3. DNS (una sola vez)

```bash
cloudflared tunnel route dns 04706903-924c-4364-b06e-aec258973960 open-library.eridu.top
```

## 4. Comprobar

```bash
curl -sI https://open-library.eridu.top | head -12
```

Debe responder `200` y traer la cabecera `content-security-policy` del
`deploy/nginx.conf`. Sin esa cabecera el lector no debe considerarse terminado:
un EPUB con scripts podría ejecutar código en el origen del sitio.

## Actualizar

```bash
cd ~/sitios/open-reader
git pull
docker build -t open-reader .
docker rm -f open-reader
docker run -d --name open-reader --restart unless-stopped \
  -p 127.0.0.1:5177:80 open-reader
```
