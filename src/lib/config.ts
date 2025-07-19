interface Config {
  cors: {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
    credentials: boolean;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  server: {
    port: number;
    frontendUrl: string;
  };
  environment: "development" | "production";
}

const config: Config = {
  cors: {
    allowedOrigins:
      process.env.NODE_ENV === "production"
        ? [
            process.env.FRONTEND_URL || "https://your-frontend-domain.com",
            process.env.ADMIN_URL || "https://admin.your-domain.com",
          ]
        : [
            // Frontend principal
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            // Backend para testing
            "http://localhost:9000",
            "http://127.0.0.1:9000",
            // Otros puertos comunes de desarrollo
            "http://localhost:3001",
            "http://localhost:5173", // Vite dev server
            "http://localhost:4200", // Angular dev server
            "http://localhost:8080",
            "http://localhost:5000",
          ],
    allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "X-Correlation-ID",
      "Cache-Control",
    ],
    credentials: true,
  },
  jwt: {
    secret:
      process.env.JWT_SECRET || "your-jwt-secret-change-this-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  server: {
    port: parseInt(process.env.PORT || "9000"),
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  },
  environment:
    (process.env.NODE_ENV as "development" | "production") || "development",
};

export default config;
