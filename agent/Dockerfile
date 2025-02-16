FROM oven/bun:1
WORKDIR /phisguard

COPY . .

RUN bun install

EXPOSE 6699/tcp

ENTRYPOINT [ "bun", "run", "dev" ]