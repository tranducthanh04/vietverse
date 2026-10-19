// Test-only guard: never load user credentials or connect outside loopback.
const net = require('node:net');
const mongoose = require('mongoose');
require('dotenv').config = () => ({ parsed: {} });
const local = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);
const connect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const first = Array.isArray(args[0]) ? args[0][0] : args[0];
  const host = first && typeof first === 'object' ? first.host : typeof args[1] === 'string' ? args[1] : 'localhost';
  if (host && !local.has(host)) throw new Error('QA blocked non-loopback socket');
  return connect.apply(this, args);
};
const open = mongoose.Connection.prototype.openUri;
mongoose.Connection.prototype.openUri = function (uri, ...args) {
  const parsed = new URL(uri);
  if (parsed.protocol !== 'mongodb:' || !local.has(parsed.hostname) || parsed.username || parsed.password) {
    throw new Error('QA blocked unsafe Mongo URI before connection');
  }
  return open.call(this, uri, ...args);
};
