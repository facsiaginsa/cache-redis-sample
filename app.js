require("dotenv").config();
const express = require("express");
const redis = require("redis");
const Minio = require("minio");
const util = require("util");

const app = express();
const cache = redis.createClient({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  socket_keepalive: true,
});
cache.get = util.promisify(cache.get);

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_HOST,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

const redisCache = async (req, res, next) => {
  const result = await cache.get(req.url);
  if (result) {
    console.log("get cache");
    return res.send(result);
  }
  next();
};

app.get("/noredis", async (req, res) => {
  const result = await minioClient.presignedGetObject(
    "private",
    "image/Picture1.png",
    24 * 60 * 60
  );

  res.send(result);
});

app.get("/withredis", redisCache, async (req, res) => {
  const result = await minioClient.presignedGetObject(
    "private",
    "image/Picture1.png",
    24 * 60 * 60
  );

  cache.setex(req.url, 10, result);
  console.log("set cache");
  res.send(result);
});

app.listen(process.env.PORT, process.env.IP, () => {
  console.log(new Date() + " - App listen on port " + process.env.PORT);
});
