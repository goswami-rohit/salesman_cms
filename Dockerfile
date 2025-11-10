# Stage 1: Dependencies - Install all dependencies
FROM node:25 AS deps
# Install necessary packages for Prisma and Node.js
# libc6-compat is required for Prisma engines on Alpine.
# openssl is needed for a variety of packages.
#RUN apk add --no-cache libc6-compat openssl #Not needed for debian base image (node:25) needed for others
WORKDIR /app

# Copy the dependency files to leverage Docker's layer caching
COPY package.json package-lock.json* ./

# Install dependencies, using `npm ci` for a clean and reproducible build.
RUN npm ci

# Stage 2: Builder - Build the Next.js application
FROM node:25 AS builder
WORKDIR /app

# Copy the dependencies from the previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Copy all project files
COPY . .

# Set environment variables for the standalone build
# NEXT_TELEMETRY_DISABLED: Disables Next.js telemetry
# NEXT_PRIVATE_STANDALONE: This is the environment variable that tells next.js to use the 'standalone' build output.
# The user's next.config.js checks for this variable
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PRIVATE_STANDALONE=true

# Generate the Prisma client and then build the Next.js app
# The Prisma client must be generated before the Next.js build process can use it.
# SKIP_ENV_VALIDATION=1 is used to allow the build to proceed even if the .env file is not present in the container
RUN npx prisma generate
RUN --mount=type=secret,id=WORKOS_API_KEY,env=WORKOS_API_KEY npm run build

# Stage 3: Runner - The final production image
# This stage uses a super-lightweight distroless base image for security and size.
FROM gcr.io/distroless/nodejs24-debian12 AS runner
WORKDIR /app

ENV NODE_ENV=production

# Disable telemetry again in the final image
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only the essential files from the builder stage
# We copy the standalone build output, static assets, and the public directory.
# The Prisma schema is also copied, which is a good practice for runtime database connections.
#COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
#COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Expose the default Next.js port
EXPOSE 3000

# Set the entrypoint to run the standalone server
# The server.js file is the entrypoint for the standalone build.
CMD ["server.js"]
