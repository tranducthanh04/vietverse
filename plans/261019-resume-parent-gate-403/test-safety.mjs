import assert from 'node:assert/strict';
import mongoose from 'mongoose';
const connect=mongoose.connect;
mongoose.connect=function(uri,...args) {
  const url=new URL(uri);
  assert.equal(url.protocol,'mongodb:');
  assert(['127.0.0.1','localhost','[::1]'].includes(url.hostname),'Tests must use disposable loopback MongoDB');
  assert(!url.username&&!url.password,'No credential-bearing database URI in tests');
  return connect.call(this,uri,...args);
};
