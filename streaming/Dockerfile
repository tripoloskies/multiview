FROM bluenviron/mediamtx:1.16.3 AS mediamtx
FROM ubuntu:24.04

COPY --from=mediamtx /mediamtx /
COPY --from=mediamtx /mediamtx.yml /

RUN apt update && apt install -y \
   curl

COPY . .

RUN chmod +x /scripts/*

ENTRYPOINT [ "/mediamtx" ]