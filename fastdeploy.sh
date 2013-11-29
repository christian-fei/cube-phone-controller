#!/bin/bash

echo '====stopping opentalk.me===='
forever stop /root/nodestuff/cube-phone-controller/index.js
echo '====checking out===='
git checkout .
echo '====pulling latest changes===='
git pull
echo '====npm install===='
npm install
echo '====starting forever daemon===='
HTTP_HOST=37.139.20.20 HTTP_PORT=3007 forever start /root/nodestuff/cube-phone-controller/index.js  >> /root/nodestuff/cube-phone-controller/log.txt 2>&1