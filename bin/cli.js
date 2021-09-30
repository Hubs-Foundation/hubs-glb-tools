#!/usr/bin/env node

// Uncomment for better stack traces during local development.
require("source-map-support").install();

const { program, programReady } = require("../");

programReady.then(() => program.run());
