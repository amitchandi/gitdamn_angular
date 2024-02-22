declare global {
    namespace NodeJS {
      interface ProcessEnv {
        MONGO_URI: string;
        API_URI: string;
        REPOSITORIES_LOCATION: string;
        HTTP_PORT: number;
        HTTPS_PORT: number;
        SSL_CERT: string;
        SSL_KEY: string;
        JWT_SECRET: string;
      }
    }
  }
  
  // If this file has no import/export statements (i.e. is a script)
  // convert it into a module by adding an empty export statement.
  export {}