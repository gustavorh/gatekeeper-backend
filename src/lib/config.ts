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
  environment: "development" | "production";
}

const config: Config = {
  cors: {
    allowedOrigins:
      process.env.NODE_ENV === "production"
        ? [process.env.FRONTEND_URL || "https://your-frontend-domain.com"]
        : [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
          ],
    allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    credentials: true,
  },
  jwt: {
    secret:
      process.env.JWT_SECRET || "your-jwt-secret-change-this-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  environment:
    (process.env.NODE_ENV as "development" | "production") || "development",
};

export default config;
