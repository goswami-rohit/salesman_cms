# Stage 1: Dependencies - Install all dependencies
FROM node:25 AS deps
#RUN apk add --no-cache libc6-compat openssl #Not needed for debian base image (node:25) needed for others
WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci

# Stage 2: Builder - Build the Next.js application
FROM node:25 AS builder
WORKDIR /app

# Copy the dependencies from the previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Copy all project files
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PRIVATE_STANDALONE=true

RUN npx prisma generate
RUN --mount=type=secret,id=WORKOS_API_KEY,env=WORKOS_API_KEY --mount=type=secret,id=WORKOS_CLIENT_ID,env=WORKOS_CLIENT_ID --mount=type=secret,id=RESEND_MAIL_API,env=RESEND_MAIL_API npm run build

# Stage 3: Runner - The final production image
FROM gcr.io/distroless/nodejs24-debian12 AS runner
WORKDIR /app

ENV NODE_ENV=production

ENV NEXT_TELEMETRY_DISABLED=1

# Copy only the essential files from the builder stage
# We copy the standalone build output, static assets, and the public directory.
# The Prisma schema is also copied, which is a good practice for runtime database connections.
#COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["server.js"]
