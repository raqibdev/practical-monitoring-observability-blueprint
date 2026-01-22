FROM node:20-alpine

# Set pnpm home and update PATH so pnpm is found
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Enable corepack to use pnpm natively
RUN corepack enable

WORKDIR /app

# Copy lockfile and package.json first to leverage Docker cache
COPY package.json pnpm-lock.yaml ./

# Use --frozen-lockfile for production stability
RUN pnpm install --prod --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["pnpm", "start"]
