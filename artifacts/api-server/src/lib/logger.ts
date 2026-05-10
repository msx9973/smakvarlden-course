import pino from "pino";

// AWS_LAMBDA_FUNCTION_NAME is set by the Lambda runtime (Netlify Functions run on Lambda)
const isProduction = process.env.NODE_ENV === "production" || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});
