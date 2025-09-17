import serverless from "serverless-http";
import { createApp } from "../src/index";

const app = createApp();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default serverless(app);

