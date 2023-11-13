declare global {
    namespace NodeJS {
      interface ProcessEnv {
        URI: string;
        HTTP_PORT: number;
        HTTPS_PORT: number;
        GIT_PORT: number;
        SSL_CERT: string;
        SSL_KEY: string;
      }
    }
  }
  
  // If this file has no import/export statements (i.e. is a script)
  // convert it into a module by adding an empty export statement.
  export {}