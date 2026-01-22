const express = require("express");
const pino = require("pino");
const pinoHttp = require("pino-http");
const client = require("prom-client");

const app = express();
app.use(express.json());

const logger = pino({ level: "info" });
app.use(pinoHttp({ logger }));

// Metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const jobCounter = new client.Counter({
    name: "jobs_processed_total",
    help: "Total jobs processed by worker",
});

const jobFailures = new client.Counter({
    name: "jobs_failed_total",
    help: "Total job failures",
});

const jobLatency = new client.Histogram({
    name: "job_processing_seconds",
    help: "Job processing latency",
    buckets: [0.1, 0.3, 0.5, 1, 2, 3],
});

register.registerMetric(jobCounter);
register.registerMetric(jobFailures);
register.registerMetric(jobLatency);

app.post("/process", async (req, res) => {
    const end = jobLatency.startTimer();

    // simulate work
    await new Promise((r) => setTimeout(r, Math.random() * 800));

    if (Math.random() < 0.15) {
        jobFailures.inc();
        end();
        return res.status(500).json({ error: "job failed" });
    }

    jobCounter.inc();
    end();
    res.json({ status: "job done" });
});

app.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

const PORT = 4000;
app.listen(PORT, () => {
    logger.info(`Worker service running on port ${PORT}`);
});
