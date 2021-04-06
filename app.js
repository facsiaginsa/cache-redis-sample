require("dotenv").config();
const express = require("express");
const redis = require("redis");
const Minio = require("minio");
const util = require("util");

const app = express();
const cache = redis.createClient({
  host: "localhost",
  port: 6379,
  socket_keepalive: true,
});
cache.get = util.promisify(cache.get);

const minioClient = new Minio.Client({
  endPoint: "10.14.35.137",
  port: 9000,
  useSSL: false,
  accessKey: "irs",
  secretKey: "irswindigital#1",
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
