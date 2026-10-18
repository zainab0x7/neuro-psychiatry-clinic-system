import { sanitizeUri, sanitizeMessage } from "../backend/config/database";

const testUri1 = "mongodb+srv://admin_user:SuperSecretPassword123!@cluster0.abcde.mongodb.net/psychiatristDB?retryWrites=true&w=majority";
const testUri2 = "mongodb://dbuser:pass123@127.0.0.1:27017/psychiatristDB";

console.log("Test 1 Sanitized URI:", sanitizeUri(testUri1));
console.log("Test 2 Sanitized URI:", sanitizeUri(testUri2));

const rawErr = `Failed to connect to mongodb+srv://admin_user:SuperSecretPassword123!@cluster0.abcde.mongodb.net: connection timed out`;
console.log("Sanitized Error Message:", sanitizeMessage(rawErr, testUri1));
