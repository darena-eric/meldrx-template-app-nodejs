import * as fs from "fs";
import { getBackendAccessCodeForJWKS } from "./lib/utils/MeldRxUtils";
import { MeldRxFhirClient, MeldRxUtils } from "@meldrx/meldrx-fhir-client";
require("dotenv").config();

const AUTH_URL = process.env.MELDRX_AUTH_URL ?? "";
const CLIENT_ID = process.env.MELDRX_CLIENT_ID ?? "";
const WORKSPACE_ID = process.env.MELDRX_WORKSPACE_ID ?? "";
const KID = "1234567890";
const ALG = "RS384";
const PRIVATE_KEY = fs.readFileSync(__dirname + "/../privatekey.pem").toString();

async function main() {
    const fhirUrl = MeldRxUtils.getWorkspaceFhirUrl(AUTH_URL, WORKSPACE_ID);
    const tokenUrl = MeldRxUtils.getWorkspaceTokenUrl(AUTH_URL, WORKSPACE_ID);
    const token = await getBackendAccessCodeForJWKS(PRIVATE_KEY, CLIENT_ID, tokenUrl, KID, ALG);

    const meldRxClient: MeldRxFhirClient = MeldRxFhirClient.forBearerToken(fhirUrl, token.access_token);
    const patient = await meldRxClient.searchPatient({ family: "MyChart", given: "Theodore", birthdate: "1948-07-07" });
    console.log(patient);
}

main().then(() => { process.exit(0); });