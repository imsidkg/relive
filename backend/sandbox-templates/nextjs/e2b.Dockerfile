# You can use most Debian-based base images
FROM node:21-slim

# Install curl (+ deps for Bun installer)
RUN apt-get update \
  && apt-get install -y curl unzip ca-certificates \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Install Bun (so sandbox can run `bun add ...`)
RUN curl -fsSL https://bun.sh/install | bash \
  && ln -sf /root/.bun/bin/bun /usr/local/bin/bun \
  && ln -sf /root/.bun/bin/bunx /usr/local/bin/bunx

COPY compile_page.sh /compile_page.sh
RUN chmod +x /compile_page.sh

# Install dependencies and customize sandbox
WORKDIR /home/user/nextjs-app

RUN npx --yes create-next-app@15.3.3 . --yes

RUN npx --yes shadcn@2.6.3 init --yes -b neutral --force
RUN npx --yes shadcn@2.6.3 add --all --yes
# Shadcn + Tailwind v4 setup imports `tw-animate-css` in app/globals.css.
RUN bun add tw-animate-css

# Move the Nextjs app to the home directory and remove the nextjs-app directory
RUN mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app
