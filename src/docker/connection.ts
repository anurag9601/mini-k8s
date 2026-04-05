import Docker from "dockerode";

// for this your docker desktop should be running than in docker desktop go to SETTINGS => GENERAL => (enable) Expose daemon on tcp://localhost:2375 without TLS
const docker = new Docker({
    host: "127.0.0.1",
    port: 2375
});

export default docker;