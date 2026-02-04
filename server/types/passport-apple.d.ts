declare module "@nicokaiser/passport-apple" {
  import { Strategy } from "passport";
  
  interface AppleStrategyOptions {
    clientID: string;
    teamID: string;
    keyID: string;
    privateKeyString: string;
    callbackURL: string;
    scope?: string[];
  }
  
  type VerifyCallback = (
    accessToken: string,
    refreshToken: string,
    idToken: any,
    profile: any,
    done: (error: any, user?: any) => void
  ) => void;
  
  class AppleStrategy extends Strategy {
    constructor(options: AppleStrategyOptions, verify: VerifyCallback);
  }
  
  export default AppleStrategy;
}
