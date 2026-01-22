const express = require("express");
const pino = require("pino");
const pinoHttp = require("pino-http");
const client = require("prom-client");

const app = express();
app.use(express.json());

const logger = pino({ level: "info" });
app.use(pinoHttp({ logger }));

// Prometheus metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const orderCounter = new client.Counter({
    name: "orders_created_total",
    help: "Total number of orders created",
});

const orderFailureCounter = new client.Counter({
    name: "orders_failed_total",
    help: "Total number of failed orders",
});

const orderLatency = new client.Histogram({
    name: "order_latency_seconds",
    help: "Order processing latency",
    buckets: [0.1, 0.3, 0.5, 1, 2],
});

register.registerMetric(orderCounter);
register.registerMetric(orderFailureCounter);
register.registerMetric(orderLatency);

app.post("/order", async (req, res) => {
    const end = orderLatency.startTimer();

    try {
        const response = await fetch("http://worker:4000/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: Date.now() }),
        });

        if (!response.ok) {
            orderFailureCounter.inc();
            end();
            return res.status(500).json({ error: "worker failed" });
        }

        orderCounter.inc();
        end();
        res.json({ status: "order created" });
    } catch (err) {
        orderFailureCounter.inc();
        end();
        res.status(500).json({ error: "worker unreachable" });
    }
});


app.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

const PORT = 3000;
app.listen(PORT, () => {
    logger.info(`API service running on port ${PORT}`);
});
