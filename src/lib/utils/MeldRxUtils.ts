import { v4 as uuidv4 } from "uuid";
import * as jwt from "jsonwebtoken";
import * as url from "url";

export interface ITokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope: string;

    error?: string;
    error_uri?: string;
};

// Get an access token by signing the private key to a JWT. Requires NodeJS 18.x or higher.
// This should be used when using a JWKS URL. The "kid" should match the "kid" from the JWKS key.
export async function getBackendAccessCodeForJWKS(privateKey: string, clientId: string, tokenUrl: string, kid: string, alg: string): Promise<ITokenResponse> {
    // Generate the JWT...
    const jwt = getJWTWithHeader(privateKey, clientId, tokenUrl, kid, alg);

    // Request the access token...
    const headers = { "Content-Type": "application/x-www-form-urlencoded" };
    const body = {
        "grant_type": "client_credentials",
        "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        "client_assertion": jwt
    };

    return __getTokenData(tokenUrl, body, headers);
}

// Generate a JWT with the given private-key/client-id. It will expire 5 minutes from calling this...
// This should be used when using a JWKS URL. The "kid" should match the "kid" from the JWKS key.
export function getJWTWithHeader(privateKey: string, clientId: string, tokenUrl: string, kid: string, alg: string): string {
    const guid = uuidv4();
    const now = Math.floor((new Date()).getTime() / 1000);
    const exp = now + 5 * 60;   // 5 minutes from now

    const jwtData  = {
        'iss': clientId,
        'sub': clientId,
        'aud': tokenUrl,
        'jti': guid,
        'nbf': now,
        'iat': now,
        'exp': exp,
    };
    return jwt.sign(jwtData, privateKey, { algorithm: "RS384", header: { kid: kid, alg: alg, typ: "JWT" } });
}

// Perform a generic, authenticated request...
async function __getTokenData(tokenUrl: string, body: any, headers: HeadersInit): Promise<ITokenResponse> {
    // Query tokenUrl with the given body and headers...
    const sBody = (new url.URLSearchParams(body)).toString();
    const tokenData = await fetch(tokenUrl, { method: "POST", headers, body: sBody })
        .then(response => response.json())

    // Validate the response...
    if (!tokenData.access_token) { throw new Error(`Unable to __getTokenData at ${tokenUrl}; ${sBody};`); }
    return tokenData;
}