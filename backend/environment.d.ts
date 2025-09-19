declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MONGO_URI: string;
      API_URI: string;
      REPOSITORIES_LOCATION: string;
      HTTP_PORT: number;
      JWT_SECRET: string;
      FRONTEND_URL_DEV: string;
      FRONTEND_URL_STAGING: string;
      FRONTEND_URL_PROD: string;
      NODE_ENV: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
